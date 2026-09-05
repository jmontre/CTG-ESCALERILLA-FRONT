'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EntryMatchInfo, EntryMatchTarget } from '@/types';
import ConfirmModal from './ConfirmModal';

/**
 * Partido de ingreso: lo ve el socio nuevo (o el que vuelve a la escalerilla)
 * mientras no tenga puesto. Elige a un rival del tope hacia abajo y se juega
 * el lugar: si gana entra en ese puesto, si pierde entra último.
 *
 * Solo se muestra cuando el backend dice que le corresponde
 * (`entry_match_available`), así que la tarjeta no aparece para el resto.
 */
export default function EntryMatchCard({
  onCreated,
  onError,
}: {
  onCreated: (rival: string) => void;
  onError: (message: string) => void;
}) {
  const [info, setInfo] = useState<EntryMatchInfo | null>(null);
  const [search, setSearch] = useState('');
  const [elegido, setElegido] = useState<EntryMatchTarget | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.getEntryMatchTargets().then(setInfo);
  }, []);

  if (!info?.available) return null;

  // Ya lo pidió: mostrar el partido en curso, no la lista de rivales.
  if (info.pending) {
    const rival = info.pending.challenged;
    return (
      <div className="bg-[#0f2211] border border-ctg-green/30 rounded-2xl p-6 mb-8">
        <p className="text-ctg-green text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Tu partido de ingreso
        </p>
        <p className="text-[#F0F7E8] text-lg font-display font-bold">
          {rival.name} {rival.position ? `· #${rival.position}` : ''}
        </p>
        <p className="text-[#F0F7E8]/50 text-sm mt-2">
          {info.pending.status === 'pending'
            ? 'Esperando que acepte. Tiene 24 horas para responder — si no responde, entras en su puesto.'
            : 'Aceptado. Coordinen la fecha y jueguen dentro de los 5 días.'}
        </p>
        <p className="text-[#F0F7E8]/35 text-xs mt-3">
          Lo sigues en <span className="text-[#F0F7E8]/60">Mis Desafíos</span>.
        </p>
      </div>
    );
  }

  const filtrados = info.targets.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const confirmar = async () => {
    if (!elegido) return;
    setEnviando(true);
    try {
      await api.createEntryChallenge(elegido.id);
      onCreated(elegido.name);
      setInfo(await api.getEntryMatchTargets());
      setElegido(null);
    } catch (e: any) {
      onError(e.message || 'No se pudo crear el partido de ingreso');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="bg-[#0f2211] border border-ctg-green/30 rounded-2xl p-6 mb-8">
        <p className="text-ctg-green text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Tu partido de ingreso
        </p>
        <h2 className="font-display text-2xl font-extrabold text-[#F0F7E8] mb-2">
          Elige contra quién entras
        </h2>
        <p className="text-[#F0F7E8]/55 text-sm max-w-2xl">
          Todavía no estás en la escalerilla. Puedes desafiar a cualquiera del
          puesto <strong className="text-[#F0F7E8]">#{info.top_limit}</strong> hacia abajo:
          si ganas entras en su puesto y él baja uno; si pierdes entras último.
          Es una sola oportunidad.
        </p>

        {info.targets.length === 0 ? (
          <p className="text-[#F0F7E8]/40 text-sm mt-6">
            Por ahora no hay rivales disponibles: los del tramo están todos con un
            desafío en curso o con inmunidad. Vuelve a mirar en unas horas.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador…"
              className="mt-5 w-full sm:max-w-xs bg-[#152b18] border border-[#1e4020] rounded-xl px-4 py-2.5
                         text-sm text-[#F0F7E8] placeholder-[#F0F7E8]/30 focus:outline-none focus:border-ctg-green/50"
            />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
              {filtrados.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setElegido(t)}
                  className="flex items-center gap-3 bg-[#152b18] border border-[#1e4020] rounded-xl px-3 py-2.5
                             text-left hover:border-ctg-green/50 transition-colors"
                >
                  <span className="font-display font-black text-ctg-green text-sm w-9 shrink-0">
                    #{t.position}
                  </span>
                  <span className="text-sm text-[#F0F7E8] truncate">{t.name}</span>
                </button>
              ))}
              {filtrados.length === 0 && (
                <p className="text-[#F0F7E8]/35 text-sm col-span-full py-3">
                  Nadie coincide con esa búsqueda.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!elegido}
        title={`¿Jugar tu ingreso contra ${elegido?.name}?`}
        explanation={
          `Si ganas, entras a la escalerilla en el puesto #${elegido?.position} y ${elegido?.name} baja uno. ` +
          `Si pierdes, entras en el último puesto. Tienes una sola oportunidad, así que elige con calma: ` +
          `una vez enviado no se puede cambiar de rival.`
        }
        confirmLabel="Sí, es mi rival"
        loading={enviando}
        onConfirm={confirmar}
        onClose={() => setElegido(null)}
      />
    </>
  );
}
