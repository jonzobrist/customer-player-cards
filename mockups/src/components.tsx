import { useGrokTheme, useState, useEffect, useRef, Fragment } from "./shim";
import type { ReactNode, CSSProperties } from "./shim";
type Theme = ReturnType<typeof useGrokTheme>;
type Band = "critical" | "high" | "elevated" | "low";
type G = Band | "change";
type IncKind = "SEV1" | "SEV2" | "SEV3" | "DEGRADED" | "CHANGE";
interface Incident { id: string; title: string; kind: IncKind; service: string; source: string; age: string; status: string }
interface TL { t: string; who: string; what: string }
interface Comp { ops: number; cs: number; sla: number; com: number; sen: number }
interface TopCase { num: string; subject: string; pri: "P1" | "P2" | "P3" | "P4"; status: string; age: string; slaLeft: string; slaPct: number; owner: string; next: string; lastContact: string }
interface Customer {
  id: string; name: string; initials: string; segment: string; industry: string; region: string; tier: "Platinum" | "Gold" | "Silver" | "Bronze"; cardNo: string;
  arr: number; renewalDate: string; renewalDays: number; health: number; csat: number; nps: number; npsDelta: number; adoption: number; uptime: number;
  owners: { ae: string; csm: string; so: string; exec: string };
  opp: { name: string; amount: string; stage: string; close: string };
  entitlement: string[]; cases: { open: number; p1: number; esc: number }; top: TopCase; incidents: Incident[]; comp: Comp; trend: number[];
  why: string; ask: string; blast: string; decision: string; tenants: string; runbook: string; deploy: string; timeline: TL[]; risk: number;
}

function riskOf(c: Comp, floor80: boolean): number {
  const r = Math.round(0.3 * c.ops + 0.25 * c.cs + 0.2 * c.sla + 0.15 * c.com + 0.1 * c.sen);
  return floor80 ? Math.max(r, 80) : r;
}
function band(r: number): Band { return r >= 80 ? "critical" : r >= 60 ? "high" : r >= 40 ? "elevated" : "low"; }
const BAND_LABEL: Record<Band, string> = { critical: "CRITICAL", high: "HIGH", elevated: "ELEVATED", low: "LOW" };
function bandColor(t: Theme, b: Band): string { return b === "critical" ? t.text.danger : b === "high" ? t.text.warning : b === "elevated" ? t.dataviz.categorical[1] : t.text.success; }
function bandFill(t: Theme, b: Band): string { return b === "critical" ? t.fill.dangerSubtle : b === "high" ? t.fill.warningSubtle : b === "elevated" ? t.fill.accentSubtle : t.fill.successSubtle; }
function tierColor(t: Theme, tier: string): string { return tier === "Platinum" ? t.dataviz.categorical[2] : tier === "Gold" ? t.dataviz.categorical[1] : t.dataviz.other; }
const TIER_STARS: Record<string, number> = { Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 };
function kindG(k: IncKind): G { return k === "SEV1" ? "critical" : k === "SEV2" ? "high" : k === "CHANGE" ? "change" : "elevated"; }
function priG(p: string): G { return p === "P1" ? "critical" : p === "P2" ? "high" : p === "P3" ? "elevated" : "low"; }
const EFFECT: Record<IncKind, [string, string]> = {
  SEV1: ["Burning", "Health drains each hour; SLA shield decays 2x"],
  SEV2: ["Poisoned", "Health drains slowly; case SLA under pressure"],
  SEV3: ["Slowed", "Minor drag on SLA shield"],
  DEGRADED: ["Weakened", "Partial service; watch for escalation"],
  CHANGE: ["Warded", "Change window ahead; avoid risky actions"],
};
function sparkPts(v: number[], w: number, h: number, pad: number): string {
  return v.map((x: number, i: number) => `${(pad + (i * (w - 2 * pad)) / (v.length - 1)).toFixed(1)},${(h - pad - (x / 100) * (h - 2 * pad)).toFixed(1)}`).join(" ");
}

