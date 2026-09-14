import React, { useState } from 'react';
import { Shield, Clock, PhoneCall, AlertCircle, Sparkles } from 'lucide-react';
import { DopamineSession } from '../types';

interface DopamineSetupProps {
  onStartSession: (durationSeconds: number) => void;
  activeSession: DopamineSession;
  onOpenActiveSession: () => void;
}

const PRESETS = [
  { label: '15 minutes', seconds: 15 * 60, tag: 'Quick Reset' },
  { label: '30 minutes', seconds: 30 * 60, tag: 'Sprint' },
  { label: '1 hour', seconds: 60 * 60, tag: 'Deep Work' },
  { label: '2 hours', seconds: 120 * 60, tag: 'Digital Detox' },
];

export const DopamineSetup: React.FC<DopamineSetupProps> = ({
  onStartSession,
  activeSession,
  onOpenActiveSession,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(30 * 60);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(45);

  const handleStart = () => {
    const duration = isCustom ? customMinutes * 60 : selectedDuration;
    onStartSession(duration);
  };

  if (activeSession.isActive) {
    const remaining = Math.max(0, Math.floor((activeSession.endTime - Date.now()) / 1000));
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return (
      <div id="dopamine-active-summary" className="p-6 max-w-md mx-auto animate-fade-in">
        <div className="bg-gradient-to-b from-[#171a24] to-[#10131a] border border-red-500/40 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto mb-4 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            Protection In Progress
          </span>

          <h3 className="text-4xl font-extrabold font-mono text-white mt-4 tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            {formatted}
          </h3>

          <p className="text-xs text-slate-300 font-medium mt-2">
            Focus mode is active • Only calling is available
          </p>

          <button
            onClick={onOpenActiveSession}
            type="button"
            className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Enter Lock Kiosk & Emergency Dialer</span>
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="dopamine-setup-screen" className="max-w-md mx-auto p-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Digital Wellbeing</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Save me for dopamine
        </h2>
        <p className="text-sm font-medium text-slate-400 mt-1">
          “Protect your focus. Get your time back.”
        </p>
      </div>

      {/* Duration Selection Presets */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Choose Focus Duration
        </label>

        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((p) => {
            const isSelected = !isCustom && selectedDuration === p.seconds;
            return (
              <button
                key={p.seconds}
                onClick={() => {
                  setIsCustom(false);
                  setSelectedDuration(p.seconds);
                }}
                type="button"
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-red-500/10 border-red-500/60 shadow-lg shadow-red-500/20 text-white'
                    : 'bg-[#12151d] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-red-400">{p.tag}</span>
                  <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-red-400' : 'text-slate-600'}`} />
                </div>
                <p className="text-lg font-bold font-mono">{p.label}</p>
              </button>
            );
          })}
        </div>

        {/* Custom Duration Toggle */}
        <div
          onClick={() => setIsCustom(true)}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            isCustom
              ? 'bg-red-500/10 border-red-500/60 shadow-lg shadow-red-500/20 text-white'
              : 'bg-[#12151d] border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Custom Duration</span>
            <span className="text-sm font-bold font-mono text-red-400">
              {customMinutes} Minutes ({Math.floor(customMinutes / 60)}h {customMinutes % 60}m)
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={240}
            step={5}
            value={customMinutes}
            onChange={(e) => {
              setIsCustom(true);
              setCustomMinutes(parseInt(e.target.value, 10));
            }}
            className="w-full accent-red-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>5m</span>
            <span>1h</span>
            <span>2h</span>
            <span>4h</span>
          </div>
        </div>
      </div>

      {/* Legitimate Android Policy & Behavior Notice */}
      <div className="mt-6 p-4 rounded-2xl bg-[#0f1219] border border-slate-800/80 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Session Rules & Android Wellbeing Policy</span>
        </div>

        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-slate-300">Strict App Lockdown:</strong> Social media, games, video streams, and messaging apps are restricted.
          </li>
          <li>
            <strong className="text-slate-300">Only Phone Calling:</strong> Built-in emergency and priority phone dialer remains continuously accessible.
          </li>
          <li>
            <strong className="text-slate-300">No Early Bypass:</strong> Exiting before time reaches zero requires developer authorization password.
          </li>
          <li>
            <strong className="text-slate-300">Android System Safety:</strong> Built on legitimate Digital Wellbeing / Kiosk limits without compromising emergency 911 calls.
          </li>
        </ul>
      </div>

      {/* Start Button */}
      <button
        id="btn-start-dopamine-session"
        onClick={handleStart}
        type="button"
        className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-400 text-white font-bold text-base shadow-xl shadow-red-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
      >
        <Sparkles className="w-5 h-5 text-red-200" />
        <span>Activate Focus Protection</span>
      </button>
    </div>
  );
};
