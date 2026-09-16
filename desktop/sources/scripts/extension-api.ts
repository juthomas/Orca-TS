/**
 * Orca Ts extension API.
 * Loaded after library and Operator. Exposes OrcaTs.registerOperator for custom operators.
 */
(function () {
  type OperatorSpec =
    | ((this: unknown, orca: IOrca, x: number, y: number, passive?: boolean) => void)
    | {
        name: string;
        info: string;
        ports?: Record<string, { x: number; y: number; output?: boolean; bang?: boolean; sensitive?: boolean; reader?: boolean; clamp?: { min?: number; max?: number }; default?: string }>;
        operation: (force?: boolean) => string | boolean | void;
        draw?: boolean;
      };

  function registerOperator(glyph: string, spec: OperatorSpec) {
    if (typeof glyph !== 'string' || glyph.length !== 1) {
      console.warn('OrcaTs.registerOperator: glyph must be a single character');
      return;
    }
    const key = glyph.toLowerCase();
    if (typeof spec === 'function') {
      library[key] = spec as any;
      return;
    }
    const name = spec.name;
    const info = spec.info;
    const ports = spec.ports || {};
    const operation = spec.operation;
    const draw = spec.draw !== undefined ? spec.draw : true;
    library[key] = function (orca: IOrca, x: number, y: number, passive?: boolean) {
      Operator.call(this, orca, x, y, glyph, passive);
      (this as any).orca = orca;
      this.name = name;
      this.info = info;
      this.ports = ports;
      this.operation = operation;
      this.draw = draw;
    } as any;
  }

  (globalThis as any).OrcaTs = {
    registerOperator,
    Operator: typeof Operator !== 'undefined' ? Operator : null,
    library: typeof library !== 'undefined' ? library : null,
  };
})();
