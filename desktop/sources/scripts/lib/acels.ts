function Acels(this: IAcels, client: IClient) {
  this.all = {} as Record<string, { cat: string; name: string; downfn?: () => void; upfn?: () => void; accelerator?: string; role?: string; type?: string }>;
  this.roles = {} as Record<string, unknown>;
  (this as unknown as { pipe: IAcels['pipe'] | ((o: { onKeyDown: (e: KeyboardEvent) => void; onKeyUp: (e: KeyboardEvent) => void }) => void) }).pipe = (obj) => {
    (this as unknown as { pipe: IAcels['pipe'] }).pipe = obj;
  };

  this.install = (host: Window | HTMLElement = window) => {
    host.addEventListener('keydown', this.onKeyDown, false);
    host.addEventListener('keyup', this.onKeyUp, false);
  };

  this.set = (cat: string, name: string, accelerator: string, downfn: () => void, upfn?: () => void) => {
    if (this.all[accelerator]) {
      console.warn('Acels', `Trying to overwrite ${this.all[accelerator].name}, with ${name}.`);
    }
    this.all[accelerator] = { cat, name, downfn, upfn, accelerator };
  };

  this.add = (cat: string, role: string) => {
    this.all[':' + role] = { cat, name: role, role };
  };

  this.get = (accelerator: string) => {
    return this.all[accelerator];
  };

  this.sort = () => {
    const h: Record<string, Array<{ cat: string; name: string; downfn?: () => void; upfn?: () => void; accelerator?: string; role?: string; type?: string }>> = {};
    for (const item of Object.values(this.all)) {
      if (!h[item.cat]) h[item.cat] = [];
      h[item.cat].push(item);
    }
    return h;
  };

  this.convert = (event: KeyboardEvent) => {
    const accelerator = event.key === ' ' ? 'Space' : event.key.substr(0, 1).toUpperCase() + event.key.substr(1);
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) return `CmdOrCtrl+Shift+${accelerator}`;
    if (event.shiftKey && event.key.toUpperCase() !== event.key) return `Shift+${accelerator}`;
    if (event.altKey && event.key.length !== 1) return `Alt+${accelerator}`;
    if (event.ctrlKey || event.metaKey) return `CmdOrCtrl+${accelerator}`;
    return accelerator;
  };

  this.onKeyDown = (e: KeyboardEvent) => {
    const target = this.get(this.convert(e));
    if (!target || !target.downfn) return this.pipe ? this.pipe.onKeyDown(e) : undefined;
    target.downfn();
    e.preventDefault();
  };

  this.onKeyUp = (e: KeyboardEvent) => {
    const target = this.get(this.convert(e));
    if (!target || !target.upfn) return this.pipe ? this.pipe.onKeyUp(e) : undefined;
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

  this.inject = (name: string = 'Untitled') => {
    const electronAPI = (window as Window & { electronAPI?: ElectronAPI }).electronAPI;
    if (!electronAPI) {
      console.warn('Acels', 'electronAPI not available (menu disabled)');
      return;
    }
    const injection: ElectronMenuItem[] = [];

    injection.push({
      label: name,
      submenu: [
        { label: 'About', click: () => electronAPI.openExternal(name === 'Orca Ts' ? 'https://github.com/hundredrabbits/Orca' : 'https://github.com/hundredrabbits/' + name.replace(/\s+/g, '')) },
        {
          label: 'Theme',
          submenu: [
            { label: 'Download Themes', click: () => electronAPI.openExternal('https://github.com/hundredrabbits/Themes') },
            { label: 'Open Theme', click: () => client.theme.open() },
            { label: 'Reset Theme', accelerator: 'CmdOrCtrl+Escape', click: () => client.theme.reset() },
          ],
        },
        { label: 'Fullscreen', accelerator: 'CmdOrCtrl+Enter', click: () => electronAPI.toggleFullscreen() },
        { label: 'Hide', accelerator: 'CmdOrCtrl+H', click: () => electronAPI.toggleVisible() },
        { label: 'Toggle Menubar', accelerator: 'Alt+H', click: () => electronAPI.toggleMenubar() },
        { label: 'Inspect', accelerator: 'CmdOrCtrl+Tab', click: () => electronAPI.inspect() },
        { role: 'quit' },
      ],
    });

    const sorted = this.sort();
    for (const cat of Object.keys(sorted)) {
      const submenu: ElectronMenuItem[] = [];
      for (const option of sorted[cat]) {
        if (option.role) {
          submenu.push({ role: option.role });
        } else if (option.type) {
          submenu.push({ type: option.type });
        } else {
          submenu.push({ label: option.name, accelerator: option.accelerator, click: option.downfn });
        }
      }
      injection.push({ label: cat, submenu });
    }
    electronAPI.injectMenu(injection);
  };
}
