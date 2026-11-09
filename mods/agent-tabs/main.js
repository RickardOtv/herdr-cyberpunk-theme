import { View, div } from "gpui-kit";
import { terminals, spaces, hc, run } from "herdr";

// Gives every new sub-agent (a terminal started with `hc run` from an agent,
// which Herdr lists without a pane) a tab of its own in its parent's space,
// named after it. Labelling it with an unknown tab id makes Herdr create
// that tab without switching to it, so the person stays where they are.
// Draws nothing; it lives in a 0px block of the layout.

const tabId = () => "tb" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export default class AgentTabs extends View {
  init() {
    // Only agents started from now on; existing ones stay as they are.
    this.handled = new Set(terminals().map((t) => t.address));
    this.naming = new Map(); // tab id -> name, until the tab shows up
  }

  render(cx) {
    const all = terminals();
    for (const t of all) {
      if (this.handled.has(t.address) || t.state !== "live" || !t.parent) continue;
      if (t.labels?.["herdr.tab"]) { this.handled.add(t.address); continue; }
      const parent = all.find((p) => p.address === t.parent);
      const space = parent?.labels?.["herdr.space"];
      if (!space) continue; // parent isn't shown in Herdr: nothing to attach to
      this.handled.add(t.address);
      const tab = tabId();
      this.naming.set(tab, t.name || t.program?.name || "agent");
      cx.spawn(async () => {
        await hc(["label", t.address, `herdr.space=${space}`, `herdr.tab=${tab}`]);
      });
    }
    for (const [tab, name] of this.naming) {
      // Another machine's tab ids carry a "<machine>/" prefix here.
      const found = spaces().flatMap((s) => s.tabs).find((x) => x.id === tab || x.id.endsWith("/" + tab));
      if (found) {
        this.naming.delete(tab);
        run("tab.rename", { id: found.id, name });
      }
    }
    return div();
  }
}