const RAW: Omit<Customer, "risk">[] = [
  {
    id: "nw", name: "Northwind Logistics", initials: "NW", segment: "Enterprise", industry: "Logistics", region: "EMEA", tier: "Platinum", cardNo: "001",
    arr: 4.2, renewalDate: "Feb 28, 2027", renewalDays: 110, health: 58, csat: 3.6, nps: 12, npsDelta: -18, adoption: 71, uptime: 99.62,
    owners: { ae: "Dana Whitfield", csm: "Priya Raman", so: "Marco Ruiz", exec: "Helen Ortiz, COO" },
    opp: { name: "FY27 renewal + EU expansion", amount: "$1.1M", stage: "Negotiation", close: "Feb 15, 2027" },
    entitlement: ["Premier 24x7", "1h P1 response", "Named TAM"], cases: { open: 7, p1: 1, esc: 2 },
    top: { num: "00481234", subject: "EU label-creation API returning 502s", pri: "P1", status: "Escalated to Engineering", age: "2h 31m", slaLeft: "47m", slaPct: 78, owner: "Sam Okafor, Support T3", next: "Engineering bridge update due 05:15 PT", lastContact: "Customer called 18 min ago" },
    incidents: [
      { id: "INC-20931", title: "EU-West API gateway degraded", kind: "SEV1", service: "API Gateway eu-west-1", source: "PagerDuty", age: "2h 14m", status: "Mitigating" },
      { id: "CHG-7782", title: "Label service DB failover window", kind: "CHANGE", service: "Label Service", source: "ServiceNow", age: "Starts 08:00 PT", status: "Scheduled" },
    ],
    comp: { ops: 100, cs: 100, sla: 78, com: 55, sen: 50 }, trend: [38, 41, 40, 45, 52, 60, 71, 84],
    why: "A SEV1 gateway incident is hitting their P1 label case 47 min before SLA breach, 110 days before a $4.2M renewal.",
    ask: "Exec-to-exec call with their COO today; confirm the service credit policy.",
    blast: "14 customers · $18.6M ARR on INC-20931", decision: "Approve a service credit and an exec call before the 08:00 PT change window",
    tenants: "tn-eu-0412, tn-eu-0419", runbook: "RB-112 API gateway 5xx surge", deploy: "gw-config v5.18.2 rolled out 02:01 PT",
    timeline: [
      { t: "02:01", who: "Change", what: "gw-config v5.18.2 deployed to eu-west-1" },
      { t: "02:12", who: "PagerDuty", what: "INC-20931 SEV1 opened: 5xx rate 14%" },
      { t: "02:14", who: "Customer", what: "Case 00481234 opened by phone, P1" },
      { t: "02:40", who: "Support T3", what: "Linked case to INC-20931, applied macro M-114" },
      { t: "03:30", who: "Engineering", what: "Rollback started; 5xx down to 6%" },
      { t: "04:25", who: "Customer", what: "COO asked for an executive update" },
    ],
  },
  {
    id: "ct", name: "Contoso Health", initials: "CH", segment: "Enterprise", industry: "Healthcare", region: "North America", tier: "Gold", cardNo: "014",
    arr: 2.8, renewalDate: "Jun 30, 2027", renewalDays: 232, health: 74, csat: 4.1, nps: 31, npsDelta: -6, adoption: 82, uptime: 99.91,
    owners: { ae: "Rafael Moreno", csm: "Jin Park", so: "Alicia Grant", exec: "Tom Becker, CIO" },
    opp: { name: "Clinical analytics add-on", amount: "$420K", stage: "Proposal", close: "Jan 30, 2027" },
    entitlement: ["Premier business hours", "2h P1 response"], cases: { open: 4, p1: 0, esc: 1 },
    top: { num: "00479920", subject: "SSO logins taking 40+ seconds for clinicians", pri: "P2", status: "In progress", age: "6h 05m", slaLeft: "2h 10m", slaPct: 62, owner: "Ana Silva, Support T2", next: "Share cached-token workaround; next update 06:00 PT", lastContact: "Customer emailed 1h ago" },
    incidents: [{ id: "INC-20925", title: "Identity service latency us-east-1", kind: "SEV2", service: "Identity Service", source: "PagerDuty", age: "5h 50m", status: "Investigating" }],
    comp: { ops: 70, cs: 70, sla: 62, com: 40, sen: 45 }, trend: [40, 42, 45, 44, 50, 55, 58, 61],
    why: "A SEV2 identity latency incident is slowing clinician logins; their P2 case is 62% through its SLA.",
    ask: "No exec action yet; CSM briefs their CIO by end of day.",
    blast: "9 customers · $11.2M ARR on INC-20925", decision: "Whether to fail identity over to us-west-2 during clinic hours",
    tenants: "tn-us-1183", runbook: "RB-087 Identity service latency", deploy: "No change in 24h; upstream DNS alert 22:40 PT",
    timeline: [
      { t: "22:38", who: "Customer", what: "Case 00479920 opened in portal, P2" },
      { t: "22:40", who: "Monitoring", what: "p95 login latency 18s on identity-us-east" },
      { t: "22:55", who: "PagerDuty", what: "INC-20925 SEV2 opened" },
      { t: "23:20", who: "Support T2", what: "Linked case to INC-20925" },
      { t: "03:43", who: "Customer", what: "Asked for an ETA by email" },
    ],
  },
  {
    id: "ww", name: "Wide World Importers", initials: "WW", segment: "Enterprise", industry: "Wholesale", region: "APAC", tier: "Gold", cardNo: "022",
    arr: 1.6, renewalDate: "Sep 1, 2027", renewalDays: 295, health: 66, csat: 3.9, nps: 18, npsDelta: -4, adoption: 64, uptime: 99.8,
    owners: { ae: "Mei Tanaka", csm: "Oliver Hughes", so: "Ravi Shah", exec: "Grace Liu, VP Ops" },
    opp: { name: "Warehouse module expansion", amount: "$260K", stage: "Discovery", close: "Mar 31, 2027" },
    entitlement: ["Standard 24x5", "4h P1 response"], cases: { open: 5, p1: 0, esc: 0 },
    top: { num: "00480577", subject: "Inventory sync jobs delayed 3+ hours", pri: "P2", status: "Investigating", age: "11h 20m", slaLeft: "38m", slaPct: 85, owner: "Kofi Mensah, Support T2", next: "Escalate to T3 if backlog is not under 1h by 05:20 PT", lastContact: "Customer chat 3h ago" },
    incidents: [{ id: "INC-20929", title: "Batch queue backlog ap-southeast-2", kind: "SEV3", service: "Batch Queue", source: "Datadog via PagerDuty", age: "9h 00m", status: "Monitoring" }],
    comp: { ops: 40, cs: 70, sla: 85, com: 25, sen: 35 }, trend: [35, 36, 34, 40, 45, 48, 51, 54],
    why: "A batch backlog is delaying their inventory sync; the P2 case is 38 min from SLA breach.",
    ask: "None yet; watch the SLA.",
    blast: "6 customers · $5.4M ARR on INC-20929", decision: "Add queue workers now or accept SLA breach on 3 cases",
    tenants: "tn-ap-0220", runbook: "RB-063 Batch queue backlog", deploy: "Queue autoscaler config unchanged since Oct 28",
    timeline: [
      { t: "17:20", who: "Customer", what: "Case 00480577 opened: inventory sync 3h late" },
      { t: "19:40", who: "Monitoring", what: "Queue depth alert in ap-southeast-2" },
      { t: "19:45", who: "PagerDuty", what: "INC-20929 SEV3 opened" },
      { t: "01:30", who: "Support T2", what: "Customer update; manual sync workaround" },
    ],
  },
  {
    id: "aw", name: "Adventure Works", initials: "AW", segment: "Mid-market", industry: "Manufacturing", region: "North America", tier: "Silver", cardNo: "037",
    arr: 0.65, renewalDate: "Dec 10, 2026", renewalDays: 30, health: 41, csat: 2.9, nps: -22, npsDelta: -25, adoption: 38, uptime: 99.95,
    owners: { ae: "Chris Novak", csm: "Fatima Noor", so: "Alicia Grant", exec: "Paul Reyes, CFO" },
    opp: { name: "FY27 renewal", amount: "$650K", stage: "At risk", close: "Dec 5, 2026" },
    entitlement: ["Standard business hours", "8h P1 response"], cases: { open: 3, p1: 0, esc: 1 },
    top: { num: "00478811", subject: "Full data export ahead of contract review", pri: "P3", status: "Waiting on customer", age: "3d 2h", slaLeft: "1d 4h", slaPct: 20, owner: "Lee Park, Support T1", next: "Send export ETA and book an adoption review", lastContact: "Customer replied 2 days ago" },
    incidents: [{ id: "CHG-7790", title: "Reporting cluster upgrade", kind: "CHANGE", service: "Reporting", source: "ServiceNow", age: "Sat 22:00 PT", status: "Scheduled" }],
    comp: { ops: 15, cs: 55, sla: 20, com: 95, sen: 90 }, trend: [30, 33, 35, 38, 40, 43, 44, 46],
    why: "Renewal in 30 days, NPS down 25 points, and a full data-export request: a churn signal, not an ops fire.",
    ask: "Sponsor call this week; offer an adoption plan with the renewal.",
    blast: "No active incidents; 1 change window Saturday", decision: "Approve a renewal concession range before Nov 20",
    tenants: "tn-us-0071", runbook: "RB-140 Large tenant data export", deploy: "Reporting cluster upgrade scheduled Sat 22:00 PT",
    timeline: [
      { t: "Nov 7", who: "Customer", what: "Case opened requesting a full export" },
      { t: "Nov 7", who: "Support T1", what: "Export scoped; 3-day estimate" },
      { t: "Nov 8", who: "CSM", what: "Flagged churn signal to the AE" },
      { t: "Nov 9", who: "Customer", what: "Asked for a contract review meeting" },
    ],
  },
  {
    id: "ts", name: "Tailspin Air", initials: "TA", segment: "Enterprise", industry: "Aviation", region: "North America", tier: "Platinum", cardNo: "005",
    arr: 3.5, renewalDate: "Mar 31, 2028", renewalDays: 507, health: 81, csat: 4.3, nps: 44, npsDelta: 5, adoption: 88, uptime: 99.97,
    owners: { ae: "Nora Quinn", csm: "Ben Carter", so: "Ivan Petrov", exec: "Laura Kim, CTO" },
    opp: { name: "Crew app seats +2,000", amount: "$540K", stage: "Commit", close: "Dec 20, 2026" },
    entitlement: ["Premier 24x7", "1h P1 response", "Named TAM"], cases: { open: 2, p1: 0, esc: 0 },
    top: { num: "00480102", subject: "Webhook retries duplicating crew notices", pri: "P3", status: "Fix scheduled", age: "2d 3h", slaLeft: "1d 2h", slaPct: 30, owner: "Ana Silva, Support T2", next: "Confirm fix in Thursday release", lastContact: "Customer replied 1 day ago" },
    incidents: [{ id: "SP-3301", title: "Webhook delivery delays", kind: "DEGRADED", service: "Webhooks", source: "Status page", age: "1h 05m", status: "Degraded" }],
    comp: { ops: 30, cs: 40, sla: 30, com: 20, sen: 25 }, trend: [22, 25, 24, 28, 26, 30, 29, 31],
    why: "Webhook delivery shows Degraded on the status page; otherwise a healthy, growing account.",
    ask: "None.",
    blast: "31 customers on the degraded Webhooks component", decision: "None needed",
    tenants: "tn-us-0904", runbook: "RB-051 Webhook delivery delays", deploy: "Webhook dispatcher v2.4.0 deployed yesterday 15:00 PT",
    timeline: [
      { t: "Nov 8", who: "Customer", what: "Reported duplicate crew notices" },
      { t: "Nov 8", who: "Engineering", what: "Root cause: dedupe key bug" },
      { t: "03:38", who: "Status page", what: "Webhooks component set to Degraded" },
    ],
  },
  {
    id: "fb", name: "Fabrikam Retail", initials: "FR", segment: "Commercial", industry: "Retail", region: "EMEA", tier: "Gold", cardNo: "019",
    arr: 1.1, renewalDate: "Apr 15, 2027", renewalDays: 156, health: 88, csat: 4.6, nps: 52, npsDelta: 8, adoption: 91, uptime: 99.99,
    owners: { ae: "Sofia Rossi", csm: "Jin Park", so: "Ravi Shah", exec: "Marc Dubois, CEO" },
    opp: { name: "Loyalty module", amount: "$180K", stage: "Proposal", close: "Feb 28, 2027" },
    entitlement: ["Standard 24x5", "4h P1 response"], cases: { open: 1, p1: 0, esc: 0 },
    top: { num: "00479101", subject: "Report builder permissions question", pri: "P4", status: "Awaiting reply", age: "1d 1h", slaLeft: "3d", slaPct: 10, owner: "Lee Park, Support T1", next: "Close once the customer confirms", lastContact: "Agent replied 1 day ago" },
    incidents: [],
    comp: { ops: 0, cs: 20, sla: 10, com: 40, sen: 15 }, trend: [18, 16, 15, 17, 14, 16, 15, 15],
    why: "Healthy and growing; one low-priority question open.",
    ask: "Ask for a reference.",
    blast: "No active events on their services", decision: "None needed",
    tenants: "tn-eu-0310", runbook: "KB-2207 Report builder permissions", deploy: "No recent changes on their services",
    timeline: [
      { t: "Nov 9", who: "Customer", what: "Asked about report builder permissions" },
      { t: "Nov 9", who: "Support T1", what: "Sent KB-2207" },
    ],
  },
];
const CUSTOMERS: Customer[] = RAW.map((c: Omit<Customer, "risk">) => ({ ...c, risk: riskOf(c.comp, c.incidents.some((i: Incident) => i.kind === "SEV1") && c.top.pri === "P1") }));
interface Tile { id: string; name: string; arr: number; tier: string; risk: number; health: number; renewalDays: number; ev: string }
const EXTRA: Tile[] = [
  { id: "x1", name: "Litware Labs", arr: 2.1, tier: "Gold", risk: 72, health: 55, renewalDays: 64, ev: "SEV2 active" },
  { id: "x2", name: "Lucerne Publishing", arr: 1.9, tier: "Gold", risk: 63, health: 60, renewalDays: 140, ev: "SLA breached" },
  { id: "x3", name: "Alpine Ski House", arr: 0.8, tier: "Silver", risk: 48, health: 62, renewalDays: 45, ev: "" },
  { id: "x4", name: "Margie's Travel", arr: 0.7, tier: "Silver", risk: 35, health: 77, renewalDays: 210, ev: "" },
  { id: "x5", name: "Proseware", arr: 0.4, tier: "Bronze", risk: 27, health: 80, renewalDays: 300, ev: "Change Sat" },
  { id: "x6", name: "Coho Winery", arr: 0.2, tier: "Bronze", risk: 9, health: 93, renewalDays: 180, ev: "" },
];
function tileOf(c: Customer): Tile {
  const ev = c.incidents.find((i: Incident) => i.kind !== "CHANGE");
  return { id: c.id, name: c.name, arr: c.arr, tier: c.tier, risk: c.risk, health: c.health, renewalDays: c.renewalDays, ev: ev ? `${ev.kind} active` : c.incidents.length ? "Change window" : "" };
}
const fmtArr = (m: number): string => (m >= 1 ? `$${m.toFixed(1)}M` : `$${Math.round(m * 1000)}K`);

