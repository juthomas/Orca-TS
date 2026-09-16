function Theme(_client) {
    this.el = document.createElement('style');
    this.el.type = 'text/css';
    this.active = {};
    this.default = {
        background: '#eeeeee',
        f_high: '#0a0a0a',
        f_med: '#4a4a4a',
        f_low: '#6a6a6a',
        f_inv: '#111111',
        b_high: '#a1a1a1',
        b_med: '#c1c1c1',
        b_low: '#ffffff',
        b_inv: '#ffb545',
    };
    this.onLoad = () => { };
    this.install = (host = document.body) => {
        window.addEventListener('dragover', this.drag);
        window.addEventListener('drop', this.drop);
        host.appendChild(this.el);
    };
    this.start = () => {
        console.log('Theme', 'Starting..');
        if (typeof localStorage !== 'undefined' && isJson(localStorage.theme)) {
            const storage = JSON.parse(localStorage.theme);
            if (isValid(storage)) {
                console.log('Theme', 'Loading theme in localStorage..');
                this.load(storage);
                return;
            }
        }
        this.load(this.default);
    };
    this.open = () => {
        console.log('Theme', 'Import palette..');
        const electronAPI = window.electronAPI;
        if (electronAPI?.openThemeFile) {
            electronAPI.openThemeFile().then((data) => {
                if (data)
                    this.load(data);
            }).catch(() => this.openViaInput());
            return;
        }
        this.openViaInput();
    };
    this.serialize = () => {
        const keys = ['background', 'f_high', 'f_med', 'f_low', 'f_inv', 'b_high', 'b_med', 'b_low', 'b_inv'];
        const palette = {};
        for (const key of keys)
            palette[key] = this.active[key];
        return JSON.stringify(palette, null, 2);
    };
    this.export = () => {
        console.log('Theme', 'Export palette..');
        const content = this.serialize();
        const electronAPI = window.electronAPI;
        if (electronAPI?.saveThemeFile) {
            electronAPI.saveThemeFile(content).then((ok) => {
                if (!ok)
                    console.warn('Theme', 'Export cancelled or failed');
            }).catch(() => this.exportViaDownload(content));
            return;
        }
        this.exportViaDownload(content);
    };
    this.exportViaDownload = (content) => {
        const link = document.createElement('a');
        link.setAttribute('download', 'orca-palette.json');
        link.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(content));
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    };
    this.openViaInput = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.svg,.json,text/plain,application/json,image/svg+xml';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file)
                this.readFile(file, (data) => this.load(data));
        };
        document.body.appendChild(input);
        input.click();
        input.remove();
    };
    this.apply = (theme) => {
        this.el.innerHTML = `:root { 
      --background: ${theme.background}; 
      --f_high: ${theme.f_high}; 
      --f_med: ${theme.f_med}; 
      --f_low: ${theme.f_low}; 
      --f_inv: ${theme.f_inv}; 
      --b_high: ${theme.b_high}; 
      --b_med: ${theme.b_med}; 
      --b_low: ${theme.b_low}; 
      --b_inv: ${theme.b_inv};
    }`;
        localStorage.setItem('theme', JSON.stringify(theme));
        this.active = theme;
    };
    this.load = (data) => {
        const theme = this.parse(data);
        if (!theme || !isValid(theme)) {
            console.warn('Theme', 'Invalid format');
            return;
        }
        console.log('Theme', 'Loaded theme!');
        this.apply(theme);
        if (this.onLoad)
            this.onLoad(theme);
    };
    this.reset = () => {
        this.load(this.default);
    };
    this.set = (key, val) => {
        if (!val)
            return;
        const hex = (`${val}`.substr(0, 1) !== '#' ? '#' : '') + `${val}`;
        if (!isColor(hex)) {
            console.warn('Theme', `${hex} is not a valid color.`);
            return;
        }
        this.active[key] = hex;
        this.apply({ ...this.active });
        if (this.onLoad)
            this.onLoad(this.active);
    };
    this.pick = (key) => {
        if (!this.active[key]) {
            console.warn('Theme', `Unknown key: ${key}`);
            return;
        }
        const existing = document.getElementById('orca-theme-picker');
        if (existing)
            existing.remove();
        const labels = {
            background: 'Background',
            f_high: 'Text bright',
            f_med: 'Text medium',
            f_low: 'Text dim',
            f_inv: 'Text inverted',
            b_inv: 'Accent / selection',
            b_high: 'Highlight',
            b_med: 'Operator',
            b_low: 'Soft',
        };
        const panel = document.createElement('div');
        panel.id = 'orca-theme-picker';
        panel.style.cssText = [
            'position:fixed',
            'top:36px',
            'right:36px',
            'z-index:99999',
            'display:flex',
            'align-items:center',
            'gap:10px',
            'padding:10px 12px',
            'background:#1a1a1a',
            'color:#eee',
            'border:1px solid #444',
            'font:12px input_mono_medium,monospace',
            '-webkit-app-region:no-drag',
        ].join(';');
        const title = document.createElement('span');
        title.textContent = labels[key] || key;
        const color = document.createElement('input');
        color.type = 'color';
        color.value = toPickerHex(this.active[key]);
        color.style.cssText = 'width:42px;height:28px;padding:0;border:0;background:transparent;cursor:pointer';
        const hex = document.createElement('input');
        hex.type = 'text';
        hex.value = toPickerHex(this.active[key]);
        hex.maxLength = 7;
        hex.style.cssText = 'width:78px;padding:4px 6px;border:1px solid #555;background:#111;color:#eee;font:inherit';
        const done = document.createElement('button');
        done.textContent = 'Done';
        done.style.cssText = 'padding:4px 8px;border:1px solid #555;background:#333;color:#eee;font:inherit;cursor:pointer';
        done.onclick = () => panel.remove();
        const applyValue = (value) => {
            this.set(key, value);
            color.value = toPickerHex(this.active[key]);
            hex.value = toPickerHex(this.active[key]);
        };
        color.oninput = () => applyValue(color.value);
        hex.onchange = () => applyValue(hex.value);
        hex.onkeydown = (e) => {
            if (e.key === 'Enter')
                applyValue(hex.value);
            if (e.key === 'Escape')
                panel.remove();
        };
        panel.appendChild(title);
        panel.appendChild(color);
        panel.appendChild(hex);
        panel.appendChild(done);
        document.body.appendChild(panel);
        hex.focus();
        hex.select();
    };
    this.read = (key) => {
        return this.active[key];
    };
    this.parse = (any) => {
        if (isValid(any))
            return any;
        if (typeof any === 'string' && isJson(any))
            return JSON.parse(any);
        if (typeof any === 'string' && isHtml(any))
            return extract(any);
        return undefined;
    };
    this.drag = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer)
            e.dataTransfer.dropEffect = 'copy';
    };
    this.drop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        const name = file?.name.toLowerCase() ?? '';
        if (file && (name.endsWith('.svg') || name.endsWith('.json'))) {
            this.readFile(file, (data) => this.load(data));
        }
        e.stopPropagation();
    };
    this.readFile = (file, callback) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            callback(event.target?.result ?? '');
        };
        reader.readAsText(file, 'UTF-8');
    };
    function extract(xml) {
        const svg = new DOMParser().parseFromString(xml, 'text/xml');
        try {
            const bg = svg.getElementById('background');
            const f_high = svg.getElementById('f_high');
            if (!bg || !f_high)
                return undefined;
            return {
                background: bg.getAttribute('fill'),
                f_high: f_high.getAttribute('fill'),
                f_med: svg.getElementById('f_med').getAttribute('fill'),
                f_low: svg.getElementById('f_low').getAttribute('fill'),
                f_inv: svg.getElementById('f_inv').getAttribute('fill'),
                b_high: svg.getElementById('b_high').getAttribute('fill'),
                b_med: svg.getElementById('b_med').getAttribute('fill'),
                b_low: svg.getElementById('b_low').getAttribute('fill'),
                b_inv: svg.getElementById('b_inv').getAttribute('fill'),
            };
        }
        catch (err) {
            console.warn('Theme', 'Incomplete SVG Theme', err);
            return undefined;
        }
    }
    function isValid(json) {
        if (!json)
            return false;
        const keys = ['background', 'f_high', 'f_med', 'f_low', 'f_inv', 'b_high', 'b_med', 'b_low', 'b_inv'];
        return keys.every((k) => json[k] && isColor(json[k]));
    }
    function isColor(hex) {
        return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
    }
    function toPickerHex(hex) {
        if (/^#[0-9A-Fa-f]{6}$/.test(hex))
            return hex;
        if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
            return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
        }
        return '#000000';
    }
    function isJson(text) {
        try {
            JSON.parse(text);
            return true;
        }
        catch {
            return false;
        }
    }
    function isHtml(text) {
        try {
            new DOMParser().parseFromString(text, 'text/xml');
            return true;
        }
        catch {
            return false;
        }
    }
}
