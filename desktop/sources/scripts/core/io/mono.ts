interface MonoItem {
  channel: number;
  octave: number;
  note: string;
  velocity: number;
  length: number;
  isPlayed?: boolean;
}

function Mono(_client: IClient) {
  this.stack = {} as Record<number, MonoItem>;

  this.start = function () {
    console.info('MidiMono Starting..');
  };

  this.clear = function () {};

  this.run = function () {
    for (const id in this.stack) {
      const item = this.stack[id as unknown as number];
      if (item.length < 1) {
        this.release(item);
        delete this.stack[id as unknown as number];
      }
      if (!this.stack[id as unknown as number]) continue;
      const it = this.stack[id as unknown as number];
      if (it.isPlayed === false) {
        this.press(it);
      }
      it.length--;
    }
  };

  this.press = function (item: MonoItem) {
    if (!item) return;
    client.io.midi.trigger(item, true);
    item.isPlayed = true;
  };

  this.release = function (item: MonoItem) {
    if (!item) return;
    client.io.midi.trigger(item, false);
    delete this.stack[item.channel];
  };

  this.silence = function () {
    for (const item of Object.values(this.stack)) {
      this.release(item);
    }
  };

  this.push = function (
    channel: number,
    octave: number,
    note: string,
    velocity: number,
    length: number,
    isPlayed: boolean = false
  ) {
    if (this.stack[channel]) {
      this.release(this.stack[channel]);
    }
    this.stack[channel] = { channel, octave, note, velocity, length, isPlayed };
  };

  this.length = function () {
    return Object.keys(this.stack).length;
  };
}
