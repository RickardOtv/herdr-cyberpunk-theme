# Herdr Cyberpunk

A Cyberpunk 2077 style setup for [Herdr](https://herdr.dev): neon theme, Night City
background, see-through panes, angular frames, Rajdhani / Share Tech Mono fonts.

## What's in it

- `layouts/cyberpunk.json`: the layout (a clone of Herdr's `main`).
- `themes/cyberpunk.json`: black, yellow `#fcee0a`, red `#ff003c`, cyan `#00f0ff`.
- `backgrounds/`: the skyline image and `night-city.py`, the script that generates it.
- `mods/cp-status`: yellow bottom bar. Shows agent counts, a context meter for the
  focused Claude session, SESSION (5h) and WEEK plan usage, and a clock.
- `mods/cp-needs`: NEEDS YOU list at the top of the sidebar (blocked agents).
- `mods/agent-tabs`: sub-agents started with `hc run` get their own tab, without
  stealing focus.
- `claude/statusline.sh`: Claude Code status line. Also writes
  `~/.claude/usage.json` and `~/.claude/herdr-ctx/<terminal>.json` for the bar.

## Install

Needs Herdr, and `jq` for the status line.

```sh
git clone https://github.com/RickardOtv/herdr-cyberpunk.git
cd herdr-cyberpunk
./install.sh
```

Existing files are backed up as `*.bak`. It also sets `statusLine` in
`~/.claude/settings.json`. If you skip that, the bar still works but shows no
context or plan usage.

## Fonts

Rajdhani and Share Tech Mono are under the SIL Open Font License
(`mods/cp-status/fonts/OFL-Rajdhani.txt`).
