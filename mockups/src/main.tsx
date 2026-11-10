import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useGrokTheme } from "./shim";
import { CUSTOMERS, EXTRA, tileOf, band, BAND_LABEL, TradingCard, Scoreboard, CharacterSheet, WalletStack, Roster, AudienceCard, BandDemo, Timeline, usePulse, Tag } from "./components";
import type { Customer, Tile } from "./components";
import { AUDS, AUD_SPEC } from "./prompts";

type Opt = { value: string; label: string };
function Segmented({ options, value, onChange, label }: { options: Opt[]; value: string; onChange: (v: string) => void; label: string }) {
  const t = useGrokTheme();
  return <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, padding: 4, borderRadius: 10, background: t.fill.secondary, margin: "4px 0 12px" }}>
    {options.map((o) => <button key={o.value} role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}
      style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: o.value === value ? t.bg.elevated : "transparent", color: o.value === value ? t.text.primary : t.text.secondary, fontWeight: o.value === value ? 700 : 500 }}>{o.label}</button>)}
  </div>;
}

function Heatmap({ list }: { list: Customer[] }) {
  const t = useGrokTheme();
  const cols = ["Ops", "Case", "SLA", "Commercial", "Sentiment"];
  return <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 12, marginTop: 14, width: "100%", maxWidth: 640 }}>
    <caption style={{ textAlign: "left", color: t.text.secondary, fontSize: 11, paddingBottom: 4 }}>Risk components (0 to 100) by customer</caption>
    <thead><tr><th scope="col" style={{ textAlign: "left", color: t.text.tertiary, fontWeight: 600 }}>Customer</th>{cols.map((c) => <th key={c} scope="col" style={{ color: t.text.tertiary, fontWeight: 600 }}>{c}</th>)}</tr></thead>
    <tbody>{list.map((x) => {
      const v = [x.comp.ops, x.comp.cs, x.comp.sla, x.comp.com, x.comp.sen];
      return <tr key={x.id}><th scope="row" style={{ textAlign: "left", fontWeight: 600, color: t.text.primary, paddingRight: 8 }}>{x.name}</th>
        {v.map((n, i) => <td key={i} style={{ textAlign: "center", padding: "6px 4px", borderRadius: 4, color: n > 55 ? "#0d0f12" : t.text.primary, background: `rgba(255, 140, 90, ${0.08 + (n / 100) * 0.85})`, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{n}</td>)}</tr>;
    })}</tbody>
  </table>;
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  const t = useGrokTheme();
  return <section id={id} aria-labelledby={`${id}-h`} style={{ marginTop: 36 }}>
    <h2 id={`${id}-h`} style={{ fontSize: 20, margin: "0 0 4px" }}>{title}</h2>
    {note && <p style={{ margin: "0 0 14px", color: t.text.secondary, fontSize: 13.5, maxWidth: 760 }}>{note}</p>}
    {children}
  </section>;
}

function App() {
  const t = useGrokTheme();
  const pulse = usePulse();
  const [sel, setSel] = useState<string>("nw");
  const [aud, setAud] = useState<string>("exec");
  const [sort, setSort] = useState<string>("risk");
  const c = CUSTOMERS.find((x) => x.id === sel) || CUSTOMERS[0];
  const tiles: Tile[] = [...CUSTOMERS.map(tileOf), ...EXTRA].sort((a, z) => sort === "risk" ? z.risk - a.risk : sort === "arr" ? z.arr - a.arr : a.renewalDays - z.renewalDays);
  const spec = AUD_SPEC[aud];
  const row = (n: React.ReactNode) => <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", padding: "8px 0" }}>{n}</div>;
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 80px" }}>
    <header style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Customer Player Cards</h1>
        <p style={{ margin: "6px 0 0", color: t.text.secondary, maxWidth: 680, fontSize: 14 }}>Salesforce CRM data plus live operational events, shown as player cards. Five display styles, six audience views. Static mockup.</p>
      </div>
      <label style={{ fontSize: 12.5, color: t.text.secondary, display: "grid", gap: 4 }}>Example customer
        <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ fontSize: 14, padding: "6px 8px", borderRadius: 8, background: t.bg.elevated, color: t.text.primary, border: `1px solid ${t.border.strong}` }}>
          {CUSTOMERS.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.risk} {BAND_LABEL[band(x.risk)]}</option>)}
        </select>
      </label>
    </header>
    <p role="note" style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: t.fill.secondary, fontSize: 13 }}><b>Illustrative data.</b> Every customer, person, case, incident and figure here is fictional. Nothing is connected to Salesforce or any ops tool.</p>

    <Section id="a" title="A. Trading card (front and back)" note="Tier is card rarity. The front is the executive glance; the back carries season stats and the risk breakdown.">
      {row(<><TradingCard c={c} side="front" pulse={pulse} /><TradingCard c={c} side="back" pulse={pulse} /></>)}
    </Section>
    <Section id="b" title="B. Broadcast scoreboard" note="Health and risk are the scores, the SLA is the game clock, renewal is the period. Select a league row to load it.">
      <Scoreboard c={c} list={CUSTOMERS} pulse={pulse} onPick={setSel} />
    </Section>
    <Section id="c" title="C. RPG character sheet" note="Active events become status effects. Use Plain labels to swap game terms for business terms.">
      <CharacterSheet c={c} pulse={pulse} />
    </Section>
    <Section id="d" title="D. Wallet stack" note="Mobile first. Ordered by risk; tap a card to expand it.">
      <WalletStack list={CUSTOMERS} sel={sel} onPick={setSel} pulse={pulse} />
    </Section>
    <Section id="e" title="E. Roster heatmap" note="The whole book at once, tinted by risk band, with a component heatmap.">
      <Segmented label="Sort roster" options={[{ value: "risk", label: "Sort by risk" }, { value: "arr", label: "By ARR" }, { value: "renewal", label: "By renewal" }]} value={sort} onChange={setSort} />
      <Roster tiles={tiles} sel={sel} onPick={setSel} pulse={pulse} />
      <Heatmap list={CUSTOMERS} />
    </Section>
    <Section id="aud" title="Audience views" note="Same customer, six audiences. The engineer view never receives commercial fields.">
      <Segmented label="Audience" options={AUDS} value={aud} onChange={setAud} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
        <AudienceCard c={c} aud={aud} pulse={pulse} />
        <dl style={{ margin: 0, fontSize: 13, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px" }}>
          {([["Default layer", spec.layer], ["What they see", spec.sees], ["Drill depth", spec.depth], ["Density", spec.density], ["Refresh", spec.refresh], ["Alerts", spec.alerts]] as [string, string][]).map(([k, v]) => <React.Fragment key={k}><dt style={{ color: t.text.tertiary }}>{k}</dt><dd style={{ margin: 0 }}>{v}</dd></React.Fragment>)}
        </dl>
      </div>
    </Section>
    <Section id="drill" title="Drill-in timeline" note="What engineers and support see first for the selected customer.">
      <Tag>Case and incident timeline · {c.name}</Tag>
      <Timeline items={c.timeline} />
    </Section>
    <Section id="rules" title="Risk bands" note="Never color alone: every band has a glyph, a text label and an aria-label. Pulsing stops under prefers-reduced-motion.">
      <BandDemo pulse={pulse} />
    </Section>
    <footer style={{ marginTop: 48, fontSize: 12, color: t.text.tertiary }}>Illustrative data · Customer Player Cards concept · MIT License</footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
