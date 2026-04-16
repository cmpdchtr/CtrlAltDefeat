const SOUNDS = {
  startup: '/sounds/startup.wav',
  error: '/sounds/error.mp3',
  notify: '/sounds/notify.mp3',
  tada: '/sounds/tada.mp3',
  click: '/sounds/click.mp3',
  shutdown: '/sounds/shutdown.wav',
  tick: '/sounds/tick.mp3'
};

class SoundManager {
  constructor() {
    this.audioCache = {};
    this.enabled = true;
    this.initialized = false;
  }

  // Initialize audio context on first user interaction
  init() {
    if (this.initialized) return;
    this.initialized = true;
    console.log("SoundManager: Audio initialized by user interaction");
  }

  play(soundName) {
    if (!this.enabled || !SOUNDS[soundName]) return;

    try {
      const audio = new Audio(SOUNDS[soundName]);
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'NotAllowedError') {
            console.warn("Audio play blocked: Wait for user interaction.");
          } else {
            console.error("Audio error:", error);
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
