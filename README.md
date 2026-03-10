# Orca Ts

**TypeScript / pnpm / Electron fork of [Orca](https://github.com/hundredrabbits/Orca)** by [hundredrabbits](https://100r.co).

Orca is an [esoteric programming language](https://en.wikipedia.org/wiki/Esoteric_programming_language) for building procedural sequencers. Every letter is an operation; lowercase runs on bang, uppercase each frame. This app is a **livecoding environment** that sends MIDI, OSC & UDP to tools like Ableton, Renoise, VCV Rack or SuperCollider.

This fork keeps the same behaviour and UI, with:

- **TypeScript** for main process, preload and renderer scripts  
- **pnpm** as package manager  
- **Electron 35.x** (security updates)  
- Same operators, commands and workflow as the original

---

## Install & run

**Requirements:** Node.js ≥ 18, [pnpm](https://pnpm.io/) (`npm install -g pnpm` or `corepack enable`)

```bash
git clone https://github.com/<your-username>/Orca_ts.git
cd Orca_ts/desktop/
pnpm install
pnpm start
```

- **Build only:** `pnpm run build`  
- **Dev:** `pnpm run dev`

---

## Original Orca

- [Official repo](https://github.com/hundredrabbits/Orca)
- [Download builds](https://hundredrabbits.itch.io/orca) (Linux, Windows, macOS)
- [Browser version](https://hundredrabbits.github.io/Orca/) (webMidi)
- [Help & community](https://discord.gg/F7W98pXKd7) · [Tutorial](https://www.youtube.com/watch?v=ktcWOLeWP-g)

Operators, commands, MIDI/OSC/UDP and the rest of the language are unchanged; see the [original README](https://github.com/hundredrabbits/Orca#readme) and docs for full reference.

---

## Licence

Same as the original project (MIT). See [LICENSE.md](LICENSE.md).
