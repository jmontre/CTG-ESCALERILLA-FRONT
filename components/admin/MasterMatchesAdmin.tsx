'use client';
import { useMemo, useState } from 'react';
import { MasterMatch, MasterSeason, Player } from '@/types';
import { isInLadder } from '@/lib/ladder';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ROUND_LABEL: Record<MasterMatch['round'], string> = {
  playoff: 'Playoff',
  group: 'Round Robin',
  semifinal: 'Semifinal',
  final: 'Final',
};

async function postJson(url: string, method: 'POST' | 'PATCH', body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(msg || 'Error en la operación');
  }
  return res.json();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
}

/**
 * Partidos de un cuadro Master para el admin: cargar o resolver resultados
 * (disputas, W.O.) y reemplazar a quien no pueda jugar el playoff.
 */
export default function MasterMatchesAdmin({
  season,
  allSeasons,
  players,
  onChanged,
  notify,
}: {
  season: MasterSeason;
  /** Todos los cuadros de la temporada, para no ofrecer de reemplazo a quien ya juega. */
  allSeasons: MasterSeason[];
  players: Player[];
  onChanged: () => Promise<void> | void;
  notify: { success: (m: string) => void; error: (m: string) => void };
}) {
  const [resultFor, setResultFor] = useState<MasterMatch | null>(null);
  const [replaceFor, setReplaceFor] = useState<MasterMatch | null>(null);

  const sections = useMemo(() => {
    const outside = season.matches ?? [];
    const byRound = (r: MasterMatch['round']) => outside.filter((m) => m.round === r);
    return [
      { title: 'Playoff', matches: byRound('playoff') },
      ...season.groups.map((g) => ({
        title: g.name,
        matches: g.matches.filter((m) => m.round === 'group'),
      })),
      { title: 'Semifinales', matches: byRound('semifinal') },
      { title: 'Final', matches: byRound('final') },
    ].filter((s) => s.matches.length > 0);
  }, [season]);

  const busyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of allSeasons) {
      (s.seed_player_ids ?? []).forEach((id) => ids.add(id));
      for (const m of [...(s.matches ?? []), ...s.groups.flatMap((g) => g.matches)]) {
        ids.add(m.player1_id);
        ids.add(m.player2_id);
      }
    }
    return ids;
  }, [allSeasons]);

  if (sections.length === 0) {
    return <p className="text-sm text-[#F0F7E8]/40">Este cuadro todavía no tiene partidos.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-[#F0F7E8]/40 uppercase tracking-wider mb-2">
            {section.title}
          </p>
          <div className="space-y-2">
            {section.matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                onResult={() => setResultFor(m)}
                onReplace={() => setReplaceFor(m)}
              />
            ))}
          </div>
        </div>
      ))}

      {resultFor && (
        <ResultModal
          match={resultFor}
          onClose={() => setResultFor(null)}
          onSubmit={async (winnerId, score) => {
            await postJson(`${API_URL}/master/matches/${resultFor.id}/result`, 'POST', {
              winner_id: winnerId,
              score,
            });
            setResultFor(null);
            notify.success('✅ Resultado registrado.');
            await onChanged();
          }}
        />
      )}

      {replaceFor && (
        <ReplaceModal
          match={replaceFor}
          candidates={players
            .filter((p) => isInLadder(p.position) && !busyIds.has(p.id))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
          onClose={() => setReplaceFor(null)}
          onSubmit={async (oldId, newId, newName) => {
            await postJson(`${API_URL}/master/matches/${replaceFor.id}/replace-player`, 'PATCH', {
              old_player_id: oldId,
              new_player_id: newId,
            });
            setReplaceFor(null);
            notify.success(`✅ ${newName} entra al playoff.`);
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function MatchRow({
  match,
  onResult,
  onReplace,
}: {
  match: MasterMatch;
  onResult: () => void;
  onReplace: () => void;
}) {
  const completed = match.status === 'completed';
  const disputed = match.status === 'disputed';
  const hasReport = !!(match.player1_result || match.player2_result);
  const canReplace = match.round === 'playoff' && match.status === 'pending' && !hasReport;

  const name = (id: string | undefined) =>
    id === match.player1_id ? match.player1.name : id === match.player2_id ? match.player2.name : '?';

  return (
    <div
      className={
        'rounded-lg border p-3 text-sm ' +
        (completed
          ? 'bg-ctg-green/5 border-ctg-green/20'
          : disputed
            ? 'bg-red-900/10 border-red-500/30'
            : 'bg-[#152b18] border-[#1e4020]')
      }
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[#F0F7E8]">
          <span className={match.winner_id === match.player1_id ? 'font-bold text-ctg-green' : ''}>
            {match.player1.name}
          </span>
          <span className="text-[#F0F7E8]/30 mx-2">vs</span>
          <span className={match.winner_id === match.player2_id ? 'font-bold text-ctg-green' : ''}>
            {match.player2.name}
          </span>
        </p>
        <span className="text-xs text-[#F0F7E8]/50">
          {completed
            ? `✅ ${match.score}`
            : disputed
              ? '⚠️ En disputa'
              : match.scheduled_date
                ? `📅 ${formatDate(match.scheduled_date)}`
                : 'Por jugar'}
        </span>
      </div>

      {!completed && hasReport && (
        <div className="mt-2 text-xs text-[#F0F7E8]/50 space-y-0.5">
          {match.player1_result && (
            <p>
              {match.player1.name} reportó: gana {name(match.player1_result.winnerId)} · {match.player1_result.score}
            </p>
          )}
          {match.player2_result && (
            <p>
              {match.player2.name} reportó: gana {name(match.player2_result.winnerId)} · {match.player2_result.score}
            </p>
          )}
        </div>
      )}

      {!completed && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onResult}
            className={
              'flex-1 text-xs rounded-lg py-1.5 font-bold transition ' +
              (disputed
                ? 'bg-red-500/80 text-white hover:bg-red-500'
                : 'bg-ctg-green text-[#0a1608] hover:bg-ctg-lime')
            }
          >
            {disputed ? 'Resolver disputa' : 'Ingresar resultado'}
          </button>
          {canReplace && (
            <button
              type="button"
              onClick={onReplace}
              className="flex-1 text-xs text-amber-300 border border-amber-500/30 rounded-lg py-1.5 hover:bg-amber-900/20 transition"
            >
              Reemplazar jugador
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto animate-scale-in">
        <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="font-display text-xl font-bold text-[#F0F7E8]">{title}</h3>
            <p className="text-sm text-[#F0F7E8]/45 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition">
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ResultModal({
  match,
  onClose,
  onSubmit,
}: {
  match: MasterMatch;
  onClose: () => void;
  onSubmit: (winnerId: string, score: string) => Promise<void>;
}) {
  // Si los dos reportaron el mismo ganador o uno solo reportó, se precarga.
  const reported = match.player1_result ?? match.player2_result ?? null;
  const [winnerId, setWinnerId] = useState(reported?.winnerId ?? '');
  const [score, setScore] = useState(reported?.score ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async () => {
    if (saving) return;
    if (!winnerId || !score.trim()) {
      setFormError('Elige al ganador e ingresa el marcador.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSubmit(winnerId, score.trim());
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo registrar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={match.status === 'disputed' ? '⚠️ Resolver disputa' : 'Ingresar resultado'}
      subtitle={`${ROUND_LABEL[match.round]} · ${match.player1.name} vs ${match.player2.name}`}
      onClose={onClose}
    >
      <div>
        <p className="label mb-2">Ganador</p>
        <div className="grid grid-cols-2 gap-2">
          {[match.player1, match.player2].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setWinnerId(p.id)}
              className={
                'p-3 rounded-xl border-2 text-sm font-semibold transition ' +
                (winnerId === p.id
                  ? 'border-ctg-green bg-ctg-green/10 text-ctg-green'
                  : 'border-[#1e4020] bg-[#152b18] text-[#F0F7E8]/60 hover:border-ctg-green/40')
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label block mb-2" htmlFor="master-score">
          Marcador, con los games de {match.player1.name} primero
        </label>
        <input
          id="master-score"
          className="field w-full"
          placeholder="6-3, 6-4"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setScore('W.O.')}
          className="mt-2 text-xs text-[#F0F7E8]/50 hover:text-[#F0F7E8] underline"
        >
          Marcar como W.O.
        </button>
      </div>
      {formError && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{formError}</div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          Cancelar
        </button>
        <button type="button" onClick={submit} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Confirmar resultado'}
        </button>
      </div>
    </ModalShell>
  );
}

function ReplaceModal({
  match,
  candidates,
  onClose,
  onSubmit,
}: {
  match: MasterMatch;
  candidates: Player[];
  onClose: () => void;
  onSubmit: (oldId: string, newId: string, newName: string) => Promise<void>;
}) {
  const [outId, setOutId] = useState('');
  const [inId, setInId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const incoming = candidates.find((c) => c.id === inId);

  const submit = async () => {
    if (saving) return;
    if (!outId || !incoming) {
      setFormError('Elige quién sale y quién entra.');
      return;
    }
    const outName = outId === match.player1_id ? match.player1.name : match.player2.name;
    if (!confirm(`¿${incoming.name} reemplaza a ${outName} en el playoff?`)) return;
    setSaving(true);
    setFormError('');
    try {
      await onSubmit(outId, incoming.id, incoming.name);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo hacer el reemplazo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Reemplazar jugador"
      subtitle={`Playoff · ${match.player1.name} vs ${match.player2.name}`}
      onClose={onClose}
    >
      <div>
        <p className="label mb-2">¿Quién no puede jugar?</p>
        <div className="grid grid-cols-2 gap-2">
          {[match.player1, match.player2].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOutId(p.id)}
              className={
                'p-3 rounded-xl border-2 text-sm font-semibold transition ' +
                (outId === p.id
                  ? 'border-amber-400 bg-amber-900/20 text-amber-300'
                  : 'border-[#1e4020] bg-[#152b18] text-[#F0F7E8]/60 hover:border-amber-500/40')
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label block mb-2" htmlFor="master-replacement">
          Reemplazante
        </label>
        <select
          id="master-replacement"
          className="field w-full"
          value={inId}
          onChange={(e) => setInId(e.target.value)}
        >
          <option value="">Elegir jugador…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.position} · {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-[#F0F7E8]/40 mt-2">
          Hereda el lugar de quien sale. Si la cancha la había reservado quien sale, la reserva se cancela y hay que
          volver a agendar.
        </p>
      </div>
      {formError && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{formError}</div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          Cancelar
        </button>
        <button type="button" onClick={submit} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Reemplazar'}
        </button>
      </div>
    </ModalShell>
  );
}