/* ---------- shared visual atoms ---------- */
function Glyph({ g, size = 14 }: { g: G; size?: number }) {
  const t = useGrokTheme();
  const col = g === "change" ? t.text.secondary : bandColor(t, g);
  const on = t.bg.base;
  let shape: ReactNode;
  if (g === "critical") shape = <Fragment><polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" fill={col} /><rect x="7.1" y="3.8" width="1.8" height="5.6" fill={on} /><rect x="7.1" y="10.6" width="1.8" height="1.8" fill={on} /></Fragment>;
  else if (g === "high") shape = <Fragment><polygon points="8,1 15.5,14.8 0.5,14.8" fill={col} /><rect x="7.1" y="5.6" width="1.8" height="4.6" fill={on} /><rect x="7.1" y="11.4" width="1.8" height="1.8" fill={on} /></Fragment>;
  else if (g === "elevated") shape = <Fragment><polygon points="8,0.6 15.4,8 8,15.4 0.6,8" fill={col} /><circle cx="8" cy="8" r="2" fill={on} /></Fragment>;
  else if (g === "low") shape = <Fragment><circle cx="8" cy="8" r="7.3" fill={col} /><polyline points="4.6,8.3 7,10.6 11.6,5.6" fill="none" stroke={on} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /></Fragment>;
  else shape = <Fragment><circle cx="8" cy="8" r="6.6" fill="none" stroke={col} strokeWidth={1.6} /><polyline points="8,4.2 8,8 10.8,9.6" fill="none" stroke={col} strokeWidth={1.6} strokeLinecap="round" /></Fragment>;
  const aria = g === "change" ? "change window" : BAND_LABEL[g].toLowerCase();
  return <svg width={size} height={size} viewBox="0 0 16 16" role="img" aria-label={aria} style={{ flex: "none", display: "inline-block", verticalAlign: "middle" }}>{shape}</svg>;
}
function Chip({ g, children }: { g: G; children: ReactNode }) {
  const t = useGrokTheme();
  const col = g === "change" ? t.border.strong : bandColor(t, g);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, border: `1px solid ${col}`, fontSize: 11, lineHeight: "14px", color: t.text.primary, background: t.bg.base }}><Glyph g={g} size={12} />{children}</span>;
}
function Bar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  const t = useGrokTheme();
  return <div style={{ height, borderRadius: 99, background: t.fill.secondary, overflow: "hidden" }}><div style={{ width: `${Math.max(2, Math.min(100, value))}%`, height: "100%", background: color, borderRadius: 99 }} /></div>;
}
function StatBar({ label, value, display, color }: { label: string; value: number; display: string; color: string }) {
  const t = useGrokTheme();
  return <div style={{ display: "grid", gridTemplateColumns: "minmax(70px, 34%) 1fr minmax(34px, auto)", alignItems: "center", gap: 8, fontSize: 11 }}>
    <span style={{ color: t.text.secondary, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 10 }}>{label}</span>
    <Bar value={value} color={color} />
    <span style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: t.text.primary }}>{display}</span>
  </div>;
}
function healthColor(t: Theme, h: number): string { return h < 50 ? t.text.danger : h < 70 ? t.text.warning : t.text.success; }
function slaColor(t: Theme, p: number): string { return p >= 90 ? t.text.danger : p >= 75 ? t.text.warning : t.dataviz.categorical[0]; }
function KV({ k, v }: { k: string; v: ReactNode }) {
  const t = useGrokTheme();
  return <div style={{ display: "grid", gridTemplateColumns: "minmax(88px, 30%) 1fr", gap: 10, fontSize: 12.5, lineHeight: 1.45, padding: "5px 0", borderTop: `1px solid ${t.border.subtle}` }}>
    <span style={{ color: t.text.tertiary }}>{k}</span><span style={{ color: t.text.primary }}>{v}</span>
  </div>;
}
function Monogram({ c, size = 40 }: { c: { initials: string; tier: string }; size?: number }) {
  const t = useGrokTheme();
  return <div style={{ width: size, height: size, flex: "none", borderRadius: 10, border: `2px solid ${tierColor(t, c.tier)}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, color: t.text.primary, background: t.bg.base }}>{c.initials}</div>;
}
function outlineFor(t: Theme, b: Band, pulse: boolean): CSSProperties {
  return b === "critical" ? { outline: `3px solid ${pulse ? t.text.danger : t.fill.dangerSubtle}`, outlineOffset: 3 } : {};
}
function Tag({ children }: { children: ReactNode }) {
  const t = useGrokTheme();
  return <div style={{ fontSize: 10, letterSpacing: "0.08em", color: t.text.tertiary, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
}

/* ---------- A. trading card ---------- */
function TradingCard({ c, side, pulse }: { c: Customer; side: "front" | "back"; pulse: boolean }) {
  const t = useGrokTheme();
  const b = band(c.risk);
  const col = bandColor(t, b);
  const tc = tierColor(t, c.tier);
  const stars = TIER_STARS[c.tier];
  const frame: CSSProperties = { width: "100%", maxWidth: 320, boxSizing: "border-box", borderRadius: 18, border: `4px solid ${tc}`, padding: 5, background: t.bg.elevated, color: t.text.primary, ...outlineFor(t, b, pulse) };
  const inner: CSSProperties = { borderRadius: 13, border: `1px solid ${t.border.default}`, padding: 12, background: t.bg.base };
  const head = <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: t.text.secondary }}><span style={{ color: tc, fontSize: 12 }}>{"★".repeat(stars)}</span>{"☆".repeat(4 - stars)} {c.tier.toUpperCase()}</span>
    <span style={{ fontSize: 10, color: t.text.tertiary, fontFamily: t.font.mono }}>{side === "front" ? `#${c.cardNo} · FY27` : "SEASON STATS"}</span>
  </div>;
  if (side === "back") {
    const parts: [string, number, number][] = [["Ops events", c.comp.ops, 0.3], ["Case", c.comp.cs, 0.25], ["SLA", c.comp.sla, 0.2], ["Commercial", c.comp.com, 0.15], ["Sentiment", c.comp.sen, 0.1]];
    return <div style={frame}><div style={inner}>
      {head}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}><Monogram c={c} size={36} /><div><div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div><div style={{ fontSize: 11, color: t.text.secondary }}>{c.owners.exec}</div></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginTop: 12 }}>
        {([["ARR", fmtArr(c.arr)], ["Renewal", `${c.renewalDays}d`], ["Open opp", c.opp.amount], ["Stage", c.opp.stage], ["CSAT", c.csat.toFixed(1)], ["NPS", `${c.nps} (${c.npsDelta > 0 ? "+" : ""}${c.npsDelta})`], ["Cases", `${c.cases.open} open`], ["P1 / Esc", `${c.cases.p1} / ${c.cases.esc}`]] as [string, string][]).map(([k, v]: [string, string]) =>
          <div key={k}><div style={{ fontSize: 9.5, letterSpacing: "0.08em", color: t.text.tertiary, textTransform: "uppercase" }}>{k}</div><div style={{ fontSize: 14, fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{v}</div></div>)}
      </div>
      <div style={{ marginTop: 12 }}><Tag>Risk breakdown · {c.risk} pts</Tag>
        <div style={{ display: "grid", gap: 5 }}>{parts.map(([k, v, w]: [string, number, number]) => <StatBar key={k} label={k} value={v} display={(v * w).toFixed(1)} color={col} />)}</div>
      </div>
      <div style={{ marginTop: 12 }}><Tag>Risk trend, 8 weeks</Tag>
        <svg viewBox="0 0 280 40" width="100%" height="40" aria-label="risk trend"><line x1="0" x2="280" y1={40 - 0.8 * 40} y2={40 - 0.8 * 40} stroke={t.border.subtle} strokeDasharray="3 3" /><polyline points={sparkPts(c.trend, 280, 40, 3)} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" /></svg>
      </div>
      <div style={{ marginTop: 8 }}><Tag>Team</Tag><div style={{ fontSize: 11.5, lineHeight: 1.6, color: t.text.secondary }}>AE {c.owners.ae} · CSM {c.owners.csm}<br />Service owner {c.owners.so}</div></div>
      <div style={{ marginTop: 8, fontSize: 11, color: t.text.secondary }}>{c.entitlement.join(" · ")}</div>
    </div></div>;
  }
  return <div style={frame} aria-label={`${c.name} player card, risk ${c.risk} ${BAND_LABEL[b]}`}><div style={inner}>
    {head}
    <div style={{ marginTop: 8, borderRadius: 10, background: bandFill(t, b), border: `1px solid ${t.border.subtle}`, padding: "12px 12px 6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{c.initials}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: t.text.secondary }}>RISK</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}><Glyph g={b} size={20} /><span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.risk}</span></div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{BAND_LABEL[b]}</div>
        </div>
      </div>
      <svg viewBox="0 0 280 40" width="100%" height="40" aria-label="risk trend"><polyline points={sparkPts(c.trend, 280, 40, 3)} fill="none" stroke={col} strokeWidth={2.2} strokeLinejoin="round" /></svg>
    </div>
    <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 8, background: t.fill.secondary }}>
      <div style={{ fontSize: 16, fontWeight: 750 }}>{c.name}</div>
      <div style={{ fontSize: 11, color: t.text.secondary }}>{c.segment} · {c.industry} · {c.region}</div>
    </div>
    <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
      <StatBar label="Health" value={c.health} display={`${c.health}`} color={healthColor(t, c.health)} />
      <StatBar label="Sentiment" value={(c.nps + 100) / 2} display={`${Math.round((c.nps + 100) / 2)}`} color={t.dataviz.categorical[0]} />
      <StatBar label="Adoption" value={c.adoption} display={`${c.adoption}`} color={t.dataviz.categorical[0]} />
      <StatBar label="SLA buffer" value={100 - c.top.slaPct} display={`${100 - c.top.slaPct}`} color={slaColor(t, c.top.slaPct)} />
      <StatBar label="Runway" value={Math.min(100, (c.renewalDays / 365) * 100)} display={`${c.renewalDays}d`} color={t.dataviz.categorical[0]} />
    </div>
    <div style={{ marginTop: 10, border: `1px solid ${t.border.default}`, borderRadius: 8, padding: "7px 9px" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
        <Chip g={priG(c.top.pri)}>{c.top.pri}</Chip><span style={{ fontFamily: t.font.mono, color: t.text.secondary }}>{c.top.num}</span>
        <span style={{ marginLeft: "auto", fontWeight: 700 }}>SLA {c.top.slaLeft}</span>
      </div>
      <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>{c.top.subject}</div>
    </div>
    {c.incidents.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>{c.incidents.map((i: Incident) => <Chip key={i.id} g={kindG(i.kind)}>{i.kind} · {i.age}</Chip>)}</div>}
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.border.subtle}`, fontSize: 11, color: t.text.secondary }}>
      <span style={{ fontWeight: 700, color: t.text.primary }}>{fmtArr(c.arr)} ARR</span><span>Renews in {c.renewalDays}d</span><span>AE {c.owners.ae.split(" ")[0]}</span>
    </div>
  </div></div>;
}

/* ---------- B. scoreboard ---------- */
function Scoreboard({ c, list, pulse, onPick }: { c: Customer; list: Customer[]; pulse: boolean; onPick: (id: string) => void }) {
  const t = useGrokTheme();
  const b = band(c.risk);
  const live = c.incidents.some((i: Incident) => i.kind === "SEV1" || i.kind === "SEV2");
  const cell: CSSProperties = { padding: "10px 14px", borderRight: `1px solid ${t.border.default}`, borderBottom: `1px solid ${t.border.default}`, display: "flex", flexDirection: "column", justifyContent: "center" };
  const small: CSSProperties = { fontSize: 9.5, letterSpacing: "0.12em", color: t.text.tertiary, textTransform: "uppercase" };
  const big: CSSProperties = { fontSize: 30, fontWeight: 800, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" };
  const sorted = [...list].sort((a: Customer, z: Customer) => z.risk - a.risk);
  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ border: `2px solid ${b === "critical" ? t.text.danger : t.border.strong}`, borderRadius: 12, overflow: "hidden", background: t.bg.elevated, color: t.text.primary }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ ...cell, flex: "2 1 220px", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12 }}>
          <Monogram c={c} size={46} />
          <div><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.01em" }}>{c.name.toUpperCase()}</div><div style={{ fontSize: 11, color: t.text.secondary }}>{c.tier} · {c.segment} · {c.region}</div></div>
        </div>
        <div style={{ ...cell, flex: "1 1 170px", flexDirection: "row", gap: 18, alignItems: "center" }}>
          <div><div style={small}>Health</div><div style={big}>{c.health}</div></div>
          <div style={{ width: 1, alignSelf: "stretch", background: t.border.default }} />
          <div><div style={small}>Risk</div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Glyph g={b} size={18} /><span style={big}>{c.risk}</span></div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em" }}>{BAND_LABEL[b]}</div></div>
        </div>
        <div style={{ ...cell, flex: "1 1 140px" }}><div style={small}>SLA clock · {c.top.pri}</div><div style={{ ...big, fontFamily: t.font.mono, fontSize: 26 }}>{c.top.slaLeft}</div><div style={{ fontSize: 10.5, color: t.text.secondary, fontFamily: t.font.mono }}>Case {c.top.num}</div></div>
        <div style={{ ...cell, flex: "1 1 110px" }}><div style={small}>Renewal</div><div style={{ ...big, fontSize: 24 }}>T-{c.renewalDays}d</div><div style={{ fontSize: 10.5, color: t.text.secondary }}>{fmtArr(c.arr)} ARR</div></div>
        {live && <div style={{ ...cell, flex: "0 0 auto", alignItems: "center", background: pulse ? t.fill.dangerSubtle : t.bg.elevated }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, letterSpacing: "0.14em", fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 9, background: t.text.danger, opacity: pulse ? 1 : 0.35 }} />LIVE</div><div style={{ fontSize: 10, color: t.text.secondary }}>ops event</div></div>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {([["CSAT", c.csat.toFixed(1)], ["NPS", `${c.nps} ${c.npsDelta < 0 ? "▼" : "▲"}${Math.abs(c.npsDelta)}`], ["Open cases", `${c.cases.open}`], ["Escalated", `${c.cases.esc}`], ["Uptime 30d", `${c.uptime}%`], ["Opp", `${c.opp.amount} ${c.opp.stage}`]] as [string, string][]).map(([k, v]: [string, string]) =>
          <div key={k} style={{ ...cell, flex: "1 1 96px", padding: "8px 12px" }}><div style={small}>{k}</div><div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</div></div>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", padding: "8px 14px", background: t.bg.subtle, fontSize: 12, fontFamily: t.font.mono }}>
        {c.incidents.length === 0 ? <span style={{ color: t.text.secondary }}>No active operational events · next update in 5 min</span> : c.incidents.map((i: Incident) =>
          <span key={i.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Glyph g={kindG(i.kind)} size={12} /><b>{i.id}</b> {i.kind} · {i.title} · {i.age} · {i.status}</span>)}
      </div>
    </div>
    <div>
      <Tag>Around the league · sorted by risk · select a row</Tag>
      <div style={{ border: `1px solid ${t.border.default}`, borderRadius: 10, overflow: "hidden" }}>
        {sorted.map((x: Customer, i: number) => {
          const xb = band(x.risk); const d = x.trend[7] - x.trend[6];
          return <div key={x.id} role="button" tabIndex={0} onClick={() => onPick(x.id)} onKeyDown={(e: { key: string }) => { if (e.key === "Enter") onPick(x.id); }}
            style={{ display: "grid", gridTemplateColumns: "22px minmax(0,1fr) auto auto auto", gap: 10, alignItems: "center", padding: "7px 12px", fontSize: 12.5, cursor: "pointer", borderTop: i ? `1px solid ${t.border.subtle}` : "none", background: x.id === c.id ? t.fill.hover : t.bg.base, color: t.text.primary }}>
            <span style={{ color: t.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <span style={{ fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</span>
            <span style={{ color: t.text.secondary, fontFamily: t.font.mono, fontSize: 11 }}>{x.top.pri} {x.top.slaLeft}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}><Glyph g={xb} size={13} />{x.risk}</span>
            <span style={{ fontSize: 11, color: t.text.secondary, minWidth: 30, textAlign: "right" }}>{d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "–"}</span>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

/* ---------- C. character sheet ---------- */
function CharacterSheet({ c, pulse }: { c: Customer; pulse: boolean }) {
  const t = useGrokTheme();
  const [plain, setPlain] = useState<boolean>(false);
  const b = band(c.risk);
  const L = (game: string, biz: string): string => (plain ? biz : game);
  const vital = (name: string, v: number, max: number, color: string, txt: string) => <div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{name}</span><span style={{ fontVariantNumeric: "tabular-nums", color: t.text.secondary }}>{txt}</span></div>
    <div role="meter" aria-valuenow={v} aria-valuemin={0} aria-valuemax={max} aria-label={name} style={{ height: 12, borderRadius: 4, background: t.fill.secondary, overflow: "hidden", border: `1px solid ${t.border.default}` }}>
      <div style={{ width: `${Math.max(2, (v / max) * 100)}%`, height: "100%", background: color, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 9px, ${t.bg.base} 9px 10px)` }} />
    </div>
  </div>;
  const effects = [...c.incidents].sort((a: Incident, z: Incident) => ["SEV1", "SEV2", "SEV3", "DEGRADED", "CHANGE"].indexOf(a.kind) - ["SEV1", "SEV2", "SEV3", "DEGRADED", "CHANGE"].indexOf(z.kind));
  return <div style={{ border: `2px solid ${tierColor(t, c.tier)}`, borderRadius: 14, padding: 14, background: t.bg.elevated, color: t.text.primary, ...outlineFor(t, b, pulse) }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <div style={{ position: "relative" }}><Monogram c={c} size={64} /><span style={{ position: "absolute", bottom: -6, right: -6, fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 6, background: t.fill.primary, color: t.text.onPrimary }}>{L("LV", "Tier")} {TIER_STARS[c.tier]}</span></div>
      <div style={{ flex: "1 1 180px" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{c.name}</div>
        <div style={{ fontSize: 11.5, color: t.text.secondary }}>{L("Class", "Segment")}: {c.segment} {c.industry} · {L("Realm", "Region")}: {c.region} · {c.tier}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}><Glyph g={b} size={20} /><span style={{ fontSize: 26 }}>{c.risk}</span><span style={{ fontSize: 10, letterSpacing: "0.1em" }}>{BAND_LABEL[b]}</span></div>
      <button onClick={() => setPlain(!plain)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, border: `1px solid ${t.border.strong}`, background: plain ? t.fill.secondary : t.bg.base, color: t.text.primary, cursor: "pointer" }}>{plain ? "Game labels" : "Plain labels"}</button>
    </div>
    <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
      {vital(L("HP", "Health"), c.health, 100, healthColor(t, c.health), `${c.health} / 100`)}
      {vital(L("SHIELD", "SLA buffer"), 100 - c.top.slaPct, 100, slaColor(t, c.top.slaPct), `${c.top.slaLeft} left on ${c.top.pri}`)}
      {vital(L("XP", "Renewal runway"), Math.min(365, c.renewalDays), 365, t.dataviz.categorical[0], `${c.renewalDays} days`)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 6, marginTop: 14 }}>
      {([["STR", "ARR", fmtArr(c.arr)], ["DEF", "Uptime 30d", `${c.uptime}%`], ["CHA", "NPS", `${c.nps}`], ["INT", "Adoption", `${c.adoption}%`], ["WIS", "CSAT", c.csat.toFixed(1)], ["LOAD", "Open cases", `${c.cases.open}`]] as [string, string, string][]).map(([g, biz, v]: [string, string, string]) =>
        <div key={g} style={{ border: `1px solid ${t.border.default}`, borderRadius: 8, padding: "6px 8px", textAlign: "center", background: t.bg.base }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: t.text.secondary }}>{plain ? biz.toUpperCase() : g}</div>
          <div style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{v}</div>
          {!plain && <div style={{ fontSize: 9.5, color: t.text.tertiary }}>{biz}</div>}
        </div>)}
    </div>
    <div style={{ marginTop: 14 }}><Tag>{L("Status effects", "Active operational events")}</Tag>
      {effects.length === 0 ? <div style={{ fontSize: 12, color: t.text.secondary }}>{L("No effects", "No active events")} on this customer's services</div> :
        <div style={{ display: "grid", gap: 6 }}>{effects.map((i: Incident) =>
          <div key={i.id} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 8, alignItems: "center", padding: "6px 8px", borderRadius: 8, border: `1px solid ${t.border.default}`, background: i.kind === "SEV1" ? t.fill.dangerSubtle : t.bg.base }}>
            <Glyph g={kindG(i.kind)} size={22} />
            <div style={{ fontSize: 12, lineHeight: 1.4 }}><b>{plain ? i.kind : EFFECT[i.kind][0]}</b> <span style={{ color: t.text.secondary, fontFamily: t.font.mono, fontSize: 11 }}>{i.id} · {i.kind} · {i.age}</span><br /><span style={{ color: t.text.secondary }}>{i.title}. {EFFECT[i.kind][1]}</span></div>
          </div>)}</div>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
      <div><Tag>{L("Active quest", "Top case")}</Tag>
        <div style={{ fontSize: 12.5, lineHeight: 1.4 }}><Chip g={priG(c.top.pri)}>{c.top.pri} {c.top.num}</Chip><div style={{ marginTop: 4 }}>{c.top.subject}</div><div style={{ color: t.text.secondary, fontSize: 11.5 }}>{c.top.status} · {c.top.owner}</div></div>
      </div>
      <div><Tag>{L("Equipment", "Entitlements")}</Tag><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{c.entitlement.map((e: string) => <span key={e} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `1px solid ${t.border.default}` }}>{e}</span>)}</div>
        <div style={{ marginTop: 8 }}><Tag>{L("Party", "Owners")}</Tag><div style={{ fontSize: 11.5, color: t.text.secondary, lineHeight: 1.5 }}>AE {c.owners.ae} · CSM {c.owners.csm} · SO {c.owners.so}</div></div>
      </div>
    </div>
  </div>;
}

