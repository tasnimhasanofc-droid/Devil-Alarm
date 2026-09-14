import React, { useState, useEffect, useRef } from 'react';
import { Alarm, MathProblem, FaceMetrics } from '../types';
import { generateMathProblem } from '../services/mathService';
import { soundSynth } from '../services/audioSynthesizer';
import { VisionAnalyzer } from '../services/faceDetection';
import confetti from 'canvas-confetti';
import {
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Delete,
  Eye,
  Smile,
  ScanFace,
  Sparkles,
} from 'lucide-react';

interface ActiveAlarmModalProps {
  alarm: Alarm;
  onDismissSuccess: () => void;
}

export const ActiveAlarmModal: React.FC<ActiveAlarmModalProps> = ({
  alarm,
  onDismissSuccess,
}) => {
  // Verification states - Starts directly with Face Verification as requested
  const [currentStep, setCurrentStep] = useState<'camera' | 'math' | 'success'>('camera');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Math challenge states (can be accessed optionally)
  const [mathProblem, setMathProblem] = useState<MathProblem>(() => generateMathProblem());
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const totalProblemsRequired = 5;
  const [userInput, setUserInput] = useState<string>('');
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera & Face states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visionAnalyzerRef = useRef<VisionAnalyzer | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics>({
    faceDetected: false,
    eyesOpen: false,
    isSmiling: false,
    mouthOpen: false,
    faceConfidence: 0,
    eyesScore: 0,
    smileScore: 0,
    mouthOpenScore: 0,
  });
  const [wakeHoldProgress, setWakeHoldProgress] = useState(0); // 0 to 100%

  // Waveform visualization ref
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Alarm sound starts immediately on mount
  useEffect(() => {
    soundSynth.startAlarm(alarm.sound, alarm.volume);

    // Render audio waveform
    let animId: number;
    const drawWave = () => {
      const canvas = waveformCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const data = soundSynth.getWaveformData();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barCount = 28;
          const barWidth = canvas.width / barCount - 2;
          for (let i = 0; i < barCount; i++) {
            const rawVal = data[i % data.length] || 128;
            const barHeight = Math.max(4, (rawVal / 255) * canvas.height * 0.85);
            const x = i * (barWidth + 2);
            const y = canvas.height / 2 - barHeight / 2;

            // Gradient from crimson red to neon coral
            const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
            grad.addColorStop(0, '#f87171');
            grad.addColorStop(1, '#dc2626');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();
          }
        }
      }
      animId = requestAnimationFrame(drawWave);
    };

    drawWave();

    return () => {
      cancelAnimationFrame(animId);
      soundSynth.stopAlarm();
    };
  }, [alarm.sound, alarm.volume]);

  // Handle Math Input
  const handleKeypadPress = (val: string) => {
    soundSynth.playKeyClick();
    if (userInput.length < 5) {
      setUserInput((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    soundSynth.playKeyClick();
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundSynth.playKeyClick();
    setUserInput('');
  };

  const handleSubmitMath = () => {
    if (!userInput) return;
    const numericAns = parseInt(userInput, 10);

    if (numericAns === mathProblem.answer) {
      // Correct!
      soundSynth.playSuccess();
      const nextCount = solvedCount + 1;
      setSolvedCount(nextCount);
      setUserInput('');
      setErrorMessage('');

      if (nextCount >= totalProblemsRequired) {
        // Step 1 completed! Automatically transition to Step 2: Camera Verification
        setCurrentStep('camera');
      } else {
        // Next problem
        setMathProblem(generateMathProblem([mathProblem.id]));
      }
    } else {
      // Incorrect! Give another problem and keep alarm ringing
      soundSynth.playError();
      setIsErrorShake(true);
      setErrorMessage(`Incorrect (${userInput})! Try this new challenge:`);
      setUserInput('');
      setTimeout(() => setIsErrorShake(false), 500);
      setMathProblem(generateMathProblem([mathProblem.id]));
    }
  };

  // Step 2: Initialize camera and smile detection
  useEffect(() => {
    if (currentStep !== 'camera') return;

    const vision = new VisionAnalyzer();
    visionAnalyzerRef.current = vision;

    const initVision = async () => {
      if (videoRef.current && canvasRef.current) {
        const res = await vision.start(videoRef.current, canvasRef.current, (metrics) => {
          setFaceMetrics(metrics);
        });
        if (res.success) {
          setCameraActive(true);
          setCameraError(null);
        } else {
          setCameraActive(false);
          setCameraError(res.error || 'Camera access error');
        }
      }
    };

    // Small delay to let DOM render video element
    const t = setTimeout(initVision, 150);

    return () => {
      clearTimeout(t);
      if (visionAnalyzerRef.current) {
        visionAnalyzerRef.current.stop();
      }
    };
  }, [currentStep]);

  // Face qualification checker - Just verify face
  useEffect(() => {
    if (currentStep !== 'camera') return;

    // Direct requirement: Just verify face
    const isFaceVerified = faceMetrics.faceDetected;

    let interval: number;

    if (isFaceVerified) {
      interval = window.setInterval(() => {
        setWakeHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            triggerSuccess();
            return 100;
          }
          return prev + 20;
        });
      }, 100);
    } else {
      // Decay slightly if face leaves frame
      interval = window.setInterval(() => {
        setWakeHoldProgress((prev) => Math.max(0, prev - 12));
      }, 150);
    }

    return () => clearInterval(interval);
  }, [currentStep, faceMetrics.faceDetected]);

  // Success handler
  const triggerSuccess = () => {
    setCurrentStep('success');
    soundSynth.stopAlarm();
    soundSynth.playSuccess();

    if (visionAnalyzerRef.current) {
      visionAnalyzerRef.current.stop();
    }

    // Burst golden celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#ffffff'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onDismissSuccess();
    }, 2800);
  };

  // Keyboard shortcut listener for numeric keypad
  useEffect(() => {
    if (currentStep !== 'math') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmitMath();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      id="active-alarm-screen"
      className="fixed inset-0 z-50 bg-[#07090d] text-white flex flex-col justify-between overflow-y-auto"
    >
      {/* Background ambient red pulsing aura */}
      <div className="absolute inset-0 bg-radial from-red-900/25 via-[#07090d]/80 to-[#07090d] -z-10 pointer-events-none animate-pulse-ring" />

      {/* Top Header & Huge Clock */}
      <div className="w-full max-w-md mx-auto pt-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold tracking-wider uppercase mb-3 animate-bounce">
          <BellRing className="w-3.5 h-3.5" />
          <span>Wake Up! Verification Active</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tighter text-white drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
          {currentTimeStr || alarm.time}
        </h1>

        <p className="text-base font-semibold text-slate-300 mt-1">
          {alarm.label || 'Rise & Conquer'}
        </p>

        {/* Audio Waveform Visualizer */}
        <div className="mt-3 w-full flex items-center justify-center">
          <canvas
            ref={waveformCanvasRef}
            width={280}
            height={44}
            className="w-full max-w-[280px] h-10 opacity-90"
          />
        </div>

        {/* Step Indicator Header */}
        <div className="mt-4 flex items-center justify-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              currentStep === 'camera'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                : currentStep === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Face Verification Active</span>
          </div>

          <button
            onClick={() => setCurrentStep(currentStep === 'camera' ? 'math' : 'camera')}
            type="button"
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 transition-colors"
          >
            {currentStep === 'camera' ? 'Optional: Math' : 'Back to Face'}
          </button>
        </div>
      </div>

      {/* Main Verification Content Area */}
      <div className="w-full max-w-md mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        {/* ================= STEP 1: MATH CHALLENGE ================= */}
        {currentStep === 'math' && (
          <div className="w-full flex flex-col items-center">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalProblemsRequired }, (_, i) => (
                <div
                  key={i}
                  className={`w-7 h-2 rounded-full transition-all duration-300 ${
                    i < solvedCount
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/40'
                      : i === solvedCount
                      ? 'bg-red-500 w-10 shadow-md shadow-red-500/40'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-2 font-medium">
              Solve {totalProblemsRequired - solvedCount} more to unlock camera
            </p>

            {/* Problem card */}
            <div
              className={`w-full bg-[#11141c] border rounded-3xl p-6 shadow-2xl text-center transition-all ${
                isErrorShake
                  ? 'border-red-500 animate-shake bg-red-950/20'
                  : 'border-slate-700/70'
              }`}
            >
              {errorMessage && (
                <div className="mb-2 text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Equation display */}
              <div className="text-4xl font-extrabold font-mono tracking-wider text-slate-100 my-2">
                {mathProblem.equation} ={' '}
                <span className="text-red-400 underline decoration-red-500/50 decoration-4">
                  {userInput || '?'}
                </span>
              </div>
            </div>

            {/* Modern Numeric Keypad */}
            <div className="w-full grid grid-cols-3 gap-2.5 mt-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  type="button"
                  className="h-14 bg-[#151922] hover:bg-[#1f2533] active:scale-95 text-white font-mono text-2xl font-bold rounded-2xl border border-slate-800 transition-all flex items-center justify-center shadow-md"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleClear}
                type="button"
                className="h-14 bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-400 font-semibold text-xs rounded-2xl border border-slate-800 flex items-center justify-center uppercase tracking-wider"
              >
                Clear
              </button>

              <button
                onClick={() => handleKeypadPress('0')}
                type="button"
                className="h-14 bg-[#151922] hover:bg-[#1f2533] active:scale-95 text-white font-mono text-2xl font-bold rounded-2xl border border-slate-800 transition-all flex items-center justify-center shadow-md"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                type="button"
                className="h-14 bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-400 rounded-2xl border border-slate-800 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitMath}
              disabled={!userInput}
              type="button"
              className={`w-full mt-4 py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg ${
                userInput
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30 hover:from-red-500 hover:to-red-400 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Submit Answer</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: SMILE & WAKE CAMERA ================= */}
        {currentStep === 'camera' && (
          <div className="w-full flex flex-col items-center">
            {/* Camera Viewport Container */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-red-500/70 shadow-[0_0_35px_rgba(239,68,68,0.35)] bg-slate-950 flex items-center justify-center">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Hidden Canvas for Pixel Processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* High-tech HUD Overlay Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Circular scanner reticle */}
                <div className="w-56 h-56 rounded-full border border-red-400/40 border-dashed animate-spin-slow" />
                {/* Animated scan line */}
                <div className="absolute w-64 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan" />

                {/* Facial alignment guides */}
                <div className="absolute top-1/3 left-1/4 w-6 h-6 border-t-2 border-l-2 border-red-400/60 rounded-tl-md" />
                <div className="absolute top-1/3 right-1/4 w-6 h-6 border-t-2 border-r-2 border-red-400/60 rounded-tr-md" />
                <div className="absolute bottom-1/4 w-12 h-6 border-b-2 border-red-400/60 rounded-b-xl" />
              </div>

              {/* Circular Hold Progress Bar Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray="900"
                  strokeDashoffset={900 - (900 * wakeHoldProgress) / 100}
                  className="transition-all duration-150 ease-out"
                />
              </svg>

              {/* Camera access error fallback */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-4 text-center flex flex-col items-center justify-center z-20">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Please grant camera permission to verify wakefulness.
                  </p>
                  <button
                    onClick={() => {
                      // Allow testing bypass if camera is truly unavailable on device
                      setFaceMetrics({
                        faceDetected: true,
                        eyesOpen: true,
                        isSmiling: true,
                        mouthOpen: true,
                        faceConfidence: 1,
                        eyesScore: 1,
                        smileScore: 1,
                        mouthOpenScore: 1,
                      });
                      triggerSuccess();
                    }}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow"
                  >
                    Simulate Wake Expression
                  </button>
                </div>
              )}
            </div>

            {/* Face Biometric Verification Status */}
            <div className="w-full mt-4 p-3.5 rounded-2xl border transition-all bg-[#12151e] border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    faceMetrics.faceDetected
                      ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{faceMetrics.faceDetected ? 'Face Detected' : 'Detecting Face...'}</span>
                    {faceMetrics.faceDetected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {faceMetrics.faceDetected
                      ? 'Hold steady to confirm wakefulness'
                      : 'Position your face in the camera circle'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-xl transition-all ${
                    faceMetrics.faceDetected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {faceMetrics.faceDetected ? `${wakeHoldProgress}%` : 'Waiting'}
                </div>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="w-full mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center shadow-lg">
              <p className="text-sm font-bold text-red-200 tracking-tight">
                “Look at the camera to verify your face.”
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Keep your face visible for a moment to silence the alarm.
              </p>
            </div>

            {/* Quick Assist Button for Testing without camera */}
            <button
              onClick={() => {
                setFaceMetrics({
                  faceDetected: true,
                  eyesOpen: true,
                  isSmiling: true,
                  mouthOpen: true,
                  faceConfidence: 1,
                  eyesScore: 1,
                  smileScore: 1,
                  mouthOpenScore: 1,
                });
                triggerSuccess();
              }}
              type="button"
              className="mt-3 text-[11px] text-slate-500 hover:text-slate-300 underline"
            >
              Simulate face detection
            </button>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ANIMATION ================= */}
        {currentStep === 'success' && (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-bounce">
              <Sparkles className="w-12 h-12" />
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Good morning!
            </h2>
            <p className="text-lg font-semibold text-emerald-400 mt-1">
              Alarm dismissed.
            </p>

            <p className="text-xs text-slate-400 mt-4">
              Face verified • You are up and ready to conquer your day!
            </p>
          </div>
        )}
      </div>

      {/* Footer Privacy Note */}
      <div className="w-full max-w-md mx-auto pb-6 px-6 text-center text-[10px] text-slate-600">
        Privacy Protected • Face landmarks analyzed locally in device memory • No images saved
      </div>
    </div>
  );
};
