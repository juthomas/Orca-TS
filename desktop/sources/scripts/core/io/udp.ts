function Udp(_client: IClient) {
  const dgram = require('dgram') as typeof import('dgram');

  this.stack = [] as string[];
  this.port = null as number | null;
  this.socket = dgram ? dgram.createSocket('udp4') : null;
  this.listener = dgram ? dgram.createSocket('udp4') : null;

  this.start = function () {
    if (!dgram || !this.socket || !this.listener) {
      console.warn('UDP', 'Could not start.');
      return;
    }
    console.info('UDP', 'Starting..');
    this.selectInput();
    this.selectOutput();
  };

  this.clear = function () {
    this.stack = [];
  };

  this.run = function () {
    for (const item of this.stack) {
      this.play(item);
    }
  };

  this.push = function (msg: string) {
    this.stack.push(msg);
  };

  this.play = function (data: string) {
    if (!this.socket || this.port === null) return;
    this.socket.send(Buffer.from(`${data}`), this.port, client.io.ip, (err?: Error) => {
      if (err) console.warn(err);
    });
  };

  this.selectOutput = function (port: number = 49161) {
    if (!dgram) {
      console.warn('UDP', 'Unavailable.');
      return;
    }
    if (parseInt(String(port)) === this.port) {
      console.warn('UDP', 'Already selected');
      return;
    }
    if (isNaN(port) || port < 1000) {
      console.warn('UDP', 'Unavailable port');
      return;
    }
    console.log('UDP', `Output: ${port}`);
    this.port = parseInt(String(port));
  };

  this.selectInput = (port: number = 49160) => {
    if (!dgram) {
      console.warn('UDP', 'Unavailable.');
      return;
    }
    if (this.listener) this.listener.close();

    console.log('UDP', `Input: ${port}`);
    this.listener = dgram.createSocket('udp4');

    this.listener.on('message', (msg: Buffer) => {
      client.commander.trigger(`${msg}`);
    });

    this.listener.on('listening', () => {
      const address = this.listener!.address();
      console.info('UDP', `Started socket at ${address.address}:${address.port}`);
    });

    this.listener.on('error', (err: Error) => {
      console.warn('UDP', `Server error:\n ${err.stack}`);
      this.listener!.close();
    });

    this.listener.bind(port);
  };
}
