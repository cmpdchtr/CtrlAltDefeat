const SOUNDS = {
  startup: 'https://www.winhistory.de/more/winxp/xpstart.wav',
  error: 'https://www.myinstants.com/media/sounds/erro.mp3',
  notify: 'https://www.myinstants.com/media/sounds/windows-xp-balloon-pop.mp3',
  tada: 'https://www.myinstants.com/media/sounds/tada.mp3',
  click: 'https://www.myinstants.com/media/sounds/start_p16Uv3S.mp3',
  shutdown: 'https://www.winhistory.de/more/winxp/xpshutdown.wav',
  tick: 'https://www.myinstants.com/media/sounds/clock-ticking-2.mp3'
};

class SoundManager {
  constructor() {
    this.audioCache = {};
    this.enabled = true;
  }

  play(soundName) {
    if (!this.enabled || !SOUNDS[soundName]) return;

    try {
      if (!this.audioCache[soundName]) {
        this.audioCache[soundName] = new Audio(SOUNDS[soundName]);
      }
      const audio = this.audioCache[soundName].cloneNode();
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play blocked by browser policy"));
    } catch (err) {
      console.error("SoundManager Error:", err);
    }
  }

  toggle(state) {
    this.enabled = state;
  }
}

export const soundManager = new SoundManager();
