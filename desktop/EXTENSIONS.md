# Orca Ts — Custom operators (extensions)

You can add your own operators (custom glyphs) by placing **.js** files in the Extensions folder. Each file is run at startup and can register one or more operators with `OrcaTs.registerOperator`.

## Extensions folder

- **macOS:** `~/Library/Application Support/Orca Ts/Extensions`
- **Windows:** `%APPDATA%\Orca Ts\Extensions`
- **Linux:** `~/.config/Orca Ts/Extensions`

Use **Orca Ts → Extensions → Open Extensions folder** to open it in your file manager.

## API

### `OrcaTs.registerOperator(glyph, spec)`

- **glyph** — Single character (e.g. `'§'`, `'µ'`). Use a character that is not already used by built-in Orca operators.
- **spec** — Either a **constructor function** or an **object**:

#### 1. Constructor function

Same shape as built-in operators: a function called with `(orca, x, y, passive)` that uses `Operator.call(this, orca, x, y, glyph, passive)` and then sets `this.name`, `this.info`, `this.ports`, `this.operation` (and optionally `this.draw`).

```javascript
OrcaTs.registerOperator('§', function (orca, x, y, passive) {
  Operator.call(this, orca, x, y, '§', passive);
  this.name = 'myop';
  this.info = 'Does something custom';
  this.ports.left = { x: -1, y: 0 };
  this.ports.right = { x: 1, y: 0 };
  this.ports.output = { x: 0, y: 1, output: true, sensitive: true };
  this.operation = function () {
    var a = this.listen(this.ports.left, true);
    var b = this.listen(this.ports.right, true);
    return orca.keyOf(a * b);
  };
});
```

#### 2. Object spec (shorthand)

- **name** — Operator name (e.g. for docs).
- **info** — Short description.
- **ports** — Object of port names to `{ x, y, output?, bang?, sensitive?, clamp?, default? }`.
- **operation** — Function `(force?)` that returns a **string** (written to output port) or **boolean** (for bang port). Use **`this.orca`** to access the Orca instance (e.g. `this.orca.keyOf(n)`).
- **draw** — Optional; default `true`. Set to `false` for invisible operators (e.g. movement).

Port offsets are relative to the operator cell: `{ x: -1, y: 0 }` is one cell left, `{ x: 0, y: 1 }` is one cell below. Use `output: true` and optionally `sensitive: true` or `bang: true` for the output port.

```javascript
OrcaTs.registerOperator('µ', {
  name: 'multiply',
  info: 'Outputs product of left and right',
  ports: {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    output: { x: 0, y: 1, output: true, sensitive: true }
  },
  operation: function (force) {
    var a = this.listen(this.ports.left, true);
    var b = this.listen(this.ports.right, true);
    return this.orca.keyOf(a * b);
  }
});
```

## Helpers inside operators

- **this.listen(port, toValue)** — Read the glyph at `port`; if `toValue` is true, returns numeric value (0–35). Use `this.ports.portName` for the port object.
- **orca.keyOf(n)** — Convert number 0–35 to grid character (e.g. for output).
- **orca.valueOf(glyph)** — Convert grid character to number.
- **this.output(glyph, port)** — Write a character to a port (usually the output port).
- **this.bang(bool)** — Trigger a bang on the output port.
- **this.move(dx, dy)** — Move the operator (for movement operators).

## Example: custom glyph `§` that adds 1

Save as `add-one.js` in the Extensions folder:

```javascript
OrcaTs.registerOperator('§', {
  name: 'add one',
  info: 'Outputs input + 1',
  ports: {
    input: { x: -1, y: 0 },
    output: { x: 0, y: 1, output: true, sensitive: true }
  },
  operation: function () {
    var n = this.listen(this.ports.input, true);
    return orca.keyOf((n + 1) % 36);
  }
});
```

Restart Orca Ts, then you can use `§` on the grid like any other operator.

## Notes

- Only **single-character** glyphs are supported (Orca’s grid is one character per cell).
- Pick a glyph that is not used by core Orca (e.g. avoid `a`–`z`, `0`–`9`, `*`, `#`, `:`, `!`, etc.). Good choices: `§`, `µ`, `¶`, `©`, `®`, or other symbols.
- Extensions are loaded at startup. To reload, restart the app.
- Errors in an extension file are logged to the console (use **Orca Ts → Inspect** to open DevTools).
