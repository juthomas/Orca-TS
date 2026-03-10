function IO(_client: IClient) {
  this.ip = '127.0.0.1';

  this.midi = new (Midi as any)(client);
  this.cc = new (MidiCC as any)(client);
  this.mono = new (Mono as any)(client);
  this.udp = new (Udp as any)(client);
  this.osc = new (Osc as any)(client);

  this.start = function () {
    this.midi.start();
    this.cc.start();
    this.mono.start();
    this.udp.start();
    this.osc.start();
    this.clear();
  };

  this.clear = function () {
    this.midi.clear();
    this.cc.clear();
    this.mono.clear();
    this.udp.clear();
    this.osc.clear();
  };

  this.run = function () {
    this.midi.run();
    this.cc.run();
    this.mono.run();
    this.udp.run();
    this.osc.run();
  };

  this.silence = function () {
    this.midi.silence();
    this.mono.silence();
  };

  this.setIp = function (addr: string = '127.0.0.1') {
    if (validateIP(addr) !== true && addr.indexOf('.local') === -1) {
      console.warn('IO', 'Invalid IP');
      return;
    }
    this.ip = addr;
    console.log('IO', 'Set target IP to ' + this.ip);
    this.osc.setup();
  };

  this.length = function () {
    return (
      this.midi.length() +
      this.mono.length() +
      (this.cc as IMidiCC).stack.length +
      (this.udp as IUdp & { stack: unknown[] }).stack.length +
      (this.osc as IOsc & { stack: unknown[] }).stack.length
    );
  };

  this.inspect = function (limit: number = client.grid.w) {
    let text = '';
    for (let i = 0; i < this.length(); i++) {
      text += '|';
    }
    return fill(text, limit, '.');
  };

  function validateIP(addr: string): boolean {
    return !!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(addr);
  }
  function fill(str: string, len: number, chr: string): string {
    while (str.length < len) str += chr;
    return str;
  }
}
