function Orca(lib) {
    this.keys = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    this.w = 1;
    this.h = 1;
    this.f = 0;
    this.s = '';
    this.locks = [];
    this.runtime = [];
    this.variables = {};
    this.run = function () {
        this.runtime = this.parse();
        this.operate(this.runtime);
        this.f += 1;
    };
    this.reset = function (w = this.w, h = this.h) {
        this.f = 0;
        this.w = w;
        this.h = h;
        this.replace(new Array(this.h * this.w + 1).join('.'));
    };
    this.load = function (w, h, s, f = 0) {
        this.w = w;
        this.h = h;
        this.f = f;
        this.replace(this.clean(s));
        return this;
    };
    this.write = function (x, y, g) {
        if (!g)
            return false;
        if (g.length !== 1)
            return false;
        if (!this.inBounds(x, y))
            return false;
        if (this.glyphAt(x, y) === g)
            return false;
        const index = this.indexAt(x, y);
        const glyph = !this.isAllowed(g) ? '.' : g;
        const str = this.s.substr(0, index) + glyph + this.s.substr(index + 1);
        this.replace(str);
        return true;
    };
    this.clean = (str) => {
        return `${str}`
            .replace(/\n/g, '')
            .trim()
            .substr(0, this.w * this.h)
            .split('')
            .map((g) => (this.isAllowed(g) ? g : '.'))
            .join('');
    };
    this.replace = function (s) {
        this.s = s;
    };
    this.parse = function () {
        const a = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const g = this.glyphAt(x, y);
                if (g === '.' || !this.isAllowed(g))
                    continue;
                a.push(new lib[g.toLowerCase()](this, x, y, g === g.toUpperCase()));
            }
        }
        return a;
    };
    this.operate = function (operators) {
        this.release();
        for (const operator of operators) {
            if (this.lockAt(operator.x, operator.y))
                continue;
            if (operator.passive || operator.hasNeighbor('*')) {
                operator.run();
            }
        }
    };
    this.bounds = function () {
        let w = 0;
        let h = 0;
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const g = this.glyphAt(x, y);
                if (g !== '.') {
                    if (x > w)
                        w = x;
                    if (y > h)
                        h = y;
                }
            }
        }
        return { w, h };
    };
    this.getBlock = (x, y, w, h) => {
        let lines = '';
        for (let _y = y; _y < y + h; _y++) {
            let line = '';
            for (let _x = x; _x < x + w; _x++) {
                line += this.glyphAt(_x, _y);
            }
            lines += line + '\n';
        }
        return lines;
    };
    this.writeBlock = (x, y, block, overlap = false) => {
        if (!block)
            return;
        const lines = block.split(/\r?\n/);
        let _y = y;
        for (const line of lines) {
            let _x = x;
            for (let i = 0; i < line.length; i++) {
                const glyph = line[i];
                this.write(_x, _y, overlap && glyph === '.' ? this.glyphAt(_x, _y) : glyph);
                _x++;
            }
            _y++;
        }
    };
    this.release = function () {
        this.locks = new Array(this.w * this.h);
        this.variables = {};
    };
    this.unlock = function (x, y) {
        this.locks[this.indexAt(x, y)] = null;
    };
    this.lock = function (x, y) {
        if (this.lockAt(x, y))
            return;
        this.locks[this.indexAt(x, y)] = true;
    };
    this.inBounds = function (x, y) {
        return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.w && y >= 0 && y < this.h;
    };
    this.isAllowed = function (g) {
        return g === '.' || !!library[`${g}`.toLowerCase()];
    };
    this.isSpecial = function (g) {
        return g.toLowerCase() === g.toUpperCase() && isNaN(Number(g));
    };
    this.keyOf = function (val, uc = false) {
        return uc ? this.keys[val % 36].toUpperCase() : this.keys[val % 36];
    };
    this.valueOf = function (g) {
        return !g || g === '.' || g === '*' ? 0 : this.keys.indexOf(`${g}`.toLowerCase());
    };
    this.indexAt = function (x, y) {
        return this.inBounds(x, y) ? x + this.w * y : -1;
    };
    this.operatorAt = function (x, y) {
        return this.runtime.filter((item) => item.x === x && item.y === y)[0];
    };
    this.posAt = function (index) {
        return { x: index % this.w, y: parseInt(String(index / this.w)) };
    };
    this.glyphAt = function (x, y) {
        return this.s.charAt(this.indexAt(x, y));
    };
    this.valueAt = function (x, y) {
        return this.valueOf(this.glyphAt(x, y));
    };
    this.lockAt = function (x, y) {
        return this.locks[this.indexAt(x, y)] === true;
    };
    this.valueIn = function (key) {
        return this.variables[key] || '.';
    };
    this.format = () => {
        const a = [];
        for (let y = 0; y < this.h; y++) {
            a.push(this.s.substr(y * this.w, this.w));
        }
        return a.reduce((acc, val) => `${acc}${val}\n`, '');
    };
    this.length = () => this.strip().length;
    this.strip = () => this.s.replace(/[^a-zA-Z0-9+]+/gi, '').trim();
    this.toString = () => this.format().trim();
    this.toRect = (str = this.s) => {
        const lines = str.trim().split(/\r?\n/);
        return { x: lines[0].length, y: lines.length };
    };
    this.reset();
}
