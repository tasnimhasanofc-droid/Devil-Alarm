import React, { useState, useEffect } from 'react';
import { Alarm, DopamineSession } from '../types';
import {
  Bell,
  Shield,
  Plus,
  Play,
  ArrowRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { AddAlarmModal } from './AddAlarmModal';

interface HomeScreenProps {
  alarms: Alarm[];
  dopamineSession: DopamineSession;
  onNavigateToTab: (tab: 'alarms' | 'dopamine') => void;
  onAddAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  onToggleAlarm: (id: string) => void;
  onTriggerAlarmNow: (alarm: Alarm) => void;
  onOpenDopamineKiosk: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  alarms,
  dopamineSession,
  onNavigateToTab,
  onAddAlarm,
  onToggleAlarm,
  onTriggerAlarmNow,
  onOpenDopamineKiosk,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setLiveDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );

      const hour = now.getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('Rise & conquer your morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Stay sharp & locked in today');
      } else if (hour >= 17 && hour < 22) {
        setGreeting('Unwind & prepare for deep rest');
      } else {
        setGreeting('Sleep deep • WakeGuard on watch');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find next upcoming enabled alarm
  const enabledAlarms = alarms.filter((a) => a.enabled);
  const nextAlarm = enabledAlarms[0] || alarms[0] || null;

  // Format 24h to 12h for next alarm
  const formatTime12 = (t?: string) => {
    if (!t) return '--:--';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const p = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${mStr} ${p}`;
  };

  // Remaining time for dopamine session
  const dopamineRemainingSeconds = Math.max(
    0,
    Math.floor((dopamineSession.endTime - Date.now()) / 1000)
  );
  const formatDopamineCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="home-screen-dashboard" className="max-w-md mx-auto p-6 pb-24 animate-fade-in">
      {/* Top Section Required by Prompt */}
      <div className="pt-2 pb-6 flex items-start justify-between">
        <div>
          {/* App Logo & Name */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 p-0.5 shadow-lg shadow-red-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0d11] rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500 fill-red-500/20" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">
                Wake<span className="text-red-500">Guard</span>
              </h1>
              <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Bio-Alarm & Shield
              </span>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {liveTime || '07:00 AM'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {liveDate}
            </span>
          </div>

          {/* Short Motivational Greeting */}
          <p className="text-xs font-medium text-red-400 mt-1 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{greeting}</span>
          </p>
        </div>

        {/* Quick Launch Alarm Verification Test */}
        {nextAlarm && (
          <button
            id="btn-quick-test-alarm"
            onClick={() => onTriggerAlarmNow(nextAlarm)}
            type="button"
            title="Instant Test Alarm"
            className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#13161f] hover:bg-[#1a1e2b] border border-slate-800 hover:border-red-500/40 text-slate-300 transition-all shadow-md active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-slate-400 group-hover:text-slate-200">
              Test Alarm
            </span>
          </button>
        )}
      </div>

      {/* ================= MAIN CARD 1: ALARM ================= */}
      <section className="mt-2">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Alarm
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('alarms')}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <span>View All ({alarms.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Alarm Card Required by Prompt */}
        <div
          id="home-alarm-card"
          className="bg-gradient-to-br from-[#151821] to-[#101319] border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden"
        >
          {nextAlarm ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                    Next Alarm
                  </span>

                  <div className="text-4xl font-black font-mono text-white tracking-tight mt-2">
                    {formatTime12(nextAlarm.time)}
                  </div>

                  <p className="text-sm font-medium text-slate-300 mt-1">
                    {nextAlarm.label || 'Rise & Conquer'}
                  </p>
                </div>

                {/* Status Toggle Switch */}
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      nextAlarm.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {nextAlarm.enabled ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    onClick={() => onToggleAlarm(nextAlarm.id)}
                    type="button"
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      nextAlarm.enabled ? 'bg-red-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        nextAlarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Verification mode badges */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg text-red-300 font-semibold">
                  Face Verification
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-400 font-medium">
                  Instant Wake Detection
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-400">No alarms created yet</p>
            </div>
          )}

          {/* Large "+ Add Alarm" button Required by Prompt */}
          <button
            id="home-btn-add-alarm"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Alarm</span>
          </button>
        </div>
      </section>

      {/* ================= MAIN CARD 2: SAVE ME FOR DOPAMINE ================= */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Save me for dopamine
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('dopamine')}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <span>Settings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Dopamine Card Required by Prompt */}
        <div
          id="home-dopamine-card"
          className="bg-gradient-to-br from-[#151821] to-[#101319] border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">
                Focus Shield Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    dopamineSession.isActive
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-slate-600'
                  }`}
                />
                <span
                  className={`text-base font-bold ${
                    dopamineSession.isActive ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {dopamineSession.isActive ? 'Active Protection' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Remaining time display */}
            {dopamineSession.isActive ? (
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Remaining
                </span>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  {formatDopamineCountdown(dopamineRemainingSeconds)}
                </div>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            {dopamineSession.isActive
              ? 'Social media, games and distracting apps are restricted. Only calling is accessible.'
              : 'Block distracting phone apps for a chosen period. Only emergency & priority calling remains available.'}
          </p>

          {/* Large Action Button Required by Prompt */}
          <button
            id="home-btn-dopamine-action"
            onClick={() => {
              if (dopamineSession.isActive) {
                onOpenDopamineKiosk();
              } else {
                onNavigateToTab('dopamine');
              }
            }}
            type="button"
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>
              {dopamineSession.isActive
                ? 'Open Active Focus Kiosk'
                : 'Start Focus Session'}
            </span>
          </button>
        </div>
      </section>

      {/* Wellbeing Metric Chips */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-[#12151d] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-white">45m</p>
            <p className="text-[10px] text-slate-400 font-medium">Focus Saved Today</p>
          </div>
        </div>

        <div className="bg-[#12151d] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-white">100%</p>
            <p className="text-[10px] text-slate-400 font-medium">Wake Verification</p>
          </div>
        </div>
      </section>

      <AddAlarmModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddAlarm}
      />
    </div>
  );
};
