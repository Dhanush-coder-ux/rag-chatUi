/**
 * AudioPlayer — plays audio chunks (MP3/WebM) received from the backend TTS.
 * Uses HTMLAudioElement with object URLs for broad browser compatibility,
 * since decoding MP3 chunks via AudioContext is unreliable across browsers.
 */
export class AudioPlayer {
  private queue: string[] = [];   // Object URLs pending playback
  private playing = false;
  private currentAudio: HTMLAudioElement | null = null;
  private stopped = false;

  private async playNext() {
    if (this.playing || this.stopped || this.queue.length === 0) return;
    this.playing = true;
    const url = this.queue.shift()!;
    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      this.playing = false;
      this.currentAudio = null;
      this.playNext();
    };
    audio.onerror = (e) => {
      console.error('AudioPlayer playback error', e);
      URL.revokeObjectURL(url);
      this.playing = false;
      this.currentAudio = null;
      this.playNext();
    };
    try {
      await audio.play();
    } catch (e) {
      console.error('AudioPlayer play() rejected', e);
      this.playing = false;
      this.playNext();
    }
  }

  async playChunk(arrayBuffer: ArrayBuffer) {
    if (this.stopped) return;
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    this.queue.push(url);
    this.playNext();
  }

  stop() {
    this.stopped = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    // Revoke any pending URLs
    this.queue.forEach(url => URL.revokeObjectURL(url));
    this.queue = [];
    this.playing = false;
    // Reset for next session
    this.stopped = false;
  }
}
