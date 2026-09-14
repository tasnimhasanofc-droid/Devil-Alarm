import React, { useState } from 'react';
import { Alarm } from '../types';
import { X, Volume2, Check, Music } from 'lucide-react';
import { soundSynth } from '../services/audioSynthesizer';

interface AddAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id'>) => void;
}

const DAYS_MAP = [
  { day: 0, label: 'S', name: 'Sun' },
  { day: 1, label: 'M', name: 'Mon' },
  { day: 2, label: 'T', name: 'Tue' },
  { day: 3, label: 'W', name: 'Wed' },
  { day: 4, label: 'T', name: 'Thu' },
  { day: 5, label: 'F', name: 'Fri' },
  { day: 6, label: 'S', name: 'Sat' },
];

const SOUND_OPTIONS: { id: Alarm['sound']; label: string; desc: string }[] = [
  { id: 'crimson_surge', label: 'Crimson Surge', desc: 'Aggressive dual-pitch pulse' },
  { id: 'radar_pulse', label: 'Radar Pulse', desc: 'High-visibility sonar ping' },
  { id: 'cyber_alert', label: 'Cyber Alert', desc: 'Sharp digital rapid triplet' },
  { id: 'zenith_rise', label: 'Zenith Rise', desc: 'Harmonic uplifting awakening' },
];

export const AddAlarmModal: React.FC<AddAlarmModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [hour, setHour] = useState('06');
  const [minute, setMinute] = useState('30');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<Alarm['sound']>('crimson_surge');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handlePreviewSound = (s: Alarm['sound']) => {
    setSound(s);
    soundSynth.startAlarm(s, 0.4);
    setIsPlayingPreview(true);
    setTimeout(() => {
      soundSynth.stopAlarm();
      setIsPlayingPreview(false);
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.stopAlarm();

    // Convert 12h to 24h
    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const time24 = `${h.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;

    onSave({
      time: time24,
      label: label.trim() || 'Wake Up Alarm',
      enabled: true,
      days: selectedDays.length > 0 ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
      sound,
      volume: 0.9,
      mathCount: 5,
    });
    onClose();
  };

  return (
    <div
      id="add-alarm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        id="add-alarm-modal"
        className="w-full max-w-md bg-[#12151d] border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Create New Alarm</h3>
          </div>
          <button
            onClick={() => {
              soundSynth.stopAlarm();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* Time Picker Controls */}
          <div className="bg-[#0b0d11] p-4 rounded-2xl border border-slate-800 flex items-center justify-center gap-3">
            {/* Hour select */}
            <select
              id="alarm-hour-select"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="bg-[#161a23] text-white text-3xl font-extrabold font-mono rounded-xl px-3 py-2 border border-slate-700 focus:border-red-500 focus:outline-none appearance-none text-center cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((h) => (
                <option key={h} value={h} className="bg-slate-900 text-base">{h}</option>
              ))}
            </select>

            <span className="text-3xl font-extrabold text-slate-500 font-mono">:</span>

            {/* Minute select */}
            <select
              id="alarm-minute-select"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="bg-[#161a23] text-white text-3xl font-extrabold font-mono rounded-xl px-3 py-2 border border-slate-700 focus:border-red-500 focus:outline-none appearance-none text-center cursor-pointer"
            >
              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-base">{m}</option>
              ))}
            </select>

            {/* AM / PM toggle */}
            <div className="flex flex-col gap-1 ml-2">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  period === 'AM'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  period === 'PM'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Label Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Alarm Label
            </label>
            <input
              id="alarm-label-input"
              type="text"
              placeholder="e.g. Rise & Conquer"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-[#0b0d11] text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm border border-slate-800 focus:border-red-500 focus:outline-none"
            />
            {/* Quick chips */}
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {['Rise & Conquer', 'Deep Focus', 'Workout', 'Meditation'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLabel(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 shrink-0 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Repeat Days
            </label>
            <div className="flex justify-between gap-1">
              {DAYS_MAP.map(({ day, label: dayLabel, name }) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    title={name}
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                      active
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {dayLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Wake Alarm Tone
              </label>
              {isPlayingPreview && (
                <span className="text-[11px] text-red-400 font-medium animate-pulse">
                  Playing preview...
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SOUND_OPTIONS.map((opt) => {
                const isSelected = sound === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handlePreviewSound(opt.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                    </div>
                    <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-red-400' : 'text-slate-600'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notice about 2-step verification */}
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-300/90 leading-relaxed flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>
              <strong>WakeGuard Security:</strong> Alarm requires solving 5 math challenges + smile camera verification to dismiss. No bypass.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundSynth.stopAlarm();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Alarm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
