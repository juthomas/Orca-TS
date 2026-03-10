function Source(_client: IClient) {
  this.cache = {} as Record<string, string>;

  this.install = () => {};

  this.start = () => {
    this.new();
  };

  this.new = () => {
    console.log('Source', 'New file..');
    this.cache = {};
  };

  this.open = (ext: string, callback: (file: File, text: string) => void, store: boolean = false) => {
    console.log('Source', 'Open file..');
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || file.name.indexOf('.' + ext) < 0) {
        console.warn('Source', `Skipped ${file?.name}`);
        return;
      }
      this.read(file, callback, store);
    };
    input.click();
  };

  this.load = (ext: string, callback?: (file: File, content: string) => void) => {
    console.log('Source', 'Load files..');
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('multiple', 'multiple');
    input.onchange = (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.indexOf('.' + ext) < 0) continue;
        this.read(file, this.store);
      }
    };
    input.click();
  };

  this.store = (file: File, content: string) => {
    console.info('Source', 'Stored ' + file.name);
    this.cache[file.name] = content;
  };

  this.save = (name: string, content: string, type: string = 'text/plain', callback?: () => void) => {
    this.saveAs(name, name, content, type, callback);
  };

  this.saveAs = (name: string, ext: string, content: string, type: string = 'text/plain', callback?: () => void) => {
    console.log('Source', 'Save new file..');
    this.write(name, ext, content, type);
  };

  this.read = (file: File, callback: (file: File, res: string) => void, store: boolean = false) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const res = (event.target?.result as string) ?? '';
      if (callback) callback(file, res);
      if (store) this.store(file, res);
    };
    reader.readAsText(file, 'UTF-8');
  };

  this.write = (name: string, ext: string, content: string, type: string, settings: string = 'charset=utf-8') => {
    const link = document.createElement('a');
    link.setAttribute('download', `${name}-${timestamp()}.${ext}`);
    if (type === 'image/png' || type === 'image/jpeg') {
      link.setAttribute('href', content);
    } else {
      link.setAttribute('href', 'data:' + type + ';' + settings + ',' + encodeURIComponent(content));
    }
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  };

  function timestamp(_d?: Date, _e?: Date) {
    return `${arvelie()}-${neralie()}`;
  }
  function arvelie(date: Date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    const doty = Math.floor(diff / 86400000) - 1;
    const y = date.getFullYear().toString().substr(2, 2);
    const m = doty === 364 || doty === 365 ? '+' : String.fromCharCode(97 + Math.floor(doty / 14)).toUpperCase();
    const d = `${(doty === 365 ? 1 : doty === 366 ? 2 : doty % 14) + 1}`.padStart(2, '0');
    return `${y}${m}${d}`;
  }
  function neralie(d: Date = new Date(), e: Date = new Date(d)) {
    const ms = e.getTime() - new Date(d).setHours(0, 0, 0, 0);
    return (ms / 8640 / 10000).toFixed(6).substr(2, 6);
  }
}
