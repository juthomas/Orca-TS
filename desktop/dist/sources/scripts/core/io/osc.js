function Osc(_client) {
    let OscClient;
    try {
        OscClient = require('node-osc').Client;
    }
    catch {
        OscClient = null;
    }
    this.stack = [];
    this.socket = null;
    this.port = null;
    this.options = { default: 49162, tidalCycles: 6010, sonicPi: 4559, superCollider: 57120, norns: 10111 };
    this.start = function () {
        if (!OscClient) {
            console.warn('OSC', 'Could not start.');
            return;
        }
        console.info('OSC', 'Starting..');
        this.setup();
        this.select();
    };
    this.clear = function () {
        this.stack = [];
    };
    this.run = function () {
        for (const item of this.stack) {
            this.play(item);
        }
    };
    this.push = function (path, msg) {
        this.stack.push({ path, msg });
    };
    this.play = function ({ path, msg }) {
        if (!this.socket) {
            console.warn('OSC', 'Unavailable socket');
            return;
        }
        const values = [];
        for (let i = 0; i < msg.length; i++) {
            values.push(client.orca.valueOf(msg.charAt(i)));
        }
        this.socket.send(path, ...values, (err) => {
            if (err)
                console.warn(err);
        });
    };
    this.select = function (port = this.options.default) {
        if (parseInt(String(port)) === this.port) {
            console.warn('OSC', 'Already selected');
            return;
        }
        if (isNaN(port) || port < 1000) {
            console.warn('OSC', 'Unavailable port');
            return;
        }
        console.info('OSC', `Selected port: ${port}`);
        this.port = parseInt(String(port));
        this.setup();
    };
    this.setup = function () {
        if (!this.port)
            return;
        if (this.socket?.close)
            this.socket.close();
        this.socket = new OscClient(client.io.ip, this.port);
        console.info('OSC', `Started socket at ${client.io.ip}:${this.port}`);
    };
}
