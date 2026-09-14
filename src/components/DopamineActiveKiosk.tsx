import React, { useState, useEffect } from 'react';
import { DopamineSession } from '../types';
import { verifyDeveloperPassword } from '../services/storageService';
import { soundSynth } from '../services/audioSynthesizer';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Lock,
  KeyRound,
  AlertOctagon,
  ShieldCheck,
  X,
  Delete,
  Flame,
} from 'lucide-react';

interface DopamineActiveKioskProps {
  session: DopamineSession;
  onEndSession: () => void;
}

export const DopamineActiveKiosk: React.FC<DopamineActiveKioskProps> = ({
  session,
  onEndSession,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((session.endTime - Date.now()) / 1000))
  );

  // Password Unlock Modal states
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Phone Calling states
  const [showDialer, setShowDialer] = useState<boolean>(false);
  const [dialerNumber, setDialerNumber] = useState<string>('');
  const [activeCallNumber, setActiveCallNumber] = useState<string | null>(null);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(false);

  // Restricted App Toast state
  const [restrictedToastApp, setRestrictedToastApp] = useState<string | null>(null);

  // Countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        soundSynth.playSuccess();
        onEndSession();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session.endTime, onEndSession]);

  // Call duration timer
  useEffect(() => {
    let interval: number;
    if (activeCallNumber) {
      interval = window.setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallNumber]);

  // Format HH:MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Password verification
  const handleVerifyPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsVerifying(true);
    setPasswordError('');

    try {
      const isValid = await verifyDeveloperPassword(passwordInput);
      if (isValid) {
        soundSynth.playSuccess();
        setShowPasswordModal(false);
        onEndSession();
      } else {
        soundSynth.playError();
        setPasswordError('Incorrect password. Protection remains active.');
        setPasswordInput('');
      }
    } catch {
      setPasswordError('Verification error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Dialer DTMF key press
  const handleDialerKey = (digit: string) => {
    soundSynth.playDTMF(digit);
    if (dialerNumber.length < 15) {
      setDialerNumber((prev) => prev + digit);
    }
  };

  const handleStartCall = (num?: string) => {
    const target = num || dialerNumber;
    if (!target) return;
    setActiveCallNumber(target);
    setCallSeconds(0);
    setShowDialer(false);
    soundSynth.playSuccess();
  };

  const handleEndCall = () => {
    setActiveCallNumber(null);
    setCallSeconds(0);
    soundSynth.playError();
  };

  const handleAppTap = (appName: string) => {
    soundSynth.playError();
    setRestrictedToastApp(appName);
    setTimeout(() => setRestrictedToastApp(null), 3500);
  };

  const RESTRICTED_APPS = [
    { name: 'Instagram', icon: '📸' },
    { name: 'TikTok', icon: '🎵' },
    { name: 'YouTube', icon: '▶️' },
    { name: 'X / Twitter', icon: '🐦' },
    { name: 'Gaming', icon: '🎮' },
    { name: 'Browser', icon: '🌐' },
  ];

  return (
    <div
      id="save-me-for-dopamine-kiosk"
      className="fixed inset-0 z-50 bg-[#07090e] text-white flex flex-col justify-between overflow-y-auto"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-red-950/20 via-transparent to-black pointer-events-none -z-10" />

      {/* Header Section Required by Prompt */}
      <div className="w-full max-w-md mx-auto pt-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Kiosk Shield Active</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Save me for dopamine
        </h1>

        <p className="text-sm font-medium text-slate-400 mt-1">
          “Protect your focus. Get your time back.”
        </p>
      </div>

      {/* Main Center Display: Countdown & Focus Status */}
      <div className="w-full max-w-md mx-auto px-6 py-6 text-center flex-1 flex flex-col justify-center items-center">
        {/* Large Countdown Timer */}
        <div className="relative my-4">
          <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Required Texts */}
        <div className="space-y-1 mt-2">
          <p className="text-lg font-bold text-red-400 flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 fill-current" />
            <span>Focus mode is active</span>
          </p>
          <p className="text-sm font-semibold text-slate-300">
            Only calling is available
          </p>
        </div>

        {/* Restricted App Grid with Lock Indicators */}
        <div className="w-full mt-6 bg-[#0e121a]/90 border border-slate-800/80 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">Restricted Apps</span>
            <span className="text-[11px] text-red-400 font-mono">ALL BLOCKED</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {RESTRICTED_APPS.map((app) => (
              <button
                key={app.name}
                onClick={() => handleAppTap(app.name)}
                type="button"
                className="p-2.5 rounded-2xl bg-[#141822] border border-slate-800/70 hover:border-red-500/40 flex flex-col items-center justify-center text-center transition-all group relative active:scale-95"
              >
                <span className="text-2xl mb-1 opacity-70 group-hover:opacity-100">{app.icon}</span>
                <span className="text-[11px] font-medium text-slate-300 truncate w-full">{app.name}</span>
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Warning / Toast notification when trying to open app */}
          {restrictedToastApp && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 text-center animate-shake flex items-center justify-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>{restrictedToastApp} is blocked!</strong> Only phone calling is permitted during this session.
              </span>
            </div>
          )}
        </div>

        {/* Calling Access Bar */}
        <div className="w-full mt-4 flex gap-2">
          <button
            id="btn-open-dialer"
            onClick={() => setShowDialer(true)}
            type="button"
            className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>Open Phone Dialer</span>
          </button>

          <button
            onClick={() => handleStartCall('911')}
            type="button"
            className="py-3.5 px-4 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 font-bold text-xs transition-all flex items-center gap-1.5"
            title="Emergency SOS"
          >
            <span>SOS 911</span>
          </button>
        </div>
      </div>

      {/* Footer / Unlock Early Control */}
      <div className="w-full max-w-md mx-auto pb-8 px-6 text-center">
        <button
          id="btn-unlock-protection-early"
          onClick={() => {
            setPasswordError('');
            setPasswordInput('');
            setShowPasswordModal(true);
          }}
          type="button"
          className="text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors py-2 px-4 rounded-xl hover:bg-slate-900 flex items-center justify-center gap-1.5 mx-auto"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Unlock before timer ends</span>
        </button>

        <p className="text-[10px] text-slate-600 mt-2">
          WakeGuard Focus Shield • System-level app limits enforced
        </p>
      </div>

      {/* ================= ACTIVE PHONE CALL SCREEN ================= */}
      {activeCallNumber && (
        <div
          id="active-call-overlay"
          className="fixed inset-0 z-50 bg-[#0a0c12] text-white flex flex-col justify-between p-8 animate-fade-in"
        >
          <div className="text-center pt-8">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Active Call
            </span>
            <h2 className="text-3xl font-extrabold font-mono mt-4 text-white">
              {activeCallNumber}
            </h2>
            <p className="text-sm font-mono text-slate-400 mt-2">
              {Math.floor(callSeconds / 60)}:{(callSeconds % 60).toString().padStart(2, '0')}
            </p>
          </div>

          {/* Call action controls */}
          <div className="w-full max-w-xs mx-auto pb-10 space-y-6">
            <div className="flex justify-around items-center">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                type="button"
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isSpeaker ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={handleEndCall}
              type="button"
              className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= DIALER PAD MODAL ================= */}
      {showDialer && (
        <div
          id="dialer-pad-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#11141c] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Priority Phone Dialer</h3>
              </div>
              <button
                onClick={() => setShowDialer(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Displayed dialed number */}
            <div className="h-16 flex items-center justify-center my-2 text-3xl font-extrabold font-mono text-white tracking-widest overflow-x-auto">
              {dialerNumber || <span className="text-slate-600 text-lg font-sans">Enter number...</span>}
            </div>

            {/* Dialer grid */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDialerKey(d)}
                  type="button"
                  className="h-14 bg-[#181d27] hover:bg-[#202735] active:scale-95 text-white font-mono text-xl font-bold rounded-2xl border border-slate-800 flex items-center justify-center"
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Bottom row actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setDialerNumber((prev) => prev.slice(0, -1))}
                type="button"
                className="w-14 h-14 bg-slate-900 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center border border-slate-800"
              >
                <Delete className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleStartCall()}
                disabled={!dialerNumber}
                type="button"
                className={`flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg ${
                  dialerNumber
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PASSWORD UNLOCK SCREEN (Required By Prompt) ================= */}
      {showPasswordModal && (
        <div
          id="password-screen-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            id="password-screen-dialog"
            className="w-full max-w-sm bg-[#12151e] border border-red-500/40 rounded-3xl p-6 shadow-2xl text-center relative"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            {/* Prompt exact text requirement */}
            <h3 className="text-lg font-bold text-white tracking-tight">
              Enter password to disable protection
            </h3>

            <form onSubmit={handleVerifyPassword} className="mt-4 space-y-4">
              <div className="relative">
                <input
                  id="developer-password-input"
                  type="password"
                  placeholder="••••"
                  autoFocus
                  maxLength={10}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full text-center tracking-[0.4em] text-2xl font-extrabold font-mono bg-[#0b0d11] text-white rounded-2xl py-3 border border-slate-700 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Exact text requirement directly underneath input */}
              <p className="text-xs font-semibold text-slate-400">
                Please collect password from the developer.
              </p>

              {passwordError && (
                <p className="text-xs font-bold text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-500/40 animate-shake">
                  {passwordError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !passwordInput}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
