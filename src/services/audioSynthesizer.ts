// Web Audio API sound synthesizer for WakeGuard alarms and haptic feedback

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmOscillators: OscillatorNode[] = [];
  private alarmGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private alarmTimer: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startAlarm(soundType: 'crimson_surge' | 'radar_pulse' | 'cyber_alert' | 'zenith_rise' = 'crimson_surge', volume = 0.9) {
    this.stopAlarm();
    this.initContext();
    if (!this.ctx) return;

    this.isAlarmPlaying = true;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;

    this.alarmGain = this.ctx.createGain();
    this.alarmGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.alarmGain.gain.exponentialRampToValueAtTime(Math.max(0.1, volume), this.ctx.currentTime + 1.2);

    this.alarmGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Vibration pattern if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600, 300]);
      } catch {
        // ignore
      }
    }

    // Play repeating alarm loop according to soundType
    let pulseCount = 0;
    const playPulse = () => {
      if (!this.isAlarmPlaying || !this.ctx || !this.alarmGain) return;

      const now = this.ctx.currentTime;

      if (soundType === 'crimson_surge') {
        // Aggressive dual saw pulse with pitch sweep
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const pulseGain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        const baseFreq = pulseCount % 2 === 0 ? 880 : 1040;
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);
        osc2.frequency.setValueAtTime(baseFreq * 0.5, now);

        pulseGain.gain.setValueAtTime(0.7, now);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(pulseGain);
        osc2.connect(pulseGain);
        pulseGain.connect(this.alarmGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);

        pulseCount++;
        this.alarmTimer = window.setTimeout(playPulse, 320);

      } else if (soundType === 'radar_pulse') {
        // High ping sonar chime
        const osc = this.ctx.createOscillator();
        const pulseGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.4);

        pulseGain.gain.setValueAtTime(0.8, now);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(pulseGain);
        pulseGain.connect(this.alarmGain);

        osc.start(now);
        osc.stop(now + 0.45);

        this.alarmTimer = window.setTimeout(playPulse, 500);

      } else if (soundType === 'cyber_alert') {
        // Rapid 3-pip tactical chime
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const pipGain = this.ctx.createGain();
          const pipStart = now + i * 0.1;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100 + i * 220, pipStart);

          pipGain.gain.setValueAtTime(0.7, pipStart);
          pipGain.gain.exponentialRampToValueAtTime(0.001, pipStart + 0.08);

          osc.connect(pipGain);
          pipGain.connect(this.alarmGain);

          osc.start(pipStart);
          osc.stop(pipStart + 0.09);
        }
        this.alarmTimer = window.setTimeout(playPulse, 550);

      } else {
        // Zenith Rise - uplifting harmonic chord
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C E G C
        freqs.forEach((f, idx) => {
          if (!this.ctx || !this.alarmGain) return;
          const osc = this.ctx.createOscillator();
          const chordGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);

          chordGain.gain.setValueAtTime(0.4, now + idx * 0.05);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

          osc.connect(chordGain);
          chordGain.connect(this.alarmGain);

          osc.start(now + idx * 0.05);
          osc.stop(now + 0.65);
        });

        this.alarmTimer = window.setTimeout(playPulse, 700);
      }
    };

    playPulse();
  }

  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.alarmTimer) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
    }
    if (this.alarmGain && this.ctx) {
      try {
        this.alarmGain.gain.setValueAtTime(this.alarmGain.gain.value, this.ctx.currentTime);
        this.alarmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
      } catch {
        // ignore
      }
    }
    this.alarmOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // ignore
      }
    });
    this.alarmOscillators = [];
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public playSuccess() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Ascending arpeggio
    const freqs = [587.33, 739.99, 880, 1174.66]; // D F# A D
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.45);
    });
  }

  public playError() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playKeyClick() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Dual-tone multi-frequency (DTMF) for phone dialer
  public playDTMF(digit: string) {
    this.initContext();
    if (!this.ctx) return;

    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = dtmfFreqs[digit] || [700, 1200];
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }
}

export const soundSynth = new AudioSynthesizer();
