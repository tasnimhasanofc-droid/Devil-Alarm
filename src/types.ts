export interface Alarm {
  id: string;
  time: string; // HH:mm format (e.g. "07:00")
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  sound: 'crimson_surge' | 'radar_pulse' | 'cyber_alert' | 'zenith_rise';
  volume: number; // 0 to 1
  mathCount: number; // default 5
}

export interface MathProblem {
  id: string;
  num1: number;
  num2: number;
  operator: '+' | '−' | '×';
  answer: number;
  equation: string;
}

export interface DopamineSession {
  isActive: boolean;
  startTime: number;
  durationSeconds: number;
  endTime: number;
}

export interface FaceMetrics {
  faceDetected: boolean;
  eyesOpen: boolean;
  isSmiling: boolean;
  mouthOpen: boolean;
  faceConfidence: number; // 0 to 1
  eyesScore: number; // 0 to 1
  smileScore: number; // 0 to 1
  mouthOpenScore: number; // 0 to 1
}

export type AppTab = 'home' | 'alarms' | 'dopamine';
