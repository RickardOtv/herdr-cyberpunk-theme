import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, focused, run, home, readTextFile } from "herdr";

// Cyberpunk status bar: a yellow strip with black uppercase text,
// a scan beam, agent counts, a context meter for the focused Claude session,
// Claude plan usage and a clock.
// Data comes from ~/.claude/statusline.sh: usage.json (plan limits) and
// herdr-ctx/<terminal>.json (context per terminal).
const YELLOW = "#fcee0a";
const BLACK = "#000000";
const RED = "#ff003c";
const CYAN = "#00f0ff";
const SEGMENTS = 20;

const pad = (n) => String(n).padStart(2, "0");
const k = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`;
const read = (path) => readTextFile(path).then((t) => JSON.parse(t)).catch(() => null);

export default class CpStatus extends View {
  init(_props, cx) {
    this.now = new Date();
    this.width = 0;
    this.usage = null;
    this.ctx = null;
    this.tick = 0;
    cx.timer.every(2000, (cx) => this.refresh(cx));
    this.refresh(cx);
  }

  // Context every 2s (follows focus), plan usage every 16s.
  refresh(cx) {
    this.now = new Date();
    const id = (focused()?.terminal ?? "").split("/").pop();
    const both = this.tick++ % 8 === 0;
    cx.spawn(async (cx) => {
      this.ctx = id ? await read(`${home()}/.claude/herdr-ctx/${id}.json`) : null;
      if (both) this.usage = await read(`${home()}/.claude/usage.json`);
      cx.notify();
    });
  }

  // Segmented meter of percent USED: cyan, yellow from 60%, pulsing red from 80%.
  // used is null when unknown; wide meters stretch, small ones are fixed width.
  gauge(name, used, text, { segments, wide }) {
    const on = used == null ? 0 : Math.max(used > 0 ? 1 : 0, Math.round((used / 100) * segments));
    const hot = used >= 80;
    const color = used == null ? "#333333" : hot ? RED : used >= 60 ? YELLOW : CYAN;
    const segs = Array.from({ length: segments }, (_, i) =>
      div().flex_1().h(10).bg(i < on ? color : "#1c1c22")
        .when(i < on && hot, (el) => el.loop("opacity", { from: 0.4, to: 1, period: 800 })));
    return h_flex().h(22).px(8).gap(8).items_center().bg(BLACK).border_l(3).border_color(color)
      .when(wide, (el) => el.min_w(340).max_w(560).flex_1().mx(12))
      .when(!wide, (el) => el.flex_none().mr(8))
      .child(div().flex_none().text_color(YELLOW).child(name))
      .child(h_flex().gap(2).items_center().children(segs)
        .when(wide, (el) => el.flex_1().min_w(120)).when(!wide, (el) => el.w(segments * 7)))
      .child(div().flex_none().text_color(used == null ? "#666666" : color).child(text));
  }

  // Context of the focused Claude session.
  meter() {
    const c = this.ctx;
    const used = c?.used_percentage == null ? null : Math.min(100, Math.max(0, c.used_percentage));
    const text = used == null ? "NO LINK"
      : `${Math.round(used)}% USED${c.size ? ` · ${k(c.used ?? 0)}/${k(c.size)}` : ""}`;
    return this.gauge("CTX", used, text, { segments: SEGMENTS, wide: true });
  }

  // Plan limit: "SESSION ▮▮▮▯▯ 41% · 14:30" (percent used, reset time); null when unknown.
  limit(label, l) {
    if (l?.used_percentage == null) return null;
    const used = Math.min(100, Math.max(0, l.used_percentage));
    const reset = l.resets_at ? new Date(l.resets_at * 1000) : null;
    const day = reset && reset - this.now > 86400000 ? `${["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][reset.getDay()]} ` : "";
    const when = reset && reset > this.now ? ` · ${day}${pad(reset.getHours())}:${pad(reset.getMinutes())}` : "";
    return this.gauge(label, used, `${Math.round(used)}%${when}`, { segments: 10, wide: false });
  }

  render() {
    const space = spaces().find((s) => s.active);
    const list = agents();
    const count = (s) => list.filter((a) => a.status === s).length;
    const blocked = count("blocked");
    const working = count("working");
    const clock = `${pad(this.now.getHours())}:${pad(this.now.getMinutes())}`;
    const cell = (text) => div().h_full().px(12).flex().items_center().child(text);
    const sep = () => div().w(1).h(12).bg(BLACK).opacity(0.35);
    const limits = this.usage?.rate_limits;

    return h_flex().id("root").relative().size_full().items_center().overflow_hidden()
      .bg(YELLOW).text_color(BLACK).font_family("Rajdhani").font_weight(700).text_size(13)
      .on_size_change((size, cx) => { this.width = size.width; cx.notify(); })
      .when(this.width > 0, (el) => el.child(
        div().absolute().top(0).left(0).w(60).h_full().bg("#ffffff").opacity(0.3)
          .loop("left", { from: -60, to: this.width, period: 7000, easing: "linear" })))
      // Left: link status, where, agents.
      .child(div().h_full().pl(10).pr(14).flex().items_center().bg(BLACK).text_color(YELLOW)
        .child("◢ NET//")
        .child(div().child("ONLINE").loop("opacity", { from: 0.35, to: 1, period: 1400 })))
      .child(cell((space?.machine ?? "LOCAL").toUpperCase()))
      .when(Boolean(space?.branch), (el) => el.child(sep()).child(cell(`⎇ ${space.branch.toUpperCase()}`)))
      .child(sep())
      .child(cell(`AGENTS ${list.length}${working ? ` · ▲${working}` : ""}`))
      .when(blocked > 0, (el) => el.child(
        div().id("blocked").h_full().px(12).flex().items_center().bg(RED).text_color(YELLOW)
          .child(`⚠ ${blocked} AWAITING`).loop("opacity", { from: 0.55, to: 1, period: 900 })
          .on_click(() => run("agent.next"))))
      // Middle: context meter.
      .child(div().flex_1())
      .child(this.meter())
      .child(div().flex_1())
      // Right: plan usage, commands, clock.
      .when(Boolean(limits), (el) => el
        .children([this.limit("SESSION", limits.five_hour), this.limit("WEEK", limits.seven_day)].filter(Boolean)))
      .child(div().id("palette").h_full().px(12).flex().items_center().on_click(() => run("app.palette")).child("// CMD"))
      .child(div().h_full().px(14).flex().items_center().bg(BLACK).text_color(YELLOW).child(clock))
      .child(div().h_full().w(6).bg(RED));
  }
}
