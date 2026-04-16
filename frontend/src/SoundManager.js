const SOUNDS = {
  startup: '/sounds/startup.wav',
  error: '/sounds/error.wav',
  notify: '/sounds/notify.wav',
  tada: '/sounds/tada.wav',
  click: '/sounds/click.wav',
  shutdown: '/sounds/shutdown.wav',
  tick: '/sounds/tick.mp3'
};

class SoundManager {
  constructor() {
    this.audioCache = {};
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    // Pre-load sounds on first interaction
    Object.keys(SOUNDS).forEach(key => {
      this.audioCache[key] = new Audio(SOUNDS[key]);
      this.audioCache[key].load();
    });
    console.log("SoundManager: Audio initialized and pre-loaded");
  }

  play(soundName) {
    if (!this.enabled || !SOUNDS[soundName]) return;

    try {
      // Use cached audio if available, otherwise create new
      const audio = this.audioCache[soundName] ? this.audioCache[soundName].cloneNode() : new Audio(SOUNDS[soundName]);
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'NotAllowedError') {
            console.warn("Audio play blocked: Wait for user interaction.");
          } else {
            console.error("Audio error for " + soundName + ":", error);
          }
        });
      }
    } catch (err) {
      console.error("SoundManager Error:", err);
    }
  }

  toggle(state) {
    this.enabled = state;
  }
}

export const soundManager = new SoundManager();
