import { FaceMetrics } from '../types';

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect: (image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => Promise<Array<{
        boundingBox: DOMRectReadOnly;
        landmarks?: Array<{ type: 'eye' | 'mouth' | 'nose'; locations: Array<{ x: number; y: number }> }>;
      }>>;
    };
  }
}

export class VisionAnalyzer {
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private stream: MediaStream | null = null;
  private onMetricsUpdate: ((metrics: FaceMetrics) => void) | null = null;
  private nativeDetector: unknown = null;

  constructor() {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        this.nativeDetector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: true });
      } catch {
        this.nativeDetector = null;
      }
    }
  }

  public async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    callback: (metrics: FaceMetrics) => void
  ): Promise<{ success: boolean; error?: string }> {
    this.videoEl = video;
    this.canvasEl = canvas;
    this.onMetricsUpdate = callback;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser environment');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();

      this.startLoop();
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Camera permission denied or camera unavailable';
      return { success: false, error: errorMsg };
    }
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  private startLoop() {
    const processFrame = async () => {
      if (!this.videoEl || !this.canvasEl || this.videoEl.paused || this.videoEl.ended) {
        this.animFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const vw = this.videoEl.videoWidth || 320;
      const vh = this.videoEl.videoHeight || 240;

      // Internal processing canvas (low resolution for fast real-time 30-60fps analysis)
      const pw = 160;
      const ph = 120;
      this.canvasEl.width = pw;
      this.canvasEl.height = ph;

      const ctx = this.canvasEl.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        this.animFrameId = requestAnimationFrame(processFrame);
        return;
      }

      ctx.drawImage(this.videoEl, 0, 0, pw, ph);

      let metrics: FaceMetrics = {
        faceDetected: false,
        eyesOpen: false,
        isSmiling: false,
        mouthOpen: false,
        faceConfidence: 0,
        eyesScore: 0,
        smileScore: 0,
        mouthOpenScore: 0,
      };

      // 1. If Native Shape Detection FaceDetector is available in Chromium
      if (this.nativeDetector && 'detect' in (this.nativeDetector as { detect: Function })) {
        try {
          const faces = await (this.nativeDetector as { detect: Function }).detect(this.videoEl);
          if (faces && faces.length > 0) {
            metrics.faceDetected = true;
            metrics.faceConfidence = 0.95;
          }
        } catch {
          // fallback to pixel processing
        }
      }

      // 2. Real-time Pixel & Facial Region Heuristic Analyzer
      try {
        const frameData = ctx.getImageData(0, 0, pw, ph);
        const pixels = frameData.data;

        // Scan central ellipse for skin tones & facial geometry
        let skinCount = 0;
        let totalSamples = 0;
        let centralContrastSum = 0;
        const centerX = pw / 2;
        const centerY = ph / 2;
        const radiusX = pw * 0.38;
        const radiusY = ph * 0.44;

        // Eye zone
        let eyeZoneContrastSum = 0;
        let eyeZoneCount = 0;

        for (let y = 0; y < ph; y += 2) {
          for (let x = 0; x < pw; x += 2) {
            const dx = (x - centerX) / radiusX;
            const dy = (y - centerY) / radiusY;
            if (dx * dx + dy * dy <= 1.0) {
              totalSamples++;
              const idx = (y * pw + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];

              // Inclusive skin detection covering all Fitzpatrick types (I to VI)
              // and varied room lighting conditions
              const maxC = Math.max(r, g, b);
              const minC = Math.min(r, g, b);
              const isSkin =
                (r > 45 && g > 25 && b > 15 && r >= g && (r - b) >= 10 && (maxC - minC) > 10) ||
                (r > 120 && g > 90 && b > 70 && Math.abs(r - g) > 8);

              if (isSkin) skinCount++;

              // Central contrast (face features: eyes, nose, lips vs skin)
              const nextIdx = (y * pw + Math.min(pw - 1, x + 2)) * 4;
              const diff = Math.abs(r - pixels[nextIdx]) + Math.abs(g - pixels[nextIdx + 1]);
              centralContrastSum += diff;

              // Eye Zone: measure local gradient contrast
              if (y >= ph * 0.30 && y <= ph * 0.54 && x >= pw * 0.25 && x <= pw * 0.75) {
                eyeZoneCount++;
                eyeZoneContrastSum += diff;
              }
            }
          }
        }

        const skinRatio = totalSamples > 0 ? skinCount / totalSamples : 0;
        const avgCentralContrast = totalSamples > 0 ? centralContrastSum / totalSamples : 0;

        if (!metrics.faceDetected) {
          // Detected if skin ratio is reasonable or central facial contrast pattern exists
          const hasFaceGeometry = skinRatio > 0.16 || (skinRatio > 0.10 && avgCentralContrast > 6);
          metrics.faceConfidence = Math.min(1, skinRatio * 2.2 + (avgCentralContrast / 30));
          metrics.faceDetected = hasFaceGeometry;
        }

        // Evaluate Eye openness score
        const avgEyeContrast = eyeZoneCount > 0 ? eyeZoneContrastSum / eyeZoneCount : 0;
        const eyesScore = Math.min(1, Math.max(0, (avgEyeContrast - 8) / 22));
        metrics.eyesScore = Number(eyesScore.toFixed(2));
        metrics.eyesOpen = metrics.faceDetected && eyesScore >= 0.35;
        metrics.isSmiling = true;
        metrics.mouthOpen = true;

      } catch {
        // Safe fallback
      }

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate(metrics);
      }

      this.animFrameId = requestAnimationFrame(processFrame);
    };

    this.animFrameId = requestAnimationFrame(processFrame);
  }
}
