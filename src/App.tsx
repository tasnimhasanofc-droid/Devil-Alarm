/**
 * WakeGuard — Premium Modern Android Alarm & Digital-Wellbeing Application
 * Developer — Tasnim Hasan
 */

import React, { useState, useEffect, useRef } from 'react';
import { Alarm, AppTab, DopamineSession } from './types';
import {
  getSavedAlarms,
  saveAlarms,
  getDopamineSession,
  saveDopamineSession,
  incrementAlarmDismissed,
  incrementFocusMinutes,
} from './services/storageService';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNav } from './components/AndroidNav';
import { DeveloperFooter } from './components/DeveloperFooter';
import { HomeScreen } from './components/HomeScreen';
import { AlarmsScreen } from './components/AlarmsScreen';
import { DopamineSetup } from './components/DopamineSetup';
import { DopamineActiveKiosk } from './components/DopamineActiveKiosk';
import { ActiveAlarmModal } from './components/ActiveAlarmModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [alarms, setAlarms] = useState<Alarm[]>(() => getSavedAlarms());
  const [dopamineSession, setDopamineSession] = useState<DopamineSession>(() => getDopamineSession());
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [isKioskOpen, setIsKioskOpen] = useState<boolean>(false);

  // Track last triggered alarm time to avoid re-triggering in the same minute
  const lastTriggeredMinuteRef = useRef<string>('');

  // Persist alarms
  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  // Persist dopamine session
  useEffect(() => {
    saveDopamineSession(dopamineSession);
  }, [dopamineSession]);

  // Background Alarm Watcher: checks every 3 seconds for exact match
  useEffect(() => {
    const checkAlarmTime = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0-6
      const currentHH = now.getHours().toString().padStart(2, '0');
      const currentMM = now.getMinutes().toString().padStart(2, '0');
      const timeKey = `${currentDay}_${currentHH}:${currentMM}`;

      if (lastTriggeredMinuteRef.current === timeKey) {
        return;
      }

      // Check if any enabled alarm matches
      const targetTime = `${currentHH}:${currentMM}`;
      const matchingAlarm = alarms.find(
        (a) => a.enabled && a.time === targetTime && a.days.includes(currentDay)
      );

      if (matchingAlarm && !activeAlarm) {
        lastTriggeredMinuteRef.current = timeKey;
        setActiveAlarm(matchingAlarm);
      }
    };

    const interval = setInterval(checkAlarmTime, 3000);
    return () => clearInterval(interval);
  }, [alarms, activeAlarm]);

  // Alarm management handlers
  const handleToggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAlarm = (newAlarmData: Omit<Alarm, 'id'>) => {
    const newAlarm: Alarm = {
      ...newAlarmData,
      id: `alarm_${Date.now()}`,
    };
    setAlarms((prev) => [newAlarm, ...prev]);
  };

  const handleTriggerAlarmNow = (alarm: Alarm) => {
    setActiveAlarm(alarm);
  };

  const handleAlarmDismissSuccess = () => {
    setActiveAlarm(null);
    incrementAlarmDismissed();
  };

  // Dopamine management handlers
  const handleStartDopamineSession = (durationSeconds: number) => {
    const now = Date.now();
    const newSession: DopamineSession = {
      isActive: true,
      startTime: now,
      durationSeconds,
      endTime: now + durationSeconds * 1000,
    };
    setDopamineSession(newSession);
    setIsKioskOpen(true);
  };

  const handleEndDopamineSession = () => {
    if (dopamineSession.startTime > 0) {
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - dopamineSession.startTime) / 60000));
      incrementFocusMinutes(elapsedMinutes);
    }
    setDopamineSession({
      isActive: false,
      startTime: 0,
      durationSeconds: 0,
      endTime: 0,
    });
    setIsKioskOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col justify-between selection:bg-red-500/30 selection:text-red-200">
      {/* Flagship Android Status Bar */}
      <AndroidStatusBar isFullScreen={Boolean(activeAlarm || (dopamineSession.isActive && isKioskOpen))} />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeScreen
            alarms={alarms}
            dopamineSession={dopamineSession}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onAddAlarm={handleAddAlarm}
            onToggleAlarm={handleToggleAlarm}
            onTriggerAlarmNow={handleTriggerAlarmNow}
            onOpenDopamineKiosk={() => setIsKioskOpen(true)}
          />
        )}

        {currentTab === 'alarms' && (
          <AlarmsScreen
            alarms={alarms}
            onToggleAlarm={handleToggleAlarm}
            onDeleteAlarm={handleDeleteAlarm}
            onAddAlarm={handleAddAlarm}
            onTriggerAlarmNow={handleTriggerAlarmNow}
          />
        )}

        {currentTab === 'dopamine' && (
          <DopamineSetup
            activeSession={dopamineSession}
            onStartSession={handleStartDopamineSession}
            onOpenActiveSession={() => setIsKioskOpen(true)}
          />
        )}
      </main>

      {/* Developer Branding Footer at bottom of application */}
      <DeveloperFooter />

      {/* Bottom Android Navigation */}
      <AndroidNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isDopamineActive={dopamineSession.isActive}
      />

      {/* Full-Screen Active Alarm Modal (Math + Camera Smile Verification) */}
      {activeAlarm && (
        <ActiveAlarmModal
          alarm={activeAlarm}
          onDismissSuccess={handleAlarmDismissSuccess}
        />
      )}

      {/* Full-Screen Dopamine Protection Kiosk Lock Screen */}
      {dopamineSession.isActive && isKioskOpen && (
        <DopamineActiveKiosk
          session={dopamineSession}
          onEndSession={handleEndDopamineSession}
        />
      )}
    </div>
  );
}
