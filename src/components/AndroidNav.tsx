import React from 'react';
import { Home, Bell, Shield } from 'lucide-react';
import { AppTab } from '../types';

interface AndroidNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isDopamineActive: boolean;
}

export const AndroidNav: React.FC<AndroidNavProps> = ({
  currentTab,
  onSelectTab,
  isDopamineActive,
}) => {
  const tabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'alarms', label: 'Alarms', icon: Bell },
    { id: 'dopamine', label: 'Save me', icon: Shield },
  ];

  return (
    <nav
      id="android-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-md mx-auto bg-[#0e1117]/95 backdrop-blur-xl border-t border-slate-800/80 px-6 py-2 pb-5"
    >
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const hasBadge = tab.id === 'dopamine' && isDopamineActive;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 relative transition-all duration-200 group ${
                isActive ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <div className="absolute inset-0 bg-red-500/10 rounded-2xl -z-10 animate-fade-in" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-red-500' : 'group-hover:scale-105'}`} />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-[#0e1117]" />
                )}
              </div>

              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android Gesture Navigation Bar pill */}
      <div className="w-32 h-1 bg-slate-700/60 rounded-full mx-auto mt-3" />
    </nav>
  );
};
