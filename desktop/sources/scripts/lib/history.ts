function OrcaHistory(this: IHistory) {
  this.index = 0;
  this.frames = [];
  this.host = null;
  this.key = null;

  this.bind = function (host: IOrca, key: string) {
    console.log('History is recording..');
    this.host = host;
    this.key = key;
    this.reset();
  };

  this.reset = function () {
    this.index = 0;
    this.frames = [];
  };

  this.record = function (data: string) {
    if (this.index === this.frames.length) {
      this.append(data);
    } else {
      this.fork(data);
    }
    this.trim();
    this.index = this.frames.length;
  };

  this.undo = function () {
    if (this.index === 0) {
      console.warn('History', 'Reached beginning');
      return;
    }
    this.index = clamp(this.index - 1, 0, this.frames.length - 2);
    this.apply(this.frames[this.index]);
  };

  this.redo = function () {
    if (this.index + 1 > this.frames.length - 1) {
      console.warn('History', 'Reached end');
      return;
    }
    this.index = clamp(this.index + 1, 0, this.frames.length - 1);
    this.apply(this.frames[this.index]);
  };

  this.apply = function (f: string) {
    if (!this.host || !this.key) return;
    const host = this.host as IOrca & { s: string; [key: string]: unknown };
    if (!host[this.key]) {
      console.log(`Unknown binding to key ${this.key}`);
      return;
    }
    if (!f || f.length !== (host[this.key] as string).length) return;
    host[this.key] = this.frames[this.index];
  };

  this.append = function (data: string) {
    if (!data) return;
    if (this.frames[this.index - 1] && this.frames[this.index - 1] === data) return;
    this.frames.push(data);
  };

  this.fork = function (data: string) {
    this.frames = this.frames.slice(0, this.index + 1);
    this.append(data);
  };

  this.trim = function (limit: number = 30) {
    if (this.frames.length < limit) return;
    this.frames.shift();
  };

  this.last = function () {
    return this.frames[this.index - 1];
  };

  this.length = function () {
    return this.frames.length;
  };

  function clamp(v: number, min: number, max: number) {
    return v < min ? min : v > max ? max : v;
  }
}
(globalThis as any).History = OrcaHistory;
