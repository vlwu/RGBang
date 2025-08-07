import { Howl } from 'howler';
import { eventBus } from '../utils/event-bus.js';

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.settings = {
      enabled: true,
      volume: 0.5,
    };
    this._setupEventSubscriptions();
  }

  _setupEventSubscriptions() {
    eventBus.subscribe('playSound', this.play.bind(this));
    eventBus.subscribe('toggleSound', this.toggleSound.bind(this));
    eventBus.subscribe('setSoundVolume', ({volume}) => this.setVolume(volume));
  }

  addSound(key, src) {
    this.sounds[key] = new Howl({ src: [src] });
  }

  play({ key, volumeMultiplier = 1.0 }) {
    if (!this.settings.enabled || !this.sounds[key]) {
      return;
    }
    const sound = this.sounds[key];
    sound.volume(this.settings.volume * volumeMultiplier);
    sound.play();
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.settings.volume);
  }

  toggleSound() {
    this.settings.enabled = !this.settings.enabled;
    Howler.mute(!this.settings.enabled);
  }
}