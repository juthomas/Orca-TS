function Clock(_client: IClient) {
  const workerScript = 'onmessage = (e) => { setInterval(() => { postMessage(true) }, e.data)}';
  const worker = window.URL.createObjectURL(new Blob([workerScript], { type: 'text/javascript' }));

  this.isPaused = true;
  this.timer = null as Worker | null;
  this.isPuppet = false;

  this.speed = { value: 120, target: 120 };

  this.start = function () {
    const memory = parseInt(window.localStorage.getItem('bpm') ?? '0');
    const target = memory >= 60 ? memory : 120;
    this.setSpeed(target, target, true);
    this.play();
  };

  this.touch = function () {
    this.stop();
    client.run();
  };

  this.run = function () {
    if (this.speed.target === this.speed.value) return;
    this.setSpeed(this.speed.value + (this.speed.value < this.speed.target ? 1 : -1), null, true);
  };

  this.setSpeed = (value: number | null, target: number | null = null, setTimer: boolean = false) => {
    if (this.speed.value === value && this.speed.target === target && this.timer) return;
    if (value) this.speed.value = clamp(value, 60, 300);
    if (target) this.speed.target = clamp(target, 60, 300);
    if (setTimer === true) this.setTimer(this.speed.value);
  };

  this.modSpeed = function (mod: number = 0, animate: boolean = false) {
    if (animate === true) {
      this.setSpeed(null, this.speed.target + mod);
    } else {
      this.setSpeed(this.speed.value + mod, this.speed.value + mod, true);
      client.update();
    }
  };

  this.togglePlay = function (msg: boolean = false) {
    if (this.isPaused === true) {
      this.play(msg);
    } else {
      this.stop(msg);
    }
    client.update();
  };

  this.play = function (msg: boolean = false, midiStart: boolean = false) {
    console.log('Clock', 'Play', msg, midiStart);
    if (this.isPaused === false && !midiStart) return;
    this.isPaused = false;
    if (this.isPuppet === true) {
      console.warn('Clock', 'External Midi control');
      if (!(pulse as { frame?: number }).frame || midiStart) {
        this.setFrame(0);
        (pulse as { frame: number }).frame = 0;
        (pulse as { count: number }).count = 5;
      }
    } else {
      if (msg === true) client.io.midi.sendClockStart();
      this.setSpeed(this.speed.target, this.speed.target, true);
    }
  };

  this.stop = function (msg: boolean = false) {
    console.log('Clock', 'Stop');
    if (this.isPaused === true) return;
    this.isPaused = true;
    if (this.isPuppet === true) {
      console.warn('Clock', 'External Midi control');
    } else {
      if (msg === true || client.io.midi.isClock) client.io.midi.sendClockStop();
      this.clearTimer();
    }
    client.io.midi.allNotesOff();
    client.io.midi.silence();
  };

  const pulse = {
    count: 0,
    last: null as number | null,
    timer: null as ReturnType<typeof setInterval> | null,
    frame: 0,
  };

  this.tap = function () {
    pulse.count = (pulse.count + 1) % 6;
    pulse.last = performance.now();
    if (!this.isPuppet) {
      console.log('Clock', 'Puppeteering starts..');
      this.isPuppet = true;
      this.clearTimer();
      pulse.timer = setInterval(() => {
        if (performance.now() - (pulse.last ?? 0) < 2000) return;
        this.untap();
      }, 2000);
    }
    if (pulse.count === 0) {
      if (this.isPaused) {
        (pulse as { frame: number }).frame++;
      } else {
        if ((pulse as { frame: number }).frame > 0) {
          this.setFrame(client.orca.f + (pulse as { frame: number }).frame);
          (pulse as { frame: number }).frame = 0;
        }
        client.run();
      }
    }
  };

  this.untap = function () {
    console.log('Clock', 'Puppeteering stops..');
    if (pulse.timer) clearInterval(pulse.timer);
    this.isPuppet = false;
    (pulse as { frame: number }).frame = 0;
    pulse.last = null;
    if (!this.isPaused) {
      this.setTimer(this.speed.value);
    }
  };

  this.setTimer = function (bpm: number) {
    if (bpm < 60) {
      console.warn('Clock', 'Error ' + bpm);
      return;
    }
    this.clearTimer();
    window.localStorage.setItem('bpm', String(bpm));
    this.timer = new Worker(worker);
    this.timer.postMessage((60000 / parseInt(String(bpm))) / 4);
    this.timer.onmessage = () => {
      client.io.midi.sendClock();
      client.run();
    };
  };

  this.clearTimer = function () {
    if (this.timer) {
      this.timer.terminate();
    }
    this.timer = null;
  };

  this.setFrame = function (f: number) {
    if (isNaN(f)) return;
    client.orca.f = clamp(f, 0, 9999999);
  };

  this.toString = function () {
    const diff = this.speed.target - this.speed.value;
    const _offset = Math.abs(diff) > 5 ? (diff > 0 ? `+${diff}` : String(diff)) : '';
    const _message = this.isPuppet === true ? 'midi' : `${this.speed.value}${_offset}`;
    const _beat = diff === 0 && client.orca.f % 4 === 0 ? '*' : '';
    return `${_message}${_beat}`;
  };

  function clamp(v: number, min: number, max: number) {
    return v < min ? min : v > max ? max : v;
  }
}
