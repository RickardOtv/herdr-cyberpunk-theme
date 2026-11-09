import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, terminals, spaces, theme, run } from "herdr";

// "NEEDS YOU" list for the sidebar, after Night City's attention rail
// (github.com/vib-z/herdr-layouts), drawn in neon cyberpunk style. Lists
// every blocked agent, sub-agents without a pane included, newest first.
// The block grows with the list: it resizes itself (id "needs").
const YELLOW = "#fcee0a";
const RED = "#ff003c";
const HEADER = 32;
const ROW = 44;
const MAX_ROWS = 5;

function blockers() {
  const raw = terminals();
  const changed = (address) => raw.find((t) => t.address === address)?.status_ms ?? 0;
  const list = agents().filter((a) => a.status === "blocked")
    .map((a) => ({ address: a.address, title: a.title || a.program?.name || a.address, where: `${a.space_name} / ${a.tab_name}`, child: false }));
  const shown = new Set(agents().map((a) => a.address));
  // Sub-agents have no pane, so agents() leaves them out: find them under their parent.
  for (const t of raw) {
    if (shown.has(t.address) || !t.parent || t.state !== "live" || t.status !== "blocked") continue;
    const parent = agents().find((a) => a.address === t.parent);
    if (!parent) continue;
    list.push({ address: t.address, title: t.name || t.title || t.address, where: `${parent.space_name} / ${parent.tab_name} / sub-agent`, child: true });
  }
  return list.sort((a, b) => changed(b.address) - changed(a.address));
}

export default class CpNeeds extends View {
  init() {
    this.px = null;
  }

  // Fit the block to the list: the header, plus up to MAX_ROWS rows.
  fit(count) {
    const px = HEADER + (count ? Math.min(count, MAX_ROWS) * ROW + 4 : 0);
    if (px === this.px) return;
    this.px = px;
    run("layout.resize", { id: "needs", px });
  }

  open(b) {
    if (b.child) run("terminal.peek", { terminal: b.address });
    else run("agent.focus", { terminal: b.address });
  }

  render() {
    const t = theme();
    const list = blockers();
    this.fit(list.length);
    return v_flex().size_full().font_family("Rajdhani").bg(t.chrome).border_b(1).border_color(t.border)
      .child(h_flex().h(HEADER).flex_none().px(12).gap(8).items_center()
        .child(div().font_weight(700).text_size(13).text_color(list.length ? RED : t.dim).child("◢ NEEDS YOU"))
        .child(div().flex_1())
        .child(list.length
          ? div().px(6).bg(YELLOW).text_color("#000000").font_weight(700).text_size(12).child(String(list.length))
          : div().text_size(12).text_color(t.dim).child("ALL CLEAR")))
      .child(v_flex().id("needs-list").flex_1().min_h(0).overflow_y_scrollbar().px(8).gap(4)
        .children(list.map((b, i) => h_flex().id(`need-${b.address}`).h(ROW - 4).flex_none().gap(8).items_center()
          .bg("#3a0d14").hover((s) => s.bg("#4f1220"))
          .on_click(() => this.open(b))
          .child(div().w(3).h_full().bg(RED).when(i < 3, (el) => el.loop("opacity", { from: 0.4, to: 1, period: 1400 })))
          .child(v_flex().flex_1().min_w(0)
            .child(div().truncate().font_weight(700).text_size(13).text_color("#ffe7ea").child(b.title))
            .child(div().truncate().text_size(11).text_color(t.muted).child(`${b.where} · ${b.address}`))))));
  }
}
