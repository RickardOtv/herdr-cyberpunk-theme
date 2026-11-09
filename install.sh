#!/bin/bash
# Installs the cyberpunk Herdr setup. Existing files are backed up as *.bak.
set -e
cd "$(dirname "$0")"
H=~/.config/herdr-app

copy() { # $1 source, $2 destination
  mkdir -p "$(dirname "$2")"
  [ -e "$2" ] && rm -rf "$2.bak" && mv "$2" "$2.bak"
  cp -R "$1" "$2"
}

copy layouts/cyberpunk.json "$H/layouts/cyberpunk.json"
copy layouts/cyberpunk.svg "$H/layouts/cyberpunk.svg"
copy themes/cyberpunk.json "$H/themes/cyberpunk.json"
copy backgrounds/skyline.png "$H/backgrounds/skyline.png"
for m in mods/*/; do copy "${m%/}" "$H/${m%/}"; done

# Claude Code status line: feeds plan usage and context to the Herdr status bar.
copy claude/statusline.sh ~/.claude/statusline.sh
if command -v jq >/dev/null; then
  S=~/.claude/settings.json
  [ -f "$S" ] || echo '{}' > "$S"
  cp "$S" "$S.bak"
  jq '.statusLine = {"type": "command", "command": "bash ~/.claude/statusline.sh"}' "$S.bak" > "$S"
else
  echo "jq not found: set statusLine in ~/.claude/settings.json by hand (see README)."
fi

command -v herdr-app >/dev/null && herdr-app do layout.switch --name cyberpunk || true
echo "Done. Switch layouts with cmd-shift-l if it didn't switch."
