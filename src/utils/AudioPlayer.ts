export class AudioPlayer {
  private audioContext: AudioContext;
  private nextTime: number;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.nextTime = 0;
  }

  async playChunk(arrayBuffer: ArrayBuffer) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // Decode the audio chunk
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      
      // Ensure we don't schedule in the past
      if (this.nextTime < currentTime) {
        this.nextTime = currentTime + 0.1; // Small buffer for initial chunk
      }

      source.start(this.nextTime);
      this.nextTime += audioBuffer.duration;
    } catch (e) {
      console.error('Failed to decode audio chunk', e);
    }
  }

  stop() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.nextTime = 0;
  }
}