/* ---------- D. wallet stack ---------- */
function WalletStack({ list, sel, onPick, pulse }: { list: Customer[]; sel: string; onPick: (id: string) => void; pulse: boolean }) {
  const t = useGrokTheme();
  const sorted = [...list].sort((a: Customer, z: Customer) => z.risk - a.risk);
  const selIdx = sorted.findIndex((x: Customer) => x.id === sel);
  return <div style={{ maxWidth: 420, margin: "0 auto", padding: "6px 4px" }}>
    <div style={{ fontSize: 12, color: t.text.secondary, marginBottom: 10 }}>{sorted.filter((x: Customer) => band(x.risk) === "critical").length} critical, {sorted.filter((x: Customer) => band(x.risk) === "high").length} high, {sorted.filter((x: Customer) => band(x.risk) === "elevated" || band(x.risk) === "low").length} steady across {sorted.length} accounts</div>
    {sorted.map((x: Customer, i: number) => {
      const b = band(x.risk); const open = i === selIdx; const afterOpen = i === selIdx + 1;
      return <div key={x.id} role="button" tabIndex={0} aria-expanded={open} onClick={() => onPick(x.id)} onKeyDown={(e: { key: string }) => { if (e.key === "Enter") onPick(x.id); }}
        style={{ position: "relative", zIndex: i + 1, marginTop: i === 0 ? 0 : open || afterOpen ? 10 : -22, borderRadius: 16, padding: "14px 16px", cursor: "pointer", background: open ? t.bg.elevated : t.bg.subtle, border: `1px solid ${b === "critical" ? t.text.danger : t.border.strong}`, color: t.text.primary, ...(b === "critical" ? outlineFor(t, b, pulse) : {}) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{x.name}</div><div style={{ fontSize: 11, color: t.text.secondary }}>{x.tier} · {fmtArr(x.arr)}</div></div>
          <Glyph g={b} size={16} /><span style={{ fontSize: 24, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>{x.risk}</span>
        </div>
        {open && <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, lineHeight: 1.45 }}>{x.why}</div>
          <div style={{ border: `1px solid ${t.border.default}`, borderRadius: 10, padding: 10, background: t.bg.base }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 11.5 }}><Chip g={priG(x.top.pri)}>{x.top.pri}</Chip><span style={{ fontFamily: t.font.mono }}>{x.top.num}</span><span style={{ marginLeft: "auto", fontWeight: 700 }}>{x.top.slaLeft} to SLA</span></div>
            <div style={{ fontSize: 12.5, margin: "6px 0" }}>{x.top.subject}</div>
            <Bar value={x.top.slaPct} color={slaColor(t, x.top.slaPct)} height={5} />
          </div>
          {x.incidents.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{x.incidents.map((n: Incident) => <Chip key={n.id} g={kindG(n.kind)}>{n.kind} {n.title}</Chip>)}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 6, fontSize: 11.5, color: t.text.secondary }}><span>Renews {x.renewalDate}</span><span>AE {x.owners.ae}</span></div>
          <div style={{ fontSize: 12, padding: "7px 10px", borderRadius: 8, background: t.fill.secondary }}>Next: {x.ask}</div>
        </div>}
      </div>;
    })}
  </div>;
}

