function Midi(_client) {
    this.mode = 0;
    this.isClock = false;
    this.outputIndex = -1;
    this.inputIndex = -1;
    this.outputs = [];
    this.inputs = [];
    this.stack = [];
    this.ticks = [];
    this.start = function () {
        console.info('Midi Starting..');
        this.refresh();
    };
    this.clear = function () {
        this.stack = this.stack.filter((item) => item);
    };
    this.run = function () {
        for (const id in this.stack) {
            const item = this.stack[id];
            if (item.isPlayed === false) {
                this.press(item);
            }
            if (item.length < 1) {
                this.release(item, id);
            }
            else {
                item.length--;
            }
        }
    };
    this.trigger = function (item, down) {
        if (!this.outputDevice()) {
            console.warn('MIDI', 'No midi output!');
            return;
        }
        const transposed = this.transpose(item.note, item.octave);
        const channel = !isNaN(Number(item.channel)) ? parseInt(String(item.channel)) : client.orca.valueOf(String(item.channel));
        if (!transposed)
            return;
        const c = down ? 0x90 + channel : 0x80 + channel;
        const n = transposed.id;
        const v = parseInt(String((item.velocity / 16) * 127));
        if (!n || c === 127)
            return;
        this.outputDevice().send([c, n, v]);
    };
    this.press = function (item) {
        if (!item)
            return;
        this.trigger(item, true);
        item.isPlayed = true;
    };
    this.release = function (item, id) {
        if (!item)
            return;
        this.trigger(item, false);
        delete this.stack[id];
    };
    this.silence = function () {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            this.release(this.stack[i], String(i));
        }
    };
    this.push = function (channel, octave, note, velocity, length, isPlayed = false) {
        const item = { channel, octave, note, velocity, length, isPlayed };
        for (const id in this.stack) {
            const dup = this.stack[id];
            if (dup.channel === channel && dup.octave === octave && dup.note === note) {
                this.release(dup, id);
            }
        }
        this.stack.push(item);
    };
    this.allNotesOff = function () {
        if (!this.outputDevice())
            return;
        console.log('MIDI', 'All Notes Off');
        for (let chan = 0; chan < 16; chan++) {
            this.outputDevice().send([0xb0 + chan, 123, 0]);
        }
    };
    this.sendClockStart = function () {
        if (!this.outputDevice())
            return;
        this.isClock = true;
        this.outputDevice().send([0xfa], 0);
        console.log('MIDI', 'MIDI Start Sent');
    };
    this.sendClockStop = function () {
        if (!this.outputDevice())
            return;
        this.isClock = false;
        this.outputDevice().send([0xfc], 0);
        console.log('MIDI', 'MIDI Stop Sent');
    };
    this.sendClock = function () {
        if (!this.outputDevice())
            return;
        if (this.isClock !== true)
            return;
        const bpm = client.clock.speed.value;
        const frameTime = 60000 / bpm / 4;
        const frameFrag = frameTime / 6;
        for (let id = 0; id < 6; id++) {
            if (this.ticks[id])
                clearTimeout(this.ticks[id]);
            this.ticks[id] = setTimeout(() => {
                this.outputDevice().send([0xf8], 0);
            }, parseInt(String(id)) * frameFrag);
        }
    };
    this.receive = function (msg) {
        switch (msg.data[0]) {
            case 0xf8:
                client.clock.tap();
                break;
            case 0xfa:
                console.log('MIDI', 'Start Received');
                client.clock.play(false, true);
                break;
            case 0xfb:
                console.log('MIDI', 'Continue Received');
                client.clock.play();
                break;
            case 0xfc:
                console.log('MIDI', 'Stop Received');
                client.clock.stop();
                break;
        }
    };
    this.selectOutput = function (id) {
        if (id === -1) {
            this.outputIndex = -1;
            console.log('MIDI', 'Select Output Device: None');
            return;
        }
        if (!this.outputs[id]) {
            console.warn('MIDI', `Unknown device with id ${id}`);
            return;
        }
        this.outputIndex = parseInt(String(id));
        console.log('MIDI', `Select Output Device: ${this.outputDevice().name}`);
    };
    this.selectInput = function (id) {
        const inputDev = this.inputDevice();
        if (inputDev)
            inputDev.onmidimessage = null;
        if (id === -1) {
            this.inputIndex = -1;
            console.log('MIDI', 'Select Input Device: None');
            return;
        }
        if (!this.inputs[id]) {
            console.warn('MIDI', `Unknown device with id ${id}`);
            return;
        }
        this.inputIndex = parseInt(String(id));
        const dev = this.inputDevice();
        dev.onmidimessage = (msg) => this.receive(msg);
        console.log('MIDI', `Select Input Device: ${this.inputDevice().name}`);
    };
    this.outputDevice = function () {
        return this.outputs[this.outputIndex];
    };
    this.inputDevice = function () {
        return this.inputs[this.inputIndex];
    };
    this.selectNextOutput = () => {
        this.outputIndex = this.outputIndex < this.outputs.length ? this.outputIndex + 1 : 0;
        client.update();
    };
    this.selectNextInput = () => {
        const id = this.inputIndex < this.inputs.length - 1 ? this.inputIndex + 1 : -1;
        this.selectInput(id);
        client.update();
    };
    this.refresh = function () {
        if (!navigator.requestMIDIAccess)
            return;
        navigator.requestMIDIAccess().then(this.access.bind(this), (err) => {
            console.warn('No Midi', err);
        });
    };
    this.access = (midiAccess) => {
        this.outputs = Array.from(midiAccess.outputs);
        this.selectOutput(0);
        this.inputs = Array.from(midiAccess.inputs);
        this.selectInput(-1);
    };
    this.transpose = function (n, o = 3) {
        if (!transposeTable[n])
            return null;
        const octave = clamp(parseInt(String(o)) + parseInt(transposeTable[n].charAt(1)), 0, 8);
        const note = transposeTable[n].charAt(0);
        const value = ['C', 'c', 'D', 'd', 'E', 'F', 'f', 'G', 'g', 'A', 'a', 'B'].indexOf(note);
        const id = clamp(octave * 12 + value + 24, 0, 127);
        return { id, value, note, octave };
    };
    this.convert = function (id) {
        const note = ['C', 'c', 'D', 'd', 'E', 'F', 'f', 'G', 'g', 'A', 'a', 'B'][id % 12];
        const octave = Math.floor(id / 12) - 5;
        const name = `${note}${octave}`;
        const key = Object.values(transposeTable).indexOf(name);
        return Object.keys(transposeTable)[key];
    };
    this.toString = function () {
        return !navigator.requestMIDIAccess
            ? 'No Midi Support'
            : this.outputDevice()
                ? `${this.outputDevice().name}`
                : 'No Midi Device';
    };
    this.toInputString = () => {
        return !navigator.requestMIDIAccess
            ? 'No Midi Support'
            : this.inputDevice()
                ? `${this.inputDevice().name}`
                : 'No Input Device';
    };
    this.toOutputString = () => {
        return !navigator.requestMIDIAccess
            ? 'No Midi Support'
            : this.outputDevice()
                ? `${this.outputDevice().name}`
                : 'No Output Device';
    };
    this.length = function () {
        return this.stack.length;
    };
    function clamp(v, min, max) {
        return v < min ? min : v > max ? max : v;
    }
}
