#!/bin/bash
input=$(cat)

j() { echo "$input" | jq -r "$1" 2>/dev/null; }

MODEL=$(j '.model.display_name // empty')
DIR=$(j '.workspace.current_dir // .cwd // empty')
PCT=$(j '.context_window.used_percentage // empty')
SIZE=$(j '.context_window.context_window_size // empty')
USED=$(j '(.context_window.current_usage // null) | if . then ((.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0)) else empty end')
H5=$(j '.rate_limits.five_hour.used_percentage // empty')
H5R=$(j '.rate_limits.five_hour.resets_at // empty')
D7=$(j '.rate_limits.seven_day.used_percentage // empty')
D7R=$(j '.rate_limits.seven_day.resets_at // empty')

k() { awk -v n="$1" 'BEGIN{ if (n>=1000000) printf "%.1fM", n/1000000; else if (n>=1000) printf "%.0fk", n/1000; else printf "%d", n }'; }
rt() { # $1 epoch, $2 fmt
  date -r "$1" "+$2" 2>/dev/null || date -d "@$1" "+$2" 2>/dev/null
}

parts=()
[ -n "$MODEL" ] && parts+=("$MODEL")
[ -n "$DIR" ] && parts+=("${DIR##*/}")

if [ -n "$PCT" ]; then
  s="ctx $(printf '%.0f' "$PCT")%"
  [ -n "$USED" ] && [ -n "$SIZE" ] && s="$s ($(k "$USED")/$(k "$SIZE"))"
  parts+=("$s")
fi

if [ -n "$H5" ]; then
  s="5h $(printf '%.0f' "$H5")% used"
  [ -n "$H5R" ] && s="$s, resets $(rt "$H5R" '%H:%M')"
  parts+=("$s")
fi
if [ -n "$D7" ]; then
  s="7d $(printf '%.0f' "$D7")% used"
  [ -n "$D7R" ] && s="$s, resets $(rt "$D7R" '%a %H:%M')"
  parts+=("$s")
fi

out=""
for p in "${parts[@]}"; do out="${out:+$out | }$p"; done
printf '%s\n' "$out"

# Share plan usage with other tools (the Herdr status bar reads this).
if [ -n "$H5$D7" ]; then
  echo "$input" | jq -c '{updated: now, rate_limits}' > ~/.claude/usage.json.tmp 2>/dev/null && mv ~/.claude/usage.json.tmp ~/.claude/usage.json
fi

# Per-terminal context for the Herdr status bar's context meter.
if [ -n "$HC_TERMINAL_ID" ] && [ -n "$PCT" ]; then
  mkdir -p ~/.claude/herdr-ctx
  f=~/.claude/herdr-ctx/$HC_TERMINAL_ID.json
  echo "$input" | jq -c --argjson used "${USED:-0}" '{updated: now, model: .model.display_name, used_percentage: .context_window.used_percentage, used: $used, size: .context_window.context_window_size}' > "$f.tmp" 2>/dev/null && mv "$f.tmp" "$f"
fi
