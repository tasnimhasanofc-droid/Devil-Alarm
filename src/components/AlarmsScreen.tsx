import React, { useState } from 'react';
import { Alarm } from '../types';
import { AlarmCard } from './AlarmCard';
import { AddAlarmModal } from './AddAlarmModal';
import { Plus, Bell, ShieldAlert, Sparkles } from 'lucide-react';

interface AlarmsScreenProps {
  alarms: Alarm[];
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onAddAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  onTriggerAlarmNow: (alarm: Alarm) => void;
}

export const AlarmsScreen: React.FC<AlarmsScreenProps> = ({
  alarms,
  onToggleAlarm,
  onDeleteAlarm,
  onAddAlarm,
  onTriggerAlarmNow,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div id="alarms-screen" className="max-w-md mx-auto p-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Alarms</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {alarms.filter(a => a.enabled).length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-screen alarm with face verification
          </p>
        </div>

        <button
          id="btn-add-alarm-header"
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/25 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Alarms List */}
      <div className="space-y-3.5">
        {alarms.map((alarm) => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onToggle={onToggleAlarm}
            onDelete={onDeleteAlarm}
            onTriggerNow={onTriggerAlarmNow}
          />
        ))}

        {alarms.length === 0 && (
          <div className="text-center py-12 bg-[#12151d] rounded-3xl border border-slate-800 p-6">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No alarms configured</p>
            <p className="text-xs text-slate-500 mt-1">Tap the button below to add your first alarm.</p>
          </div>
        )}
      </div>

      {/* Primary Add Alarm button */}
      <button
        id="btn-add-alarm-bottom"
        onClick={() => setIsAddModalOpen(true)}
        type="button"
        className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-400 text-white font-bold text-base shadow-xl shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" />
        <span>+ Add Alarm</span>
      </button>

      {/* Information Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-[#0f1219] border border-slate-800/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500/10 text-red-400 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200">How WakeGuard Works</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            When the alarm triggers, sound loops continuously. Look at the camera to verify your face and dismiss it.
          </p>
        </div>
      </div>

      <AddAlarmModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddAlarm}
      />
    </div>
  );
};
