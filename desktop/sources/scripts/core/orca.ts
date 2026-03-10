function Orca(lib: typeof library) {
  this.keys = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

  this.w = 1;
  this.h = 1;
  this.f = 0;
  this.s = '';

  this.locks = [] as (boolean | null)[];
  this.runtime = [] as IOperator[];
  this.variables = {} as Record<string, string>;

  this.run = function () {
    this.runtime = this.parse();
    this.operate(this.runtime);
    this.f += 1;
  };

  this.reset = function (w: number = this.w, h: number = this.h) {
    this.f = 0;
    this.w = w;
    this.h = h;
    this.replace(new Array(this.h * this.w + 1).join('.'));
  };

  this.load = function (w: number, h: number, s: string, f: number = 0) {
    this.w = w;
    this.h = h;
    this.f = f;
    this.replace(this.clean(s));
    return this;
  };

  this.write = function (x: number, y: number, g: string): boolean {
    if (!g) return false;
    if (g.length !== 1) return false;
    if (!this.inBounds(x, y)) return false;
    if (this.glyphAt(x, y) === g) return false;
    const index = this.indexAt(x, y);
    const glyph = !this.isAllowed(g) ? '.' : g;
    const str = this.s.substr(0, index) + glyph + this.s.substr(index + 1);
    this.replace(str);
    return true;
  };

  this.clean = (str: string) => {
    return `${str}`
      .replace(/\n/g, '')
      .trim()
      .substr(0, this.w * this.h)
      .split('')
      .map((g) => (this.isAllowed(g) ? g : '.'))
      .join('');
  };

  this.replace = function (s: string) {
    this.s = s;
  };

  this.parse = function (): IOperator[] {
    const a: IOperator[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const g = this.glyphAt(x, y);
        if (g === '.' || !this.isAllowed(g)) continue;
        a.push(new lib[g.toLowerCase()](this, x, y, g === g.toUpperCase()) as IOperator);
      }
    }
    return a;
  };

  this.operate = function (operators: IOperator[]) {
    this.release();
    for (const operator of operators) {
      if (this.lockAt(operator.x, operator.y)) continue;
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
          if (x > w) w = x;
          if (y > h) h = y;
        }
      }
    }
    return { w, h };
  };

  this.getBlock = (x: number, y: number, w: number, h: number) => {
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

  this.writeBlock = (x: number, y: number, block: string, overlap: boolean = false) => {
    if (!block) return;
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

  this.unlock = function (x: number, y: number) {
    this.locks[this.indexAt(x, y)] = null;
  };

  this.lock = function (x: number, y: number) {
    if (this.lockAt(x, y)) return;
    this.locks[this.indexAt(x, y)] = true;
  };

  this.inBounds = function (x: number, y: number) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.w && y >= 0 && y < this.h;
  };

  this.isAllowed = function (g: string) {
    return g === '.' || !!library[`${g}`.toLowerCase()];
  };

  this.isSpecial = function (g: string) {
    return g.toLowerCase() === g.toUpperCase() && isNaN(Number(g));
  };

  this.keyOf = function (val: number, uc: boolean = false) {
    return uc ? this.keys[val % 36].toUpperCase() : this.keys[val % 36];
  };

  this.valueOf = function (g: string) {
    return !g || g === '.' || g === '*' ? 0 : this.keys.indexOf(`${g}`.toLowerCase());
  };

  this.indexAt = function (x: number, y: number) {
    return this.inBounds(x, y) ? x + this.w * y : -1;
  };

  this.operatorAt = function (x: number, y: number) {
    return this.runtime.filter((item) => item.x === x && item.y === y)[0];
  };

  this.posAt = function (index: number) {
    return { x: index % this.w, y: parseInt(String(index / this.w)) };
  };

  this.glyphAt = function (x: number, y: number) {
    return this.s.charAt(this.indexAt(x, y));
  };

  this.valueAt = function (x: number, y: number) {
    return this.valueOf(this.glyphAt(x, y));
  };

  this.lockAt = function (x: number, y: number) {
    return this.locks[this.indexAt(x, y)] === true;
  };

  this.valueIn = function (key: string) {
    return this.variables[key] || '.';
  };

  this.format = () => {
    const a: string[] = [];
    for (let y = 0; y < this.h; y++) {
      a.push(this.s.substr(y * this.w, this.w));
    }
    return a.reduce((acc, val) => `${acc}${val}\n`, '');
  };

  this.length = () => this.strip().length;

  this.strip = () => this.s.replace(/[^a-zA-Z0-9+]+/gi, '').trim();

  this.toString = () => this.format().trim();

  this.toRect = (str: string = this.s) => {
    const lines = str.trim().split(/\r?\n/);
    return { x: lines[0].length, y: lines.length };
  };

  this.reset();
}
