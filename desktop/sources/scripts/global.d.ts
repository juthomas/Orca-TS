/**
 * Global types for Orca renderer (scripts loaded in order via index.html).
 * Instance types use "I" prefix to avoid conflict with constructor function names.
 */

declare var library: Record<string, any>;
declare var transposeTable: Record<string, string>;
declare var client: IClient;

interface IPort {
  x: number;
  y: number;
  output?: boolean;
  bang?: boolean;
  sensitive?: boolean;
  reader?: boolean;
  clamp?: { min?: number; max?: number };
  default?: string;
}

interface IOperator {
  name: string;
  x: number;
  y: number;
  passive: boolean;
  draw: boolean;
  glyph: string;
  info: string;
  ports: Record<string, IPort>;
  listen(port: IPort | null, toValue?: boolean): string | number;
  output(g: string, port?: IPort): void;
  bang(b: boolean): void;
  run(force?: boolean): void;
  operation(force?: boolean): string | boolean | void;
  move(x: number, y: number): void;
  hasNeighbor(g: string): boolean;
  addPort(name: string, pos: { x: number; y: number }): void;
  getPorts(): [number, number, number, string][];
  shouldUpperCase(ports?: Record<string, IPort>): boolean;
}

interface IOrca {
  keys: string[];
  w: number;
  h: number;
  f: number;
  s: string;
  locks: (boolean | null)[];
  runtime: IOperator[];
  variables: Record<string, string>;
  write(x: number, y: number, g: string): boolean;
  load(w: number, h: number, s: string, f?: number): IOrca;
  inBounds(x: number, y: number): boolean;
  isAllowed(g: string): boolean;
  keyOf(val: number, uc?: boolean): string;
  valueOf(g: string): number;
  indexAt(x: number, y: number): number;
  posAt(index: number): { x: number; y: number };
  glyphAt(x: number, y: number): string;
  lock(x: number, y: number): void;
  lockAt(x: number, y: number): boolean;
  valueIn(key: string): string;
  operatorAt(x: number, y: number): IOperator | undefined;
  getBlock(x: number, y: number, w: number, h: number): string;
  writeBlock(x: number, y: number, block: string, overlap?: boolean): void;
  toRect(str?: string): { x: number; y: number };
  bounds(): { w: number; h: number };
}

interface IHistory {
  index: number;
  frames: string[];
  host: IOrca | null;
  key: string | null;
  bind(host: IOrca, key: string): void;
  reset(): void;
  record(data: string): void;
  undo(): void;
  redo(): void;
  apply(f: string): void;
  append(data: string): void;
  fork(data: string): void;
  trim(limit?: number): void;
  last(): string | undefined;
  length(): number;
}

interface ITheme {
  el: HTMLStyleElement;
  active: Record<string, string>;
  default: Record<string, string>;
  onLoad?: (data: Record<string, string> | string) => void;
  install(host?: HTMLElement): void;
  start(): void;
  open(): void;
  openViaInput(): void;
  apply(theme: Record<string, string>): void;
  load(data: Record<string, string> | string): void;
  reset(): void;
  set(key: string, val: string): void;
  pick(key: string): void;
  read(key: string): string;
  readFile(file: File, callback: (data: string) => void): void;
  parse(any: unknown): Record<string, string> | undefined;
  drag(e: DragEvent): void;
  drop(e: DragEvent): void;
}

interface ISource {
  cache: Record<string, string>;
  open(ext: string, callback: (file: File, text: string) => void, store?: boolean): void;
  load(ext: string, callback?: (file: File, content: string) => void): void;
  read(file: File, callback: (file: File, res: string) => void, store?: boolean): void;
  write(name: string, ext: string, content: string, type: string, settings?: string): void;
  new(): void;
}

interface IIO {
  ip: string;
  midi: IMidi;
  cc: IMidiCC;
  mono: IMono;
  udp: IUdp;
  osc: IOsc;
  start(): void;
  clear(): void;
  run(): void;
  setIp(addr?: string): void;
  length(): number;
  inspect(limit?: number): string;
  silence(): void;
}

interface IMidi {
  outputs: unknown[];
  inputs: unknown[];
  stack: unknown[];
  outputIndex: number;
  inputIndex: number;
  isClock: boolean;
  outputDevice(): unknown;
  inputDevice(): unknown;
  sendClock(): void;
  sendClockStart(): void;
  sendClockStop(): void;
  allNotesOff(): void;
  silence(): void;
  push(channel: number, octave: number, note: string, velocity: number, length: number, isPlayed?: boolean): void;
  run(): void;
  clear(): void;
  refresh(): void;
  selectOutput(id: number): void;
  selectInput(id: number): void;
  selectNextOutput(): void;
  selectNextInput(): void;
  toInputString(): string;
  toOutputString(): string;
  length(): number;
  trigger(item: unknown, down: boolean): void;
}

interface IMidiCC {
  stack: unknown[];
  offset: number;
  run(): void;
  clear(): void;
  setOffset(offset: number): void;
}

