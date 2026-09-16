function Acels(client) {
    this.all = {};
    this.roles = {};
    this.pipe = (obj) => {
        this.pipe = obj;
    };
    this.install = (host = window) => {
        host.addEventListener('keydown', this.onKeyDown, false);
        host.addEventListener('keyup', this.onKeyUp, false);
    };
    this.set = (cat, name, accelerator, downfn, upfn) => {
        const key = accelerator || `:${cat}:${name}`;
        if (this.all[key]) {
            console.warn('Acels', `Trying to overwrite ${this.all[key].name}, with ${name}.`);
        }
        this.all[key] = {
            cat,
            name,
            downfn,
            upfn,
            accelerator: accelerator || undefined,
        };
    };
    this.add = (cat, role) => {
        this.all[':' + role] = { cat, name: role, role };
    };
    this.get = (accelerator) => {
        return this.all[accelerator];
    };
    this.sort = () => {
        const h = {};
        for (const item of Object.values(this.all)) {
            if (!h[item.cat])
                h[item.cat] = [];
            h[item.cat].push(item);
        }
        return h;
    };
    this.convert = (event) => {
        const accelerator = event.key === ' ' ? 'Space' : event.key.substr(0, 1).toUpperCase() + event.key.substr(1);
        if ((event.ctrlKey || event.metaKey) && event.shiftKey)
            return `CmdOrCtrl+Shift+${accelerator}`;
        if (event.shiftKey && event.key.toUpperCase() !== event.key)
            return `Shift+${accelerator}`;
        if (event.altKey && event.key.length !== 1)
            return `Alt+${accelerator}`;
        if (event.ctrlKey || event.metaKey)
            return `CmdOrCtrl+${accelerator}`;
        return accelerator;
    };
    this.onKeyDown = (e) => {
        const target = this.get(this.convert(e));
        if (!target || !target.downfn)
            return this.pipe ? this.pipe.onKeyDown(e) : undefined;
        target.downfn();
        e.preventDefault();
    };
    this.onKeyUp = (e) => {
        const target = this.get(this.convert(e));
        if (!target || !target.upfn)
            return this.pipe ? this.pipe.onKeyUp(e) : undefined;
        target.upfn();
        e.preventDefault();
    };
    this.toMarkdown = () => {
        const cats = this.sort();
        let text = '';
        for (const cat in cats) {
            text += `\n### ${cat}\n\n`;
            for (const item of cats[cat]) {
                text += item.accelerator ? `- \`${item.accelerator.replace('`', 'tilde')}\`: ${item.name}\n` : '';
            }
        }
        return text.trim();
    };
    this.toString = () => {
        const cats = this.sort();
        let text = '';
        for (const cat in cats) {
            text += `\n${cat}\n\n`;
            for (const item of cats[cat]) {
                text += item.accelerator ? `${item.name.padEnd(25, '.')} ${item.accelerator}\n` : '';
            }
        }
        return text.trim();
    };
    this.inject = (name = 'Untitled') => {
        const electronAPI = window.electronAPI;
        if (!electronAPI) {
            console.warn('Acels', 'electronAPI not available (menu disabled)');
            return;
        }
        const injection = [];
        injection.push({
            label: name,
            submenu: [
                { label: 'About', click: () => electronAPI.openExternal(name === 'Orca Ts' ? 'https://github.com/hundredrabbits/Orca' : 'https://github.com/hundredrabbits/' + name.replace(/\s+/g, '')) },
                {
                    label: 'Theme',
                    submenu: [
                        { label: 'Download Themes', click: () => electronAPI.openExternal('https://github.com/hundredrabbits/Themes') },
                        { label: 'Import Palette…', click: () => client.theme.open() },
                        { label: 'Export Palette…', click: () => client.theme.export() },
                        { label: 'Reset Theme', accelerator: 'CmdOrCtrl+Escape', click: () => client.theme.reset() },
                    ],
                },
                {
                    label: 'Extensions',
                    submenu: [
                        { label: 'Open Extensions folder', click: () => electronAPI.openExtensionsFolder?.() },
                    ],
                },
                { label: 'Fullscreen', accelerator: 'CmdOrCtrl+Enter', click: () => electronAPI.toggleFullscreen() },
                { label: 'Hide', accelerator: 'CmdOrCtrl+H', click: () => electronAPI.toggleVisible() },
                { label: 'Toggle Menubar', accelerator: 'CmdOrCtrl+Shift+E', click: () => electronAPI.toggleMenubar() },
                { label: 'Inspect', accelerator: 'CmdOrCtrl+Tab', click: () => electronAPI.inspect() },
                { role: 'quit' },
            ],
        });
        const sorted = this.sort();
        const topOrder = [];
        const topItems = {};
        const nestItems = {};
        const toMenuItem = (option) => {
            if (option.role)
                return { role: option.role };
            if (option.type)
                return { type: option.type };
            const item = { label: option.name, click: option.downfn };
            if (option.accelerator && !option.accelerator.startsWith(':')) {
                item.accelerator = option.accelerator;
            }
            return item;
        };
        for (const cat of Object.keys(sorted)) {
            const slash = cat.indexOf('/');
            const parent = slash === -1 ? cat : cat.slice(0, slash);
            const child = slash === -1 ? null : cat.slice(slash + 1);
            if (!topItems[parent]) {
                topItems[parent] = [];
                topOrder.push(parent);
            }
            const items = sorted[cat].map(toMenuItem);
            if (!child) {
                topItems[parent].push(...items);
            }
            else {
                if (!nestItems[parent])
                    nestItems[parent] = {};
                if (!nestItems[parent][child])
                    nestItems[parent][child] = [];
                nestItems[parent][child].push(...items);
            }
        }
        for (const cat of topOrder) {
            const submenu = [...topItems[cat]];
            if (nestItems[cat]) {
                for (const sub of Object.keys(nestItems[cat])) {
                    submenu.push({ label: sub, submenu: nestItems[cat][sub] });
                }
            }
            injection.push({ label: cat, submenu });
        }
        // IPC cannot clone functions: serialize clicks to ids and invoke them in the renderer.
        const handlers = {};
        let nextId = 0;
        const serialize = (items) => {
            return items.map((item) => {
                const out = {};
                if (item.label !== undefined)
                    out.label = item.label;
                if (item.role !== undefined)
                    out.role = item.role;
                if (item.accelerator !== undefined)
                    out.accelerator = item.accelerator;
                if (item.type !== undefined)
                    out.type = item.type;
                if (item.click) {
                    const id = `menu-${nextId++}`;
                    handlers[id] = item.click;
                    out.clickId = id;
                }
                if (item.submenu) {
                    out.submenu = serialize(item.submenu);
                }
                return out;
            });
        };
        window.__orcaMenuHandlers = handlers;
        electronAPI.injectMenu(serialize(injection)).catch((err) => {
            console.warn('Acels', 'Failed to inject menu', err);
        });
    };
}
