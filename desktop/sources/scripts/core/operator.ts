function Operator(
  orca: IOrca,
  x: number,
  y: number,
  glyph: string = '.',
  passive: boolean = false
) {
  this.name = 'unknown';
  this.x = x;
  this.y = y;
  this.passive = passive;
  this.draw = passive;
  this.glyph = passive ? glyph.toUpperCase() : glyph;
  this.info = '--';
  this.ports = {} as Record<string, IPort>;

  this.listen = function (port: IPort | null, toValue: boolean = false): string | number {
    if (!port) return toValue ? 0 : '.';
    const g = orca.glyphAt(this.x + port.x, this.y + port.y);
    const glyph = (g === '.' || g === '*') && port.default ? port.default : g;
    if (toValue) {
      const min = port.clamp?.min ?? 0;
      const max = port.clamp?.max ?? 36;
      return clamp(orca.valueOf(glyph), min, max);
    }
    return glyph;
  };

  this.output = function (g: string, port: IPort = this.ports.output!) {
    if (!port) {
      console.warn(this.name, 'Trying to output, but no port');
      return;
    }
    if (!g) return;
    orca.write(this.x + port.x, this.y + port.y, this.shouldUpperCase() ? `${g}`.toUpperCase() : g);
  };

  this.bang = function (b: boolean) {
    if (!this.ports.output) {
      console.warn(this.name, 'Trying to bang, but no port');
      return;
    }
    orca.write(this.x + this.ports.output.x, this.y + this.ports.output.y, b ? '*' : '.');
    orca.lock(this.x + this.ports.output.x, this.y + this.ports.output.y);
  };

  this.run = function (force: boolean = false) {
    const payload = this.operation(force);
    for (const port of Object.values(this.ports) as IPort[]) {
      if (port.bang) continue;
      orca.lock(this.x + port.x, this.y + port.y);
    }
    if (this.ports.output) {
      if ((this.ports.output as IPort).bang === true) {
        this.bang(payload as boolean);
      } else {
        this.output(payload as string);
      }
    }
  };

  this.operation = function (_force?: boolean): string | boolean | void {};

  this.lock = function () {
    orca.lock(this.x, this.y);
  };

  this.replace = function (g: string) {
    orca.write(this.x, this.y, g);
  };

  this.erase = function () {
    this.replace('.');
  };

  this.explode = function () {
    this.replace('*');
  };

  this.move = function (x: number, y: number) {
    const offset = { x: this.x + x, y: this.y + y };
    if (!orca.inBounds(offset.x, offset.y)) {
      this.explode();
      return;
    }
    if (orca.glyphAt(offset.x, offset.y) !== '.') {
      this.explode();
      return;
    }
    this.erase();
    this.x += x;
    this.y += y;
    this.replace(this.glyph);
    this.lock();
  };

  this.hasNeighbor = function (g: string) {
    if (orca.glyphAt(this.x + 1, this.y) === g) return true;
    if (orca.glyphAt(this.x - 1, this.y) === g) return true;
    if (orca.glyphAt(this.x, this.y + 1) === g) return true;
    if (orca.glyphAt(this.x, this.y - 1) === g) return true;
    return false;
  };

  this.addPort = function (name: string, pos: { x: number; y: number }) {
    this.ports[name] = pos as IPort;
  };

  this.getPorts = function (): [number, number, number, string][] {
    const a: [number, number, number, string][] = [];
    if (this.draw === true) {
      a.push([this.x, this.y, 0, `${this.name.charAt(0).toUpperCase() + this.name.substring(1).toLowerCase()}`]);
    }
    if (!this.passive) return a;
    for (const id in this.ports) {
      const port = this.ports[id];
      const type = port.output ? 3 : port.x < 0 || port.y < 0 ? 1 : 2;
      a.push([this.x + port.x, this.y + port.y, type, `${this.glyph}-${id}`]);
    }
    return a;
  };

  this.shouldUpperCase = function (_ports = this.ports) {
    if (!this.ports.output?.sensitive) return false;
    const value = this.listen({ x: 1, y: 0 }) as string;
    if (value.toLowerCase() === value.toUpperCase()) return false;
    if (value.toUpperCase() !== value) return false;
    return true;
  };

  function clamp(v: number, min: number, max: number) {
    return v < min ? min : v > max ? max : v;
  }
}
