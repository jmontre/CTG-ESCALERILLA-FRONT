'use client';

import { useState } from 'react';
import { Challenge } from '@/types';

interface ScheduleDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  currentPlayerId: string;
  onSubmit: (scheduledDate: string) => Promise<void>;
}

const TIME_SLOTS = [
  { label: '06:00 - 07:30', start: '06:00' },
  { label: '07:45 - 09:15', start: '07:45' },
  { label: '09:30 - 11:00', start: '09:30' },
  { label: '11:15 - 12:45', start: '11:15' },
  { label: '13:00 - 14:30', start: '13:00' },
  { label: '14:45 - 16:15', start: '14:45' },
  { label: '16:30 - 18:00', start: '16:30' },
  { label: '18:15 - 19:45', start: '18:15' },
  { label: '20:00 - 21:30', start: '20:00' },
  { label: '21:45 - 23:15', start: '21:45' },
];

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function Calendar({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  minDate: Date;
  maxDate: Date;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Primer día del mes (0=Dom … ajustar a Lu=0)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-first
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ctg-light transition text-ctg-dark font-bold"
        >
          ‹
        </button>
        <span className="font-semibold text-ctg-dark text-sm">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ctg-light transition text-ctg-dark font-bold"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const date = new Date(viewYear, viewMonth, day);
          date.setHours(0, 0, 0, 0);

          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);
          const isDisabled = date < minDate || date > maxDate;

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              className={`
                mx-auto w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-ctg-dark text-white shadow-md'
                  : isToday && !isDisabled
                  ? 'border-2 border-ctg-green text-ctg-dark hover:bg-ctg-light'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-ctg-light'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScheduleDateModal({
  isOpen,
  onClose,
  challenge,
  currentPlayerId,
  onSubmit,
}: ScheduleDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !challenge) return null;

  const now = new Date();
  const playDeadline = new Date(challenge.play_deadline);

  // minDate: mañana a medianoche
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);

  // maxDate: día del deadline
  const maxDate = new Date(playDeadline);
  maxDate.setHours(0, 0, 0, 0);

  const opponent =
    challenge.challenger_id === currentPlayerId
      ? challenge.challenged
      : challenge.challenger;

  const formatDisplayDate = (d: Date) =>
    d.toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

  const getAvailableSlots = () => {
    if (!selectedDate) return TIME_SLOTS;
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (!isToday) return TIME_SLOTS;

    return TIME_SLOTS.filter(slot => {
      const [h, min] = slot.start.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(h, min, 0, 0);
      return slotTime > now;
    });
  };

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    setSelectedSlot(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!selectedDate || !selectedSlot) {
      setError('Debes seleccionar una fecha y un horario.');
      return;
    }

    const [h, min] = selectedSlot.split(':').map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(h, min, 0, 0);

    if (finalDate <= now) {
      setError('El horario seleccionado ya pasó.');
      return;
    }
    if (finalDate > playDeadline) {
      setError('La fecha no puede ser posterior al plazo límite del partido.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(finalDate.toISOString());
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al fijar la fecha.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setError('');
    onClose();
  };

  const availableSlots = getAvailableSlots();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-ctg-dark px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">📅 Agendar partido</h2>
            <p className="text-ctg-light text-sm mt-0.5">vs {opponent?.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-ctg-light hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Plazo límite */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
            <span>⏰</span>
            <span>
              Plazo límite:{' '}
              <strong>
                {playDeadline.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
              </strong>
            </span>
          </div>

          {/* Step 1: Calendario */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-ctg-green text-white text-xs flex items-center justify-center font-bold">1</span>
              Selecciona la fecha
            </p>
            <div className="border-2 border-gray-100 rounded-xl p-4">
              <Calendar
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>
            {selectedDate && (
              <p className="text-xs text-ctg-dark font-semibold mt-2 ml-1">
                📆 {formatDisplayDate(selectedDate)}
              </p>
            )}
          </div>

          {/* Step 2: Horarios */}
          <div>
            <p className={`text-sm font-semibold mb-3 flex items-center gap-1 transition ${selectedDate ? 'text-gray-700' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold transition ${selectedDate ? 'bg-ctg-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                2
              </span>
              Selecciona el horario
            </p>

            {!selectedDate ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-gray-400 text-sm">
                Primero elige una fecha en el calendario
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-orange-200 py-6 text-center text-orange-500 text-sm">
                No hay horarios disponibles para este día
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => { setSelectedSlot(slot.start); setError(''); }}
                      className={`
                        py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all
                        ${isSelected
                          ? 'bg-ctg-dark border-ctg-dark text-white shadow-md scale-[1.02]'
                          : 'bg-ctg-light/40 border-ctg-light text-ctg-dark hover:border-ctg-green hover:bg-ctg-light'
                        }
                      `}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen */}
          {selectedDate && selectedSlot && (
            <div className="bg-ctg-light/60 rounded-xl px-4 py-3 text-sm text-ctg-dark font-semibold flex items-center gap-2">
              <span>✅</span>
              <span>
                {formatDisplayDate(selectedDate)},{' '}
                {TIME_SLOTS.find(s => s.start === selectedSlot)?.label}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedDate || !selectedSlot}
              className="flex-1 px-4 py-2.5 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}