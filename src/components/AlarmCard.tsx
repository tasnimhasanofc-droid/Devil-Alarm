import React from 'react';
import { Alarm } from '../types';
import { Volume2, Play, Trash2, BrainCircuit, Smile } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTriggerNow: (alarm: Alarm) => void;
}

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onToggle,
  onDelete,
  onTriggerNow,
}) => {
  // Convert 24h to 12h display
  const [hourStr, minuteStr] = alarm.time.split(':');
  const hourNum = parseInt(hourStr, 10);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;

  const getSoundLabel = (sound: Alarm['sound']) => {
    switch (sound) {
      case 'crimson_surge': return 'Crimson Surge';
      case 'radar_pulse': return 'Radar Pulse';
      case 'cyber_alert': return 'Cyber Alert';
      case 'zenith_rise': return 'Zenith Rise';
      default: return 'Alarm';
    }
  };

  return (
    <div
      id={`alarm-card-${alarm.id}`}
      className={`relative rounded-2xl p-5 border transition-all duration-300 ${
        alarm.enabled
          ? 'bg-gradient-to-br from-[#161a23] to-[#12151d] border-slate-700/80 shadow-lg shadow-black/40'
          : 'bg-[#101319]/80 border-slate-800/40 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-extrabold font-mono tracking-tight ${
                alarm.enabled ? 'text-white' : 'text-slate-400'
              }`}
            >
              {displayHour}:{minuteStr}
            </span>
            <span
              className={`text-sm font-semibold tracking-wider ${
                alarm.enabled ? 'text-red-400' : 'text-slate-500'
              }`}
            >
              {period}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-300 mt-1 flex items-center gap-1.5">
            {alarm.label || 'Alarm'}
          </p>
        </div>

        {/* Custom Toggle Switch */}
        <button
          id={`toggle-alarm-${alarm.id}`}
          onClick={() => onToggle(alarm.id)}
          type="button"
          aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
            alarm.enabled ? 'bg-red-500' : 'bg-slate-800'
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
              alarm.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Days row */}
      <div className="flex items-center gap-1.5 mt-4">
        {DAYS_SHORT.map((dayName, idx) => {
          const isSelected = alarm.days.includes(idx);
          return (
            <span
              key={idx}
              className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                isSelected
                  ? alarm.enabled
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  : 'text-slate-600'
              }`}
            >
              {dayName}
            </span>
          );
        })}
      </div>

      {/* Metadata & Actions */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300">
            <Volume2 className="w-3 h-3 text-red-400" />
            {getSoundLabel(alarm.sound)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <BrainCircuit className="w-3 h-3 text-red-400" />
            5 Math
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Smile className="w-3 h-3 text-red-400" />
            Smile
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`btn-test-alarm-${alarm.id}`}
            onClick={() => onTriggerNow(alarm)}
            title="Simulate / Trigger Alarm"
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-medium transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            Test
          </button>
          <button
            id={`btn-delete-alarm-${alarm.id}`}
            onClick={() => onDelete(alarm.id)}
            title="Delete Alarm"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
