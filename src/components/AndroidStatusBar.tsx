import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium } from 'lucide-react';

export const AndroidStatusBar: React.FC<{ isFullScreen?: boolean }> = ({ isFullScreen = false }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="android-status-bar"
      className={`w-full max-w-md mx-auto px-6 pt-2.5 pb-1 flex items-center justify-between text-xs font-mono select-none z-40 transition-colors ${
        isFullScreen ? 'bg-transparent text-slate-300' : 'bg-[#0b0d11]/90 backdrop-blur-md text-slate-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-tight text-slate-200">{timeStr || '07:00'}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse" title="WakeGuard Active" />
      </div>

      {/* Front camera cutout punch hole */}
      <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900/90" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-300 tracking-wider">5G</span>
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-slate-300 font-sans font-medium">89%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