/* ---------- E. roster ---------- */
function Roster({ tiles, sel, onPick, pulse }: { tiles: Tile[]; sel: string; onPick: (id: string) => void; pulse: boolean }) {
  const t = useGrokTheme();
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
    {tiles.map((x: Tile) => {
      const b = band(x.risk); const s = x.id === sel; const real = CUSTOMERS.some((c: Customer) => c.id === x.id);
      return <div key={x.id} role={real ? "button" : undefined} tabIndex={real ? 0 : undefined} onClick={() => { if (real) onPick(x.id); }} onKeyDown={(e: { key: string }) => { if (real && e.key === "Enter") onPick(x.id); }}
        style={{ borderRadius: 12, padding: 10, background: bandFill(t, b), border: `${s ? 2 : 1}px solid ${s ? t.text.primary : bandColor(t, b)}`, cursor: real ? "pointer" : "default", color: t.text.primary, ...(b === "critical" ? outlineFor(t, b, pulse) : {}) }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, minHeight: 32 }}>{x.name}</div>
        <div style={{ fontSize: 10.5, color: t.text.secondary }}>{fmtArr(x.arr)} · {x.tier}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0" }}><Glyph g={b} size={16} /><span style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{x.risk}</span><span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em" }}>{BAND_LABEL[b]}</span></div>
        <Bar value={x.health} color={healthColor(t, x.health)} height={4} />
        <div style={{ fontSize: 10.5, color: t.text.secondary, marginTop: 5, minHeight: 14 }}>Health {x.health}{x.ev ? ` · ${x.ev}` : ""}</div>
      </div>;
    })}
  </div>;
}

