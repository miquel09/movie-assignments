import { Component, DestroyRef, signal, ChangeDetectionStrategy, HostListener, inject, NgZone, Renderer2 } from '@angular/core';
import { Movie } from './movies/movie.interface';
import { MoviesComponent } from './movies/movies.component';

@Component({
    selector: 'app-root',
    imports: [MoviesComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = signal('Movies');
  extraGlam = signal(true);
  soundtrackPlaying = signal(false);
  soundtrackError = signal('');
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private cometHead: HTMLElement | null = null;
  private previousPointer: { x: number; y: number } | null = null;
  private readonly cometParticles: HTMLElement[] = [];
  private particleIndex = 0;
  readonly stars = Array.from({ length: 340 }, (_, id) => ({
    id,
    x: (id * 47 + 11) % 100,
    y: (id * 71 + 7) % 100,
    size: id % 9 === 0 ? 4 : id % 3 === 0 ? 2 : 1,
    delay: -((id * 13) % 60) / 10,
    duration: 1.2 + ((id * 17) % 34) / 10,
    color: ['#ffffff', '#ff8bd2', '#d8c5ff', '#ffe8b0', '#ff4fb5', '#ffc2e8'][id % 6],
    bright: id % 9 === 0,
  }));
  private audioContext: AudioContext | null = null;
  private soundtrackGain: GainNode | null = null;
  private soundtrackTimer: number | undefined;
  private soundtrackStep = 0;
  private readonly soundtrackStepMs = 300;
  private readonly chordLengthInSteps = 8;

  toggleExtraGlam(): void {
    this.extraGlam.update((enabled) => !enabled);
  }

  async toggleSoundtrack(): Promise<void> {
    if (this.soundtrackPlaying()) {
      this.stopSoundtrack();
      return;
    }

    if (typeof AudioContext === 'undefined') {
      this.soundtrackError.set('Soundtrack audio is not supported in this browser.');
      return;
    }

    try {
      this.audioContext ??= new AudioContext();
      await this.audioContext.resume();
      this.soundtrackGain ??= this.createSoundtrackGain(this.audioContext);
      this.soundtrackGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.soundtrackGain.gain.setTargetAtTime(0.16, this.audioContext.currentTime, 0.45);
      this.soundtrackError.set('');
      this.soundtrackPlaying.set(true);
      this.soundtrackStep = 0;
      this.playNextSoundtrackNote();
      this.soundtrackTimer = window.setInterval(() => this.playNextSoundtrackNote(), this.soundtrackStepMs);
    } catch (error) {
      console.error('Unable to start the original sparkle soundtrack.', error);
      this.soundtrackError.set('The soundtrack could not be started. Please try again.');
      this.soundtrackPlaying.set(false);
    }
  }

  constructor() {
    const stopListening = this.zone.runOutsideAngular(() =>
      this.renderer.listen('document', 'pointermove', (event: PointerEvent) => this.onPointerMove(event)),
    );
    const stopLeaveListening = this.zone.runOutsideAngular(() =>
      this.renderer.listen('document', 'pointerleave', () => {
        this.previousPointer = null;
        if (this.cometHead) this.cometHead.style.opacity = '0';
      }),
    );

    this.destroyRef.onDestroy(() => {
      stopListening();
      stopLeaveListening();
      if (this.soundtrackTimer !== undefined) window.clearInterval(this.soundtrackTimer);
      this.cometHead?.remove();
      this.cometParticles.forEach((particle) => particle.remove());
      void this.audioContext?.close();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (event.detail === 0 && target instanceof Element) {
      const bounds = target.getBoundingClientRect();
      this.createSparkleBurst(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    } else {
      this.createSparkleBurst(event.clientX, event.clientY);
    }
    this.playTwinkleSound();
  }

  private onPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!this.cometHead) {
      this.cometHead = this.renderer.createElement('span') as HTMLElement;
      this.renderer.addClass(this.cometHead, 'comet-cursor');
      this.renderer.setAttribute(this.cometHead, 'aria-hidden', 'true');
      this.renderer.appendChild(document.body, this.cometHead);
    }

    const { clientX: x, clientY: y } = event;
    this.cometHead.style.left = `${x}px`;
    this.cometHead.style.top = `${y}px`;
    this.cometHead.style.opacity = '1';

    if (this.previousPointer) {
      const dx = x - this.previousPointer.x;
      const dy = y - this.previousPointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 8) {
        this.cometHead.style.setProperty('--comet-angle', `${Math.atan2(dy, dx)}rad`);
        this.createCometParticle(x - (dx / distance) * 9, y - (dy / distance) * 9);
      }
    }

    this.previousPointer = { x, y };
  }

  private createCometParticle(x: number, y: number): void {
    const particle = this.renderer.createElement('span') as HTMLElement;
    const symbols = ['✦', '✧', '·', '✳', '⋆'];
    const index = this.particleIndex++;
    particle.className = 'comet-particle';
    particle.textContent = symbols[index % symbols.length];
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--particle-delay', `${(index % 4) * 35}ms`);
    particle.style.setProperty('--particle-hue', `${(index % 3) * 28}`);

    if (this.cometParticles.length >= 32) this.cometParticles.shift()?.remove();
    this.cometParticles.push(particle);
    this.renderer.appendChild(document.body, particle);
    window.setTimeout(() => {
      particle.remove();
      const particleIndex = this.cometParticles.indexOf(particle);
      if (particleIndex !== -1) this.cometParticles.splice(particleIndex, 1);
    }, 850);
  }

  private createSparkleBurst(x: number, y: number): void {
    const burst = document.createElement('span');
    burst.className = 'click-sparkle-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    const sparkles = [
      '✦', '✧', '♡', '✳', '⋆', '✦', '♥', '✧',
      '✴', '♡', '✦', '⋆', '✧', '♥', '✳', '✦',
      '♡', '✴', '✧', '⋆', '♥', '✦', '✳', '♡',
      '✦', '✧', '♥', '✴', '⋆', '♡', '✦', '✳',
      '✧', '♥', '✦', '♡', '✴', '⋆', '✧', '✦',
    ];
    sparkles.forEach((sparkle, index) => {
      const particle = document.createElement('span');
      particle.className = `click-sparkle${sparkle === '♡' || sparkle === '♥' ? ' click-sparkle-heart' : ''}`;
      particle.textContent = sparkle;
      particle.style.setProperty('--sparkle-angle', `${index * 9}deg`);
      particle.style.setProperty('--sparkle-distance', `${85 + (index % 5) * 20}px`);
      particle.style.setProperty('--sparkle-delay', `${(index % 8) * 35}ms`);
      burst.appendChild(particle);
    });

    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), 2400);
  }

  private playTwinkleSound(): void {
    if (typeof AudioContext === 'undefined') return;

    this.audioContext ??= new AudioContext();
    const context = this.audioContext;

    void context.resume().then(() => {
      [880, 1174.66, 1567.98].forEach((frequency, index) => {
        const start = context.currentTime + index * 0.055;
        const oscillator = context.createOscillator();
        const volume = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(0.07, start + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.19);
      });
    }).catch((error: unknown) => {
      console.error('Unable to play the button twinkle sound.', error);
    });
  }

  private createSoundtrackGain(context: AudioContext): GainNode {
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    gain.connect(context.destination);
    return gain;
  }

  private stopSoundtrack(): void {
    if (this.soundtrackTimer !== undefined) {
      window.clearInterval(this.soundtrackTimer);
      this.soundtrackTimer = undefined;
    }

    this.soundtrackPlaying.set(false);
    if (this.soundtrackGain && this.audioContext) {
      this.soundtrackGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.soundtrackGain.gain.setTargetAtTime(0.0001, this.audioContext.currentTime, 0.18);
    }
  }

  private playNextSoundtrackNote(): void {
    if (!this.audioContext || !this.soundtrackGain || !this.soundtrackPlaying()) return;

    const melody = [
      659.25, 783.99, 987.77, 783.99, 1174.66, 987.77, 783.99, 587.33,
      659.25, 987.77, 1174.66, 1318.51, 1174.66, 987.77, 783.99, 880,
      698.46, 880, 1046.5, 880, 1318.51, 1174.66, 1046.5, 783.99,
      880, 1046.5, 1318.51, 1567.98, 1396.91, 1174.66, 987.77, 1174.66,
    ];
    const step = this.soundtrackStep % melody.length;
    const note = melody[step];
    const nextNote = melody[(step + 1) % melody.length];
    const start = this.audioContext.currentTime + 0.03;
    const phraseAccent = step % 8 === 0 || step % 8 === 5;
    this.playSoundtrackHiHat(start, step % 4 === 0);
    if (step % 4 === 2) {
      this.playSoundtrackHiHat(start + 0.1, false);
    }
    this.playSoundtrackTone(note, start, phraseAccent ? 0.17 : 0.12, phraseAccent ? 0.27 : 0.22, 'triangle');
    this.playSoundtrackTone(note * 2, start + 0.012, 0.09, 0.07, 'sine');
    if (step % 4 === 2 || step % 4 === 3) {
      this.playSoundtrackTone(note * 1.5, start + 0.035, 0.1, 0.045, 'sine');
    }
    if (step % 4 === 1 || step % 4 === 3) {
      this.playSoundtrackTone(nextNote, start + 0.115, 0.07, 0.06, 'sine');
    }
    if (step % 8 === 6) {
      this.playSoundtrackTone(nextNote * 2, start + 0.07, 0.13, 0.055, 'sine');
      this.playSoundtrackTone(nextNote * 3, start + 0.11, 0.08, 0.025, 'sine');
    }
    if (step % 2 === 0) {
      const glitterNotes = [1760, 2093, 2349.32, 2637.02, 2093, 2637.02, 2349.32, 3135.96];
      this.playSoundtrackTone(glitterNotes[(step / 2) % glitterNotes.length], start + 0.08, 0.075, 0.04, 'sine');
    }

    if (step % this.chordLengthInSteps === 0) {
      const padChords = [
        [164.81, 196, 246.94, 293.66],
        [130.81, 164.81, 196, 246.94],
        [196, 246.94, 293.66, 369.99],
        [146.83, 220, 293.66, 329.63],
      ];
      const chordDuration = (this.soundtrackStepMs * this.chordLengthInSteps) / 1000;
      const chord = padChords[(step / this.chordLengthInSteps) % padChords.length];
      this.playSoundtrackPad(chord, start, chordDuration);
      this.playSoundtrackGuitarRiff(chord, start);
    }

    const bassLine = [82.41, 82.41, 65.41, 65.41, 98, 98, 73.42, 73.42];
    const bassFrequency = bassLine[this.soundtrackStep % bassLine.length];
    this.playSoundtrackBass(bassFrequency, start, this.soundtrackStep % 2 === 0);
    if (this.soundtrackStep % 2 === 0) {
      this.playSoundtrackKick(start, this.soundtrackStep % 4 === 0, bassFrequency);
    }

    if (this.soundtrackStep % 4 === 3) {
      const bubbleNote = [1567.98, 1760, 1975.53, 1760][Math.floor(this.soundtrackStep / 4) % 4];
      this.playSoundtrackTone(bubbleNote, start + 0.1, 0.11, 0.035, 'sine');
    }

    this.soundtrackStep++;
  }

  private playSoundtrackGuitarRiff(chord: number[], start: number): void {
    const riff = [
      { note: 2, offset: 0 },
      { note: 1, offset: 0.22 },
      { note: 3, offset: 0.44 },
      { note: 2, offset: 0.7 },
      { note: 0, offset: 0.94 },
      { note: 2, offset: 1.2 },
    ];

    riff.forEach(({ note, offset }) => this.playSoundtrackGuitarNote(chord[note] * 2, start + offset));
  }

  private playSoundtrackGuitarNote(frequency: number, start: number): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const context = this.audioContext;
    const oscillator = context.createOscillator();
    const doubleOscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = 'sawtooth';
    doubleOscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency * 1.015, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, start + 0.035);
    doubleOscillator.frequency.setValueAtTime(frequency, start);
    doubleOscillator.detune.setValueAtTime(6, start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, start);
    filter.frequency.exponentialRampToValueAtTime(1050, start + 0.2);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.09, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.21);
    oscillator.connect(filter);
    doubleOscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.soundtrackGain);
    oscillator.start(start);
    doubleOscillator.start(start);
    oscillator.stop(start + 0.23);
    doubleOscillator.stop(start + 0.23);
  }

  private playSoundtrackHiHat(start: number, accented: boolean): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const context = this.audioContext;
    const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.055), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index++) {
      noiseData[index] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const envelope = context.createGain();
    noise.buffer = noiseBuffer;
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(7600, start);
    envelope.gain.setValueAtTime(accented ? 0.12 : 0.075, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + (accented ? 0.045 : 0.032));
    noise.connect(highpass);
    highpass.connect(envelope);
    envelope.connect(this.soundtrackGain);
    noise.start(start);
    noise.stop(start + 0.055);
  }

  private playSoundtrackPad(frequencies: number[], start: number, duration: number): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const context = this.audioContext;
    const destination = this.soundtrackGain;
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.detune.setValueAtTime(index % 2 === 0 ? -4 : 4, start);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1700, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.05, start + 0.28);
      envelope.gain.setValueAtTime(0.05, start + duration - 0.35);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }

  private playSoundtrackBass(frequency: number, start: number, accented: boolean): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const oscillator = this.audioContext.createOscillator();
    const shaper = this.audioContext.createWaveShaper();
    const filter = this.audioContext.createBiquadFilter();
    const envelope = this.audioContext.createGain();
    const curve = new Float32Array(512);
    for (let index = 0; index < curve.length; index++) {
      const input = (index * 2) / (curve.length - 1) - 1;
      curve[index] = Math.tanh(input * 5);
    }

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.setValueAtTime(accented ? -7 : 7, start);
    shaper.curve = curve;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(accented ? 950 : 680, start);
    filter.frequency.exponentialRampToValueAtTime(240, start + 0.16);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(accented ? 0.2 : 0.14, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);
    oscillator.connect(shaper);
    shaper.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.soundtrackGain);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
  }

  private playSoundtrackKick(start: number, accented: boolean, tailFrequency: number): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const oscillator = this.audioContext.createOscillator();
    const shaper = this.audioContext.createWaveShaper();
    const filter = this.audioContext.createBiquadFilter();
    const envelope = this.audioContext.createGain();
    const tailOscillator = this.audioContext.createOscillator();
    const tailEnvelope = this.audioContext.createGain();
    const clickFilter = this.audioContext.createBiquadFilter();
    const clickEnvelope = this.audioContext.createGain();
    const curve = new Float32Array(1024);
    for (let index = 0; index < curve.length; index++) {
      const input = (index * 2) / (curve.length - 1) - 1;
      curve[index] = Math.tanh(input * 8);
    }

    shaper.curve = curve;
    shaper.oversample = '4x';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(accented ? 1450 : 1100, start);
    filter.frequency.exponentialRampToValueAtTime(520, start + 0.32);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(accented ? 260 : 220, start);
    oscillator.frequency.exponentialRampToValueAtTime(48, start + 0.11);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(accented ? 0.72 : 0.54, start + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    oscillator.connect(shaper);
    shaper.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.soundtrackGain);
    oscillator.start(start);
    oscillator.stop(start + 0.16);

    tailOscillator.type = 'sine';
    tailOscillator.frequency.setValueAtTime(150, start);
    tailOscillator.frequency.exponentialRampToValueAtTime(tailFrequency, start + 0.13);
    tailEnvelope.gain.setValueAtTime(0.0001, start);
    tailEnvelope.gain.exponentialRampToValueAtTime(accented ? 0.48 : 0.34, start + 0.012);
    tailEnvelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.43);
    tailOscillator.connect(tailEnvelope);
    tailEnvelope.connect(this.soundtrackGain);
    tailOscillator.start(start);
    tailOscillator.stop(start + 0.45);

    const noiseBuffer = this.audioContext.createBuffer(1, Math.ceil(this.audioContext.sampleRate * 0.025), this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index++) {
      noiseData[index] = Math.random() * 2 - 1;
    }
    const click = this.audioContext.createBufferSource();
    click.buffer = noiseBuffer;
    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(1800, start);
    clickEnvelope.gain.setValueAtTime(accented ? 0.22 : 0.14, start);
    clickEnvelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.022);
    click.connect(clickFilter);
    clickFilter.connect(clickEnvelope);
    clickEnvelope.connect(this.soundtrackGain);
    click.start(start);
    click.stop(start + 0.025);
  }

  private playSoundtrackTone(
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    waveform: OscillatorType = 'sine',
  ): void {
    if (!this.audioContext || !this.soundtrackGain) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (waveform === 'triangle' && frequency < 120) {
      oscillator.frequency.setValueAtTime(frequency * 1.12, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency, start + 0.12);
    }
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.soundtrackGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
