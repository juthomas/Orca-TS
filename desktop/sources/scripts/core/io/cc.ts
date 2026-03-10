function MidiCC(_client: IClient) {
  this.stack = [] as Array<{ channel?: number; knob?: number; value?: number; type: string; lsb?: number; msb?: number; bank?: number; sub?: number; pgm?: number }>;
  this.offset = 64;

  this.start = function () {
    console.info('MidiCC', 'Starting..');
  };

  this.clear = function () {
    this.stack = [];
  };

  this.run = function () {
    if (this.stack.length < 1) return;
    const device = client.io.midi.outputDevice() as { send: (data: number[]) => void } | undefined;
    if (!device) {
      console.warn('CC', 'No Midi device.');
      return;
    }
    for (const msg of this.stack) {
      if (msg.type === 'cc' && typeof msg.channel === 'number' && typeof msg.knob === 'number' && typeof msg.value === 'number') {
        device.send([0xb0 + msg.channel, this.offset + msg.knob, msg.value]);
      } else if (msg.type === 'pb' && typeof msg.channel === 'number' && typeof msg.lsb === 'number' && typeof msg.msb === 'number') {
        device.send([0xe0 + msg.channel, msg.lsb, msg.msb]);
      } else if (msg.type === 'pg' && typeof msg.channel === 'number') {
        if (typeof msg.bank === 'number') device.send([0xb0 + msg.channel, 0, msg.bank]);
        if (typeof msg.sub === 'number') device.send([0xb0 + msg.channel, 32, msg.sub]);
        if (typeof msg.pgm === 'number') device.send([0xc0 + msg.channel, msg.pgm]);
      } else {
        console.warn('CC', 'Unknown message', msg);
      }
    }
  };

  this.setOffset = function (offset: number) {
    if (isNaN(offset)) return;
    this.offset = offset;
    console.log('CC', 'Set offset to ' + this.offset);
  };
}
