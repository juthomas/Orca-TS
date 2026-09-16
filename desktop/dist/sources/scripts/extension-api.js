/**
 * Orca Ts extension API.
 * Loaded after library and Operator. Exposes OrcaTs.registerOperator for custom operators.
 */
(function () {
    function registerOperator(glyph, spec) {
        if (typeof glyph !== 'string' || glyph.length !== 1) {
            console.warn('OrcaTs.registerOperator: glyph must be a single character');
            return;
        }
        const key = glyph.toLowerCase();
        if (typeof spec === 'function') {
            library[key] = spec;
            return;
        }
        const name = spec.name;
        const info = spec.info;
        const ports = spec.ports || {};
        const operation = spec.operation;
        const draw = spec.draw !== undefined ? spec.draw : true;
        library[key] = function (orca, x, y, passive) {
            Operator.call(this, orca, x, y, glyph, passive);
            this.orca = orca;
            this.name = name;
            this.info = info;
            this.ports = ports;
            this.operation = operation;
            this.draw = draw;
        };
    }
    globalThis.OrcaTs = {
        registerOperator,
        Operator: typeof Operator !== 'undefined' ? Operator : null,
        library: typeof library !== 'undefined' ? library : null,
    };
})();