/* ---------- audience card ---------- */
function AudienceCard({ c, aud, pulse }: { c: Customer; aud: string; pulse: boolean }) {
  const t = useGrokTheme();
  const b = band(c.risk);
  const active = c.incidents.filter((i: Incident) => i.kind !== "CHANGE");
  const changes = c.incidents.filter((i: Incident) => i.kind === "CHANGE");
  let body: ReactNode = null;
  if (aud === "exec") body = <Fragment>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "4px 0 10px" }}>
      {([["ARR", fmtArr(c.arr)], ["Renews in", `${c.renewalDays}d`], ["Health", `${c.health}`]] as [string, string][]).map(([k, v]: [string, string]) => <div key={k} style={{ background: t.bg.subtle, borderRadius: 10, padding: "8px 10px" }}><div style={{ fontSize: 10, color: t.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div></div>)}
    </div>
    <KV k="Why" v={c.why} /><KV k="Ask" v={c.ask} />
  </Fragment>;
  else if (aud === "account") body = <Fragment>
    <KV k="Opportunity" v={`${c.opp.name} · ${c.opp.amount} · ${c.opp.stage} · closes ${c.opp.close}`} />
    <KV k="Renewal" v={`${c.renewalDate} (${c.renewalDays} days)`} />
    <KV k="Sentiment" v={`CSAT ${c.csat.toFixed(1)} · NPS ${c.nps} (${c.npsDelta > 0 ? "+" : ""}${c.npsDelta} in 90d)`} />
    <KV k="Cases" v={`${c.cases.open} open · ${c.cases.p1} P1 · ${c.cases.esc} escalated`} />
    <KV k="Top case" v={<span><Chip g={priG(c.top.pri)}>{c.top.pri}</Chip> {c.top.num} {c.top.subject}</span>} />
    <KV k="Sponsor" v={c.owners.exec} /><KV k="Owners" v={`AE ${c.owners.ae} · CSM ${c.owners.csm}`} />
    <KV k="Next best action" v={c.ask} />
  </Fragment>;
  else if (aud === "service") body = <Fragment>
    {active.length === 0 ? <KV k="Events" v="No active incidents on services this customer uses" /> : active.map((i: Incident) => <KV key={i.id} k={i.id} v={<span><Chip g={kindG(i.kind)}>{i.kind}</Chip> {i.title} · {i.service} · {i.age} · {i.status}</span>} />)}
    <KV k="Blast radius" v={c.blast} />
    <KV k="SLA exposure" v={`Case ${c.top.num} (${c.top.pri}) · ${c.top.slaLeft} to breach · ${c.top.slaPct}% elapsed`} />
    {changes.map((i: Incident) => <KV key={i.id} k="Change window" v={<span><Chip g="change">{i.id}</Chip> {i.title} · {i.age}</span>} />)}
    <KV k="Service owner" v={c.owners.so} />
  </Fragment>;
  else if (aud === "leaders") body = <Fragment>
    <KV k="Escalations" v={`${c.cases.esc} escalated case${c.cases.esc === 1 ? "" : "s"} · sponsor ${c.owners.exec}`} />
    <KV k="Blast radius" v={c.blast} />
    <KV k="Decision needed" v={c.decision} />
    <KV k="Accountable" v={`AE ${c.owners.ae} · CSM ${c.owners.csm} · SO ${c.owners.so}`} />
    <KV k="Risk trend" v={<span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "100%" }}><svg viewBox="0 0 160 26" width="60%" height="26"><polyline points={sparkPts(c.trend, 160, 26, 2)} fill="none" stroke={bandColor(t, b)} strokeWidth={2} /></svg>{c.trend[0]} → {c.risk} in 8 weeks</span>} />
  </Fragment>;
  else if (aud === "eng") body = <Fragment>
    {active.length === 0 ? <KV k="Incidents" v="None linked" /> : active.map((i: Incident) => <KV key={i.id} k={i.id} v={<span><Chip g={kindG(i.kind)}>{i.kind}</Chip> {i.title} · {i.service} · via {i.source} · {i.age} · {i.status}</span>} />)}
    <KV k="Tenants" v={<span style={{ fontFamily: t.font.mono }}>{c.tenants}</span>} />
    <KV k="Linked case" v={`${c.top.num} (${c.top.pri}) · ${c.top.owner}`} />
    <KV k="Runbook" v={c.runbook} /><KV k="Recent change" v={c.deploy} />
    <KV k="Hidden" v="ARR, opportunity and renewal are not sent to this view" />
  </Fragment>;
  else body = <Fragment>
    <div style={{ border: `1px solid ${t.border.default}`, borderRadius: 10, padding: 10, margin: "4px 0 8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12 }}><Chip g={priG(c.top.pri)}>{c.top.pri} {c.top.num}</Chip><span>{c.top.status}</span><span style={{ marginLeft: "auto", fontWeight: 800 }}>{c.top.slaLeft} to SLA</span></div>
      <div style={{ fontSize: 13, margin: "6px 0" }}>{c.top.subject}</div>
      <Bar value={c.top.slaPct} color={slaColor(t, c.top.slaPct)} height={7} />
      <div style={{ fontSize: 10.5, color: t.text.secondary, marginTop: 3 }}>{c.top.slaPct}% of SLA elapsed · amber at 75%, red at 90%</div>
    </div>
    {active.length > 0 && <div style={{ fontSize: 12, padding: "7px 10px", borderRadius: 8, background: t.fill.warningSubtle, marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}><Glyph g={kindG(active[0].kind)} size={14} />Known incident {active[0].id}: use macro M-114 and link the case</div>}
    <KV k="Entitlement" v={c.entitlement.join(" · ")} />
    <KV k="Last contact" v={c.top.lastContact} />
    <KV k="Next action" v={c.top.next} />
    <KV k="Latest" v={c.timeline.slice(-2).map((x: TL) => `${x.t} ${x.who}: ${x.what}`).join(" / ")} />
  </Fragment>;
  return <div style={{ border: `1px solid ${b === "critical" ? t.text.danger : t.border.strong}`, borderRadius: 16, padding: 14, background: t.bg.elevated, color: t.text.primary, ...outlineFor(t, b, pulse) }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
      <Monogram c={c} size={38} />
      <div style={{ flex: "1 1 140px" }}><div style={{ fontWeight: 750, fontSize: 15 }}>{c.name}</div><div style={{ fontSize: 11, color: t.text.secondary }}>{c.tier} · {c.segment} · {c.region}</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Glyph g={b} size={18} /><span style={{ fontSize: 24, fontWeight: 800 }}>{c.risk}</span><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{BAND_LABEL[b]}</span></div>
    </div>
    {body}
  </div>;
}

function Timeline({ items }: { items: TL[] }) {
  const t = useGrokTheme();
  const col = (who: string): string => who === "Customer" ? t.dataviz.categorical[0] : who.startsWith("Support") || who === "CSM" ? t.dataviz.categorical[1] : who === "Change" || who === "Status page" ? t.dataviz.other : t.dataviz.categorical[2];
  return <div style={{ position: "relative", paddingLeft: 22 }}>
    <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 2, background: t.border.default }} />
    {items.map((x: TL, i: number) => <div key={i} style={{ position: "relative", padding: "6px 0" }}>
      <span style={{ position: "absolute", left: -21, top: 10, width: 12, height: 12, borderRadius: 12, background: col(x.who), border: `2px solid ${t.bg.base}` }} />
      <div style={{ fontSize: 12, color: t.text.tertiary, fontFamily: t.font.mono }}>{x.t} · {x.who}</div>
      <div style={{ fontSize: 13.5, color: t.text.primary }}>{x.what}</div>
    </div>)}
  </div>;
}

function BandDemo({ pulse }: { pulse: boolean }) {
  const t = useGrokTheme();
  const rows: [Band, string, string][] = [["critical", "86", "Pulsing 3px outline"], ["high", "65", "Solid 2px border"], ["elevated", "48", "1px tinted border"], ["low", "15", "Default border"]];
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, padding: 4 }}>
    {rows.map(([b, n, d]: [Band, string, string]) => <div key={b} style={{ borderRadius: 12, padding: 12, background: bandFill(t, b), border: `${b === "high" ? 2 : 1}px solid ${b === "low" ? t.border.default : bandColor(t, b)}`, color: t.text.primary, ...outlineFor(t, b, pulse) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Glyph g={b} size={22} /><span style={{ fontSize: 26, fontWeight: 800 }}>{n}</span></div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", marginTop: 4 }}>{BAND_LABEL[b]}</div>
      <div style={{ fontSize: 11.5, color: t.text.secondary }}>{d}</div>
    </div>)}
  </div>;
}

function CodeBlock({ code }: { code: string }) {
  const t = useGrokTheme();
  const ref = useRef<HTMLPreElement>(null);
  const [msg, setMsg] = useState<string>("Copy prompt");
  const selectAll = (): void => { const el = ref.current; if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); if (s) { s.removeAllRanges(); s.addRange(r); } };
  const copy = (): void => {
    const fallback = (): void => { selectAll(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; } setMsg(ok ? "Copied" : "Selected: press Ctrl/Cmd+C"); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(() => setMsg("Copied"), fallback); } else { fallback(); } } catch (e) { fallback(); }
    window.setTimeout(() => setMsg("Copy prompt"), 3000);
  };
  return <div style={{ border: `1px solid ${t.border.default}`, borderRadius: 12, overflow: "hidden" }}>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${t.border.default}`, background: t.bg.subtle }}>
      <span style={{ fontSize: 12, color: t.text.secondary }}>{code.split("\n").length} lines · {code.length.toLocaleString()} characters</span>
      <button onClick={copy} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${t.border.strong}`, background: t.fill.primary, color: t.text.onPrimary, cursor: "pointer" }}>{msg}</button>
    </div>
    <pre ref={ref} style={{ margin: 0, padding: 16, maxHeight: 440, overflow: "auto", fontFamily: t.font.mono, fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word", color: t.text.primary, background: t.bg.base }}>{code}</pre>
  </div>;
}

function usePulse(): boolean {
  const [on, setOn] = useState<boolean>(true);
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { reduce = false; }
    if (reduce) return;
    const id = window.setInterval(() => setOn((v: boolean) => !v), 750);
    return () => window.clearInterval(id);
  }, []);
  return on;
}
export { CUSTOMERS, EXTRA, tileOf, band, BAND_LABEL, TradingCard, Scoreboard, CharacterSheet, WalletStack, Roster, AudienceCard, BandDemo, Timeline, usePulse, Tag, fmtArr };
export type { Customer, Tile };
