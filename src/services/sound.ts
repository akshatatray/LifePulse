/**
 * Sound Service
 * Handles audio feedback for habit interactions
 */

import { Audio } from 'expo-av';
import { useSettingsStore } from '../stores/settingsStore';

// Sound types
type SoundType = 'complete' | 'skip' | 'undo' | 'success' | 'pop';

// Sound cache to avoid reloading
const soundCache: Map<SoundType, Audio.Sound | null> = new Map();

// Sound file mappings (using built-in system sounds as fallback)
// In production, you'd have custom sound files in assets/sounds/
const SOUND_CONFIG: Record<SoundType, { frequency: number; duration: number }> = {
  complete: { frequency: 880, duration: 150 },  // A5 - happy completion
  skip: { frequency: 440, duration: 100 },      // A4 - neutral skip
  undo: { frequency: 330, duration: 100 },      // E4 - soft undo
  success: { frequency: 1047, duration: 200 },  // C6 - celebration
  pop: { frequency: 660, duration: 50 },        // E5 - quick pop
};

class SoundService {
  private isInitialized = false;

  /**
   * Initialize the audio system
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('[Sound] Failed to initialize audio:', error);
    }
  }

  /**
   * Play a sound effect
   */
  async play(type: SoundType): Promise<void> {
    // Check if sound is enabled
    const { soundEnabled } = useSettingsStore.getState();
    if (!soundEnabled) return;

    try {
      await this.init();
      
      // Create a simple beep sound using oscillator-like approach
      // In production, use actual sound files
      const { sound } = await Audio.Sound.createAsync(
        // Using a data URI for a simple beep (placeholder)
        // Replace with actual sound files: require('../../assets/sounds/complete.mp3')
        { uri: this.generateToneDataUri(SOUND_CONFIG[type]) },
        { shouldPlay: true, volume: 0.5 }
      );
      
      // Clean up after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      // Silently fail - sound is non-critical
      console.warn('[Sound] Failed to play sound:', type, error);
    }
  }

  /**
   * Generate a simple tone data URI (placeholder for real sound files)
   * In production, replace this with actual mp3/wav files
   */
  private generateToneDataUri(config: { frequency: number; duration: number }): string {
    // This is a placeholder - in production use actual sound files
    // For now, we'll create a simple WAV file programmatically
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * (config.duration / 1000));
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // Create WAV header
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Apply envelope (fade in/out)
      const envelope = Math.min(1, Math.min(i / 500, (numSamples - i) / 500));
      const sample = Math.sin(2 * Math.PI * config.frequency * t) * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }
    
    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Preload sounds for faster playback
   */
  async preload(): Promise<void> {
    // In production, preload actual sound files here
    await this.init();
  }

  /**
   * Clean up all loaded sounds
   */
  async cleanup(): Promise<void> {
    for (const [, sound] of soundCache) {
      if (sound) {
        await sound.unloadAsync();
      }
    }
    soundCache.clear();
  }
}

// Export singleton instance
export const soundService = new SoundService();

// Convenience functions
export const playSound = (type: SoundType) => soundService.play(type);
export const preloadSounds = () => soundService.preload();