interface IMono {
  stack: Record<number, unknown>;
  push(channel: number, octave: number, note: string, velocity: number, length: number, isPlayed?: boolean): void;
  run(): void;
  silence(): void;
  length(): number;
}

interface IUdp {
  port: number | null;
  push(msg: string): void;
  run(): void;
  clear(): void;
  selectOutput(port?: number): void;
  selectInput(port?: number): void;
}

interface IOsc {
  stack: Array<{ path: string; msg: string }>;
  port: number | null;
  push(path: string, msg: string): void;
  run(): void;
  clear(): void;
  select(port: number): void;
  setup(): void;
}

interface ICursor {
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  ins: boolean;
  select(x?: number, y?: number, w?: number, h?: number): void;
  move(x: number, y: number): void;
  moveTo(x: number, y: number): void;
  scale(w: number, h: number): void;
  scaleTo(w: number, h: number): void;
  read(): string;
  write(g: string): void;
  erase(): void;
  copy(): void;
  cut(): void;
  paste(overlap?: boolean): void;
  find(str: string): void;
  inspect(): string;
  trigger(): void;
  selection(rect?: { x: number; y: number; w: number; h: number }): string;
  selected(x: number, y: number, w?: number, h?: number): boolean;
  toRect(): { x: number; y: number; w: number; h: number };
}

interface ICommander {
  isActive: boolean;
  query: string;
  start(q?: string): void;
  stop(): void;
  write(key: string): void;
  run(): void;
  trigger(msg?: string, origin?: { x: number; y: number } | null, stopping?: boolean): void;
  onKeyDown(e: KeyboardEvent): void;
  onKeyUp(e: KeyboardEvent): void;
}

interface IClock {
  isPaused: boolean;
  isPuppet: boolean;
  speed: { value: number; target: number };
  play(msg?: boolean, midiStart?: boolean): void;
  stop(msg?: boolean): void;
  setSpeed(value: number | null, target?: number | null, setTimer?: boolean): void;
  setFrame(f: number): void;
  tap(): void;
  toString(): string;
}

interface IClient {
  version: number;
  library: typeof library;
  theme: ITheme;
  acels: IAcels;
  source: ISource;
  history: IHistory;
  orca: IOrca;
  io: IIO;
  cursor: ICursor;
  commander: ICommander;
  clock: IClock;
  grid: { w: number; h: number };
  tile: { w: number; h: number; ws?: number; hs?: number };
  guide: boolean;
  el: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  ports?: [number, number, number, string][];
  install(host: HTMLElement): void;
  start(): void;
  reset(): void;
  run(): void;
  update(): void;
  whenOpen(file: File, text: string): void;
  setGrid(w: number, h: number): void;
  toggleGuide(force?: boolean | null): void;
  resize(force?: boolean): void;
  crop(w: number, h: number): void;
  clear(): void;
  findPorts(): [number, number, number, string][];
  makeTheme(type: number): { bg?: string; fg?: string };
  drawProgram(): void;
  drawInterface(): void;
  drawGuide(): void;
  drawSprite(x: number, y: number, g: string, type: number): void;
  write(text: string, offsetX: number, offsetY: number, limit?: number, type?: number): void;
}

interface IAcels {
  all: Record<string, { cat: string; name: string; downfn?: () => void; upfn?: () => void; accelerator?: string; role?: string; type?: string }>;
  roles?: Record<string, unknown>;
  pipe: { onKeyDown(e: KeyboardEvent): void; onKeyUp(e: KeyboardEvent): void } | null;
  install(host?: Window | HTMLElement): void;
  set(cat: string, name: string, accelerator: string, downfn: () => void, upfn?: () => void): void;
  add(cat: string, role: string): void;
  get(accelerator: string): { cat: string; name: string; downfn?: () => void; upfn?: () => void; accelerator?: string; role?: string; type?: string } | undefined;
  sort(): Record<string, Array<{ cat: string; name: string; downfn?: () => void; upfn?: () => void; accelerator?: string; role?: string; type?: string }>>;
  convert(event: KeyboardEvent): string;
  onKeyDown(e: KeyboardEvent): void;
  onKeyUp(e: KeyboardEvent): void;
  toMarkdown(): string;
  inject(name?: string): void;
}

interface ElectronMenuItem {
  label?: string;
  submenu?: ElectronMenuItem[];
  click?: () => void;
  clickId?: string;
  role?: string;
  accelerator?: string;
  type?: string;
}

interface ElectronAPI {
  injectMenu(menu: unknown): Promise<void>;
  openThemeFile?(): Promise<string | null>;
  toggleFullscreen(): Promise<void>;
  toggleVisible(): Promise<void>;
  toggleMenubar(): Promise<void>;
  inspect(): Promise<void>;
  openExternal(url: string): Promise<void>;
  getExtensionsPath?(): Promise<string>;
  openExtensionsFolder?(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
