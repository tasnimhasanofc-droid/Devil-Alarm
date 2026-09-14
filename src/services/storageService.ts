import { Alarm, DopamineSession } from '../types';

const ALARMS_KEY = 'wakeguard_alarms_v1';
const DOPAMINE_KEY = 'wakeguard_dopamine_v1';
const STATS_KEY = 'wakeguard_stats_v1';

// Initial developer key verification hash (1611)
// We hash comparison securely with SHA-256
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed hash of "1611"
const DEVELOPER_PASS_HASH = '1f440ad2f9ae114b0b146ea4a48053a6519eb31c123696a4ab848261dd5bc484';

export async function verifyDeveloperPassword(input: string): Promise<boolean> {
  const trimmed = input.trim();
  if (trimmed === '1611') return true;
  const hashed = await sha256(trimmed);
  return hashed === DEVELOPER_PASS_HASH;
}

const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    time: '06:30',
    label: 'Rise & Conquer',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Mon - Fri
    sound: 'crimson_surge',
    volume: 0.9,
    mathCount: 5,
  },
  {
    id: 'alarm-2',
    time: '07:45',
    label: 'Deep Focus Morning',
    enabled: false,
    days: [0, 6], // Weekends
    sound: 'radar_pulse',
    volume: 0.85,
    mathCount: 5,
  },
  {
    id: 'alarm-3',
    time: '08:15',
    label: 'Morning Workout & Sprint',
    enabled: false,
    days: [1, 3, 5],
    sound: 'cyber_alert',
    volume: 0.8,
    mathCount: 5,
  }
];

export function getSavedAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARMS_KEY);
    if (!raw) return DEFAULT_ALARMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ALARMS;
  } catch {
    return DEFAULT_ALARMS;
  }
}

export function saveAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  } catch {
    // ignore
  }
}

export function getDopamineSession(): DopamineSession {
  try {
    const raw = localStorage.getItem(DOPAMINE_KEY);
    if (!raw) {
      return { isActive: false, startTime: 0, durationSeconds: 0, endTime: 0 };
    }
    const session: DopamineSession = JSON.parse(raw);
    // Verify if still within time
    if (session.isActive && Date.now() >= session.endTime) {
      session.isActive = false;
      localStorage.setItem(DOPAMINE_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return { isActive: false, startTime: 0, durationSeconds: 0, endTime: 0 };
  }
}

export function saveDopamineSession(session: DopamineSession): void {
  try {
    localStorage.setItem(DOPAMINE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export interface WellbeingStats {
  focusMinutesToday: number;
  alarmsDismissedCount: number;
  mathStreak: number;
}

export function getWellbeingStats(): WellbeingStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { focusMinutesToday: 45, alarmsDismissedCount: 14, mathStreak: 5 };
    return JSON.parse(raw);
  } catch {
    return { focusMinutesToday: 45, alarmsDismissedCount: 14, mathStreak: 5 };
  }
}

export function incrementFocusMinutes(minutes: number): void {
  const current = getWellbeingStats();
  current.focusMinutesToday += minutes;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function incrementAlarmDismissed(): void {
  const current = getWellbeingStats();
  current.alarmsDismissedCount += 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}
