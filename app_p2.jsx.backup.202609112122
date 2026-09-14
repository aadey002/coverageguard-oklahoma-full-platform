// PART1_PENDING (after Coverage Intelligence P2-009 QC and architect approval):
// 1. buildPanel() \u2014 add dualEligible flag to patient data (Medicare + Medicaid both active)
// 2. Clinician Exemption Review \u2014 dual eligible = auto-exempt, no attestation needed, distinct badge/label
// 3. Work engagement queue \u2014 exclude dual eligible patients entirely (already exempt)
// 4. Patient Queue checklist \u2014 "Medicare primary \u00b7 Medicaid secondary" note in coverage section
// 5. PART3_BRIDGE \u2014 Coverage Intel dual_eligible \u2192 CertCore auto-confirms exemption when Full platform licensed
// Do NOT touch CertCore until Coverage Intelligence P2-009 is QC\u2019d and approved by the architect.
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, Inbox, MessageSquare, Boxes, LineChart as LineIcon,
  ShieldCheck, Play, Search, ChevronRight, X, Phone as PhoneIcon, AlertTriangle,
  CheckCircle2, Clock, Activity, Stethoscope, Pill, DollarSign, FileText, Send,
  Cpu, Radio, Lock, ArrowRight, Bell, Globe, Zap, ClipboardCheck, UserPlus, Circle, Flag,
  Download, Upload, RotateCcw, TrendingUp, ArrowLeft, Database,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";

/* ============================================================
   CoverageGuard IQ — FQHC Medicaid Coverage Intelligence
   Operations Command Center (demo prototype, synthetic data)
   ============================================================ */

const T = {
  ink: "#14392A", panel: "#173B2B", panel2: "#1F4A36", line: "#2A4D3B",
  canvas: "#F3F5F2", surface: "#FFFFFF", surface2: "#F7F8F4",
  border: "#E3E6DF", borderHi: "#D0D5CB",
  text: "#16241C", textMid: "#586A5E", textLo: "#8A958B", textInv: "#EAF2EC", textInvLo: "#A7C0B2",
  teal: "#1F8A53", tealD: "#15663D", indigo: "#C8A02E", amber: "#D4A017",
  green: "#34A56A", orange: "#CC7A22", red: "#C8472E",
  low: "#34A56A", moderate: "#D4A017", high: "#CC7A22", critical: "#C8472E",
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace',
};
const TIER_COLOR = { low: T.low, moderate: T.moderate, high: T.high, critical: T.critical };

/* ---------- helpers ---------- */
let _id = 0;
const uid = (p) => `${p}_${(++_id).toString(36)}`;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const pad = (n) => (n < 10 ? "0" + n : "" + n);
function mulberry32(seed) { return function () { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const nowClock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const fmt = (n) => n.toLocaleString("en-US");
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

/* ---------- risk model (the documented weighted rule model) ---------- */
// ── TRADE SECRET SEAM [B] · coverage-risk factor weights · SYNTHETIC placeholders. Production: load tuned weights server-side (config/DB/secrets); never compile real weights into a client bundle. Held back per patent §27.
const _RF = [
  { key: "renewal", label: "Days until renewal", w: 0.22 },
  { key: "lapse", label: "Prior coverage lapse", w: 0.18 },
  { key: "checks", label: "Failed eligibility checks", w: 0.13 },
  { key: "outreach", label: "Failed outreach attempts", w: 0.09 },
  { key: "address", label: "Returned mail / bad address", w: 0.09 },
  { key: "clinical", label: "Clinical complexity", w: 0.10 },
  { key: "sdoh", label: "Social drivers (SDOH)", w: 0.10 },
  { key: "language", label: "Language barrier", w: 0.05 },
  { key: "appts", label: "Missed appointments", w: 0.04 },
];
function _classifyRisk(score) { return score >= 75 ? "critical" : score >= 55 ? "high" : score >= 30 ? "moderate" : "low"; }
function scorePatient(f) {
  // ── TRADE SECRET SEAM [B] · factor normalization curves/divisors · SYNTHETIC. Tuned curves held back — server-side in production.
  const factors = {
    renewal: clamp(1 - f.renewalDays / 120),
    lapse: f.priorLapse,
    checks: clamp(f.failedChecks / 3),
    outreach: clamp(f.failedOutreach / 4),
    address: f.badAddress ? 1 : 0,
    clinical: f.clinical,
    sdoh: f.sdoh || 0,
    language: f.language ? 1 : 0,
    appts: clamp(f.missedAppts / 3),
  };
  let score = 0; const contrib = [];
  for (const { key, label, w } of _RF) { const c = w * factors[key]; score += c; contrib.push({ key, label, c, pct: Math.round(factors[key] * 100), weight: w }); }
  score = Math.round(score * 100);
  const drivers = contrib.filter((c) => c.c > 0.01).sort((a, b) => b.c - a.c).slice(0, 3);
  return { score, tier: _classifyRisk(score), drivers };
}

const FIRST = ["Maria", "James", "Aisha", "Robert", "Daniela", "Marcus", "Linh", "Sofia", "Andre", "Keisha", "Hector", "Grace", "Tariq", "Nadia", "Devon", "Rosa", "Samuel", "Imani", "Carlos", "Yuki", "Felix", "Tanya", "Omar", "Priya", "Leon", "Bianca", "Mateo", "Renee", "Darnell", "Ana"];
const LAST = ["Alvarez", "Johnson", "Okafor", "Nguyen", "Patel", "Williams", "Garcia", "Brooks", "Reyes", "Coleman", "Mensah", "Tran", "Diaz", "Foster", "Hassan", "Ramirez", "Bell", "Santos", "Webb", "Price", "Ortiz", "Hayes", "Khan", "Cole", "Vega", "Boyd", "Lopez", "Flynn", "Cruz", "Park"];
const LANGS = [["en", "English"], ["en", "English"], ["en", "English"], ["es", "Spanish"], ["es", "Spanish"], ["vi", "Vietnamese"], ["fr", "French"]];
const CLINICAL = ["Diabetes", "Hypertension", "HIV", "Pregnancy", "Behavioral health", "Asthma"];
const ACTION = { critical: "Call today — escalate", high: "Send secure intake link", moderate: "Schedule renewal reminder", low: "Monitor — no action" };

// SDOH (PRAPARE-style) screening — internal, dated source feeding work-req + risk
// ── TRADE SECRET SEAM [B] · SDOH employment-burden weights · SYNTHETIC. Production tuned values live server-side.
const SDOH_EMP = [
  { key: "employed_ft", label: "Employed full-time", burden: 0, wr: "corroborates" },
  { key: "multiple_jobs", label: "Multiple jobs", burden: 0, wr: "corroborates" },
  { key: "employed_pt", label: "Employed part-time", burden: 0.4, wr: "partial" },
  { key: "self_employed", label: "Self-employed / gig", burden: 0.4, wr: "partial" },
  { key: "unemployed", label: "Unemployed", burden: 1, wr: "exposed" },
  { key: "zero_income", label: "No income reported", burden: 1, wr: "exposed" },
];
const SDOH_DOMAINS = {
  housing: [["stable", "Stable housing", 0], ["at_risk", "Housing at risk", 0.5], ["unstable", "Unstable / homeless", 1]],
  food: [["secure", "Food secure", 0], ["insecure", "Food insecure", 1]],
  transportation: [["reliable", "Reliable transport", 0], ["barrier", "Transportation barrier", 1]],
  financial: [["none", "No financial strain", 0], ["some", "Some financial strain", 0.5], ["high", "High financial strain", 1]],
};
// ── TRADE SECRET SEAM [B] · SDOH recency-decay windows (6/18 mo) + weights (1.0/0.5/0.15) · SYNTHETIC. Exact decay curve is held back — keep server-side.
const sdohRecency = (m) => (m == null || isNaN(m)) ? { w: 0, status: "unknown" } : m <= 6 ? { w: 1, status: "current" } : m <= 18 ? { w: 0.5, status: "stale" } : { w: 0.15, status: "expired" };
function makeSDOH(rng) {
  const emp = pick(rng, SDOH_EMP);
  const dom = {};
  for (const k of Object.keys(SDOH_DOMAINS)) { const r = rng(); const o = SDOH_DOMAINS[k]; dom[k] = r < 0.62 ? o[0] : r < 0.86 ? o[Math.min(1, o.length - 1)] : o[o.length - 1]; }
  const monthsAgo = 1 + Math.floor(rng() * 26);
  const rec = sdohRecency(monthsAgo);
  const raw = (emp.burden + dom.housing[2] + dom.food[2] + dom.transportation[2] + dom.financial[2]) / 5;
  const rd = new Date(Date.now() - monthsAgo * 30.4 * 86400000);
  const recordedDate = pad(rd.getMonth() + 1) + "/" + pad(rd.getDate()) + "/" + rd.getFullYear();
  return { emp, housing: dom.housing, food: dom.food, transportation: dom.transportation, financial: dom.financial, monthsAgo, recencyMonths: monthsAgo, recordedDate, recencyW: rec.w, recencyStatus: rec.status, burden: clamp(raw * rec.w) };
}

// H.R. 1 / Oklahoma work-requirement constants
const WR_STATUS = {
  exempt: { label: "Exempt", c: "#6B7A70" },
  compliant: { label: "Compliant", c: "#34A56A" },
  unverified: { label: "Needs verification", c: "#D4A017" },
  at_risk: { label: "At risk", c: "#C8472E" },
};
const MHC = {
  checkin: "marylandhealthconnection.gov/checkin",
  workReqHours: 80, workReqIncome: 580,   // federal minimum wage x 80 hrs — federal wage is the exclusive baseline
  // VERIFIED against primary sources
  citation: "CMS-2454-IFC \u00b7 91 FR 33348 \u00b7 issued June 1, published June 3, 2026",
  effectiveDate: "July 31, 2026",         // IFC effective date; comment deadline the same day
  notifyDeadline: "August 31, 2026",      // Congress directed States to notify members by this date
  goLive: "January 1, 2027",              // State implementation deadline
  litigation: "26-state coalition \u00b7 D. Mass. \u00b7 filed June 29, 2026 \u00b7 preliminary-injunction hearing July 28, 2026",
  // PENDING CONFIRMATION — not yet verified against the rule text; confirm with counsel / MDH
  attestationSunset: "January 1, 2028",
  frailtyReverifyMonths: 12,
  pendingNote: "pending confirmation",
};

/* ── White-label config ── */
const CFG = {
  brand: "CoverageGuard IQ",
  state: "Oklahoma",
  product: "Coverage Intelligence",
  startingTier: 2,
  startingView: "command",
};

/* ── Security: Session logger ───────────────────────────────────────── */
const SESSION_ID = CFG.state + "_" + CFG.product.replace(/ /g, "") + "_" + Date.now();
const _SB_URL = "https://ffwkhwqyodellvkobdfj.supabase.co";
const _SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2tod3F5b2RlbGx2a29iZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDY0MDQsImV4cCI6MjEwMzMyMjQwNH0.NNpCtLFF5bU1zVxEgqM7fS9UNmoTemn-Xy9-3EHnRNY";

const logEvent = function(type, detail) {
  try {
    var d = detail || {};
    var key = "cg_log_" + SESSION_ID;
    var entry = Object.assign({
      ts: new Date().toISOString(),
      org: CFG.state,
      product: CFG.product,
      session: SESSION_ID,
      type: type,
    }, d);
    var log = JSON.parse(sessionStorage.getItem(key) || "[]");
    log.push(entry);
    sessionStorage.setItem(key, JSON.stringify(log));

    fetch(_SB_URL + "/rest/v1/session_events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": _SB_KEY,
        "Authorization": "Bearer " + _SB_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        session_id: SESSION_ID,
        org: CFG.state,
        product: CFG.product,
        event_type: type,
        detail: d
      })
    }).catch(function() {});
  } catch(e) {}
};

const exportLog = function() {
  var key = "cg_log_" + SESSION_ID;
  var log = JSON.parse(sessionStorage.getItem(key) || "[]");
  var lines = [
    "CoverageGuard IQ \u00b7 Session Audit Log",
    "Org: " + CFG.state + " \u00b7 Product: " + CFG.product,
    "Session: " + SESSION_ID,
    "Exported: " + new Date().toISOString(),
    "\u2500".repeat(60),
  ];
  log.forEach(function(e) {
    var extra = {};
    Object.keys(e).forEach(function(k) {
      if (["ts","org","product","session","type"].indexOf(k) === -1) extra[k] = e[k];
    });
    lines.push(e.ts + "  " + (e.type + "                    ").slice(0, 20) + "  " + JSON.stringify(extra));
  });
  var text = lines.join("\n");
  navigator.clipboard.writeText(text)
    .then(function() { alert("Session log copied \u2014 paste into email to send to Dr. Tee"); })
    .catch(function() {
      var el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand("copy");
      document.body.removeChild(el);
      alert("Session log copied");
    });
};

const WR_ACTIVITIES = [
  { key: "work", label: "Work — paid, self-employed, in-kind, or unpaid", cite: "\u00a7 435.552(a)(1)", docs: ["Recent pay stubs", "Employer verification letter", "W-2 / 1099", "State wage record", "Self-attestation of unpaid work"] },
  { key: "community", label: "Community service (structured program)", cite: "\u00a7 435.552(a)(2)", docs: ["Program letter with dates and hours", "Signed hours log"] },
  { key: "workprog", label: "Government work or training program", cite: "\u00a7 435.552(a)(3)", docs: ["Program enrollment letter", "Attendance record"] },
  { key: "education", label: "Education — at least half time", cite: "\u00a7 435.552(a)(4)", docs: ["Enrollment verification", "Clearinghouse record", "Transcript"], noHours: true },
  { key: "income", label: "Income proxy — $580/mo MAGI household income", cite: "\u00a7 435.552(a)(6)", docs: ["Payroll data (ex parte)", "Recent pay stubs"], noHours: true },
];
// Specified excluded individuals (\u00a7 435.554) — never subject to the requirement; identified FIRST.
// tier: A = health-center data \u00b7 B = state ex parte data \u00b7 C = patient-reported + documentation
const WR_EXEMPTIONS = [
  { label: "Pregnant or postpartum (12 months)", cite: "\u00a7 435.554(c)(10)", tier: "A", note: "State must accept attestation absent inconsistent information." },
  { label: "Medically frail or special medical needs", cite: "\u00a7 435.554(c)(5)", tier: "A", note: "TWO elements: a qualifying condition AND significant impairment of the ability to comply." },
  { label: "Active drug or alcohol treatment program", cite: "\u00a7 435.554(c)(8)", tier: "A", note: "Verified from adjudicated claims / encounter data first." },
  { label: "Parent, guardian, caretaker relative, or family caregiver", cite: "\u00a7 435.554(c)(3)", tier: "C", note: "Child \u2264 13, or a disabled individual of any age. Informal caregiving often has no documentation \u2014 states must not disenroll for that alone." },
  { label: "Veteran with a 100% total disability rating", cite: "\u00a7 435.554(c)(4)", tier: "C", note: "Service-connected, rated total, including Individual Unemployability." },
  { label: "Former foster youth under 26", cite: "\u00a7 435.554(c)(1)", tier: "B", note: "Verified ex parte until age 26." },
  { label: "American Indian / Alaska Native", cite: "\u00a7 435.554(c)(2)", tier: "B", note: "Permanent exclusion once identified \u2014 never re-verified." },
  { label: "Compliant with TANF work requirements", cite: "\u00a7 435.554(c)(6)", tier: "B", note: "CMS: states should NOT require reporting from the individual." },
  { label: "SNAP household, not exempt from SNAP work rules", cite: "\u00a7 435.554(c)(7)", tier: "B", note: "State verifies receipt + non-exempt status, not active completion." },
  { label: "Inmate of a public institution", cite: "\u00a7 435.554(c)(9)", tier: "B", note: "State corrections data \u2014 ex parte." },
];
const WR_TIERS = {
  A: { label: "Health-center data", how: "Visible in our EMR / claims — we can surface it" },
  B: { label: "State ex parte data", how: "State verifies from its own systems — we should not duplicate" },
  C: { label: "Patient-reported + documentation", how: "Must be asked and documented — the screening gap" },
};
// Five statutory medical-frailty categories (\u00a7 435.554(c)(5)(i))
const FRAILTY_CATEGORIES = [
  { key: "blind_disabled", label: "Blind or disabled", detail: "SSA \u00a7 1614 (SSI standard)." },
  { key: "sud", label: "Substance use disorder", detail: "Excludes individuals in stable recovery (5+ years)." },
  { key: "mental", label: "Disabling mental disorder", detail: "CMS declined to define; DSM-5 / ICD-10 offered as resources." },
  { key: "pidd", label: "Physical, intellectual, or developmental disability", detail: "Must impair one or more ADLs. IADLs are expressly excluded." },
  { key: "serious", label: "Serious or complex medical condition", detail: "Life-threatening, seriously disabling, or requiring multi-specialty coordination." },
];
const ADLS = ["Bathing", "Dressing", "Toileting", "Eating", "Transferring", "Walking", "Self-care"];
const IMPAIRMENT = {
  not_assessed: { label: "Impairment not assessed", c: "#6b7a70", note: "Condition found. The second element still needs a clinician." },
  needs_visit: { label: "Needs a visit to assess", c: "#D4A017", note: "No recent functional assessment on file." },
  assessed_impairs: { label: "Clinician: significantly impairs", c: "#34A56A", note: "Both elements met \u2014 attestation can be prepared." },
  assessed_no_impair: { label: "Clinician: does not significantly impair", c: "#C8472E", note: "Condition present but does not meet the standard." },
};
// EMR-derived PROBABLE work-requirement exemptions — hypotheses for clinician review, never auto-applied.
// Qualifying code set is a configurable rules table validated by compliance + clinical (medically frail per 42 CFR 440.315).
const dFull = (daysAgo) => { const d = new Date(Date.now() - daysAgo * 86400000); return pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + d.getFullYear(); };
// Governed exemption RULES TABLE (data, not hardcoded logic) — every rule requires clinician confirmation.
// ── TRADE SECRET SEAM [C] · exemption code/keyword SET is a held-back category AND is rendered in the Rules Engine view. This demo table is ILLUSTRATIVE ONLY. Production: real ICD-10/keyword/NLP set lives server-side and must NOT appear on any client-facing screen.
const EXEMPTION_RULES = [
  { rule_id: "EXR-001", frailty_category: "serious", exemption_category: "Medically frail / serious condition", evidence_type: "structured_dx", code_system: "ICD-10", code_or_keyword: "B20", flag: "HIV", inclusion_logic: "code active on problem list", exclusion_logic: "exclude history-of / resolved", confidence_default: "review", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-002", frailty_category: "mental", exemption_category: "Medically frail / disabling mental disorder", evidence_type: "structured_dx", code_system: "ICD-10", code_or_keyword: "F20–F33", flag: "Behavioral health", inclusion_logic: "serious mental illness code active", exclusion_logic: "exclude resolved / in remission", confidence_default: "review", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-003", frailty_category: null, exemption_category: "Primary caregiver — person with a disability", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "caregiver for disabled spouse", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation / other-subject", confidence_default: "low", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-004", frailty_category: null, exemption_category: "Primary caregiver — person with a disability", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "primary caregiver for parent on oxygen", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation / other-subject", confidence_default: "low", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-005", frailty_category: "serious", exemption_category: "Medically frail / serious condition", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "ESRD — on hemodialysis 3x/wk", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation", confidence_default: "review", sensitive: false, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-006", frailty_category: "serious", exemption_category: "Medically frail / serious condition", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "active chemotherapy", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation / history-of", confidence_default: "review", sensitive: false, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-007", frailty_category: "pidd", exemption_category: "Medically frail / serious condition", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "homebound, limited mobility", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation", confidence_default: "low", sensitive: false, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-008", frailty_category: "sud", exemption_category: "Medically frail / serious condition", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "enrolled in MAT / SUD treatment", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation / history-of", confidence_default: "review", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
  { rule_id: "EXR-009", frailty_category: null, exemption_category: "Disabled veteran", evidence_type: "note_nlp", code_system: "note", code_or_keyword: "VA service-connected disability", inclusion_logic: "keyword present in note", exclusion_logic: "exclude on negation", confidence_default: "review", sensitive: true, requires_clinician_confirmation: true, approved_by: "Compliance + Clinical Lead", approved_date: "05/15/2026", active_flag: true, effective_date: "06/01/2026", retired_date: null },
];
// ── TRADE SECRET SEAM [C] · illustrative negation/context terms (also displayed). Production negation/NLP model lives server-side.
const NEGATION_TERMS = ["denies", "history of", "family history", "mother has", "father has", "spouse has", "resolved", "no longer", "ruled out", "not currently", "caregiver is someone else"];
const noteNegated = (text) => { const t = (text || "").toLowerCase(); return NEGATION_TERMS.some((n) => t.includes(n)); };
const SENSITIVE_CATS = ["HIV", "SUD", "behavioral", "mental", "pregnan", "disab", "veteran"];
const EXEMPTION_STATUS = {
  candidate_detected: { label: "Candidate detected", c: "#5B6CC9" },
  clinician_review_pending: { label: "Clinician review pending", c: "#D4A017" },
  clinician_confirmed: { label: "Clinician confirmed", c: "#34A56A" },
  clinician_rejected: { label: "Clinician rejected", c: "#C8472E" },
  insufficient_evidence: { label: "Insufficient evidence", c: "#6B7A70" },
  documentation_needed: { label: "Documentation needed", c: "#D98324" },
};
// Two-stage Medicaid Coverage Review. Stage 1 = population screening prompt; Stage 2 = evidence-based case status.
const REVIEW_STATUS = {
  not_due: { label: "Not due", c: "#8A958B", stage: 0 },
  review_due: { label: "Annual Coverage Review Due", c: "#D4A017", stage: 1 },
  renewal_ready: { label: "Renewal Ready", c: "#2E8B57", stage: 2 },
  documentation_requested: { label: "Documentation Requested", c: "#B5771A", stage: 2 },
  documentation_missing: { label: "Documentation Missing", c: "#C8472E", stage: 2 },
  staff_verification_required: { label: "Staff Verification Required", c: "#4457C7", stage: 2 },
  patient_assistance_requested: { label: "Patient Assistance Requested", c: "#6D4FD8", stage: 2 },
  submitted: { label: "Submitted", c: "#5A6472", stage: 2 },
  verified_resolved: { label: "Verified / Resolved", c: "#2E8B57", stage: 2 },
  patient_declined: { label: "Patient Declined", c: "#5A6472", stage: 2 },
};
const REVIEW_INPROGRESS = ["documentation_requested", "documentation_missing", "staff_verification_required", "patient_assistance_requested", "submitted"];
const REVIEW_RESOLVED = ["renewal_ready", "verified_resolved", "patient_declined"];
// The short review maps screening answers to a suggested Stage-2 status + a document checklist.
function suggestReview(chg, notice) {
  const checklist = [];
  if (chg.income) checklist.push("Recent paystub / income proof");
  if (chg.household) checklist.push("Household / dependents update");
  if (chg.address) checklist.push("Proof of address");
  let status;
  if (notice === "help") status = "patient_assistance_requested";
  else if (chg.income || chg.household || chg.address) status = "documentation_requested";
  else if (notice === "no") status = "staff_verification_required";
  else status = "renewal_ready";
  return { status, checklist };
}

/* ---------- Coverage-State Reconciliation Engine (the moat) ---------- */
const dOff = (days) => { const x = new Date(Date.now() + days * 86400000); return pad(x.getMonth() + 1) + "/" + pad(x.getDate()); };
const STATE_TONE = {
  "Active — High Confidence": T.green,
  "Active — Verification Needed": T.amber,
  "Inactive — High Confidence": T.red,
  "Inactive — Conflicting Evidence": T.orange,
  "Pending Renewal": T.amber,
  "MCO Attribution Changed": T.indigo,
  "Pharmacy Access Risk Only": T.orange,
  "Patient-Reported Active — Unverified": T.amber,
  "Rebilling Opportunity": T.green,
  "Critical Coverage Continuity Risk": T.red,
  "Unknown — Human Review Required": T.textMid,
  "Active Today — Renewal Due": T.amber,
  "Active Today — Renewal Upcoming": T.teal,
  "Pending Renewal — Immediate": T.orange,
  "Pending Renewal — Upcoming": T.amber,
  "Renewal Watch": T.indigo,
  "Possible Coverage Loss": T.red,
  "Outreach Barrier": T.orange,
  "Monitor Only — Outreach Suppressed": T.textMid,
};
const CONFLICT_TAXONOMY = [
  { code: "COV-001", pattern: "EMR active / 270 inactive", state: "Inactive — High Confidence", action: "Start renewal intake + route to eligibility", route: "eligibility" },
  { code: "COV-002", pattern: "EMR inactive / 270 active", state: "Active — Verification Needed", action: "Update EMR registration payer record", route: "eligibility" },
  { code: "COV-003", pattern: "270 active / 834 dropped", state: "MCO Attribution Changed", action: "Route to MCO / roster review", route: "care" },
  { code: "COV-004", pattern: "State active / pharmacy reject", state: "Pharmacy Access Risk Only", action: "Route to pharmacy payer-profile review", route: "pharmacy" },
  { code: "COV-005", pattern: "Pharmacy reject + 270 inactive + EMR active", state: "Inactive — High Confidence", action: "Renewal intake + eligibility & pharmacy rescue", route: "eligibility" },
  { code: "COV-006", pattern: "Patient says active / systems inactive", state: "Patient-Reported Active — Unverified", action: "Request proof of coverage", route: "intake" },
  { code: "COV-007", pattern: "RCM denial / 270 active on DOS", state: "Rebilling Opportunity", action: "Create rebilling task", route: "rcm" },
  { code: "COV-008", pattern: "Renewal due + no contact + high-risk meds", state: "Critical Coverage Continuity Risk", action: "Escalate to pharmacy + care management", route: "care" },
  { code: "COV-009", pattern: "CRISP current-month redet + Availity active", state: "Active Today — Renewal Due", action: "Start renewal intake now + verify jobs/income", route: "intake" },
  { code: "COV-010", pattern: "CRISP next-month redet + Availity active", state: "Active Today — Renewal Upcoming", action: "Renewal prep + contact verification", route: "intake" },
  { code: "COV-011", pattern: "CRISP redet due + Availity inactive", state: "Possible Coverage Loss", action: "Renewal intake + eligibility review", route: "eligibility" },
  { code: "COV-012", pattern: "CRISP redet due + pharmacy reject", state: "Critical Coverage Continuity Risk", action: "Escalate pharmacy rescue + eligibility", route: "pharmacy" },
  { code: "COV-013", pattern: "CRISP MCO differs from eCW MCO", state: "MCO Attribution Changed", action: "Route to MCO / roster review", route: "care" },
  { code: "COV-014", pattern: "CRISP patient + no valid phone", state: "Outreach Barrier", action: "Update contact info before outreach", route: "intake" },
  { code: "COV-015", pattern: "CRISP redet outside outreach window", state: "Monitor Only — Outreach Suppressed", action: "Monitor only — outreach suppressed", route: null },
  { code: "COV-016", pattern: "Patient on two Medicaid MCO rosters simultaneously", state: "State Enrollment Error", action: "Identify primary MCO \u00b7 call both plans \u00b7 notify State", route: "care" },
  { code: "COV-017", pattern: "Medicare + Medicaid both active", state: "Dual Eligible", action: "Bill Medicare primary \u00b7 work requirement exempt", route: "eligibility" },
];
const labelFor = (k) => (QUEUE_DEFS.find((d) => d.key === k) || {}).label || k;
const taxOf = (code) => CONFLICT_TAXONOMY.find((t) => t.code === code);
const COV_META = {
  "COV-001": { action: "Start renewal intake — route to eligibility navigator",         rev: 1240 },
  "COV-002": { action: "Update eCW registration payer record — verify with 271",        rev: 420  },
  "COV-003": { action: "Call MCO — confirm attribution change · update roster",          rev: 780  },
  "COV-004": { action: "Route to pharmacy — correct payer profile · protect 340B",      rev: 325  },
  "COV-005": { action: "Renewal intake + eligibility & pharmacy rescue — same visit",    rev: 1560 },
  "COV-006": { action: "Request proof of coverage — patient self-report unverified",     rev: 560  },
  "COV-007": { action: "Submit rebilling claim — coverage confirmed on DOS · attach 271",rev: 1842 },
  "COV-008": { action: "Escalate to pharmacy + care mgmt — high-risk meds at risk",     rev: 1380 },
  "COV-009": { action: "Start renewal intake now — redet this month · verify income",   rev: 1100 },
  "COV-010": { action: "Renewal prep — contact verification · income docs",             rev: 900  },
  "COV-011": { action: "Renewal intake + eligibility review — Availity inactive",       rev: 1050 },
  "COV-012": { action: "Escalate pharmacy rescue + eligibility — redet + Rx reject",    rev: 1620 },
  "COV-013": { action: "Call MCO — CRISP MCO differs from eCW · update roster",         rev: 680  },
  "COV-014": { action: "Update contact info — no valid phone · outreach blocked",       rev: 480  },
  "COV-015": { action: "Monitor only — outreach suppressed · outside window",           rev: 0    },
};
const _src = (key, status, dateType, date, reliability, evidence) => ({ key, status, dateType, date, reliability, evidence });
const NCPDP = {
  "65": { label: "Patient is not covered", cls: "loss" }, "66": { label: "Patient age exceeds maximum", cls: "loss" },
  "67": { label: "Filled before coverage effective", cls: "loss" }, "68": { label: "Filled after coverage expired", cls: "loss" },
  "69": { label: "Filled after coverage terminated", cls: "loss" }, "52": { label: "Non-matched cardholder ID", cls: "loss" },
  "70": { label: "Product not covered (formulary)", cls: "access" }, "73": { label: "Refills not covered", cls: "access" },
  "75": { label: "Prior authorization required", cls: "access" }, "76": { label: "Plan limitations exceeded", cls: "access" },
  "78": { label: "Cost exceeds maximum", cls: "access" }, "79": { label: "Refill too soon", cls: "access" }, "88": { label: "DUR reject", cls: "access" },
  "41": { label: "Submit to other/primary payer (COB)", cls: "cob" }, "74": { label: "Other carrier payment meets/exceeds", cls: "cob" },
  "07": { label: "M/I cardholder ID", cls: "data" },
};
const rejectClassOf = (code) => (NCPDP[code] || {}).cls || "access";
const rejectLabel = (code) => (NCPDP[code] || {}).label || ("Reject " + (code || "")) ;
const CLASS_META = { loss: { label: "Coverage loss", tone: T.red }, access: { label: "Pharmacy access", tone: T.amber }, cob: { label: "COB / payer change", tone: T.indigo }, data: { label: "Data fix", tone: T.textMid } };
// ── TRADE SECRET SEAM [A/B] · representative NCPDP code lists are PATENT-DISCLOSED (safe). The tuned/refined mapping + medication-criticality weights are held back [B] — keep the refined mapping server-side.
const ACCESS_CODES = ["70", "75", "76", "79", "73"], LOSS_CODES = ["65", "68", "69", "52"], COB_CODES = ["41", "74"];
function pickReject(rng) { const pr = rng(); return pr < 0.5 ? pick(rng, ACCESS_CODES) : pr < 0.85 ? pick(rng, LOSS_CODES) : pick(rng, COB_CODES); }

function pickConflictCode(p, rng) {
  if (p.pharmacyReject) { const cls = rejectClassOf(p.rejectCode); if (cls === "loss" && p.coverage !== "active") return "COV-005"; return "COV-004"; }
  if (p.denial) return "COV-007";
  if (p.intakeDone) return "COV-006";
  if (p.coverage === "inactive") return "COV-001";
  if (p.coverage === "pending") return rng() < 0.5 ? "COV-003" : "COV-008";
  return rng() < 0.16 ? "VERIFY" : "AGREE";
}

// ── TRADE SECRET SEAM [B] · source reliability / temporal-freshness / conflict-specific confidence factors. Representative formula is disclosed in the patent; exact factor values are held back — production values server-side.
function makeRecon(p, rng, force) {
  const code0 = force || pickConflictCode(p, rng);
  const hi = (a, b) => a + Math.floor(rng() * (b - a));
  let state, conf, sources, evidence, contra, weighting, humanReview = false, humanReason = "", timeline = [];
  const today = "today", yest = "yesterday";
  const med = p.clinicalFlags && p.clinicalFlags.includes("Diabetes") ? "insulin" : (p.clinicalFlags && p.clinicalFlags[0]) || "medication";

  if (code0 === "COV-005") {
    state = "Inactive — High Confidence"; conf = hi(88, 96);
    sources = [
      _src("EMR / eCW", "Active", "Last updated", dOff(-72), "Low", "Stale registration · 72 days old"),
      _src("270 / 271", "Inactive", "Checked", today, "High", "Eligibility returned inactive"),
      _src("834 / MCO roster", "Dropped", "File date", dOff(-21), "Medium", "Not on current roster"),
      _src("State Medicaid", "Pending renewal", "Renewal due", dOff(Math.max(1, p.renewalDays)), "High", "Renewal window open"),
      _src("Pharmacy PMS", "Reject " + (p.rejectCode || "69"), "Fill attempt", yest, "High", rejectLabel(p.rejectCode || "69") + " (coverage-loss code)"),
      _src("Patient intake", "No response", "—", "—", "Unverified", "No contact yet"),
    ];
    evidence = "NCPDP reject " + (p.rejectCode || "69") + " (" + rejectLabel(p.rejectCode || "69") + ") + 270/271 inactive today → coverage loss. EMR still shows active but 72 days stale.";
    contra = "EMR shows Medicaid active — but last verified 72 days ago.";
    weighting = "Real-time 270/271 + pharmacy adjudication weighted above stale EMR registration.";
    humanReview = true; humanReason = (p.clinicalFlags && p.clinicalFlags.length ? med + " refill due + " : "") + "renewal window closing";
    timeline = [{ d: dOff(-21), t: "834 roster dropped patient" }, { d: dOff(-7), t: "EMR still lists Medicaid active" }, { d: today, t: "270/271 returned inactive" }, { d: yest, t: "Pharmacy reject — Medicaid inactive" }];
  } else if (code0 === "COV-004") {
    state = "Pharmacy Access Risk Only"; conf = hi(82, 91);
    sources = [
      _src("EMR / eCW", "Active", "Last updated", dOff(-10), "Medium", "Payer on file"),
      _src("270 / 271", "Active", "Checked", today, "High", "Medical eligibility active"),
      _src("State Medicaid", "Active", "Verified", dOff(-3), "High", "Active case"),
      _src("Pharmacy PMS", "Reject " + (p.rejectCode || "75"), "Fill attempt", yest, "High", rejectLabel(p.rejectCode || "75") + " (pharmacy-access code)"),
    ];
    evidence = "NCPDP reject " + (p.rejectCode || "75") + " (" + rejectLabel(p.rejectCode || "75") + ") + 270/271 active → pharmacy access issue, not coverage loss.";
    contra = "A pharmacy reject can be misread as full coverage loss.";
    weighting = "Reject scoped to the pharmacy benefit; medical sources agree active.";
    humanReview = true; humanReason = med + " refill at risk — payer profile fix";
    timeline = [{ d: dOff(-3), t: "State Medicaid verified active" }, { d: today, t: "270/271 active" }, { d: yest, t: "Pharmacy reject at counter" }];
  } else if (code0 === "COV-007") {
    state = "Rebilling Opportunity"; conf = hi(80, 90);
    sources = [
      _src("RCM", "Denial", "Date of service", dOff(-8), "Medium", "Eligibility denial"),
      _src("270 / 271", "Active on DOS", "Checked", dOff(-8), "High", "Eligibility active on the date of service"),
      _src("EMR / eCW", "Active", "Last updated", dOff(-15), "Medium", "Payer on file"),
    ];
    evidence = "Claim denied for eligibility, but 270/271 shows active coverage on the date of service — recoverable revenue.";
    contra = "The initial denial implied no coverage.";
    weighting = "As-of-service-date eligibility weighted over the post-hoc denial.";
    timeline = [{ d: dOff(-8), t: "Claim denied — eligibility" }, { d: dOff(-8), t: "270/271 active on DOS" }, { d: today, t: "Flagged for rebilling" }];
  } else if (code0 === "COV-006") {
    state = "Patient-Reported Active — Unverified"; conf = hi(54, 67);
    sources = [
      _src("Patient intake", "Says active", "Response", today, "Unverified", "Reports working two jobs"),
      _src("270 / 271", "Inactive", "Checked", today, "High", "Eligibility inactive"),
      _src("EMR / eCW", "Inactive", "Last updated", dOff(-30), "Low", "No active payer"),
    ];
    evidence = "Patient reports active coverage, but 270/271 and EMR show inactive — needs documentary proof.";
    contra = "Self-report conflicts with real-time eligibility.";
    weighting = "Unverified self-report held below verified electronic sources pending proof.";
    humanReview = true; humanReason = "Self-report vs. systems mismatch — request paystub / proof";
    timeline = [{ d: dOff(-30), t: "EMR shows inactive" }, { d: today, t: "270/271 inactive" }, { d: today, t: "Patient submitted intake — says active" }];
  } else if (code0 === "COV-001") {
    state = "Inactive — High Confidence"; conf = hi(86, 95);
    sources = [
      _src("EMR / eCW", "Active", "Last updated", dOff(-45), "Low", "Stale payer record"),
      _src("270 / 271", "Inactive", "Checked", today, "High", "Eligibility inactive"),
      _src("State Medicaid", "Terminated", "Effective", dOff(-5), "High", "Case closed"),
    ];
    evidence = "270/271 inactive and State shows terminated; EMR active but stale — likely true coverage loss.";
    contra = "EMR still lists Medicaid active.";
    weighting = "Real-time 270/271 + State termination weighted above stale EMR.";
    timeline = [{ d: dOff(-45), t: "EMR last updated (active)" }, { d: dOff(-5), t: "State case terminated" }, { d: today, t: "270/271 inactive" }];
  } else if (code0 === "COV-002") {
    state = "Active — Verification Needed"; conf = hi(70, 82);
    sources = [
      _src("EMR / eCW", "Inactive", "Last updated", dOff(-50), "Low", "No payer on file"),
      _src("270 / 271", "Active", "Checked", today, "High", "Eligibility active"),
      _src("State Medicaid", "Active", "Verified", dOff(-4), "High", "Active case"),
    ];
    evidence = "External sources show active coverage the EMR is missing — registration update needed.";
    contra = "EMR shows no active payer.";
    weighting = "Verified external eligibility weighted above an empty EMR record.";
    timeline = [{ d: dOff(-50), t: "EMR shows inactive" }, { d: today, t: "270/271 active" }];
  } else if (code0 === "COV-003") {
    state = "MCO Attribution Changed"; conf = hi(76, 88);
    sources = [
      _src("270 / 271", "Active", "Checked", today, "High", "Medicaid active"),
      _src("834 / MCO roster", "Dropped", "File date", dOff(-12), "Medium", "Removed from prior MCO roster"),
      _src("EMR / eCW", "Active (old MCO)", "Last updated", dOff(-20), "Low", "Lists prior plan"),
    ];
    evidence = "Medicaid active (270/271) but the 834 roster dropped the patient — plan/attribution changed, not coverage loss.";
    contra = "A roster drop can look like a termination.";
    weighting = "Active eligibility weighted over the roster drop; classified as attribution change.";
    timeline = [{ d: dOff(-20), t: "EMR lists prior MCO" }, { d: dOff(-12), t: "834 roster dropped patient" }, { d: today, t: "270/271 still active" }];
  } else if (code0 === "COV-008") {
    const crit = p.clinicalFlags && p.clinicalFlags.length > 0;
    state = crit ? "Critical Coverage Continuity Risk" : "Pending Renewal"; conf = hi(68, 80);
    sources = [
      _src("State Medicaid", "Pending renewal", "Renewal due", dOff(Math.max(1, p.renewalDays)), "High", "Renewal open · action needed"),
      _src("270 / 271", "Active", "Checked", today, "High", "Active for now"),
      _src("Patient intake", "No contact", "—", "—", "Unverified", "No response to outreach"),
    ];
    evidence = "Coverage active now, renewal due soon, no patient contact" + (crit ? " — high-risk meds on file." : ".");
    contra = "Currently active — the risk is a future lapse.";
    weighting = "Renewal timing + no-contact elevate continuity risk.";
    humanReview = crit; humanReason = crit ? "High-risk: " + p.clinicalFlags[0] + " — protect continuity" : "";
    timeline = [{ d: today, t: "Renewal window opened" }, { d: today, t: "Outreach sent — no response" }];
  } else { // AGREE / VERIFY
    const verif = code0 === "VERIFY";
    state = verif ? "Active — Verification Needed" : "Active — High Confidence"; conf = verif ? hi(84, 91) : hi(94, 100);
    sources = [
      _src("270 / 271", "Active", "Checked", today, "High", "Eligibility active"),
      _src("State Medicaid", "Active", "Verified", dOff(-2), "High", "Active case"),
      _src("EMR / eCW", verif ? "Active (stale)" : "Active", "Last updated", dOff(verif ? -40 : -6), verif ? "Low" : "Medium", verif ? "Registration may be stale" : "Payer on file"),
    ];
    evidence = verif ? "All sources active; EMR registration may be stale and should be reconfirmed." : "All sources agree — coverage active and current.";
    contra = verif ? "EMR last updated 40 days ago." : "None — sources concur.";
    weighting = "Sources concur; no conflict to adjudicate.";
    timeline = [{ d: dOff(-2), t: "State verified active" }, { d: today, t: "270/271 active" }];
  }
  const isCov = /^COV-/.test(code0);
  const code = isCov ? code0 : null;
  const tax = code ? taxOf(code) : null;
  const action = tax ? tax.action : (state === "Active — Verification Needed" ? "Update EMR registration payer record" : "No action — monitor");
  const route = tax ? tax.route : (state === "Active — Verification Needed" ? "eligibility" : null);
  return { code, pattern: tax ? tax.pattern : "Sources agree", state, tone: STATE_TONE[state] || T.textMid, confidence: conf, evidence, contra, weighting, action, route, humanReview, humanReason, sources, timeline };
}

// Canonical demo scenarios forced onto the first patients so the demo opens on a conflict story.
const DEMO = [
  { set: { coverage: "inactive", pharmacyReject: true, clinicalFlags: ["Diabetes"], rejectCode: "69" }, force: "COV-005" },
  { set: { coverage: "pending", pharmacyReject: false, denial: false, intakeDone: false }, force: "COV-003" },
  { set: { coverage: "active", pharmacyReject: true, clinicalFlags: ["Asthma"], rejectCode: "75" }, force: "COV-004" },
  { set: { coverage: "active", denial: true }, force: "COV-007" },
  { set: { coverage: "inactive", intakeDone: true }, force: "COV-006" },
  { set: { coverage: "inactive", pharmacyReject: true, clinicalFlags: ["Diabetes", "Behavioral health"], rejectCode: "65" }, force: "COV-005" },
  { set: { coverage: "inactive" }, force: "COV-001" },
  { set: { coverage: "pending", clinicalFlags: ["Hypertension"] }, force: "COV-003" },
];

/* ---------- CRISP Medicaid Redetermination File (renewal-risk source) ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const crispWindow = (d) => d <= 31 ? "current" : d <= 62 ? "upcoming" : "watch";
const GUARDRAIL = {
  current: { label: "Outreach allowed — start renewal now", tone: T.green, allow: true },
  upcoming: { label: "Outreach allowed — renewal prep", tone: T.teal, allow: true },
  watch: { label: "Monitor only — outreach suppressed", tone: T.textLo, allow: false },
  missing: { label: "Human review — no valid phone on file", tone: T.red, allow: false },
};
function makeCrisp(p, rng) {
  if (p.renewalDays > 120) return null; // not in this month's CRISP file
  const dt = new Date(Date.now() + p.renewalDays * 86400000);
  const now = new Date();
  const mm = rng() < 0.12;
  return {
    inFile: true, window: crispWindow(p.renewalDays),
    redetMth: MONTHS[dt.getMonth()] + " " + dt.getFullYear(), renewalDue: p.renewalDate,
    mco: mcoOf(p), mcoEcw: mm ? mcoNew(p) : mcoOf(p), mcoMismatch: mm,
    recipMedicaid: "MD" + (700000 + (p.idx * 37) % 99999),
    noPhone: rng() < 0.10, phones: 1 + Math.floor(rng() * 3),
    fileMonth: MONTHS[now.getMonth()] + " " + now.getFullYear(),
    fileReceived: pad(now.getMonth() + 1) + "/28",
  };
}
function crispConflict(p) {
  const c = p.crisp;
  if (p.pharmacyReject) return "COV-012";
  if (p.coverage === "inactive") return "COV-011";
  if (c.noPhone) return "COV-014";
  if (c.mcoMismatch) return "COV-013";
  if (c.window === "current") return "COV-009";
  if (c.window === "upcoming") return "COV-010";
  return "COV-015";
}
function crispGuard(c) {
  const g = c.noPhone ? GUARDRAIL.missing : (GUARDRAIL[c.window] || GUARDRAIL.watch);
  return { window: c.window, label: g.label, tone: g.tone, allow: g.allow && !c.noPhone };
}
function crispSource(c) {
  return _src("CRISP redet file", "REDET_Mth " + c.redetMth, "File month", c.fileMonth, c.noPhone ? "Unverified" : "High", c.noPhone ? "In file; no valid phone" : "Renewal due " + c.window);
}
function crispOverlay(p) {
  const c = p.crisp;
  const code = crispConflict(p);
  const tax = taxOf(code);
  const r = { ...p.recon };
  r.code = code; r.pattern = tax.pattern; r.state = tax.state; r.tone = STATE_TONE[tax.state] || T.textMid;
  r.action = tax.action; r.route = tax.route;
  const cmap = { "COV-012": 92, "COV-011": 89, "COV-009": 88, "COV-010": 84, "COV-013": 80, "COV-015": 76, "COV-014": 68 };
  r.confidence = cmap[code] || 80;
  r.guardrail = crispGuard(c);
  r.evidence = `CRISP redetermination ${c.redetMth} (${c.window}) reconciled with Availity ${p.coverage === "inactive" ? "inactive" : "active"}${p.pharmacyReject ? " + pharmacy reject" : ""}${c.mcoMismatch ? " + MCO mismatch" : ""}${c.noPhone ? " + no valid phone" : ""}.`;
  r.contra = c.window === "watch" ? "Renewal not due this or next month — early outreach suppressed per CRISP rule." : (p.coverage !== "inactive" ? "Coverage active today; the risk is the upcoming renewal." : (p.recon.contra || ""));
  r.weighting = "CRISP renewal timing + Availity eligibility + pharmacy reconciled; outreach gated by REDET_Mth window.";
  r.humanReview = (code === "COV-011" || code === "COV-012" || code === "COV-014");
  r.humanReason = code === "COV-012" ? "Renewal due + pharmacy reject — protect medication continuity" : code === "COV-011" ? "Renewal due + Availity inactive — possible coverage loss" : code === "COV-014" ? "No valid phone on file — outreach barrier" : "";
  r.sources = [crispSource(c), ...p.recon.sources.filter((x) => x.key !== "CRISP redet file")];
  r.timeline = [{ d: c.fileReceived, t: `CRISP file received — REDET_Mth ${c.redetMth}` }, ...(p.recon.timeline || [])];
  return r;
}
function attachCrisp(p) {
  const c = p.crisp, r = p.recon;
  r.guardrail = crispGuard(c);
  r.sources = [crispSource(c), ...r.sources.filter((x) => x.key !== "CRISP redet file")];
}
// CRISP demo scenarios to showcase COV-009..015 (applied to patients 9-15)
const CRISP_DEMO = [
  { renewalDays: 12, set: { coverage: "active", pharmacyReject: false, denial: false, intakeDone: false }, crisp: { noPhone: false, mcoMismatch: false } },
  { renewalDays: 45, set: { coverage: "active", pharmacyReject: false, denial: false }, crisp: { noPhone: false, mcoMismatch: false } },
  { renewalDays: 20, set: { coverage: "inactive", pharmacyReject: false, denial: false }, crisp: { noPhone: false, mcoMismatch: false } },
  { renewalDays: 18, set: { coverage: "active", pharmacyReject: true, clinicalFlags: ["Diabetes"], rejectCode: "69" }, crisp: { noPhone: false, mcoMismatch: false } },
  { renewalDays: 25, set: { coverage: "active", pharmacyReject: false }, crisp: { noPhone: false, mcoMismatch: true } },
  { renewalDays: 15, set: { coverage: "active", pharmacyReject: false }, crisp: { noPhone: true, mcoMismatch: false } },
  { renewalDays: 100, set: { coverage: "active", pharmacyReject: false }, crisp: { noPhone: false, mcoMismatch: false } },
];

function buildPanel(seed, n) {
  const rng = mulberry32(seed);
  const list = [];
  for (let i = 0; i < n; i++) {
    const [lc, lname] = pick(rng, LANGS);
    const renewalDays = Math.floor(rng() * 120);
    const clinicalN = rng() < 0.34 ? 1 + Math.floor(rng() * 2) : 0;
    const cflags = []; for (let k = 0; k < clinicalN; k++) cflags.push(pick(rng, CLINICAL));
    const sdoh = makeSDOH(rng);
    const f = {
      renewalDays,
      priorLapse: rng() < 0.28 ? (rng() < 0.5 ? 1 : 0.5) : 0,
      failedChecks: rng() < 0.4 ? Math.floor(rng() * 4) : 0,
      failedOutreach: rng() < 0.45 ? Math.floor(rng() * 5) : 0,
      badAddress: rng() < 0.18,
      clinical: clinicalN ? clamp(0.4 + rng() * 0.6) : (rng() < 0.2 ? rng() * 0.3 : 0),
      language: lc !== "en",
      missedAppts: rng() < 0.4 ? Math.floor(rng() * 4) : 0,
      sdoh: sdoh.burden,
    };
    const { score, tier, drivers } = scorePatient(f);
    const dt = new Date(Date.now() + renewalDays * 86400000);
    const cov = rng() < 0.12 ? "inactive" : rng() < 0.2 ? "pending" : "active";
    // H.R. 1 work-requirement screening
    const ar = rng();
    const age = ar < 0.12 ? 6 + Math.floor(rng() * 12) : ar < 0.27 ? 65 + Math.floor(rng() * 20) : 19 + Math.floor(rng() * 46);
    const caregiver = age >= 19 && age < 65 && rng() < 0.14;
    const disabled = age >= 19 && age < 65 && rng() < 0.09;
    const hr = rng();
    const activityHours = hr < 0.5 ? 80 + Math.floor(rng() * 60) : hr < 0.74 ? Math.floor(rng() * 79) : 0;
    const activityKnown = hr < 0.8;
    const snapTanf = age >= 19 && age < 65 && rng() < 0.08;
    const fosterYouth = age >= 19 && age < 26 && rng() < 0.10;
    const veteran = age >= 19 && age < 65 && rng() < 0.04;
    const tribal = age >= 19 && age < 65 && rng() < 0.05;
    let wrStatus, wrReason, wrSubject, wrExemption = null, wrActivity = null;
    if (age < 19 || age >= 65) { wrStatus = "exempt"; wrExemption = "Under 19 or age 65+"; wrSubject = false; }
    else if (cflags.includes("Pregnancy")) { wrStatus = "exempt"; wrExemption = "Pregnant or postpartum"; wrSubject = false; }
    else if (caregiver) { wrStatus = "exempt"; wrExemption = "Primary caregiver — child ≤ 13 or a person with a disability"; wrSubject = false; }
    else if (disabled) { wrStatus = "exempt"; wrExemption = "Medically frail / serious health condition"; wrSubject = false; }
    else if (snapTanf) { wrStatus = "exempt"; wrExemption = "Meets SNAP or TANF work requirements"; wrSubject = false; }
    else if (fosterYouth) { wrStatus = "exempt"; wrExemption = "Former foster youth under 26"; wrSubject = false; }
    else if (veteran) { wrStatus = "exempt"; wrExemption = "Disabled veteran"; wrSubject = false; }
    else if (tribal) { wrStatus = "exempt"; wrExemption = "American Indian / Alaska Native"; wrSubject = false; }
    else { wrSubject = true; wrActivity = pick(rng, WR_ACTIVITIES); if (!activityKnown) { wrStatus = "unverified"; wrReason = "Activity not verified"; } else if (wrActivity.noHours) { wrStatus = "compliant"; wrReason = wrActivity.key === "income" ? `Meets $${MHC.workReqIncome}/mo income proxy — no hour log required` : "Enrolled at least half time — no hour log required"; } else if (activityHours >= MHC.workReqHours) { wrStatus = "compliant"; wrReason = `${activityHours} hrs/mo · ${wrActivity.label}`; } else { wrStatus = "at_risk"; wrReason = `${activityHours} hrs/mo — below ${MHC.workReqHours}`; } }
    if (!wrSubject) wrReason = wrExemption;
    const cadence = wrSubject ? "6-month" : "12-month";
    const pharmacyReject = cflags.includes("Diabetes") && rng() < 0.5 && cov !== "active";
    const rejectCode = pharmacyReject ? pickReject(rng) : null;
    let probableExemption = null;
    if (wrSubject) {
      let rule = EXEMPTION_RULES.find((r) => r.active_flag && r.evidence_type === "structured_dx" && cflags.includes(r.flag));
      if (!rule && rng() < 0.45) {
        const cand = pick(rng, EXEMPTION_RULES.filter((r) => r.active_flag && r.evidence_type === "note_nlp"));
        const noteText = (rng() < 0.3 ? pick(rng, ["denies ", "family history of ", "no longer ", "ruled out ", "caregiver is someone else; "]) : "") + cand.code_or_keyword;
        if (!noteNegated(noteText)) rule = cand;
      }
      if (rule) {
        const STx = ["candidate_detected", "candidate_detected", "clinician_review_pending", "clinician_review_pending", "clinician_confirmed", "clinician_rejected", "documentation_needed", "insufficient_evidence"];
        const st = pick(rng, STx);
        const done = st === "clinician_confirmed" || st === "clinician_rejected";
        const structured = rule.evidence_type === "structured_dx";
        probableExemption = {
          patient_id: null,
          frailty_category: rule.frailty_category || null,
          requires_impairment_element: !!rule.frailty_category,
          impairment_status: rule.frailty_category ? pick(rng, ["not_assessed", "not_assessed", "needs_visit", "assessed_impairs", "assessed_no_impair"]) : null,
          adl_limitations: rule.frailty_category && rng() < 0.5 ? [pick(rng, ADLS), pick(rng, ADLS)].filter((v, i, a) => a.indexOf(v) === i) : [],
          exemption_category: rule.exemption_category, category: rule.exemption_category,
          evidence_tier: rule.evidence_type,
          evidence_source: structured ? "Problem list / ICD-10" : "Clinical note (NLP)", source: structured ? "Problem list / ICD-10" : "Clinical note (NLP)",
          evidence_code_or_keyword: rule.code_or_keyword,
          basis: structured ? ("ICD-10 " + rule.code_or_keyword) : ('Note: "' + rule.code_or_keyword + '"'),
          evidence_date: dFull(20 + Math.floor(rng() * 320)),
          confidence_level: rule.confidence_default, conf: rule.confidence_default,
          sensitive: rule.sensitive, rule_id: rule.rule_id, requires_clinician_confirmation: true,
          clinician_confirmation_status: st,
          confirming_clinician: done ? pick(rng, ["Dr. A. Mensah", "Dr. R. Cole", "NP J. Park"]) : null,
          confirmation_date: done ? dFull(1 + Math.floor(rng() * 20)) : null,
          documentation_note: st === "clinician_confirmed" ? "Clinician attestation on file" : st === "documentation_needed" ? "Awaiting supporting documentation" : null,
          audit_event_id: "AE-" + (100000 + Math.floor(rng() * 899999)),
          documentation_submitted: st === "clinician_confirmed" && rng() < 0.7,
          coverage_preserved: st === "clinician_confirmed" && rng() < 0.6,
          outcome: st === "clinician_confirmed" ? "confirmed" : st === "clinician_rejected" ? "rejected" : "pending",
          route_queue: rule.sensitive ? "compliance" : "care",
        };
      }
    }
    list.push({
      id: uid("pt"), idx: i,
      first: pick(rng, FIRST), last: pick(rng, LAST),
      mrn: "MRN" + (480000 + Math.floor(rng() * 99999)),
      medicaidId: "••••" + Math.floor(1000 + rng() * 8999),
      lang: lname, langCode: lc,
      renewalDate: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
      renewalDays, coverage: cov,
      clinicalFlags: cflags,
      pharmacyReject, rejectCode,
      denial: rng() < 0.16,
      intakeDone: rng() < 0.18,
      age, caregiver, disabled, activityHours, activityKnown, wrStatus, wrReason, wrSubject, wrExemption, wrActivity, cadence, probableExemption,
      factors: f, score, tier, drivers, sdoh,
      sdoh_recorded_date: sdoh.recordedDate, sdoh_recency_months: sdoh.recencyMonths, sdoh_recency_status: sdoh.recencyStatus,
      recommended: ACTION[tier],
      lastScored: "tonight 02:14",
    });
  }
  const rng2 = mulberry32(seed + 99);
  list.forEach((p) => {
    p.recon = makeRecon(p, rng2);
    p.crisp = makeCrisp(p, rng2);
    if (p.crisp) { if (!p.recon.code) p.recon = crispOverlay(p); else attachCrisp(p); }
  });
  DEMO.forEach((demo, i) => {
    const p = list[i]; if (!p) return;
    Object.assign(p, demo.set || {});
    p.demo = true; p.crisp = null;
    p.recon = makeRecon(p, rng2, demo.force);
  });
  CRISP_DEMO.forEach((d, j) => {
    const p = list[8 + j]; if (!p) return;
    p.renewalDays = d.renewalDays;
    Object.assign(p, d.set || {});
    p.demo = true;
    p.crisp = makeCrisp(p, rng2);
    if (p.crisp && d.crisp) Object.assign(p.crisp, d.crisp);
    p.recon = makeRecon(p, rng2);
    if (p.crisp) p.recon = crispOverlay(p);
  });
  list.forEach((p) => {
    if (p.recon && p.recon.sources && p.sdoh) {
      const sd = p.sdoh;
      if (p.probableExemption) p.probableExemption.patient_id = p.id;
      p.recon.sources.push(_src("SDOH screen (eCW)", sd.emp.label, "Screened", sd.recordedDate, sd.recencyStatus === "current" ? "Medium" : "Low", sd.emp.label + " · " + sd.housing[1] + " · " + sd.food[1] + " — self-reported · recorded " + sd.recordedDate + " (" + sd.recencyStatus + ", " + sd.recencyMonths + " mo)"));
    }
  });
  return list;
}

/* ---------- the 16 agents ---------- */
const AGENTS = [
  { n: "Command Orchestrator", dom: "Platform operations", layer: "Orchestration", phase: 5, status: "running", role: "Coordinates every agent, schedules the nightly sweep, manages retries and SLAs, writes the audit trail." },
  { n: "Eligibility Sentinel", dom: "Coverage surveillance", layer: "Agents", phase: 1, status: "running", role: "Monitors Medicaid active/inactive status, plan changes and pre-visit eligibility across the panel." },
  { n: "Redetermination Predictor", dom: "Predictive risk", layer: "Agents", phase: 1, status: "running", role: "Generates the explainable 0–100 Coverage Risk Score and surfaces the top 3 drivers per patient." },
  { n: "Patient Outreach", dom: "Outbound engagement", layer: "Agents", phase: 2, status: "running", role: "Sends approved renewal reminders and nudges, routes replies into structured intake." },
  { n: "Patient Eligibility Communication", dom: "Structured intake", layer: "Agents", phase: 2, status: "running", role: "Bidirectional intake: jobs, hours, income, household, documents — the 11-state conversation machine." },
  { n: "Document Readiness", dom: "Document review", layer: "Agents", phase: 2, status: "idle", role: "Classifies uploads and returns ready / incomplete / human_review_needed." },
  { n: "Case Routing", dom: "Work orchestration", layer: "Agents", phase: 2, status: "running", role: "Routes exceptions to the right human queue with urgency, owner and SLA." },
  { n: "Pharmacy Coverage", dom: "Medication access", layer: "Agents", phase: 3, status: "idle", role: "Treats Medicaid pharmacy rejects as real-time coverage-loss signals; triggers refill rescue." },
  { n: "Revenue Protection", dom: "RCM", layer: "Agents", phase: 3, status: "idle", role: "Detects eligibility denials, estimates PPS exposure, builds the rebilling recovery queue." },
  { n: "High-Risk Patient", dom: "Clinical priority", layer: "Agents", phase: 3, status: "idle", role: "Links coverage risk to chronic disease, pregnancy, HIV, pediatrics and critical meds." },
  { n: "MCO Roster Intelligence", dom: "Roster churn", layer: "Agents", phase: 4, status: "idle", role: "Compares monthly MCO rosters, detects attribution churn and plan changes." },
  { n: "Quality Protection", dom: "UDS / HEDIS", layer: "Agents", phase: 4, status: "idle", role: "Links care-gap risk to coverage tiers to protect quality measures." },
  { n: "340B Impact", dom: "Pharmacy margin", layer: "Agents", phase: 4, status: "idle", role: "Watches payer/carve changes for 340B capture and compliance exposure." },
  { n: "Compliance Guardrail", dom: "Governance", layer: "Agents", phase: 1, status: "running", role: "Wraps every outbound message: consent, PHI, no state impersonation, approved template, audit." },
  { n: "Executive Intelligence", dom: "Leadership reporting", layer: "Agents", phase: 5, status: "running", role: "Aggregates outcomes into the operations and board dashboards and the weekly digest." },
  { n: "Learning & Optimization", dom: "Continuous improvement", layer: "Agents", phase: 5, status: "idle", role: "Tunes thresholds, scripts and routing from outcome data — governance approval required." },
];

const QUEUE_DEFS = [
  // hidden: intake — surfaced via lanes / Patient Queue
  { key: "eligibility", label: "Eligibility Workqueue", icon: Inbox, color: T.indigo, blurb: "Incomplete or urgent coverage cases" },
  { key: "pharmacy", label: "Pharmacy Rescue", icon: Pill, color: T.red, blurb: "Critical medication access at risk" },
  { key: "rcm", label: "RCM Recovery", icon: DollarSign, color: T.green, blurb: "Eligibility denials and rebilling" },
  { key: "care", label: "Care Management", icon: Stethoscope, color: T.orange, blurb: "High-risk patient escalation" },
  { key: "exemption", label: "Clinician Exemption Review", icon: ShieldCheck, color: T.indigo, blurb: "Probable frailty / exemption candidates awaiting clinician confirmation (Element 2)" },
];


/* ============================================================
   Shared atoms
   ============================================================ */
function Card({ children, style, pad = 16, title, right, sub }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 1px 2px rgba(16,23,38,.04)", ...style }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: .2 }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: T.textLo, marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, delta, tone = T.teal, foot }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, minWidth: 0, boxShadow: "0 1px 2px rgba(16,23,38,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textMid }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: tone + "1A", color: tone, display: "grid", placeItems: "center" }}><Icon size={15} /></span>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: .2 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 760, color: T.text, marginTop: 8, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
        {delta != null && <span style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? T.green : T.red }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}{typeof delta === "number" && foot == null ? "" : ""}</span>}
        {foot && <span style={{ fontSize: 11, color: T.textLo }}>{foot}</span>}
      </div>
    </div>
  );
}
function TierPill({ tier, small }) {
  const c = TIER_COLOR[tier];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: small ? 10.5 : 11.5, fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}44`, padding: small ? "1px 7px" : "2px 9px", borderRadius: 999, textTransform: "capitalize", letterSpacing: .2 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: c }} />{tier}</span>;
}
function Badge({ children, c = T.textMid, bg }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: c, background: bg || c + "14", padding: "2px 8px", borderRadius: 6, letterSpacing: .3, whiteSpace: "nowrap" }}>{children}</span>;
}
function CovDot({ coverage }) {
  const m = { active: T.green, pending: T.amber, inactive: T.red };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.textMid, textTransform: "capitalize" }}><span style={{ width: 7, height: 7, borderRadius: 99, background: m[coverage] }} />{coverage}</span>;
}
function MiniBar({ value, color }) {
  return <div style={{ height: 6, background: T.border, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${clamp(value, 0, 100)}%`, height: "100%", background: color, borderRadius: 99 }} /></div>;
}
function Empty({ children }) { return <div style={{ padding: 28, textAlign: "center", color: T.textLo, fontSize: 12.5 }}>{children}</div>; }

/* ============================================================
   Console — app shell, state, the nightly sweep engine
   ============================================================ */
const NAV = [
  { key: "command",  label: "Command Center",    icon: LayoutDashboard, tier: 1 },
  { key: "mco",      label: "Patient worklist",  icon: ShieldCheck,     tier: 1 },
  { key: "billing",  label: "Billing queue",     icon: DollarSign,      tier: 1 },
  { key: "pharmacy", label: "Pharmacy / 340B",   icon: Pill,            tier: 1 },
  { key: "caregap",  label: "Quality / CareGap", icon: Activity,        tier: 1 },
  { key: "execmvp",  label: "Executive Intel",   icon: TrendingUp,      tier: 1 },
  { key: "health",   label: "Data Source Health", icon: Database,       tier: 1 },
];

function Console() {
  const [view, _setView] = useState(CFG.startingView || "command");
  const setView = function(v) { logEvent("nav", { view: v }); _setView(v); };
  const [productTier, setProductTier] = useState(2);
  const [narrow, setNarrow] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [env, setEnv] = useState("build"); // build | azure
  const viewerRole = "authorized"; // always authorized — role toggle removed
  const [panel, setPanel] = useState(() => buildPanel(7, 72));
  const [audit, setAudit] = useState(() => seedAudit());
  const [selected, _setSelected] = useState(null);
  const setSelected = function(patient) { _setSelected(patient); if (patient) logEvent("patient_open", { name: patient.name || (patient.first + " " + patient.last), mrn: patient.mrn }); };
  const [agents, setAgents] = useState(() => AGENTS.map((a) => ({ ...a })));
  const [sweep, setSweep] = useState({ running: false, step: -1, ran: false, ts: null, changed: 0, outreach: 0, cases: 0, conflicts: 0 });
  const [outreachSent, setOutreachSent] = useState(312);
  const [extraCases, setExtraCases] = useState([]);
  const [assigned, setAssigned] = useState({});
  const [reviewState, setReviewState] = useState({}); // mrn -> { status, reviewedDate, checklist, note }
  const [recerts, setRecerts] = useState(() => buildRecerts(panel));
  const [assumptions, setAssumptions] = useState(FIN_DEFAULT);
  const [impact, setImpact] = useState(IMPACT_DEFAULT);
  const sweepingRef = useRef(false);

  // ── Departmental queue state ──────────────────────────────────
  const [billingCases,   setBillingCases]   = useState([]);
  const [pharmacyCases,  setPharmacyCases]  = useState([]);
  const [cgQueueCases,   setCgQueueCases]   = useState([]);
  const [sessionLog,     setSessionLog]     = useState([]);
  const [consoleRosterCases] = useState(() => buildRosterCases(panel));

  const nowClock2 = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function addSessionLog(patient, action, queue) {
    setSessionLog(l => [{ ts: nowClock2(), patient, action, queue }, ...l].slice(0, 100));
  }
  function routeToQueue(mrn, patient, dest, note) {
    const routed = { id: uid("q"), mrn, patient, navNote: note || "", routedTime: nowClock2(), routedDate: new Date().toISOString().slice(0,10), status: "active" };
    if (dest === "billing") {
      const bpt = panel.find(p => p.mrn === mrn);
      setBillingCases(l => [...l, {
        ...routed,
        amount: bpt?.claimAmt || 0,
        claims: bpt?.claimsCount || 0,
        plan:   bpt ? mcoNew(bpt) : "",
        billingStatus: "active",
        billingLog: []
      }]);
      addSessionLog(patient, "Routed → Billing queue" + (note ? ` — ${note}` : ""), "billing");
    } else if (dest === "pharmacy") {
      const pt = panel.find(p => p.mrn === mrn);
      const isCoverageLapse = pt?.coverage === "inactive";
      const oldPlan = pt ? mcoOf(pt) : "—";
      const newPlan = pt ? mcoNew(pt) : "—";
      const isDualElig = consoleRosterCases.some(rc => rc.mrn === mrn && rc.dtype === "dual_eligible");
      setPharmacyCases(l => [...l, {
        ...routed,
        signalType: isCoverageLapse ? "coverage_lapse" : "plan_change",
        is340b: isCoverageLapse,
        rejectCode: isCoverageLapse ? "—" : "Reject 69 · COV-012",
        oldPlan,
        newPlan,
        drug: "—",
        pharmLog: [],
        isDualEligible: isDualElig
      }]);
      addSessionLog(patient, "Routed → Pharmacy / 340B" + (note ? ` — ${note}` : ""), "pharmacy");
    } else if (dest === "caregap") {
      setCgQueueCases(l => [...l, { ...routed, measure: "Open care gap", gapDays: 0, cgStatus: "open", cgLog: [] }]);
      addSessionLog(patient, "Routed → Quality / CareGap" + (note ? ` — ${note}` : ""), "caregap");
    }
  }
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < 980);
    onR(); window.addEventListener("resize", onR);
    setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    return () => window.removeEventListener("resize", onR);
  }, []);

  /* Security: keyboard + right-click block + session start */
  useEffect(function() {
    logEvent("session_start");
    var blockKeys = function(e) {
      if (e.ctrlKey && ["s","p","u","a"].indexOf(e.key.toLowerCase()) !== -1) {
        e.preventDefault(); return false;
      }
      if (e.key === "PrintScreen") { e.preventDefault(); return false; }
    };
    var blockCtx = function(e) { e.preventDefault(); };
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockCtx);
    return function() {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockCtx);
    };
  }, []);

  const kpis = useMemo(() => deriveKPIs(panel, outreachSent), [panel, outreachSent]);
  const tierDist = useMemo(() => deriveTierDist(panel), [panel]);
  const renewalBuckets = useMemo(() => deriveRenewal(panel), [panel]);
  const queues = useMemo(() => deriveQueues(panel, extraCases), [panel, extraCases]);
  const openCount = useMemo(() => queues.reduce((n, q) => n + q.items.length, 0), [queues]);

  function pushAudit(actor, action, detail, phi = false) {
    setAudit((a) => [{ id: uid("aud"), ts: nowClock(), actor, action, detail, phi }, ...a].slice(0, 200));
  }
  function assignCase(id, patient) {
    setAssigned((a) => (a[id] ? a : { ...a, [id]: true }));
    if (!assigned[id]) pushAudit("staff:you", "case.assigned", `${patient} · claimed from queue`);
  }
  function unassignCase(id) { setAssigned((a) => { const n = { ...a }; delete n[id]; return n; }); }
  function routeRecon(p, queueKey) {
    if (!queueKey) return;
    const c = { ...makeCase(queueKey, p, `Coverage state: ${p.recon.state} · ${p.recon.code || "agree"} · ${p.recon.action}`, p.recon.humanReview ? "high" : "normal", 1), id: `case_recon_${queueKey}_${p.mrn}` };
    setExtraCases((cs) => (cs.some((x) => x.id === c.id) ? cs : [c, ...cs]));
    pushAudit("coverage_reconciliation", "case.routed", `${p.first} ${p.last} · ${p.recon.code || "state"} → ${labelFor(queueKey)}`);
  }

  function recertSetDoc(caseId, docKey, status, patient, docName) {
    setRecerts((rs) => rs.map((c) => (c.id === caseId ? { ...c, docs: c.docs.map((d) => (d.key === docKey ? { ...d, status } : d)) } : c)));
    pushAudit("recert_workflow", status === "received" ? "document.received" : "document.pending", `${patient} · ${docName}`);
  }
  function recertAssign(caseId, step, person, patient) {
    setRecerts((rs) => rs.map((c) => (c.id === caseId ? { ...c, owners: step === "all" ? { gather: person, review: person } : { ...c.owners, [step]: person } } : c)));
    if (person) pushAudit("staff:you", "case.assigned", `${patient} · ${step === "all" ? "all steps" : step + " step"} → ${person}`);
  }
  function recertAdvance(caseId, patient) {
    const c = recerts.find((x) => x.id === caseId);
    if (!c) return;
    const order = ["flagged", "gathering", "complete", "ready"];
    const idx = order.indexOf(c.stage);
    if (idx < 0 || idx >= order.length - 1) return;
    const next = order[idx + 1];
    setRecerts((rs) => rs.map((x) => (x.id === caseId ? { ...x, stage: next } : x)));
    pushAudit("case_routing_agent", "stage.advanced", `${patient} · → ${next}`);
    if (next === "ready") pushAudit("recert_workflow", "ready_to_submit", `${patient} · packet complete`);
  }
  function recertSubmit(caseId, sub) {
    const c = recerts.find((x) => x.id === caseId); const patient = c ? c.patient : caseId;
    setRecerts((rs) => rs.map((x) => (x.id === caseId ? { ...x, stage: "submitted", submissions: [...(x.submissions || []), sub], outcome: null, resubmission: false } : x)));
    pushAudit("recert_workflow", "submission.recorded", `${patient} · ${sub.channel} · #${sub.trackingNo} · by ${sub.by}`);
  }
  function recertOutcome(caseId, outcome, detail) {
    const c = recerts.find((x) => x.id === caseId); const patient = c ? c.patient : caseId;
    setRecerts((rs) => rs.map((x) => {
      if (x.id !== caseId) return x;
      if (outcome === "approved") return { ...x, stage: "recertified", outcome, closedAs: "renewed", pendingItem: null };
      if (outcome === "denied_ineligible") return { ...x, stage: "recertified", outcome, closedAs: "ineligible", pendingItem: null };
      if (outcome === "pending") return { ...x, stage: "recertified", outcome, pendingItem: detail || "Additional clarification requested", closedAs: null };
      if (outcome === "denied_procedural") return { ...x, stage: "gathering", outcome, attempts: (x.attempts || 1) + 1, resubmission: true, cureDeadline: detail || "Cure window — 10 days", closedAs: null };
      return x;
    }));
    pushAudit("recert_workflow", "determination.recorded", `${patient} · ${outcome}`);
    if (outcome === "approved") pushAudit("recert_workflow", "case.closed", `${patient} · renewed`);
    if (outcome === "denied_procedural") pushAudit("case_routing_agent", "resubmission.created", `${patient} · attempt ${(c ? c.attempts || 1 : 1) + 1} · back to gathering`);
    if (outcome === "denied_ineligible") pushAudit("recert_workflow", "case.closed", `${patient} · ineligible · Marketplace referral`);
  }
  function recertResolvePending(caseId) {
    const c = recerts.find((x) => x.id === caseId); const patient = c ? c.patient : caseId;
    setRecerts((rs) => rs.map((x) => (x.id === caseId ? { ...x, stage: "ready", outcome: null, pendingItem: null } : x)));
    pushAudit("recert_workflow", "clarification.resolved", `${patient} · re-queued to submit`);
  }
  function recertSetAuthRep(caseId, status, patient) {
    setRecerts((rs) => rs.map((x) => (x.id === caseId ? { ...x, authRep: status } : x)));
    pushAudit("recert_workflow", "authorized_rep." + status, `${patient}`);
  }
  function recertAuth(caseId, action, payload, patient) {
    const today = todayStr();
    setRecerts((rs) => rs.map((x) => {
      if (x.id !== caseId) return x;
      if (action === "capture") { const pend = AR_NEEDS_SIGNATURE(payload.method); return { ...x, authRep: "granted", authRepRec: { method: payload.method, scope: payload.scope, capturedDate: today, effectiveDate: today, reviewDate: addDays(today, 180), signedForm: x.authRepRec ? x.authRepRec.signedForm : null, revokedDate: null, signaturePending: pend, followUp: pend ? { plan: payload.followUp || AR_FOLLOWUP_PLANS[0], due: addDays(today, 14), status: "open" } : null } }; }
      if (action === "upload") { const base = x.authRepRec || { scope: { submit: true, notices: true, comm: true, workreq: true }, capturedDate: today, effectiveDate: today, reviewDate: addDays(today, 180) }; return { ...x, authRep: "granted", authRepRec: { ...base, method: "Signed paper form (CG-AR-01)", signedForm: `CG-AR-01_${x.mrn}.pdf`, revokedDate: null, signaturePending: false, followUp: base.followUp ? { ...base.followUp, status: "resolved" } : null } }; }
      if (action === "signed") { const base = x.authRepRec || {}; return { ...x, authRep: "granted", authRepRec: { ...base, method: (payload && payload.method) || base.method || "Recorded telephonic signature", signaturePending: false, followUp: base.followUp ? { ...base.followUp, status: "resolved" } : null, signatureCapturedDate: today } }; }
      if (action === "revoke") return { ...x, authRep: "declined", authRepRec: x.authRepRec ? { ...x.authRepRec, revokedDate: today } : null };
      return x;
    }));
    const capPend = action === "capture" && AR_NEEDS_SIGNATURE(payload && payload.method);
    const map = { capture: capPend ? "authorized_rep.verbal_provisional" : "authorized_rep.e_consent_captured", upload: "authorized_rep.form_uploaded", revoke: "authorized_rep.revoked", signed: "authorized_rep.signature_captured" };
    pushAudit("recert_workflow", map[action] || "authorized_rep.updated", `${patient}${action === "capture" ? " · " + payload.method + (capPend ? " · signature pending (" + (payload.followUp || AR_FOLLOWUP_PLANS[0]) + ")" : "") : action === "upload" ? " · CG-AR-01 signed form" : action === "signed" ? " · signature captured" : ""}`);
  }
  function handleIntakeComplete(session) {
    const mrn = "MRN480219", id = `rc_${mrn}`;
    const docs = docsForPathway(session.pathway, [session.incomeKey, "id"]);
    const rec = { id, patient: "Maria Alvarez", first: "Maria", last: "Alvarez", mrn, tier: "high", lang: session.lang, renewalDays: 21, renewalDate: "2026-07-19", stage: "gathering", pathway: session.pathway, source: "intake", docs, owners: { gather: null, review: null }, authRep: session.authRep || "granted", authRepRec: (session.authRep || "granted") === "granted" ? { method: "Patient SMS reply (e-consent) — captured at intake", scope: { submit: true, notices: true, comm: true, workreq: true }, capturedDate: todayStr(), effectiveDate: todayStr(), reviewDate: addDays(todayStr(), 180), signedForm: null, revokedDate: null } : null, submissions: [], attempts: 1, outcome: null, closedAs: null, pendingItem: null, cureDeadline: null, resubmission: false };
    setRecerts((rs) => (rs.some((c) => c.id === id) ? rs.map((c) => (c.id === id ? rec : c)) : [rec, ...rs]));
    pushAudit("patient_eligibility_agent", "recert.synced", `Maria Alvarez · ${PATHWAY_LABEL[session.pathway]} · auth rep ${session.authRep || "granted"} → recert board`);
  }
  const recertActive = recerts.filter((c) => !c.closedAs).length;

  const SWEEP_STEPS = [
    "Command Orchestrator", "Eligibility Sentinel", "Redetermination Predictor", "Patient Outreach", "Case Routing", "Executive Intelligence",
  ];

  function runSweep() {
    if (sweepingRef.current) return;
    sweepingRef.current = true;
    setSweep({ running: true, step: 0, ran: true, ts: nowClock(), changed: 0, outreach: 0, cases: 0, conflicts: 0 });
    const D = reduced ? 1 : 760;
    const at = (i, fn) => setTimeout(fn, reduced ? i * 1 : i * D);

    at(0, () => { pushAudit("command_orchestrator", "workflow.started", "daily_coverage_sweep"); setSweep((s) => ({ ...s, step: 0 })); });

    // Pre-select deterministic targets from the pre-sweep snapshot (StrictMode-safe).
    const sentinelTargets = panel.filter((p) => p.coverage === "active").filter((_, i) => i % 7 === 2).slice(0, 4);
    const targetIds = new Set(sentinelTargets.map((p) => p.id));

    at(1, () => {
      setSweep((s) => ({ ...s, step: 1, changed: sentinelTargets.length }));
      setPanel((prev) => prev.map((p) => (targetIds.has(p.id) ? { ...p, coverage: "pending" } : p)));
      sentinelTargets.forEach((p) => pushAudit("eligibility_sentinel", "coverage.changed", `${p.first[0]}. ${p.last} → pending`));
      pushAudit("eligibility_sentinel", "sweep.complete", `${panel.length} patients verified`);
      const _conf = panel.filter((p) => p.recon && p.recon.code).length;
      setSweep((s) => ({ ...s, conflicts: _conf }));
      pushAudit("coverage_reconciliation", "conflicts.adjudicated", `${_conf} coverage conflicts reconciled into confidence-scored states`);
    });

    at(2, () => {
      setSweep((s) => ({ ...s, step: 2 }));
      // Redetermination Predictor — recompute; nudge failed-check factor for non-active coverage
      setPanel((prev) => prev.map((p) => {
        const f = p.coverage !== "active" ? { ...p.factors, failedChecks: Math.min(3, p.factors.failedChecks + 1) } : p.factors;
        const r = scorePatient(f);
        return { ...p, factors: f, score: r.score, tier: r.tier, drivers: r.drivers, recommended: ACTION[r.tier], lastScored: "just now" };
      }));
      pushAudit("redetermination_predictor", "scores.recomputed", "100% of panel · model v1.4");
    });

    at(3, () => {
      setSweep((s) => ({ ...s, step: 3 }));
      // Patient Outreach — high+critical cohort, guardrail-gated
      const cohort = panel.filter((p) => p.tier === "high" || p.tier === "critical").length;
      const sent = Math.round(cohort * 0.82);
      setOutreachSent((n) => n + sent);
      setSweep((s) => ({ ...s, outreach: sent }));
      pushAudit("compliance_guardrail", "outbound.approved", `${sent} messages · approved templates`);
      pushAudit("patient_outreach", "campaign.sent", `${sent} reminders to high/critical cohort`);
    });

    at(4, () => {
      setSweep((s) => ({ ...s, step: 4 }));
      // Case Routing — create a few exception cases
      const crit = panel.filter((p) => p.tier === "critical").slice(0, 3);
      const newCases = crit.map((p) => ({ ...makeCase("eligibility", p, "Flagged tonight · renewal window closing", "high", 2), id: `case_sweep_${p.mrn}` }));
      setExtraCases((c) => [...newCases, ...c]);
      setSweep((s) => ({ ...s, cases: newCases.length }));
      pushAudit("case_routing_agent", "workqueue.created", `${newCases.length} eligibility cases · urgency=high`);
    });

    at(5, () => {
      setSweep((s) => ({ ...s, step: 5 }));
      pushAudit("executive_intelligence", "dashboard.refreshed", "metrics + tier distribution updated");
    });

    at(6, () => {
      setSweep((s) => ({ ...s, running: false, step: 6 }));
      pushAudit("command_orchestrator", "workflow.completed", "daily_coverage_sweep · within SLA");
      sweepingRef.current = false;
    });
  }

  const consentByMrn = useMemo(() => { const m = {}; for (const cs of recerts) m[cs.mrn] = cs; return m; }, [recerts]);
  const reviewCohort = useMemo(() => panel.filter((p) => p.medicaidId).map((p) => {
    const annualVisitDue = p.idx % 3 === 0;
    const renewalWindow = p.renewalDays <= 90;
    const due = renewalWindow || annualVisitDue;
    const trigger = renewalWindow ? "Renewal window" : annualVisitDue ? "Annual visit" : "\u2014";
    const base = due ? "review_due" : "not_due";
    const ov = reviewState[p.mrn];
    return { mrn: p.mrn, patient: `${p.first} ${p.last}`, first: p.first, last: p.last, tier: p.tier, lang: p.lang, mco: mcoOf(p), renewalDate: p.renewalDate, renewalDays: p.renewalDays, trigger, due, status: ov ? ov.status : base, reviewedDate: ov ? ov.reviewedDate : null, checklist: ov ? ov.checklist : null, note: ov ? ov.note : null };
  }), [panel, reviewState]);
  const setReview = (mrn, status, payload = {}) => {
    setReviewState((rs) => ({ ...rs, [mrn]: { status, reviewedDate: todayStr(), checklist: payload.checklist || null, note: payload.note || null } }));
    const lab = (REVIEW_STATUS[status] || {}).label || status;
    pushAudit("coverage_review", status === "review_due" ? "review.flag_set" : "review.resolved", `${mrn} \u00b7 ${lab}${payload.checklist && payload.checklist.length ? " \u00b7 " + payload.checklist.length + " item(s)" : ""} \u00b7 written back to eCW flag`, false);
  };
  const decideExemption = (mrn, decision, payload = {}) => {
    const today = todayStr();
    const pl = { ...payload, mrn };
    setPanel((ps) => ps.map((pp) => (pp.mrn === mrn && pp.probableExemption) ? { ...pp, probableExemption: applyExemptionDecision(pp.probableExemption, decision, pl, today) } : pp));
    setSelected((sel) => (sel && sel.mrn === mrn && sel.probableExemption) ? { ...sel, probableExemption: applyExemptionDecision(sel.probableExemption, decision, pl, today) } : sel);
    const evt = { confirm: "exemption.clinician_confirmed", assess: "exemption.assessment_requested", reject: "exemption.clinician_rejected" }[decision];
    const detail = decision === "confirm" ? `Element 2 impairment attested \u00b7 ${payload.evidence || "clinician exam"} \u00b7 re-verify ${payload.reverify || addDays(today, 365)}` : decision === "assess" ? "functional assessment visit requested" : `rejected \u00b7 ${payload.reason || "no impairment"}`;
    pushAudit("exemption_engine", evt, `${mrn} \u00b7 ${detail}`, true);
  };
  const visibleNav = NAV.filter(n => n.tier <= productTier);
  const viewProps = { panel, kpis, tierDist, renewalBuckets, queues, audit, agents, setAgents, sweep, runSweep, setView, selected, setSelected, reduced, env, pushAudit, outreachSent, openCount, narrow, viewerRole, decideExemption, reviewCohort, setReview, recerts, consentByMrn, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth, assumptions, setAssumptions, impact, setImpact, productTier, setProductTier, billingCases, setBillingCases, pharmacyCases, setPharmacyCases, cgQueueCases, setCgQueueCases, sessionLog, addSessionLog, routeToQueue };

  const billingOpen  = billingCases.filter(c => !c.resolved).length;
  const pharmacyOpen = pharmacyCases.filter(c => !c.pharmResolved).length;
  const caregapOpen  = cgQueueCases.filter(c => c.cgStatus !== "closed").length;

  return (
    <div style={{ fontFamily: T.sans, background: T.canvas, color: T.text, minHeight: "100vh", display: "flex", flexDirection: narrow ? "column" : "row" }}>
      <Sidebar view={view} setView={setView} narrow={narrow} visibleNav={visibleNav} badges={{ mco: openCount || null, billing: billingOpen || null, pharmacy: pharmacyOpen || null, caregap: caregapOpen || null }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", maxHeight: narrow ? "none" : "100vh" }}>
        <Topbar view={view} env={env} setEnv={setEnv} sweep={sweep} runSweep={runSweep} narrow={narrow} productTier={productTier} setProductTier={setProductTier} />
        <div style={{ flex: 1, overflowY: "auto", padding: narrow ? 12 : 20 }}>
          {view === "patientqueue" && <PatientQueue {...viewProps} />}
          {view === "execmvp" && <ExecIntelMVP {...viewProps} />}
          {view === "hr1mvp" && <HR1ImpactMVP {...viewProps} />}
          {view === "referralqueues" && <ReferralQueues {...viewProps} />}
          {view === "execroi" && <FQHCExposureROI {...viewProps} />}
          {view === "command" && <CommandCenter {...viewProps} />}
          {view === "worklist" && <PatientWorklist {...viewProps} />}
          {view === "billing"  && <BillingQueueView {...viewProps} />}
          {view === "pharmacy" && <PharmacyQueueView {...viewProps} />}
          {view === "mco" && <MCORosterView {...viewProps} />}
          {view === "revenue" && <RevenueRecoveryView {...viewProps} onRoute={routeRecon} />}
          {view === "conflicts" && <ConflictsView {...viewProps} />}
          {view === "patients" && <Patients {...viewProps} />}
          {view === "queues" && <Queues {...viewProps} />}
          {view === "roster" && <MCORosterView {...viewProps} />}
          {view === "caregap" && <CareGapView {...viewProps} />}
          {view === "threeb" && <Impact340BView {...viewProps} />}
          {view === "rx" && <RxCoverageView {...viewProps} onRoute={routeRecon} />}
          {view === "rrg" && <RevenueRecoveryView {...viewProps} onRoute={routeRecon} />}
          {view === "recert" && <RecertView {...viewProps} />}
          {view === "review" && <MedicaidReviewView {...viewProps} />}
          {view === "intake" && <IntakeView reduced={reduced} onComplete={handleIntakeComplete} setView={setView} />}
          {view === "agents" && <Agents {...viewProps} />}
          {view === "exec" && <Executive {...viewProps} />}
          {view === "impact" && <ImpactView {...viewProps} />}
          {view === "rules" && <RulesEngineView {...viewProps} />}
          {view === "health" && <DataSourceHealthView {...viewProps} />}
          {view === "audit" && <AuditView {...viewProps} />}
        </div>
      </div>
      {selected && !["conflicts","mco"].includes(view) && <PatientDrawer p={selected} onClose={() => setSelected(null)} setView={setView} onRoute={routeRecon} viewerRole={viewerRole} consent={consentByMrn[selected.mrn]} />}
    </div>
  );
}

const NAV_BADGE_COLOR = { worklist: T.indigo, billing: T.red, pharmacy: T.amber, caregap: T.green };

function Sidebar({ view, setView, narrow, badges = {}, visibleNav: navItems = NAV }) {
  const open = badges.queues || 0;
  if (narrow) {
    return (
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "10px 12px", background: T.ink, position: "sticky", top: 0, zIndex: 30 }}>
        {navItems.map((it) => {
          const badge = badges[it.key] || null;
          return (
            <button key={it.key} onClick={() => setView(it.key)} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6, background: view === it.key ? T.teal : "transparent", color: view === it.key ? "#04201F" : T.textInvLo, border: "none", borderRadius: 9, padding: "8px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", position: "relative" }}>
              <it.icon size={14} />{it.label.split(" ")[0]}
              {badge ? <span style={{ fontSize: 10, fontWeight: 800, background: NAV_BADGE_COLOR[it.key] || T.red, color: "#fff", borderRadius: 99, padding: "0px 5px", marginLeft: 2 }}>{badge}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ width: 234, flex: "0 0 234px", background: T.ink, color: T.textInv, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${T.teal}, ${T.indigo})`, display: "grid", placeItems: "center", color: "#fff" }}><ShieldCheck size={17} /></span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: .2 }}>CoverageGuard <span style={{ color: T.teal }}>IQ</span> Oklahoma</div>
            <div style={{ fontSize: 10, color: T.textInvLo, letterSpacing: .4, marginTop: 1 }}>COVERAGE INTELLIGENCE</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
        {navItems.map((it) => {
          const active = view === it.key;
          const badge = badges[it.key] || null;
          const badgeColor = NAV_BADGE_COLOR[it.key] || T.red;
          return (
            <button key={it.key} onClick={() => setView(it.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, background: active ? T.panel2 : "transparent", color: active ? "#fff" : T.textInvLo, border: "none", borderLeft: `3px solid ${active ? T.teal : "transparent"}`, borderRadius: active ? "0 9px 9px 0" : 9, padding: "10px 12px", fontSize: 13, fontWeight: active ? 700 : 600, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
              <it.icon size={16} style={{ color: active ? T.teal : T.textInvLo }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {badge ? <span style={{ fontSize: 10.5, fontWeight: 800, background: badgeColor, color: "#fff", borderRadius: 99, padding: "1px 7px" }}>{badge}</span> : null}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.line}`, fontSize: 10.5, color: T.textInvLo, lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: T.green }} /> 16 agents · human-by-exception</div>
        <div style={{ marginTop: 4, fontWeight: 800, letterSpacing: .3, color: "#D9B44A" }}>CONFIDENTIAL · PATENT PENDING</div>
        <div style={{ marginTop: 3 }}>Synthetic data only</div>
      </div>
    </div>
  );
}

function Topbar({ view, env, setEnv, sweep, runSweep, narrow, productTier, setProductTier }) {
  const label = NAV.find((n) => n.key === view)?.label || "";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: narrow ? "10px 12px" : "12px 20px", background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 20, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: narrow ? 15 : 17, fontWeight: 800, letterSpacing: .2 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: T.textLo }}>Medicaid coverage intelligence · redetermination season <span style={{ color: "#9A7A1E", fontWeight: 800 }}>· Confidential — Patent Pending</span></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        <div style={{ display: "flex", background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 9, padding: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 800, background: T.orange+"22", color: T.orange, borderRadius: 8, padding: "4px 10px", marginRight: 6, border: `1px solid ${T.orange}44` }}>Coverage Intelligence</div>
          {[["build", "Build env"], ["azure", "Azure pilot"]].map(([k, l]) => (
            <button key={k} onClick={() => setEnv(k)} style={{ fontSize: 11.5, fontWeight: 700, border: "none", cursor: "pointer", borderRadius: 7, padding: "5px 10px", background: env === k ? T.surface : "transparent", color: env === k ? T.text : T.textLo, boxShadow: env === k ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{l}</button>
          ))}
        </div>
        <button onClick={exportLog} style={{ fontSize: 11, color: "rgba(120,130,145,.7)", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>{"\u2193 Session log"}</button>
        <button onClick={runSweep} disabled={sweep.running} style={{ display: "flex", alignItems: "center", gap: 7, background: sweep.running ? T.textLo : T.ink, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: sweep.running ? "default" : "pointer" }}>
          {sweep.running ? <><Activity size={14} className="cg-spin" /> Sweeping…</> : <><Play size={14} /> Run nightly sweep</>}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Derivations + seeds
   ============================================================ */
function deriveRecon(panel) {
  const w = panel.map((p) => p.recon).filter(Boolean);
  const n = w.length || 1;
  return {
    conflicts: w.filter((r) => r.code).length,
    hiConfInactive: w.filter((r) => r.state === "Inactive — High Confidence").length,
    conflicting: w.filter((r) => r.code && r.confidence < 75).length,
    pharmacyRisk: w.filter((r) => r.state === "Pharmacy Access Risk Only" || r.code === "COV-005").length,
    revenue: w.filter((r) => r.code === "COV-007").length,
    humanEx: w.filter((r) => r.humanReview).length,
    avgConf: Math.round(w.reduce((s, r) => s + r.confidence, 0) / n),
  };
}
function deriveKPIs(panel, outreachSent) {
  const n = panel.length;
  const crit = panel.filter((p) => p.tier === "critical").length;
  const high = panel.filter((p) => p.tier === "high").length;
  const dueSoon = panel.filter((p) => p.renewalDays <= 30).length;
  const inactive = panel.filter((p) => p.coverage !== "active").length;
  const denials = panel.filter((p) => p.denial).length;
  return {
    panel: n, highCrit: high + crit, crit, dueSoon, inactive, denials,
    response: 71, retained: Math.round((1 - crit / n) * 100),
    revenue: denials * 1842 + crit * 640, outreachSent,
  };
}
function deriveTierDist(panel) {
  const o = { low: 0, moderate: 0, high: 0, critical: 0 };
  panel.forEach((p) => o[p.tier]++);
  return [["critical", o.critical], ["high", o.high], ["moderate", o.moderate], ["low", o.low]].map(([tier, count]) => ({ tier, count, fill: TIER_COLOR[tier] }));
}
function deriveRenewal(panel) {
  const b = [0, 0, 0, 0]; // <15, 15-30, 31-60, 61-120
  panel.forEach((p) => { const d = p.renewalDays; if (d < 15) b[0]++; else if (d < 30) b[1]++; else if (d < 60) b[2]++; else b[3]++; });
  return [{ label: "≤14d", v: b[0] }, { label: "15–30d", v: b[1] }, { label: "31–60d", v: b[2] }, { label: "61–120d", v: b[3] }];
}
function makeCase(queue, p, reason, urgency, ageHours) {
  const docs = queue === "intake" ? { total: 2, review: p.idx % 4 === 0 ? 1 : 0 } : null;
  return {
    id: `case_${queue}_${p.mrn}`, queue, patient: `${p.first} ${p.last}`, mrn: p.mrn, tier: p.tier,
    urgency, reason, ageHours, owner: "unassigned", docs,
    sla: queue === "exemption" ? "confirm before renewal / redetermination" : urgency === "high" ? "respond < 1 business day" : "review before renewal",
    transcript: queue === "intake" || queue === "eligibility",
    exemption: queue === "exemption" && p.probableExemption ? { category: p.probableExemption.exemption_category, rule_id: p.probableExemption.rule_id, status: p.probableExemption.clinician_confirmation_status, impairment_status: p.probableExemption.impairment_status, requires_impairment_element: p.probableExemption.requires_impairment_element, sensitive: p.probableExemption.sensitive } : null,
  };
}
function applyExemptionDecision(ex0, decision, payload, today) {
  const ex = { ...ex0 };
  if (decision === "confirm") {
    ex.clinician_confirmation_status = "clinician_confirmed";
    ex.impairment_status = "assessed_impairs";
    ex.outcome = "confirmed";
    ex.confirming_clinician = payload.clinician || "Authorized clinician";
    ex.confirmation_date = today;
    ex.impairment_statement = payload.statement || "";
    ex.evidence_basis_source = payload.evidence || "Clinician exam / attestation";
    ex.reverify_date = payload.reverify || addDays(today, 365);
    ex.documentation_note = "Clinician attestation on file";
    ex.documentation_submitted = true;
    ex.attestation_artifact = "CG-FA-01_" + (payload.mrn || "patient") + ".pdf";
  } else if (decision === "assess") {
    ex.impairment_status = "needs_visit";
    ex.clinician_confirmation_status = "documentation_needed";
    ex.documentation_note = "Functional assessment visit requested";
  } else if (decision === "reject") {
    ex.clinician_confirmation_status = "clinician_rejected";
    ex.impairment_status = "assessed_no_impair";
    ex.outcome = "rejected";
    ex.reject_reason = payload.reason || "No functional impairment established";
    ex.confirming_clinician = payload.clinician || "Authorized clinician";
    ex.confirmation_date = today;
  }
  return ex;
}
function deriveQueues(panel, extra) {
  const items = { intake: [], eligibility: [], pharmacy: [], rcm: [], care: [], exemption: [] };
  panel.forEach((p) => {
    if (p.intakeDone) items.intake.push(makeCase("intake", p, "Intake complete — ready for staff review & submission", "normal", 5 + (p.idx % 30)));
    else if (p.tier === "critical" || p.tier === "high") items.eligibility.push(makeCase("eligibility", p, p.recommended, p.tier === "critical" ? "high" : "normal", 3 + (p.idx % 40)));
    if (p.pharmacyReject) items.pharmacy.push(makeCase("pharmacy", p, "Medicaid pharmacy reject on critical medication", "high", 1 + (p.idx % 8)));
    if (p.denial) items.rcm.push(makeCase("rcm", p, "Eligibility-related claim denial · estimate PPS exposure", "normal", 8 + (p.idx % 50)));
    if (p.clinicalFlags.length && p.coverage !== "active" && (p.tier === "high" || p.tier === "critical")) items.care.push(makeCase("care", p, `Clinical risk (${p.clinicalFlags[0]}) + lapsed coverage`, "high", 2 + (p.idx % 12)));
    if (p.probableExemption && ["candidate_detected", "clinician_review_pending", "documentation_needed"].includes(p.probableExemption.clinician_confirmation_status)) {
      const ex = p.probableExemption;
      const urg = (ex.sensitive || ex.clinician_confirmation_status === "documentation_needed" || ex.impairment_status === "needs_visit") ? "high" : "normal";
      items.exemption.push(makeCase("exemption", p, `Probable exemption — ${ex.exemption_category}`, urg, 2 + (p.idx % 20)));
    }
  });
  extra.forEach((c) => { if (items[c.queue] && !items[c.queue].some((x) => x.id === c.id)) items[c.queue].unshift(c); });
  return QUEUE_DEFS.map((d) => ({ ...d, items: items[d.key] || [] }));
}
function seedAudit() {
  const rows = [
    ["command_orchestrator", "workflow.scheduled", "daily_coverage_sweep @ 02:00"],
    ["eligibility_sentinel", "sweep.complete", "72 patients verified · 6 status changes"],
    ["redetermination_predictor", "scores.recomputed", "100% of panel · model v1.4"],
    ["compliance_guardrail", "outbound.blocked", "1 message held · opt-out on record", false],
    ["patient_outreach", "campaign.sent", "39 reminders · EN/ES templates"],
    ["patient_eligibility_agent", "session.ready_for_review", "one_job pathway · M. Alvarez", true],
    ["document_readiness_agent", "document.reviewed", "paystub · status=ready"],
    ["case_routing_agent", "workqueue.created", "type=pharmacy_rescue · urgency=high"],
    ["executive_intelligence", "digest.generated", "weekly leadership digest drafted"],
    ["exemption_engine", "rule.hit", "EXR-001 \u00b7 probable medically-frail candidate \u00b7 status=clinician_review_pending", true],
    ["compliance_guardrail", "sensitive.routed", "HIV-evidence candidate \u2192 authorized compliance review; masked for general users", true],
    ["exemption_engine", "clinician.confirmed", "caregiver exemption confirmed by clinician \u00b7 documentation on file", true],
    ["exemption_engine", "note.suppressed", "negation match ('family history of') \u00b7 candidate not created"],
  ];
  return rows.map((r, i) => ({ id: uid("aud"), ts: `02:${pad(14 + i)}:0${i % 9}`, actor: r[0], action: r[1], detail: r[2], phi: r[3] || false }));
}

/* ============================================================
   VIEW · Command Center (P2-006 · Coverage Intelligence)
   ============================================================ */
function CommandCenter({ panel, billingCases, pharmacyCases, cgQueueCases, sessionLog, sweep, runSweep, setView, addSessionLog }) {
  const n = panel.length || 1;
  const [orchLog, setOrchLog] = React.useState([]);
  const [orchRunning, setOrchRunning] = React.useState(null); // null | action key

  // ── KPI derivations ──────────────────────────────────────
  const billingOpen   = billingCases.filter(function(c){ return !c.resolved; }).length;
  const pharmacyOpen  = pharmacyCases.filter(function(c){ return !c.pharmResolved; }).length;
  const caregapOpen   = cgQueueCases.filter(function(c){ return c.cgStatus !== "closed"; }).length;
  const mcoMismatch   = panel.filter(function(p){ return p.crisp && p.crisp.mcoMismatch; }).length;
  const pharmacyFlags = panel.filter(function(p){ return p.pharmacyReject; }).length;
  const lapsedCovg    = panel.filter(function(p){ return p.coverage !== "active"; }).length;
  const openItems     = panel.filter(function(p){ return p.mcoMismatch || p.pharmacyReject || p.coverage !== "active"; }).length;
  const renewal7d     = panel.filter(function(p){ return p.renewalDays <= 7; }).length;
  const resolvedCount = sessionLog.filter(function(e){ return e.action && e.action.toLowerCase().indexOf("resolved") !== -1; }).length;
  const claimsAtRisk  = billingOpen * 280 + mcoMismatch * 340;

  const Section = function({ label, children }) {
    return (
      <div>
        <div style={{fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>{label}</div>
        {children}
      </div>
    );
  };

  const KPI = function({ label, value, sub, tone, warn, onClick }) {
    return (
      <div onClick={onClick}
        style={{background:T.surface,border:"1px solid " + (warn ? tone+"44" : T.border),borderRadius:12,padding:"13px 14px",cursor:onClick?"pointer":"default",transition:"border-color .15s"}}
        onMouseEnter={function(e){ if(onClick) e.currentTarget.style.borderColor = (warn?tone:T.teal)+"88"; }}
        onMouseLeave={function(e){ if(onClick) e.currentTarget.style.borderColor = warn?tone+"44":T.border; }}>
        <div style={{fontSize:11,color:T.textLo,fontWeight:700,marginBottom:4}}>{label}</div>
        <div style={{fontSize:28,fontWeight:800,color:warn?tone:T.text,lineHeight:1}}>{value}</div>
        {sub && <div style={{fontSize:11.5,color:tone||T.textMid,fontWeight:600,marginTop:4}}>{sub}</div>}
        {onClick && <div style={{fontSize:10,color:T.teal,marginTop:5,fontWeight:700}}>&#8594; View queue</div>}
      </div>
    );
  };

  const QStrip = function({ label, count, amt, tone, onClick }) {
    return (
      <div onClick={onClick}
        style={{flex:1,minWidth:140,background:T.surface,border:"1px solid " + T.border,borderRadius:11,padding:"11px 14px",cursor:"pointer",transition:"border-color .15s"}}
        onMouseEnter={function(e){ e.currentTarget.style.borderColor = tone+"88"; }}
        onMouseLeave={function(e){ e.currentTarget.style.borderColor = T.border; }}>
        <div style={{fontSize:11,color:T.textLo,fontWeight:700,marginBottom:3}}>{label}</div>
        <div style={{fontSize:22,fontWeight:800,color:count>0?tone:T.textMid,lineHeight:1}}>{count}</div>
        {amt != null && <div style={{fontSize:11,color:T.textMid,marginTop:3}}>{amt>0?"$" + Math.round(amt/1000) + "k at risk":"none at risk"}</div>}
        {amt == null && <div style={{fontSize:11,color:T.textMid,marginTop:3}}>open cases</div>}
        <div style={{fontSize:10,color:T.teal,marginTop:4,fontWeight:700}}>&#8594; Open queue</div>
      </div>
    );
  };

  const UrgencyChip = function({ label, count, tone, onClick }) {
    return (
      <div onClick={onClick}
        style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",background:count>0?tone+"0C":T.surface2,border:"1px solid " + (count>0?tone+"44":T.border),borderRadius:9,cursor:onClick?"pointer":"default",flex:1,minWidth:160}}
        onMouseEnter={function(e){ if(onClick&&count>0) e.currentTarget.style.background=tone+"18"; }}
        onMouseLeave={function(e){ e.currentTarget.style.background=count>0?tone+"0C":T.surface2; }}>
        <div style={{width:10,height:10,borderRadius:999,background:count>0?tone:T.border,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text}}>{label}</div>
        </div>
        <div style={{fontSize:20,fontWeight:800,color:count>0?tone:T.textMid}}>{count}</div>
        {onClick && count>0 && <span style={{fontSize:12,color:T.teal}}>&#8250;</span>}
      </div>
    );
  };

  const runOrch = function(key, label, durationMs) {
    if(orchRunning) return;
    setOrchRunning(key);
    var start = Date.now();
    var timer = setInterval(function(){
      if(Date.now() - start >= durationMs){
        clearInterval(timer);
        setOrchRunning(null);
        var ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
        setOrchLog(function(l){ return [{ts:ts, action:label, result:"Complete — audit written"}].concat(l).slice(0,20); });
        if(addSessionLog) addSessionLog("Orchestrator", label + " complete.", "command");
      }
    }, 200);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── Header banner ── */}
      <div style={{background:T.ink,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>CoverageGuard IQ · Coverage Intelligence</div>
          <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Real-time coverage signal command</div>
          <div style={{fontSize:12.5,color:T.textInvLo,marginTop:3}}>
            {n + " patients · MCO reconciliation · Rx signals · claims recovery"}
            {sweep.ts ? <span style={{color:"#F5C842",fontWeight:700}}>{" · last sweep " + sweep.ts}</span> : ""}
          </div>
        </div>
        <div style={{display:"flex",gap:14,textAlign:"center"}}>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 18px"}}>
            <div style={{fontSize:36,fontWeight:800,color:claimsAtRisk>0?"#F5C842":T.teal,lineHeight:1}}>${Math.round(claimsAtRisk/1000)}k</div>
            <div style={{fontSize:11,color:T.textInvLo,fontWeight:700,marginTop:2}}>claims at risk</div>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 18px"}}>
            <div style={{fontSize:36,fontWeight:800,color:openItems>0?T.red:T.teal,lineHeight:1}}>{openItems}</div>
            <div style={{fontSize:11,color:T.textInvLo,fontWeight:700,marginTop:2}}>open items</div>
          </div>
        </div>
      </div>

      {/* ── Section 1: KPI tiles ── */}
      <Section label="Coverage intelligence snapshot · as of today">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
          <KPI label="Patients with open items"  value={fmt(openItems)}      sub="worklist action needed"              tone={T.indigo}  warn={openItems>0}    onClick={function(){ setView("worklist"); }} />
          <KPI label="Claims at risk ($)"        value={"$" + Math.round(claimsAtRisk/1000) + "k"} sub={billingOpen + " billing cases open"} tone={T.red} warn={billingOpen>0} onClick={function(){ setView("billing"); }} />
          <KPI label="MCO call needed"           value={fmt(mcoMismatch)}    sub="plan mismatch confirmed"             tone={T.orange}  warn={mcoMismatch>0}  onClick={function(){ setView("worklist"); }} />
          <KPI label="Pharmacy / 340B flags"     value={fmt(pharmacyOpen||pharmacyFlags)}  sub="plan change or lapse"  tone={T.amber}   warn={(pharmacyOpen||pharmacyFlags)>0} onClick={function(){ setView("pharmacy"); }} />
          <KPI label="CareGap open"              value={fmt(caregapOpen)}    sub="HEDIS gaps unscheduled"              tone={T.green}   warn={caregapOpen>0}  onClick={function(){ setView("caregap"); }} />
          <KPI label="Revenue at risk"           value={money(panel.filter(function(p){return p.recon&&p.recon.code;}).reduce(function(s,p){return s+((COV_META[p.recon.code]||{}).rev||0);},0))} sub="open coverage conflicts" tone={T.red} warn={true} onClick={function(){ setView("worklist"); }} />
          <KPI label="Resolved this week"        value={fmt(resolvedCount)}  sub="across all queues"                   tone={T.teal}    warn={false}           onClick={null} />
        </div>
      </Section>

      {/* ── Section 2: Queue status strip ── */}
      <Section label="Queue status · click to open">
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <QStrip label="Billing"          count={billingOpen}   amt={claimsAtRisk}   tone={T.red}     onClick={function(){ setView("billing");  }} />
          <QStrip label="Pharmacy / 340B"  count={pharmacyOpen}  amt={null}           tone={T.amber}   onClick={function(){ setView("pharmacy"); }} />
          <QStrip label="CareGap"          count={caregapOpen}   amt={null}           tone={T.green}   onClick={function(){ setView("caregap");  }} />
          <QStrip label="Patient worklist" count={openItems}     amt={null}           tone={T.indigo}  onClick={function(){ setView("worklist"); }} />
        </div>
      </Section>

      {/* ── Section 3: Urgency breakdown ── */}
      <Section label="Urgency flags · click to open worklist">
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <UrgencyChip label={"Renewal \u22647d"} count={renewal7d}     tone={T.red}    onClick={function(){ setView("worklist"); }} />
          <UrgencyChip label="MCO call needed"          count={mcoMismatch}  tone={T.orange} onClick={function(){ setView("worklist"); }} />
          <UrgencyChip label="Coverage lapsed"          count={lapsedCovg}   tone={T.red}    onClick={function(){ setView("worklist"); }} />
          <UrgencyChip label="Pharmacy flags unresolved" count={pharmacyFlags} tone={T.amber} onClick={function(){ setView("pharmacy"); }} />
        </div>
      </Section>

      {/* ── Section 4: Recent activity feed ── */}
      <Section label="Recent activity · last 10 actions across all queues">
        <div style={{background:T.ink,borderRadius:12,padding:"14px 16px",fontFamily:T.mono}}>
          {sessionLog.length === 0 ? (
            <div style={{color:T.textInvLo,fontSize:12,textAlign:"center",padding:"16px 0"}}>No activity yet — route cases from the Patient Worklist to begin.</div>
          ) : (
            sessionLog.slice(0,10).map(function(e,i){
              var qColor = e.queue==="billing"?T.red:e.queue==="pharmacy"?T.amber:e.queue==="caregap"?T.green:T.teal;
              return (
                <div key={i} style={{display:"flex",gap:10,fontSize:11.5,color:T.textInv,marginBottom:i<9?"6px":0,paddingBottom:i<9?"6px":0,borderBottom:i<9?"1px solid rgba(255,255,255,.06)":"none",flexWrap:"wrap"}}>
                  <span style={{color:T.textInvLo,flexShrink:0}}>{e.ts}</span>
                  <span style={{color:"#fff",fontWeight:700,flexShrink:0}}>{e.patient}</span>
                  <span style={{flex:1,color:T.textInv,minWidth:120}}>{e.action}</span>
                  <span style={{color:qColor,fontWeight:700,flexShrink:0,textTransform:"uppercase",fontSize:10,letterSpacing:.4}}>{e.queue}</span>
                </div>
              );
            })
          )}
        </div>
      </Section>

      {/* ── Section 5: Command Orchestrator ── */}
      <CIOrchestrator sweep={sweep} runSweep={runSweep} orchLog={orchLog} orchRunning={orchRunning} runOrch={runOrch} panel={panel} />

    </div>
  );
}

function CIOrchestrator({ sweep, runSweep, orchLog, orchRunning, runOrch, panel }) {
  const n = panel.length || 1;
  const mcoConf   = Math.round(82 + (n % 12));
  const eligConf  = Math.round(91 + (n % 7));
  const pharmConf = Math.round(88 + (n % 9));

  const steps = ["Orchestrator","MCO Reconciliation","271 Eligibility","Pharmacy Signal","Claims Analysis","Executive Report"];
  const actions = [
    { key:"sweep",    label:"Run nightly sweep",       sub:"Full reconciliation across all feeds",   ms:3200 },
    { key:"mco",      label:"Reconcile MCO rosters",   sub:"Compare eCW vs MCO roster files",        ms:2100 },
    { key:"elig",     label:"271 eligibility sweep",   sub:"Real-time eligibility on full panel",    ms:2600 },
    { key:"pharma",   label:"Flag at-risk pharmacy",   sub:"Detect plan changes via NCPDP signals",  ms:1800 },
  ];

  return (
    <div style={{background:T.ink,borderRadius:14,padding:"18px 18px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14}}>
        <div>
          <div style={{fontSize:13.5,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
            <Cpu size={16} style={{color:T.teal}}/> Command Orchestrator
          </div>
          <div style={{fontSize:11.5,color:T.textInvLo,marginTop:2}}>
            {"Coverage Intelligence agent layer" + (sweep.ts ? " · last sweep " + sweep.ts : "")}
          </div>
        </div>
        {sweep.ran && !sweep.running && (
          <div style={{display:"flex",gap:14,fontSize:11.5,color:T.textInv}}>
            <span><b style={{color:T.amber}}>{sweep.changed}</b> status changes</span>
            <span><b style={{color:T.teal}}>{sweep.outreach}</b> signals relayed</span>
            <span><b style={{color:T.red}}>{sweep.cases}</b> cases routed</span>
          </div>
        )}
      </div>

      {/* Pipeline progress */}
      <div style={{display:"flex",alignItems:"stretch",gap:0,flexWrap:"wrap",marginBottom:16}}>
        {steps.map(function(s,i){
          var done = sweep.ran && (i < sweep.step || (!sweep.running && sweep.step >= 6));
          var active = sweep.running && i === sweep.step;
          var c = done ? T.green : active ? T.teal : T.line;
          return (
            <div key={i} style={{flex:"1 1 100px",display:"flex",alignItems:"center",gap:8,minWidth:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:1}}>
                <div style={{width:"100%",display:"flex",alignItems:"center",gap:0}}>
                  <span style={{flex:1,height:2,background:i===0?"transparent":(done||active?c:T.line)}}/>
                  <span style={{width:22,height:22,borderRadius:99,background:done?T.green:active?T.teal:T.panel,display:"grid",placeItems:"center",flex:"0 0 auto",border:"1px solid " + c}}>
                    {done ? <CheckCircle2 size={13} color="#fff"/> : active ? <Activity size={12} color="#fff" className="cg-spin"/> : <span style={{width:6,height:6,borderRadius:99,background:T.textInvLo}}/>}
                  </span>
                  <span style={{flex:1,height:2,background:i===steps.length-1?"transparent":(done?T.green:T.line)}}/>
                </div>
                <span style={{fontSize:10.5,fontWeight:600,color:active?"#fff":T.textInvLo,textAlign:"center",lineHeight:1.2}}>{s}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
        {actions.map(function(a){
          var isRunning = orchRunning===a.key || (a.key==="sweep"&&sweep.running);
          var runFn = a.key==="sweep" ? runSweep : function(){ runOrch(a.key, a.label, a.ms); };
          return (
            <button key={a.key} onClick={runFn} disabled={!!orchRunning||sweep.running}
              style={{background:isRunning?T.teal:T.panel,border:"1px solid " + (isRunning?T.teal:T.line),borderRadius:10,padding:"10px 13px",textAlign:"left",cursor:(orchRunning||sweep.running)?"not-allowed":"pointer",opacity:(orchRunning||sweep.running)&&!isRunning?0.5:1}}>
              <div style={{fontSize:12.5,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:7}}>
                {isRunning ? <Activity size={13} className="cg-spin"/> : <Play size={13}/>}
                {a.label}
              </div>
              <div style={{fontSize:11,color:T.textInvLo,marginTop:3}}>{a.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Confidence scores */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:orchLog.length?14:0}}>
        {[
          {label:"MCO reconciliation",   conf:mcoConf,   color:T.teal},
          {label:"271 eligibility match", conf:eligConf,  color:T.green},
          {label:"Pharmacy signal conf.", conf:pharmConf, color:T.amber},
        ].map(function(s){
          return (
            <div key={s.label} style={{flex:1,minWidth:140,background:"rgba(255,255,255,.04)",borderRadius:9,padding:"8px 12px"}}>
              <div style={{fontSize:10.5,color:T.textInvLo,fontWeight:700,marginBottom:4}}>{s.label}</div>
              <div style={{height:5,background:T.line,borderRadius:999,overflow:"hidden",marginBottom:4}}>
                <div style={{height:"100%",width:s.conf + "%",background:s.color,borderRadius:999}}/>
              </div>
              <div style={{fontSize:12,fontWeight:800,color:s.color}}>{s.conf}% confidence</div>
            </div>
          );
        })}
      </div>

      {/* Audit trail */}
      {orchLog.length > 0 && (
        <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:12,fontFamily:T.mono}}>
          <div style={{fontSize:10,fontWeight:700,color:T.textInvLo,textTransform:"uppercase",letterSpacing:.4,marginBottom:6}}>Orchestrator audit trail</div>
          {orchLog.slice(0,5).map(function(e,i){
            return (
              <div key={i} style={{display:"flex",gap:10,fontSize:11,color:T.textInv,marginBottom:3}}>
                <span style={{color:T.textInvLo,flexShrink:0}}>{e.ts}</span>
                <span style={{flex:1}}>{e.action}</span>
                <span style={{color:T.teal,flexShrink:0}}>{e.result}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const linkBtn = { display: "inline-flex", alignItems: "center", gap: 2, background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 700, cursor: "pointer" };

/* ============================================================
   VIEW · Patients (risk panel) + explainable score drawer
   ============================================================ */

/* ══════════════════════════════════════════════════════════
   PATIENT QUEUE — unified worklist (Change 11)
   Replaces the separate Patients + Work Queues tabs.
   Navigator searches / filters / clicks a row → drawer opens.
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   REFERRAL QUEUES — downstream routing lanes (Change 10-12)
   These are the outputs of navigator interactions, not drivers.
   Each lane has a named owner. Overdue items escalate.
   Two rules: don't hold up coverage · don't lose money.
══════════════════════════════════════════════════════════ */
function ReferralQueues({ panel, queues = [], setSelected, setView }) {
  const [activeLane, setActiveLane] = React.useState("exemption");

  // Build referral lane data from existing queue data
  const lanes = React.useMemo(() => {
    const exemptionQ = queues.find(q => q.key === "exemption") || { items: [] };
    const rcmQ       = queues.find(q => q.key === "rcm")       || { items: [] };
    const careQ      = queues.find(q => q.key === "care")      || { items: [] };
    const pharmacyQ  = queues.find(q => q.key === "pharmacy")  || { items: [] };

    return [
      {
        key: "exemption",
        label: "Clinician Exemption Review",
        owner: "Clinician",
        ownerRole: "Dr. assigned clinician",
        color: T.indigo,
        icon: Stethoscope,
        rule: "Tier 3 — clinician owns · navigator routed and stepped back",
        description: "Chart shows a possible exemption. Clinician confirms both elements and signs CG-FA-01. Navigator will be notified of the outcome.",
        actionLabel: "Confirm or reject",
        items: exemptionQ.items.map(c => ({
          ...c,
          daysOut: Math.max(1, c.ageHours ? Math.floor(c.ageHours / 24) : 2),
          ownerInitials: "MD",
          overdue: c.ageHours > 72,
        })),
      },
      {
        key: "rcm",
        label: "RCM / Billing",
        owner: "Billing team",
        ownerRole: "Revenue cycle staff",
        color: T.orange,
        icon: DollarSign,
        rule: "Tier 2 — billing team owns · no patient call needed",
        description: "Claim denied but coverage was active on the date of service. Billing team rebills the correct plan. Revenue recovered without touching the patient.",
        actionLabel: "Rebill and recover",
        items: rcmQ.items.map(c => {
          const p = panel.find(x => x.mrn === c.mrn);
          return {
            ...c,
            daysOut: Math.max(1, c.ageHours ? Math.floor(c.ageHours / 24) : 3),
            ownerInitials: "RC",
            overdue: c.ageHours > 96,
            dollarValue: p ? Math.round(180 + (p.idx || 0) % 400) : 220,
          };
        }),
      },
      {
        key: "care",
        label: "Care Management",
        owner: "Care coordinator",
        ownerRole: "Clinical care team",
        color: T.teal,
        icon: Activity,
        rule: "Tier 2 — care coordinator owns the clinical piece · navigator retains coverage piece",
        description: "Patient has clinical risk flags plus lapsed or at-risk coverage. Care coordinator takes the care gap coordination. Navigator still owns the renewal.",
        actionLabel: "Coordinate care",
        items: careQ.items.map(c => ({
          ...c,
          daysOut: Math.max(1, c.ageHours ? Math.floor(c.ageHours / 24) : 1),
          ownerInitials: "CC",
          overdue: c.ageHours > 48,
        })),
      },
      {
        key: "pharmacy",
        label: "Pharmacy Auth",
        owner: "Navigator (follow-up)",
        ownerRole: "Stays in patient queue",
        color: T.amber,
        icon: Pill,
        rule: "Tier 1 — navigator follows up · stays open until auth clears",
        description: "Prior auth or formulary issue. Coverage is active but the pharmacy rejected the fill. Navigator follows up in 3 days if not cleared — may need a patient call.",
        actionLabel: "Chase the auth",
        items: pharmacyQ.items.map(c => ({
          ...c,
          daysOut: Math.max(1, c.ageHours ? Math.floor(c.ageHours / 24) : 1),
          ownerInitials: "NV",
          overdue: c.ageHours > 72,
        })),
      },
    ];
  }, [queues, panel]);

  const currentLane = lanes.find(l => l.key === activeLane) || lanes[0];
  const LIcon = currentLane.icon;
  const totalOpen = lanes.reduce((n, l) => n + l.items.length, 0);

  return (
    <div>
      {/* Two-rule banner */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, padding: "9px 13px", background: T.green + "12", border: `1px solid ${T.green}44`, borderRadius: 10, fontSize: 12.5, color: T.tealD, fontWeight: 700 }}>
          ✓ Don't hold up coverage — recert never waits for a referral
        </div>
        <div style={{ flex: 1, minWidth: 200, padding: "9px 13px", background: T.amber + "12", border: `1px solid ${T.amber}44`, borderRadius: 10, fontSize: 12.5, color: T.orange, fontWeight: 700 }}>
          $ Don't lose money — every referral has a named owner
        </div>
      </div>

      {/* Lane tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {lanes.map(lane => {
          const LI = lane.icon;
          const overdue = lane.items.filter(i => i.overdue).length;
          return (
            <button key={lane.key} onClick={() => setActiveLane(lane.key)}
              style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${activeLane === lane.key ? lane.color : T.border}`, background: activeLane === lane.key ? lane.color + "12" : T.surface, color: activeLane === lane.key ? lane.color : T.textMid, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              <LI size={14} />
              {lane.label}
              <span style={{ fontSize: 11, fontWeight: 800, background: activeLane === lane.key ? lane.color : T.border, color: activeLane === lane.key ? "#fff" : T.textMid, borderRadius: 99, padding: "0 7px" }}>{lane.items.length}</span>
              {overdue > 0 && <span style={{ fontSize: 10, fontWeight: 800, background: T.red + "20", color: T.red, borderRadius: 99, padding: "0 6px" }}>{overdue} overdue</span>}
            </button>
          );
        })}
      </div>

      {/* Lane detail */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        {/* Lane header */}
        <div style={{ padding: "13px 16px", background: currentLane.color + "10", borderBottom: `1px solid ${currentLane.color}33`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LIcon size={16} color={currentLane.color} />
              <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{currentLane.label}</span>
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 3 }}>{currentLane.description}</div>
            <div style={{ fontSize: 11, color: T.textLo, marginTop: 4, fontStyle: "italic" }}>{currentLane.rule}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textLo, textTransform: "uppercase", letterSpacing: .3, fontWeight: 700 }}>Owner</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: currentLane.color }}>{currentLane.owner}</div>
            <div style={{ fontSize: 11, color: T.textLo }}>{currentLane.ownerRole}</div>
          </div>
        </div>

        {/* Cases */}
        {currentLane.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px", color: T.textLo, fontSize: 13 }}>
            This lane is clear — no outstanding referrals.
          </div>
        ) : (
          currentLane.items.map((c, i) => {
            const pp = panel.find(x => x.mrn === c.mrn);
            return (
              <div key={c.id || i}
                onClick={() => pp && setSelected(pp)}
                onMouseEnter={e => e.currentTarget.style.background = T.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${T.surface2}`, cursor: pp ? "pointer" : "default" }}>
                {/* Urgency bar */}
                <span style={{ width: 5, height: 42, borderRadius: 99, background: c.overdue ? T.red : c.urgency === "high" ? T.orange : T.amber, flexShrink: 0 }} />
                {/* Owner avatar */}
                <div style={{ width: 30, height: 30, borderRadius: 999, background: currentLane.color + "20", border: `1px solid ${currentLane.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: currentLane.color, flexShrink: 0 }}>
                  {c.ownerInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: T.text }}>{c.patient}</span>
                    <span style={{ fontSize: 11, color: T.textLo, fontFamily: T.mono }}>{c.mrn}</span>
                    {c.overdue && <Badge c={T.red} bg={T.red + "18"}>Overdue</Badge>}
                    {c.dollarValue && <Badge c={T.green} bg={T.green + "12"}>~${c.dollarValue} recoverable</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{c.reason}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.overdue ? T.red : T.textMid }}>{c.daysOut}d in queue</div>
                  <div style={{ fontSize: 10.5, color: T.textLo }}>{currentLane.actionLabel}</div>
                </div>
                {pp && <span style={{ color: T.textLo, fontSize: 18 }}>›</span>}
              </div>
            );
          })
        )}

        {/* Lane footer */}
        {currentLane.items.length > 0 && (
          <div style={{ padding: "10px 16px", background: T.surface2, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 12, color: T.textLo }}>
              {currentLane.items.length} case{currentLane.items.length !== 1 ? "s" : ""} · {currentLane.items.filter(i => i.overdue).length} overdue · overdue items escalate to supervisor after 7 days
            </div>
            {currentLane.key === "rcm" && (
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>
                Total recoverable: ~${currentLane.items.reduce((n, i) => n + (i.dollarValue || 0), 0).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recert independence note */}
      <div style={{ marginTop: 12, padding: "10px 13px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.textLo, lineHeight: 1.6 }}>
        <b style={{ color: T.text }}>Referrals are non-blocking.</b> The recertification pipeline moves forward independently. These referrals run in parallel — coverage is never held up waiting for a clinician, a billing team, or a pharmacy auth to resolve.
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   EXECUTIVE INTEL — Coverage Intelligence (P2-007)
   Revenue protection · MCO reconciliation · Quality outcomes
══════════════════════════════════════════════════════════ */
function ExecIntelMVP({ panel, billingCases, pharmacyCases, cgQueueCases, sessionLog, setView }) {
  const n = panel.length || 1;
  const todayStr = "2026-08-23";

  // ── KPI derivations ──────────────────────────────────────
  const billingResolved   = billingCases.filter(function(c){ return c.resolved; });
  const revenueRecovered  = billingResolved.reduce(function(s,c){ return s + (c.amount||0); }, 0);
  const billingOpen       = billingCases.filter(function(c){ return !c.resolved; }).length;
  const planChangesRes    = pharmacyCases.filter(function(c){ return c.pharmResolved && !c.is340b; }).length;
  const lapseRes          = pharmacyCases.filter(function(c){ return c.pharmResolved && c.is340b; }).length;
  const hedisGapsClosed   = cgQueueCases.filter(function(c){ return c.cgStatus === "closed"; }).length;
  const cgOpen            = cgQueueCases.filter(function(c){ return c.cgStatus !== "closed"; }).length;
  const casesRouted       = billingCases.length + pharmacyCases.length + cgQueueCases.length;
  const casesResolved     = billingResolved.length + pharmacyCases.filter(function(c){ return c.pharmResolved; }).length + hedisGapsClosed;
  const resolutionRate    = casesRouted > 0 ? Math.round(casesResolved / casesRouted * 100) : 0;
  const annualized        = revenueRecovered * 52;
  const claimsAtRisk      = billingOpen * 280 + panel.filter(function(p){ return p.crisp && p.crisp.mcoMismatch; }).length * 340;

  // ── MCO payer breakdown from panel ──────────────────────
  const mcoTotals = React.useMemo(function() {
    var counts = {};
    panel.forEach(function(p) {
      var plan = (p.mco || (p.crisp && p.crisp.mcoEcw) || "Unknown");
      if (!counts[plan]) counts[plan] = { total: 0, mismatch: 0 };
      counts[plan].total++;
      if (p.crisp && p.crisp.mcoMismatch) counts[plan].mismatch++;
    });
    return Object.keys(counts).map(function(plan) {
      return { plan: plan, total: counts[plan].total, mismatch: counts[plan].mismatch };
    }).sort(function(a,b){ return b.mismatch - a.mismatch; }).slice(0, 6);
  }, [panel]);

  // ── Report state ─────────────────────────────────────────
  const [activeReport, setActiveReport] = React.useState(null);
  const [reportText,   setReportText]   = React.useState("");
  const [generating,   setGenerating]   = React.useState(false);

  var runReport = function(r) {
    setActiveReport(r.id);
    setGenerating(true);
    setReportText("");
    setTimeout(function() {
      setReportText(r.generate());
      setGenerating(false);
    }, 900);
  };

  var sep = "─".repeat(56);
  var REPORTS = [
    {
      id: "revenue_ops",
      label: "Weekly revenue recovery ops",
      audience: "CFO · Revenue cycle director",
      icon: "💰",
      color: T.red,
      desc: "Cases worked, amount recovered, open pipeline",
      generate: function() {
        return [
          "COVERAGEGUARD IQ — COVERAGE INTELLIGENCE",
          "Weekly Revenue Recovery Operations",
          "As of " + todayStr,
          sep,
          "",
          "BILLING QUEUE SUMMARY",
          "  Cases routed to billing:   " + billingCases.length,
          "  Cases resolved:            " + billingResolved.length,
          "  Revenue recovered:         $" + revenueRecovered.toLocaleString(),
          "  Open pipeline:             " + billingOpen + " cases",
          "  Claims at risk (est.):     $" + Math.round(claimsAtRisk / 1000) + "k",
          "",
          "RESOLUTION RATE",
          "  Overall rate:              " + resolutionRate + "%",
          "  Billing rate:              " + (billingCases.length > 0 ? Math.round(billingResolved.length / billingCases.length * 100) : 0) + "%",
          "",
          "PIPELINE STATUS",
          billingOpen > 0
            ? "  " + billingOpen + " cases pending — immediate action required"
            : "  Pipeline clear — no open billing cases",
          "",
          sep,
          "Generated by CoverageGuard IQ · Confidential · Patent Pending"
        ].join("\n");
      }
    },
    {
      id: "mco_recon",
      label: "MCO payer reconciliation",
      audience: "Operations director · MCO liaisons",
      icon: "🏥",
      color: T.indigo,
      desc: "Discrepancies by plan, resolution rate per plan",
      generate: function() {
        var lines = [
          "COVERAGEGUARD IQ — COVERAGE INTELLIGENCE",
          "MCO Payer Reconciliation Report",
          "As of " + todayStr,
          sep,
          "",
          "PAYER BREAKDOWN (" + n + " patients)",
        ];
        mcoTotals.forEach(function(m) {
          lines.push("  " + m.plan.padEnd(24) + m.total + " patients · " + m.mismatch + " mismatches");
        });
        lines = lines.concat([
          "",
          "RECONCILIATION STATUS",
          "  Plans reconciled daily vs eCW, Availity 271, MCO roster, CRISP",
          "  Action required on all mismatch rows above",
          "",
          "RECOMMENDED ACTION",
          "  1. Pull MCO roster files for flagged plans",
          "  2. Cross-reference with Availity 271 responses",
          "  3. Update eCW with confirmed attribution",
          "  4. Route claims to correct plan for resubmission",
          "",
          sep,
          "Generated by CoverageGuard IQ · Confidential · Patent Pending"
        ]);
        return lines.join("\n");
      }
    },
    {
      id: "pharmacy_margin",
      label: "340B margin protection",
      audience: "Pharmacy director · CFO",
      icon: "💊",
      color: T.amber,
      desc: "Plan changes caught, fills protected, margin preserved",
      generate: function() {
        return [
          "COVERAGEGUARD IQ — COVERAGE INTELLIGENCE",
          "340B Margin Protection Report",
          "As of " + todayStr,
          sep,
          "",
          "PHARMACY SIGNAL SUMMARY",
          "  Total pharmacy cases:       " + pharmacyCases.length,
          "  Plan change signals (COV-012 / Reject 69):",
          "    Flagged:                  " + pharmacyCases.filter(function(c){ return !c.is340b; }).length,
          "    Resolved:                 " + planChangesRes,
          "  Coverage lapse signals:",
          "    Flagged:                  " + pharmacyCases.filter(function(c){ return c.is340b; }).length,
          "    Recert team notified:     " + lapseRes,
          "",
          "340B ELIGIBILITY NOTE",
          "  340B eligibility is patient-based, not plan-based.",
          "  Plan changes caught here preserve fill continuity.",
          "  Unresolved plan changes risk claim rejection at point of sale.",
          "",
          "ACTION REQUIRED",
          pharmacyCases.filter(function(c){ return !c.pharmResolved; }).length > 0
            ? "  " + pharmacyCases.filter(function(c){ return !c.pharmResolved; }).length + " unresolved signals — update billing records before next fill"
            : "  All pharmacy signals resolved.",
          "",
          sep,
          "Generated by CoverageGuard IQ · Confidential · Patent Pending"
        ].join("\n");
      }
    },
    {
      id: "quality_gaps",
      label: "Quality gap closure",
      audience: "CMO · Quality director",
      icon: "📋",
      color: T.green,
      desc: "HEDIS measures closed, visit completion rate",
      generate: function() {
        var total = cgQueueCases.length;
        var closed = hedisGapsClosed;
        var rate = total > 0 ? Math.round(closed / total * 100) : 0;
        return [
          "COVERAGEGUARD IQ — COVERAGE INTELLIGENCE",
          "Quality Gap Closure Report",
          "As of " + todayStr,
          sep,
          "",
          "CAREGAP QUEUE SUMMARY",
          "  Total care gaps flagged:    " + total,
          "  Gaps closed:               " + closed,
          "  Open gaps:                 " + cgOpen,
          "  Closure rate:              " + rate + "%",
          "",
          "HEDIS IMPACT",
          "  Each closed gap contributes to HEDIS measure compliance.",
          "  MCO quality bonuses are tied to HEDIS performance.",
          "  Open gaps above represent active quality measure risk.",
          "",
          "PENDING ACTION",
          cgOpen > 0
            ? "  " + cgOpen + " care gaps open — schedule visits to close"
            : "  All flagged care gaps resolved.",
          "",
          sep,
          "Generated by CoverageGuard IQ · Confidential · Patent Pending"
        ].join("\n");
      }
    },
    {
      id: "ci_roi",
      label: "Coverage Intelligence ROI",
      audience: "CEO · Board · Investors",
      icon: "📈",
      color: T.teal,
      desc: "Revenue protected, cost per case, annualized projection",
      generate: function() {
        var costPerCase = casesResolved > 0 ? Math.round(revenueRecovered / casesResolved) : 0;
        return [
          "COVERAGEGUARD IQ — COVERAGE INTELLIGENCE",
          "Return on Investment Summary",
          "As of " + todayStr,
          sep,
          "",
          "REVENUE PROTECTION SUMMARY",
          "  Revenue recovered (to date): $" + revenueRecovered.toLocaleString(),
          "  Annualized projection:       $" + Math.round(annualized / 1000) + "k",
          "  Claims at risk (open):       $" + Math.round(claimsAtRisk / 1000) + "k",
          "  Cases resolved:              " + casesResolved + " of " + casesRouted + " routed",
          "  Revenue per resolved case:   $" + costPerCase.toLocaleString(),
          "",
          "QUEUE PERFORMANCE",
          "  Overall resolution rate:     " + resolutionRate + "%",
          "  Billing queue:               " + billingCases.length + " total · " + billingResolved.length + " resolved",
          "  Pharmacy signals:            " + pharmacyCases.length + " total · " + planChangesRes + " plan changes resolved",
          "  CareGap closures:            " + hedisGapsClosed + " HEDIS gaps closed",
          "",
          "ROI CASE",
          "  CoverageGuard CI surfaces revenue leakage that would",
          "  otherwise go undetected until denial or audit.",
          "  Annualized at current recovery rate: $" + Math.round(annualized / 1000) + "k protected.",
          "",
          sep,
          "Generated by CoverageGuard IQ · Confidential · Patent Pending"
        ].join("\n");
      }
    }
  ];

  var Tile = function({ label, value, sub, tone, onClick }) {
    return (
      <div onClick={onClick}
        style={{background:T.surface, border:"1px solid " + (tone ? tone+"33" : T.border), borderRadius:13, padding:"16px 18px", cursor:onClick?"pointer":"default"}}
        onMouseEnter={function(e){ if(onClick) e.currentTarget.style.borderColor = (tone||T.teal)+"88"; }}
        onMouseLeave={function(e){ e.currentTarget.style.borderColor = tone ? tone+"33" : T.border; }}>
        <div style={{fontSize:11, fontWeight:800, color:T.textLo, textTransform:"uppercase", letterSpacing:.4, marginBottom:6}}>{label}</div>
        <div style={{fontSize:30, fontWeight:800, color:tone||T.text, lineHeight:1}}>{value}</div>
        {sub && <div style={{fontSize:12, color:T.textMid, marginTop:6, lineHeight:1.4}}>{sub}</div>}
        {onClick && <div style={{fontSize:10, color:T.teal, marginTop:5, fontWeight:700}}>&#8594; Open queue</div>}
      </div>
    );
  };

  var MBar = function({ label, value, total, mismatch, color }) {
    var pct = total ? Math.round(value / total * 100) : 0;
    var mpct = total ? Math.round(mismatch / total * 100) : 0;
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:700, color:T.text, marginBottom:3}}>
          <span>{label}</span>
          <span style={{color:T.textMid, fontWeight:500}}>{value} patients{mismatch > 0 ? <span style={{color:T.red, fontWeight:700}}>{" · " + mismatch + " mismatch"}</span> : ""}</span>
        </div>
        <div style={{height:7, background:T.border, borderRadius:999, overflow:"hidden", position:"relative"}}>
          <div style={{height:"100%", width:pct + "%", background:color, borderRadius:999}}/>
          {mismatch > 0 && <div style={{position:"absolute", top:0, left:0, height:"100%", width:mpct + "%", background:T.red+"88", borderRadius:999}}/>}
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>

      {/* ── Header ── */}
      <div style={{background:T.ink, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
        <div>
          <div style={{fontSize:11, fontWeight:800, color:T.teal, textTransform:"uppercase", letterSpacing:.5, marginBottom:4}}>Executive Intelligence · Coverage Intelligence</div>
          <div style={{fontSize:15, fontWeight:800, color:"#fff"}}>Revenue protection outcomes · {CFG.brand}</div>
          <div style={{fontSize:12.5, color:T.textInvLo, marginTop:3}}>{"As of " + todayStr + " · " + n + " patient panel · real-time reconciliation"}</div>
        </div>
        <div style={{display:"flex", gap:12}}>
          <div style={{background:"rgba(255,255,255,.07)", borderRadius:12, padding:"10px 18px", textAlign:"center"}}>
            <div style={{fontSize:36, fontWeight:800, color:revenueRecovered>0?"#F5C842":T.teal, lineHeight:1}}>{"$" + Math.round(annualized/1000) + "k"}</div>
            <div style={{fontSize:11, color:T.textInvLo, fontWeight:700, marginTop:2}}>annualized recovery</div>
          </div>
          <div style={{background:"rgba(255,255,255,.07)", borderRadius:12, padding:"10px 18px", textAlign:"center"}}>
            <div style={{fontSize:36, fontWeight:800, color:resolutionRate>=70?T.green:resolutionRate>=40?T.amber:T.red, lineHeight:1}}>{resolutionRate + "%"}</div>
            <div style={{fontSize:11, color:T.textInvLo, fontWeight:700, marginTop:2}}>resolution rate</div>
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI tiles ── */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12}}>
        <Tile label="Revenue recovered"      value={"$" + revenueRecovered.toLocaleString()} sub={"$" + Math.round(annualized/1000) + "k annualized · " + billingResolved.length + " cases closed"} tone={T.green}  onClick={function(){ setView("billing"); }} />
        <Tile label="Plan changes resolved"  value={planChangesRes}   sub="Pharmacy fills protected · 340B margin preserved"  tone={T.amber}  onClick={function(){ setView("pharmacy"); }} />
        <Tile label="HEDIS gaps closed"      value={hedisGapsClosed}  sub={"Quality measure risk reduced · " + cgOpen + " still open"} tone={T.teal}   onClick={function(){ setView("caregap"); }} />
        <Tile label="Cases pending recovery" value={billingOpen}      sub={"$" + Math.round(claimsAtRisk/1000) + "k at risk · act now"} tone={billingOpen>0?T.red:T.green} onClick={function(){ setView("billing"); }} />
      </div>

      {/* ── Row 2: MCO breakdown + Recovery rate ── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>

        <div style={{background:T.surface, border:"1px solid " + T.border, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>MCO payer discrepancies</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>{"Patients by plan · red = mismatch confirmed"}</div>
          {mcoTotals.length === 0
            ? <div style={{color:T.textLo, fontSize:12, textAlign:"center", padding:"16px 0"}}>No panel data yet.</div>
            : mcoTotals.map(function(m) {
                return <MBar key={m.plan} label={m.plan} value={m.total} total={n} mismatch={m.mismatch} color={T.indigo}/>;
              })
          }
        </div>

        <div style={{background:T.surface, border:"1px solid " + T.border, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>Recovery performance</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>Cases routed vs resolved across all queues</div>

          {[
            {label:"Billing",          routed:billingCases.length,    resolved:billingResolved.length,    color:T.red},
            {label:"Pharmacy signals", routed:pharmacyCases.length,   resolved:planChangesRes+lapseRes,   color:T.amber},
            {label:"CareGap",          routed:cgQueueCases.length,    resolved:hedisGapsClosed,           color:T.green},
          ].map(function(row) {
            var rate = row.routed > 0 ? Math.round(row.resolved / row.routed * 100) : 0;
            return (
              <div key={row.label} style={{marginBottom:12}}>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12.5, fontWeight:700, color:T.text, marginBottom:3}}>
                  <span>{row.label}</span>
                  <span style={{color:row.color}}>{row.resolved}<span style={{color:T.textLo, fontWeight:500}}>{" / " + row.routed + " · " + rate + "%"}</span></span>
                </div>
                <div style={{height:7, background:T.border, borderRadius:999, overflow:"hidden"}}>
                  <div style={{height:"100%", width:rate + "%", background:row.color, borderRadius:999}}/>
                </div>
              </div>
            );
          })}

          <div style={{marginTop:14, padding:"9px 12px", background:T.surface2, borderRadius:9}}>
            <div style={{fontSize:11, color:T.textLo, marginBottom:2}}>Overall resolution rate</div>
            <div style={{fontSize:22, fontWeight:800, color:resolutionRate>=70?T.green:resolutionRate>=40?T.amber:T.red}}>{resolutionRate + "%"}</div>
            <div style={{fontSize:11, color:T.textMid, marginTop:1}}>{casesResolved + " resolved of " + casesRouted + " routed"}</div>
          </div>
        </div>

      </div>

      {/* ── Row 3: KPI Reports ── */}
      <div style={{border:"1px solid " + T.border, borderRadius:14, overflow:"hidden"}}>
        <div style={{background:T.ink, padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:T.teal, textTransform:"uppercase", letterSpacing:.5, marginBottom:2}}>KPI Reports</div>
            <div style={{fontSize:14, fontWeight:800, color:"#fff"}}>{"CoverageGuard IQ · On-demand reporting"}</div>
          </div>
          <div style={{fontSize:11.5, color:T.textInvLo}}>5 report types · generate · download · copy</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:0}}>
          {REPORTS.map(function(r, i) {
            var isActive = activeReport === r.id;
            return (
              <div key={r.id} onClick={function(){ runReport(r); }}
                style={{padding:"14px 16px", borderBottom:i<4?"1px solid " + T.border:"", borderRight:i%2===0?"1px solid " + T.border:"", cursor:"pointer", background:isActive?r.color+"08":T.surface}}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
                  <span style={{fontSize:22}}>{r.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:700, color:T.text}}>{r.label}</div>
                    <div style={{fontSize:11, color:T.textLo}}>{r.audience}</div>
                  </div>
                  <button onClick={function(e){ e.stopPropagation(); runReport(r); }}
                    style={{fontSize:11, fontWeight:700, color:r.color, background:r.color+"10", border:"1px solid " + r.color+"44", borderRadius:999, padding:"3px 12px", cursor:"pointer", flexShrink:0}}>
                    {generating && isActive ? "Generating\u2026" : "Generate"}
                  </button>
                </div>
                <div style={{fontSize:11.5, color:T.textMid}}>{r.desc}</div>
              </div>
            );
          })}
        </div>

        {reportText && (
          <div style={{borderTop:"1px solid " + T.border}}>
            <div style={{padding:"10px 16px", background:T.surface2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <span style={{fontSize:12, fontWeight:700, color:T.text}}>{(REPORTS.find(function(r){ return r.id===activeReport; })||{}).label + " · " + todayStr}</span>
              <div style={{display:"flex", gap:8}}>
                <button onClick={function(){
                  var blob = new Blob([reportText], {type:"text/plain"});
                  var a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "CoverageGuard_CI_" + activeReport + "_" + todayStr + ".txt";
                  a.click();
                }} style={{fontSize:11, fontWeight:700, color:T.teal, background:T.teal+"10", border:"1px solid " + T.teal+"44", borderRadius:999, padding:"3px 12px", cursor:"pointer"}}>
                  &#8595; Download .txt
                </button>
                <button onClick={function(){ navigator.clipboard && navigator.clipboard.writeText(reportText); }}
                  style={{fontSize:11, fontWeight:700, color:T.textMid, background:"none", border:"1px solid " + T.border, borderRadius:999, padding:"3px 12px", cursor:"pointer"}}>
                  Copy
                </button>
                <button onClick={function(){ setReportText(""); setActiveReport(null); }}
                  style={{fontSize:11, color:T.textLo, background:"none", border:"1px solid " + T.border, borderRadius:999, padding:"3px 12px", cursor:"pointer"}}>&#10005;</button>
              </div>
            </div>
            <pre style={{margin:0, padding:"14px 16px", fontSize:11.5, fontFamily:T.mono, color:T.text, background:T.surface, overflowX:"auto", whiteSpace:"pre", maxHeight:400, overflowY:"auto", lineHeight:1.6}}>{reportText}</pre>
          </div>
        )}
      </div>

    </div>
  );
}

function PatientQueue({ panel, setSelected, queues = [], consentByMrn = {}, recerts = [] }) {
  const [search, setSearch] = React.useState("");
  const [filt, setFilt]   = React.useState("action"); // all | high | renewal | conflict | action

  // Build a quick lookup: which queues is each patient in?
  const queueMap = React.useMemo(() => {
    const m = {};
    queues.forEach(q => q.items.forEach(c => {
      if (!m[c.mrn]) m[c.mrn] = [];
      m[c.mrn].push(q.key);
    }));
    return m;
  }, [queues]);

  // Renewal days from recert pipeline
  const renewalMap = React.useMemo(() => {
    const m = {};
    recerts.forEach(r => { if (r.mrn) m[r.mrn] = r; });
    return m;
  }, [recerts]);

  const filtered = React.useMemo(() => {
    let list = panel.filter(p => p.medicaidId || p.recon);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => `${p.first} ${p.last} ${p.mrn}`.toLowerCase().includes(q));
    }
    if (filt === "high")     list = list.filter(p => p.tier === "high" || p.tier === "critical");
    if (filt === "renewal")  list = list.filter(p => p.renewalDays <= 90);
    if (filt === "conflict") list = list.filter(p => p.recon && p.recon.code);
    if (filt === "action")   list = list.filter(p => p.tier === "high" || p.tier === "critical" || p.renewalDays <= 45 || (p.recon && p.recon.humanReview));
    return list.sort((a,b) => {
      const urgA = a.tier==="critical"?0:a.tier==="high"?1:a.tier==="moderate"?2:3;
      const urgB = b.tier==="critical"?0:b.tier==="high"?1:b.tier==="moderate"?2:3;
      return urgA - urgB || (a.renewalDays||999) - (b.renewalDays||999);
    });
  }, [panel, search, filt]);

  const FILTERS = [
    ["action","Needs action"],["high","High risk"],["renewal","Renewal ≤90d"],["conflict","Has conflict"],["all","All patients"]
  ];

  const urgBar = (tier) => {
    const c = {critical:T.red,high:T.orange,moderate:T.amber,low:T.low}[tier]||T.textLo;
    return <span style={{display:"inline-block",width:5,height:38,borderRadius:99,background:c,flexShrink:0}}/>;
  };

  const renewalBadge = (p) => {
    const d = p.renewalDays;
    if (d == null) return null;
    const c = d < 0 ? T.red : d <= 14 ? T.red : d <= 30 ? T.orange : d <= 90 ? T.amber : T.teal;
    const label = d < 0 ? `${-d}d overdue` : `Renewal ${d}d`;
    return <Badge c={c} bg={c+"18"}>{label}</Badge>;
  };

  const issuePills = (p) => {
    const pills = [];
    const qs = queueMap[p.mrn] || [];
    if (p.recon && p.recon.code) pills.push(<Badge key="conf" c={T.red} bg={T.red+"18"}>{p.recon.code}</Badge>);
    if (qs.includes("pharmacy"))  pills.push(<Badge key="rx" c={T.amber} bg={T.amber+"18"}>Pharmacy</Badge>);
    if (qs.includes("rcm"))       pills.push(<Badge key="rcm" c={T.orange} bg={T.orange+"18"}>RCM denial</Badge>);
    if (qs.includes("exemption")) pills.push(<Badge key="ex" c={T.indigo} bg={T.indigo+"18"}>Exemption pending</Badge>);
    if (qs.includes("care"))      pills.push(<Badge key="care" c={T.teal} bg={T.teal+"18"}>Care mgmt</Badge>);
    const consent = consentByMrn[p.mrn];
    if (!consent || !consent.authRep || consent.authRep === "none")
      pills.push(<Badge key="cons" c={T.textLo}>Consent needed</Badge>);
    return pills;
  };

  return (
    <div>
      {/* Search + filters */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name or MRN..."
          style={{fontSize:13,border:`1px solid ${T.border}`,borderRadius:9,padding:"7px 11px",background:T.surface,color:T.text,outline:"none",minWidth:200,flex:"0 0 auto"}}
        />
        {FILTERS.map(([k,l])=>(
          <button key={k} onClick={()=>setFilt(k)} style={{fontSize:12,fontWeight:800,border:`1px solid ${filt===k?T.teal:T.border}`,background:filt===k?T.teal:T.surface,color:filt===k?"#fff":T.textMid,borderRadius:999,padding:"6px 13px",cursor:"pointer"}}>
            {l}{filt===k&&filtered.length>0?` (${filtered.length})`:""}
          </button>
        ))}
      </div>

      {/* Patient rows */}
      {filtered.length === 0
        ? <div style={{textAlign:"center",padding:40,color:T.textLo,fontSize:13}}>No patients match this filter.</div>
        : filtered.map((p,i) => (
          <div key={p.id||p.mrn}
            onClick={()=>setSelected(p)}
            onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
            onMouseLeave={e=>e.currentTarget.style.background=T.surface}
            style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderBottom:`1px solid ${T.surface2}`,cursor:"pointer",background:T.surface,borderRadius:i===0?0:0}}>
            {urgBar(p.tier)}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:14,fontWeight:800,color:T.text}}>{p.first} {p.last}</span>
                <span style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{p.mrn}</span>
                <TierPill tier={p.tier} small />
              </div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:12,color:T.textMid}}>{p.mco||mcoOf(p)}</span>
                {renewalBadge(p)}
                {issuePills(p)}
              </div>
            </div>
            <div style={{color:T.textLo,fontSize:18,flexShrink:0}}>›</div>
          </div>
        ))
      }
      {filtered.length > 0 && (
        <div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.textLo}}>
          {filtered.length} patient{filtered.length!==1?"s":""} · click any row to open
        </div>
      )}
    </div>
  );
}

function Patients({ panel, setSelected, consentByMrn = {} }) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [win, setWin] = useState("all");
  const [wr, setWr] = useState("all");
  const rows = panel
    .filter((p) => tier === "all" || p.tier === tier)
    .filter((p) => win === "all" || (win === "30" ? p.renewalDays <= 30 : p.renewalDays <= 60))
    .filter((p) => wr === "all" || (wr === "subject" ? p.wrSubject : wr === "exposed" ? (p.wrStatus === "at_risk" || p.wrStatus === "unverified") : p.wrStatus === wr))
    .filter((p) => { const s = (p.first + " " + p.last + " " + p.mrn).toLowerCase(); return s.includes(q.toLowerCase()); })
    .sort((a, b) => b.score - a.score);
  const chip = (val, cur, set, label) => (
    <button onClick={() => set(val)} style={{ fontSize: 11.5, fontWeight: 700, border: `1px solid ${cur === val ? T.ink : T.border}`, background: cur === val ? T.ink : T.surface, color: cur === val ? "#fff" : T.textMid, borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 11px", flex: "1 1 240px", maxWidth: 360 }}>
          <Search size={15} color={T.textLo} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or MRN" style={{ border: "none", outline: "none", fontSize: 13, width: "100%", background: "transparent", color: T.text }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>{["all", "critical", "high", "moderate", "low"].map((t) => chip(t, tier, setTier, t === "all" ? "All tiers" : t[0].toUpperCase() + t.slice(1)))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[["all", "Any renewal"], ["30", "≤30d"], ["60", "≤60d"]].map(([v, l]) => chip(v, win, setWin, l))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[["all", "All work-req"], ["subject", "Subject"], ["exposed", "Exposed"], ["exempt", "Exempt"]].map(([v, l]) => chip(v, wr, setWr, l))}</div>
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: T.textLo, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>
                {["Patient", "Risk", "Score", "Coverage state", "Renewal", "Work req (H.R.1)", "Consent to represent", "SDOH", "Action", ""].map((h) => <th key={h} style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer", borderBottom: `1px solid ${T.surface2}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 700 }}>{p.first} {p.last}</div>
                    <div style={{ fontSize: 11, color: T.textLo, fontFamily: T.mono }}>{p.mrn} · {p.lang}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}><TierPill tier={p.tier} small /></td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", width: 26 }}>{p.score}</span>
                      <div style={{ width: 56 }}><MiniBar value={p.score} color={TIER_COLOR[p.tier]} /></div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 11.5, fontWeight: 700, color: p.recon.tone }}>{p.recon.state}</div><div style={{ fontSize: 10, color: T.textLo, fontFamily: T.mono }}>{p.recon.code || "sources agree"} · {p.recon.confidence}%</div></td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}><span style={{ fontWeight: 600 }}>{p.renewalDays}d</span> <span style={{ color: T.textLo, fontSize: 11 }}>{p.renewalDate.slice(5)}</span></td>
                  <td style={{ padding: "10px 14px" }}><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><WrPill status={p.wrStatus} small /><span style={{ fontSize: 10, color: T.textLo }}>{p.cadence} renewal</span></div></td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{(() => { const cst = arConsentStatus(consentByMrn[p.mrn]); return (<div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10.5, fontWeight: 800, color: cst.c, background: cst.c + "18", border: `1px solid ${cst.c}44`, borderRadius: 999, padding: "2px 8px", width: "fit-content" }}>{cst.label}</span>{cst.sub && <span style={{ fontSize: 9.5, color: T.textLo }}>{cst.sub}</span>}</div>); })()}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{p.sdoh ? (<><div style={{ fontSize: 11.5, fontWeight: 600 }}>{p.sdoh.recordedDate}</div><div style={{ fontSize: 10, fontWeight: 700, color: p.sdoh.recencyStatus === "current" ? T.green : p.sdoh.recencyStatus === "stale" ? T.amber : T.textLo }}>{p.sdoh.recencyStatus}</div></>) : <span style={{ color: T.textLo, fontSize: 11 }}>—</span>}</td>
                  <td style={{ padding: "10px 14px" }}><Badge c={TIER_COLOR[p.tier]}>{p.recommended}</Badge></td>
                  <td style={{ padding: "10px 14px", color: T.textLo }}><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>No patients match these filters.</Empty>}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Synthetic seed data · Medicaid IDs masked · no real PHI in the build environment.</div>
    </div>
  );
}

function ConfidenceRing({ value, tone }) {
  return (
    <div style={{ width: 72, height: 72, borderRadius: 99, background: `conic-gradient(${tone} ${value * 3.6}deg, ${T.border} 0deg)`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
      <div style={{ width: 56, height: 56, borderRadius: 99, background: T.surface, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: tone, fontVariantNumeric: "tabular-nums" }}>{value}<span style={{ fontSize: 11 }}>%</span></div>
          <div style={{ fontSize: 8, color: T.textLo, fontWeight: 800, letterSpacing: .3, marginTop: 1 }}>CONFIDENCE</div>
        </div>
      </div>
    </div>
  );
}
function ReconHero({ r, routed, onRoute }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${r.tone}44`, background: `linear-gradient(180deg, ${r.tone}14, ${T.surface})`, padding: 16 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <ConfidenceRing value={r.confidence} tone={r.tone} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .4, color: T.textLo, textTransform: "uppercase" }}>Coverage State</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: r.tone, lineHeight: 1.15, marginTop: 2 }}>{r.state}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
            {r.code && <Badge c={r.tone} bg={r.tone + "18"}>{r.code}</Badge>}
            <Badge c={T.textMid}>{r.pattern}</Badge>
            {r.humanReview && <Badge c={T.red} bg={T.red + "15"}>Human review</Badge>}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: T.text, marginTop: 12, lineHeight: 1.5 }}><b style={{ color: T.textMid }}>Why:</b> {r.evidence}</div>
      <div style={{ fontSize: 12.5, color: T.text, marginTop: 6, lineHeight: 1.5 }}><b style={{ color: T.textMid }}>Next best action:</b> {r.action}</div>
      {r.guardrail && <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: r.guardrail.tone, background: r.guardrail.tone + "14", padding: "4px 9px", borderRadius: 7 }}><Bell size={12} /> Outreach guardrail: {r.guardrail.label}</div>}
      {r.humanReview && <div style={{ fontSize: 11.5, color: T.red, marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}><AlertTriangle size={12} /> {r.humanReason}</div>}
      {r.route && <button onClick={onRoute} disabled={routed} style={{ ...primaryBtn, marginTop: 12, width: "100%", justifyContent: "center", background: routed ? T.green : T.ink }}>{routed ? <><CheckCircle2 size={14} /> Routed to {labelFor(r.route)}</> : <><ArrowRight size={14} /> Take recommended action — route to {labelFor(r.route)}</>}</button>}
    </div>
  );
}
function SourceEvidencePanel({ r }) {
  const relColor = { High: T.green, Medium: T.amber, Low: T.textLo, Unverified: T.textLo };
  return (
    <Card title="Source Evidence Timeline" sub="The signals CoverageGuard reconciled — not a guess" pad={0}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead><tr style={{ textAlign: "left", color: T.textLo, fontSize: 9.5, textTransform: "uppercase", letterSpacing: .4 }}>
            {["Source", "Status", "Date", "Rel.", "Evidence"].map((h) => <th key={h} style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {r.sources.map((sx, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.surface2}` }}>
                <td style={{ padding: "7px 10px", fontWeight: 700, fontFamily: T.mono, whiteSpace: "nowrap" }}>{sx.key}</td>
                <td style={{ padding: "7px 10px", fontWeight: 700 }}>{sx.status}</td>
                <td style={{ padding: "7px 10px", color: T.textMid, whiteSpace: "nowrap" }}><span style={{ fontSize: 9, color: T.textLo }}>{sx.dateType}</span><br />{sx.date}</td>
                <td style={{ padding: "7px 10px" }}><span style={{ fontSize: 10, fontWeight: 800, color: relColor[sx.reliability] || T.textMid }}>{sx.reliability}</span></td>
                <td style={{ padding: "7px 10px", color: T.textMid }}>{sx.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
function CoverageTimeline({ r }) {
  if (!r.timeline || !r.timeline.length) return null;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, marginBottom: 8, letterSpacing: .3, textTransform: "uppercase" }}>Coverage signal timeline</div>
      <div style={{ display: "flex", flexDirection: "column", borderLeft: `2px solid ${T.border}`, paddingLeft: 14, marginLeft: 4 }}>
        {r.timeline.map((e, i) => (
          <div key={i} style={{ position: "relative", paddingBottom: 10 }}>
            <span style={{ position: "absolute", left: -21, top: 3, width: 8, height: 8, borderRadius: 99, background: r.tone, border: `2px solid ${T.surface}` }} />
            <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textLo, marginRight: 8 }}>{e.d}</span>
            <span style={{ fontSize: 12.5 }}>{e.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function ExplainPanel({ r }) {
  const Row = ({ k, v, c }) => (<div style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 6 }}><span style={{ flex: "0 0 116px", color: T.textLo, fontWeight: 700 }}>{k}</span><span style={{ color: c || T.text }}>{v}</span></div>);
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 13 }}>
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, display: "flex", gap: 7, alignItems: "center" }}><Cpu size={13} color={T.teal} /> Why did CoverageGuard decide this?</div>
      <Row k="Top evidence" v={r.evidence} />
      <Row k="Contradictory" v={r.contra} c={T.textMid} />
      <Row k="Weighting" v={r.weighting} c={T.textMid} />
      <Row k="Confidence" v={r.confidence + "%"} c={r.tone} />
      {r.humanReview && <Row k="Routing trigger" v={r.humanReason} c={T.red} />}
      <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}><Lock size={11} /> Deterministic, explainable reconciliation · every decision logged to the audit trail.</div>
    </div>
  );
}
function SecondaryRisk({ p }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 13 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3 }}>Redetermination risk · supporting</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><TierPill tier={p.tier} small /><span style={{ fontSize: 18, fontWeight: 800, color: TIER_COLOR[p.tier] }}>{p.score}</span></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {p.drivers.slice(0, 3).map((d) => (
          <div key={d.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}><span>{d.label}</span><span style={{ color: T.textLo, fontFamily: T.mono }}>+{Math.round(d.c * 100)}</span></div>
            <MiniBar value={Math.round(d.c * 100 / 0.25)} color={TIER_COLOR[p.tier]} />
          </div>
        ))}
      </div>
    </div>
  );
}
function sdohWR(p) {
  if (!p.wrSubject || !p.sdoh) return null;
  const sd = p.sdoh;
  if (sd.recencyStatus !== "current") return { tone: T.amber, text: `SDOH employment screen is ${sd.recencyStatus} (recorded ${sd.recordedDate}, ${sd.recencyMonths} mo) — re-screen before relying on it for the activity rule.` };
  if (sd.emp.wr === "corroborates") return { tone: T.green, text: `SDOH screen shows ${sd.emp.label.toLowerCase()} — corroborates likely compliance. Confirm with documentation.` };
  if (sd.emp.wr === "partial") return { tone: T.amber, text: `SDOH screen shows ${sd.emp.label.toLowerCase()} — may need more hours or a second activity to reach 80/mo.` };
  return { tone: T.red, text: `SDOH screen shows ${sd.emp.label.toLowerCase()} — exposed on the activity rule; prioritize outreach + documentation help.` };
}
function SdohPanel({ p }) {
  const sd = p.sdoh;
  const rows = [["Employment", sd.emp.label], ["Housing", sd.housing[1]], ["Food", sd.food[1]], ["Transportation", sd.transportation[1]], ["Financial", sd.financial[1]]];
  const tone = sd.recencyStatus === "current" ? T.green : sd.recencyStatus === "stale" ? T.amber : T.textLo;
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 13 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3 }}>SDOH screening</span>
          <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 2 }}>Recorded {sd.recordedDate}</div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: tone, background: tone + "16", padding: "1px 8px", borderRadius: 999 }}>{sd.recencyStatus} · {sd.recencyMonths} mo</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5 }}><span style={{ color: T.textLo }}>{k}</span><span style={{ fontWeight: 700, textAlign: "right" }}>{v}</span></div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 9, display: "flex", gap: 6, alignItems: "center", lineHeight: 1.4 }}><Activity size={11} style={{ flex: "0 0 auto" }} /> Self-reported screen · contributes to risk recency-weighted ({Math.round(sd.recencyW * 100)}% of full weight) — informs support, never eligibility.</div>
    </div>
  );
}
function PatientDrawer({ p, onClose, setView, onRoute, viewerRole, consent: consent_arg }) {
  const r = p.recon;
  const [routed, setRouted] = useState(false);
  const oAllow = !r.guardrail || r.guardrail.allow;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(14,23,38,.34)" }} />
      <div style={{ position: "relative", width: "min(480px, 96vw)", background: T.surface, height: "100%", overflowY: "auto", boxShadow: "-12px 0 40px rgba(0,0,0,.18)", animation: "cgSlide .22s ease" }}>
        <div style={{ position: "sticky", top: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{p.first} {p.last}</div>
            <div style={{ fontSize: 12, color: T.textLo, fontFamily: T.mono }}>{p.mrn} · Medicaid {p.medicaidId} · {p.lang}</div>
          </div>
          <button onClick={onClose} style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: T.textMid }}><X size={16} /></button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── SECTION 1: FIX THIS NOW ── */}
          <div style={{ border: `1.5px solid ${T.red}55`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: T.red + "18", padding: "8px 13px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={T.red} />
              <span style={{ fontSize: 12, fontWeight: 800, color: T.red, textTransform: "uppercase", letterSpacing: .3 }}>Fix this now</span>
              {p.recon && p.recon.code && <Badge c={T.red}>{p.recon.code}</Badge>}
            </div>
            <div style={{ padding: "11px 13px", background: T.surface }}>
              <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.5 }}>{r.evidence || "Coverage issue detected — review the evidence below."}</div>
              <div style={{ marginTop: 9, padding: "8px 11px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: T.textLo, textTransform: "uppercase", letterSpacing: .4 }}>Do this</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginTop: 3 }}>{r.action || "Review and action required."}</div>
              </div>
              {r.guardrail && !oAllow && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: T.amber + "18", border: `1px solid ${T.amber}55`, borderRadius: 8, fontSize: 12, color: T.amber, display: "flex", gap: 6, alignItems: "center" }}>
                  <Bell size={13} /> {r.guardrail.label} — do not send a letter or text. Contact by phone or in person only.
                </div>
              )}
            </div>
          </div>

          {/* ── POSSIBLE EXEMPTION CARD (if applicable) ── */}
          {p.probableExemption && (() => {
            const ex = p.probableExemption;
            const st = EXEMPTION_STATUS[ex.clinician_confirmation_status] || EXEMPTION_STATUS.candidate_detected;
            const masked = ex.sensitive && viewerRole !== "authorized";
            return (
              <div style={{ border: `1.5px solid ${T.indigo}55`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: T.indigo + "18", padding: "8px 13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Stethoscope size={14} color={T.indigo} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: T.indigo, textTransform: "uppercase", letterSpacing: .3 }}>Possible exemption — clinician must confirm</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: st.c, background: st.c + "18", border: `1px solid ${st.c}44`, borderRadius: 999, padding: "2px 9px" }}>{st.label}</span>
                </div>
                <div style={{ padding: "11px 13px", background: T.surface }}>
                  {masked
                    ? <div style={{ fontSize: 13, color: T.textMid }}><Lock size={13} style={{verticalAlign:-2,marginRight:6}} />Sensitive — restricted to authorized reviewers.</div>
                    : <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>The chart suggests this patient may qualify as <b>{ex.exemption_category}</b>. A clinician needs to confirm — not the navigator.</div>
                  }
                  <div style={{ marginTop: 9, padding: "8px 11px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: T.textLo, textTransform: "uppercase", letterSpacing: .4 }}>Do this</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginTop: 3 }}>Tell the patient a clinician will review their chart. Do not promise they are exempt.</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textLo, marginTop: 7 }}>Already routed to Clinician Exemption Review queue. Navigator will be notified of outcome.</div>
                </div>
              </div>
            );
          })()}

          {/* ── SECTION 2: WHILE YOU HAVE THEM ── */}
          {(() => {
            const renewalDays = p.renewalDays;
            const isExempt = !p.wrSubject;
            const [consentModal, setConsentModal] = React.useState(false);
            const [consentSent, setConsentSent] = React.useState(null);
            const cst = arConsentStatus(consent_arg);
            const consentOk = cst.key === "granted";
            const renewalLabel = renewalDays < 0 ? `${-renewalDays}d overdue` : renewalDays <= 14 ? `${renewalDays}d — urgent` : `${renewalDays} days`;
            const renewalColor = renewalDays < 0 ? T.red : renewalDays <= 14 ? T.red : renewalDays <= 30 ? T.orange : renewalDays <= 90 ? T.amber : T.teal;

            const CheckRow = ({label, done, note, verifiedDate, stale, onGotIt, customAction}) => {
              const dateColor = stale ? T.orange : T.textLo;
              return (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",borderBottom:`1px solid ${T.border}`,background:done&&!stale?T.surface:stale?T.orange+"08":T.amber+"0A"}}>
                <div style={{width:20,height:20,borderRadius:999,background:done&&!stale?T.green+"20":stale?T.orange+"20":T.surface,border:`1px solid ${done&&!stale?T.green:stale?T.orange:T.amber}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {done&&!stale?<CheckCircle2 size={12} color={T.green}/>:stale?<AlertTriangle size={12} color={T.orange}/>:<Circle size={12} color={T.amber}/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2,flexWrap:"wrap"}}>
                    <span style={{fontSize:11.5,color:done&&!stale?T.textLo:stale?T.orange:T.amber}}>{done?stale?"On file — may be stale":"On file":note}</span>
                    {verifiedDate&&<span style={{fontSize:11,color:dateColor,fontFamily:T.mono,background:dateColor+"14",border:`1px solid ${dateColor}33`,borderRadius:6,padding:"1px 7px"}}>verified {verifiedDate}</span>}
                    {stale&&<span style={{fontSize:11,color:T.orange,fontWeight:700}}>re-verify</span>}
                  </div>
                </div>
                {customAction==="consent" ? (!done||stale ? <button onClick={()=>setConsentModal&&setConsentModal(true)} style={{fontSize:11,padding:"3px 10px",border:"1px solid #5B6CC966",borderRadius:999,background:"#5B6CC918",color:"#534AB7",cursor:"pointer",flexShrink:0,fontWeight:700}}>Send form</button> : null) : customAction || ((!done||stale)&&onGotIt&&<button onClick={onGotIt} style={{fontSize:11,padding:"3px 10px",border:"1px solid rgba(200,160,0,.4)",borderRadius:999,background:"transparent",color:stale?"#CC7A22":"#D4A017",cursor:"pointer",flexShrink:0}}>Got it</button>)}
              </div>
            );};

            // Derive realistic verification dates from patient data
            const consentRec = consent_arg && consent_arg.authRepRec;
            const consentDate = consentRec ? (consentRec.effectiveDate || consentRec.capturedDate) : null;
            const consentStale = consentDate ? (() => { try { const d = new Date(consentDate); return (Date.now()-d.getTime()) > 365*24*60*60*1000; } catch(e){ return false; } })() : false;

            // Synthetic dates seeded from patient index so they're stable per patient
            const seed = (p.idx || 0);
            const dOff = (days) => { const d = new Date("2026-08-22"); d.setDate(d.getDate()-days); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
            const idDate      = dOff(30  + (seed % 60));
            const incomeDate  = dOff(45  + (seed % 90));   const incomeStale = (45 + (seed%90)) > 180;
            const residDate   = dOff(120 + (seed % 120));  const residStale  = (120+(seed%120)) > 180;
            const contactDate = dOff(14  + (seed % 30));
            const wrDate      = p.wrStatus==="compliant" ? dOff(20 + (seed%40)) : null;
            const exDate      = p.probableExemption?.evidence_date || null;

            const items = [
              {label:"Consent to represent",
               done:consentOk,
               note:"Capture now — 42 CFR 435.923",
               verifiedDate: consentDate || null,
               stale: consentStale,
               customAction: "consent"},
              {label:"Identity confirmed",
               done:true,
               note:"Verified",
               verifiedDate: idDate,
               stale: false},
              {label:isExempt?"Exemption documented":"Work hours / activity (80 hrs/mo)",
               done:isExempt?(p.probableExemption?.clinician_confirmation_status==="clinician_confirmed"):p.wrStatus==="compliant",
               note:isExempt?"Pending clinician confirmation":"Ask for pay stub, letter, or hours log",
               verifiedDate: isExempt ? exDate : wrDate,
               stale: false},
              {label:"Income verified",
               done: incomeDate && !incomeStale,
               note:"Ask or check wage data (ex parte first)",
               verifiedDate: incomeDate,
               stale: incomeStale},
              {label:"Residency proof",
               done: residDate && !residStale,
               note:"Utility bill or lease",
               verifiedDate: residDate,
               stale: residStale},
              {label:"Household changes",
               done:false,
               note:"Any changes since last renewal?",
               verifiedDate: null,
               stale: false},
              {label:"Contact info current",
               done:true,
               note:"Confirmed",
               verifiedDate: contactDate,
               stale: false},
            ];
            const doneCount = items.filter(i=>i.done).length;

            return (
              <div>
              {consentModal && (
                <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.45)"}} onClick={()=>setConsentModal(false)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,90vw)",boxShadow:"-4px 4px 32px rgba(0,0,0,.18)"}}>
                    <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>Send consent form — CG-AR-01</div>
                    <div style={{fontSize:12.5,color:T.textMid,marginBottom:16,lineHeight:1.5}}>Choose how to send the form to <b>{p.first} {p.last}</b>. They sign and return — you submit on their behalf once signed.</div>
                    {consentSent ? (
                      <div style={{padding:"12px 14px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:10,marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.tealD}}>
                          {consentSent==="sms"?"SMS sent — patient will receive a link to sign":
                           consentSent==="email"?"Email sent — patient will receive the form to sign and return":
                           consentSent==="mia"?"Mia push sent — patient will see it in their app":
                           "PDF ready — print and collect signature in person"}
                        </div>
                        <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>Verbal consent logged · signature pending · follow-up in 14 days if not returned</div>
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                        {[
                          {key:"sms",      label:"Text message",  sub:`Link to ${p.first}'s phone · signs online · fastest`},
                          {key:"email",    label:"Email",         sub:"PDF attachment · patient prints, signs and returns"},
                          {key:"mia",      label:"Mia app",       sub:"Push notification · in-app signature · no paper"},
                          {key:"download", label:"Download PDF",  sub:"Print and sign in person · navigator uploads signed copy"},
                        ].map(opt=>(
                          <button key={opt.key} onClick={()=>setConsentSent(opt.key)}
                            style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 14px",border:`1px solid ${T.border}`,borderRadius:10,background:T.surface,cursor:"pointer",textAlign:"left",width:"100%"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{opt.label}</div>
                              <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>{opt.sub}</div>
                            </div>
                            <span style={{color:T.tealD,fontSize:16,marginTop:2}}>›</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      {consentSent && <button onClick={()=>setConsentModal(false)} style={{...primaryBtn,background:T.teal}}>Done</button>}
                      <button onClick={()=>{setConsentModal(false);setConsentSent(null);}} style={ghostBtn}>{consentSent?"Close":"Cancel"}</button>
                    </div>
                    <div style={{fontSize:10.5,color:T.textLo,marginTop:10,lineHeight:1.5}}>Voluntary, revocable designation · 42 CFR 435.923 · Full controls in Recertification tab.</div>
                  </div>
                </div>
              )}
              <div style={{border:`1px solid ${T.borderHi}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{background:T.surface2,padding:"8px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <ClipboardCheck size={14} color={T.textMid}/>
                    <span style={{fontSize:12,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3}}>While you have them — renewal in <span style={{color:renewalColor}}>{renewalLabel}</span></span>
                  </div>
                  <span style={{fontSize:11,color:doneCount===items.length?T.green:T.textLo,fontWeight:700}}>{doneCount} of {items.length} done</span>
                </div>
                {items.map((it,i)=><CheckRow key={i} {...it}/>)}
              </div>
              </div>
            );
          })()}

          {/* ── ACTION BUTTONS ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={!oAllow} onClick={() => { if (oAllow) { onClose(); setView("intake"); } }} style={{ ...primaryBtn, opacity: oAllow ? 1 : .45, cursor: oAllow ? "pointer" : "not-allowed" }} title={oAllow ? "" : "Suppressed by CRISP outreach guardrail"}><MessageSquare size={14} /> Start intake</button>
            <button disabled={!oAllow} style={{ ...ghostBtn, opacity: oAllow ? 1 : .45, cursor: oAllow ? "pointer" : "not-allowed" }}><Send size={14} /> Send outreach</button>
            <button style={ghostBtn}><AlertTriangle size={14} /> Escalate</button>
          </div>

          {/* ── AUDIT TOGGLE ── */}
          {(() => {
            const [show, setShow] = React.useState(false);
            return (
              <div>
                <button onClick={()=>setShow(s=>!s)} style={{background:"none",border:"none",color:T.textLo,fontSize:12,cursor:"pointer",padding:0}}>
                  {show?"Hide full detail ↑":"See full detail ↓"}
                </button>
                {show && (
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:12}}>
                    <ReconHero r={r} routed={routed} onRoute={() => { if (r.route && onRoute) { onRoute(p, r.route); setRouted(true); } }} />
                    {p.sdoh && <SdohPanel p={p} />}
                    <SecondaryRisk p={p} />
                    <CoverageTimeline r={r} />
                    <SourceEvidencePanel r={r} />
                    <ExplainPanel r={r} />
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
function Fact({ label, value }) {
  return <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 11px" }}>
    <div style={{ fontSize: 10.5, color: T.textLo, textTransform: "uppercase", letterSpacing: .3, fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 12.5, marginTop: 3, fontWeight: 600 }}>{value}</div>
  </div>;
}
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 7, background: T.ink, color: "#fff", border: "none", borderRadius: 9, padding: "9px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 7, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const drawerInput = { width: "100%", boxSizing: "border-box", fontSize: 12.5, fontWeight: 600, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 10px", background: T.surface, marginBottom: 8, color: T.text, outline: "none" };

function ConflictsView({ panel, routeToQueue }) {
  const rosterCases = React.useMemo(() => buildRosterCases(panel), [panel]);
  const worklist    = React.useMemo(() => buildWorklist(panel, rosterCases), [panel, rosterCases]);
  const [covFilter, setCovFilter] = useState(null);
  const NOW = "Aug 24 · 09:47";

  const covCounts = {};
  worklist.forEach(p => { if(p.recon?.code) covCounts[p.recon.code] = (covCounts[p.recon.code]||0)+1; });

  // Severity color for a taxonomy entry
  const sevColor = (t) => {
    const s = t.state||"";
    if(s.includes("Inactive")||s.includes("Critical")||s.includes("Possible Coverage Loss")) return T.red;
    if(s.includes("Active Today")||s.includes("Rebilling")) return T.teal;
    if(s.includes("MCO Attribution")||s.includes("Dual Eligible")) return T.indigo;
    if(s.includes("Monitor Only")) return T.textMid;
    return T.amber;
  };

  const conflictRows = worklist.filter(p => p.recon?.code);
  const filtered     = covFilter ? conflictRows.filter(p => p.recon.code === covFilter) : conflictRows;

  const SOURCES = [
    {label:"eCW / EMR",      ts:NOW},
    {label:"Availity 271",   ts:NOW},
    {label:"MCO roster",     ts:"Aug 24 · 08:15"},
    {label:"CRISP",          ts:"Aug 24 · 06:30"},
    {label:"Pharmacy rejects",ts:"Aug 24 · 09:47"},
    {label:"RCM denials",    ts:"Aug 23 · 23:59"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Header */}
      <div style={{background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:14,padding:"14px 18px"}}>
        <div style={{fontSize:11,fontWeight:800,color:T.indigo,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Coverage conflicts</div>
        <div style={{fontSize:15,fontWeight:800,color:T.text}}>15 conflict types · multi-source reconciliation engine</div>
        <div style={{fontSize:12,color:T.textMid,marginTop:3}}>{"COV-001\u2013COV-017 · eCW · Availity 271 · MCO roster · CRISP · pharmacy rejects · RCM denials"}</div>
      </div>

      {/* Taxonomy grid */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,fontWeight:700,color:T.text}}>Conflict taxonomy — COV-001 through COV-017</span>
          {covFilter&&<button onClick={()=>setCovFilter(null)} style={{fontSize:11,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"2px 10px",cursor:"pointer"}}>{"Clear filter"}</button>}
        </div>
        <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {CONFLICT_TAXONOMY.map(t=>{
            const tone   = sevColor(t);
            const cnt    = covCounts[t.code]||0;
            const active = covFilter===t.code;
            return (
              <div key={t.code} onClick={()=>setCovFilter(active?null:t.code)}
                style={{border:`1px solid ${active?tone:T.border}`,background:active?tone+"0C":T.surface,borderRadius:9,padding:"8px 10px",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:"monospace",color:tone}}>{t.code}</span>
                  {cnt>0&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:tone,borderRadius:999,padding:"1px 5px"}}>{cnt}</span>}
                </div>
                <div style={{fontSize:10.5,color:T.textMid,lineHeight:1.4,marginBottom:3}}>{t.pattern}</div>
                <div style={{fontSize:10,fontWeight:700,color:tone,lineHeight:1.3}}>{t.state}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Worklist */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{"Patient conflict worklist · "}{filtered.length}{" patients"}</span>
          <span style={{fontSize:11.5,color:T.textLo}}>{"Click a row to open in Patient worklist"}</span>
        </div>
        {/* Col headers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px 180px 70px 220px 90px",padding:"7px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`}}>
          {["Patient","COV code","Open issues","At risk","Recommended action","Rev at risk"].map(h=>(
            <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
          ))}
        </div>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {filtered.map((p,i)=>{
            const tone  = p.recon?.tone||T.textMid;
            return (
              <div key={p.mrn}
                style={{display:"grid",gridTemplateColumns:"1fr 90px 180px 70px 220px 90px",padding:"10px 14px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",background:T.surface,borderLeft:`3px solid ${tone}`}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.first} {p.last}</div>
                  <div style={{fontSize:11,color:T.textLo,fontFamily:"monospace"}}>{p.mrn} · {"renewal "}{p.renewalDays}{"d"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:"monospace",color:tone,background:tone+"12",border:`1px solid ${tone}44`,borderRadius:5,padding:"2px 7px"}}>{p.recon.code}</span>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                  {p.issues.slice(0,3).map(iss=>(
                    <span key={iss.type} style={{fontSize:10.5,fontWeight:700,color:iss.color,background:iss.color+"12",border:`1px solid ${iss.color}44`,borderRadius:4,padding:"1px 6px"}}>{iss.label}</span>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:p.claimAmt>0?T.red:T.textLo}}>{p.claimAmt>0?("$"+p.claimAmt.toLocaleString()):"—"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:11,color:p.urgency===1?T.red:p.urgency===2?T.orange:T.textMid,lineHeight:1.3}}>{p.recon&&p.recon.code ? ((COV_META[p.recon.code]||{}).action || p.nextAction) : p.nextAction}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:p.recon&&p.recon.code&&(COV_META[p.recon.code]||{}).rev>0?T.red:T.textLo}}>{p.recon&&p.recon.code&&(COV_META[p.recon.code]||{}).rev>0 ? money((COV_META[p.recon.code]||{}).rev) : "\u2014"}</span>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{padding:32,textAlign:"center",color:T.textLo,fontSize:13}}>
              {covFilter?"No patients with "+covFilter+" active.":"No patients with active conflicts."}
            </div>
          )}
        </div>
      </div>

      {/* Source evidence strip */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 16px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>{"The signals CoverageGuard reconciled — not a guess"}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {SOURCES.map(s=>(
            <div key={s.label} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 11px"}}>
              <div style={{fontSize:11.5,fontWeight:700,color:T.text}}>{s.label}</div>
              <div style={{fontSize:10.5,color:T.textLo,marginTop:1}}>{"Last sync: "}{s.ts}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:T.textLo,marginTop:10,display:"flex",alignItems:"center",gap:5}}>
          <Lock size={11}/>
          {"Deterministic, explainable reconciliation · every decision logged · synthetic demo data"}
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   VIEWS · downstream modules (all keyed off the reconciled coverage state)
   ============================================================ */
const MCOS = ["SoonerCare Choice", "UnitedHealthcare Community", "Humana Healthy Horizons", "Blue Cross Blue Shield OK", "Aetna Better Health", "Oklahoma Complete Health", "CommunityCare", "GlobalHealth"];
const mcoOf = (p) => MCOS[p.idx % MCOS.length];
const mcoNew = (p) => MCOS[(p.idx + 3) % MCOS.length];
const CARE_GAP = {
  "Diabetes": "HbA1c poor control >9% · HEDIS HBD",
  "Hypertension": "Controlling high blood pressure · HEDIS CBP",
  "Behavioral health": "Depression follow-up · HEDIS FUM",
  "HIV": "HIV viral-load suppression · HRSA UDS",
  "Pregnancy": "Prenatal & postpartum care · HEDIS PPC",
  "Asthma": "Asthma medication ratio · HEDIS AMR",
};
const RX_MARGIN = { "Diabetes": 280, "HIV": 420, "Behavioral health": 160, "Asthma": 90, "Hypertension": 70, "Pregnancy": 60 };
const marginOf = (p) => { const m = (p.clinicalFlags || []).reduce((a, f) => a + (RX_MARGIN[f] || 0), 0); return m || 120; };

function ModHeader({ tone, kicker, line }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${tone}33`, background: `linear-gradient(180deg, ${tone}12, ${T.surface})`, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, color: tone, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5, maxWidth: 820 }}>{line}</div>
    </div>
  );
}
function ModTable({ cols, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ textAlign: "left", color: T.textLo, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .4 }}>
          {cols.map((c) => <th key={c} style={{ padding: "10px 13px", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", fontWeight: 700 }}>{c}</th>)}
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
const tdC = { padding: "9px 13px", verticalAlign: "top" };
const rowHover = { cursor: "pointer", borderBottom: `1px solid ${T.surface2}` };
const onRowEnter = (e) => (e.currentTarget.style.background = T.surface2);
const onRowLeave = (e) => (e.currentTarget.style.background = "transparent");

// ── COV codes for MCO mismatches ──
const MCO_DISC_TYPES = {
  wrong_plan:    { label:"Wrong plan",      color:T.red,     sla:24, action:"Update eCW enrollment record" },
  terminated:    { label:"Terminated",      color:T.orange,  sla:48, action:"Verify with State / MCO" },
  not_enrolled:  { label:"Not enrolled",    color:T.orange,  sla:72, action:"Contact MCO enrollment" },
  dual_mco:      { label:"Dual MCO roster", color:T.textMid, sla:96, action:"Identify primary MCO \u00b7 call both plans \u00b7 notify State" },
  dual_eligible: { label:"Dual eligible",   color:T.indigo,  sla:0,  action:"Bill Medicare primary \u00b7 work requirement exempt" },
};

function buildRosterCases(panel) {
  const rng2 = mulberry32(42);
  const DISC = ["wrong_plan","terminated","not_enrolled","dual_mco","dual_eligible"];
  return panel
    .filter(p => p.crisp?.mcoMismatch || rng2() < 0.18)
    .slice(0,16)
    .map((p,i) => {
      const dtype = DISC[i % DISC.length];
      const disc  = MCO_DISC_TYPES[dtype];
      const ecwPlan = mcoOf(p);
      const truePlan = mcoNew(p);
      const openHrs = Math.floor(rng2()*96)+1;
      const claimsAtRisk = dtype==="dual_eligible" ? 0 : Math.floor(rng2()*5+1);
      const claimAmt = dtype==="dual_eligible" ? 0 : Math.floor(rng2()*3000+500);
      const status = dtype==="dual_eligible" ? "open"
                   : openHrs > disc.sla*1.5 ? "overdue"
                   : openHrs > disc.sla ? "due_today"
                   : i % 4 === 3 ? "billing" : "open";
      const blocker = dtype==="wrong_plan"   ? "MCO confirmation"
                    : dtype==="terminated"   ? "State portal verify"
                    : dtype==="not_enrolled" ? "MCO enrollment call"
                    : dtype==="dual_mco"     ? "Primary MCO ID"
                    : "Medicare coordination";
      const waitOn  = dtype==="wrong_plan"   ? truePlan
                    : dtype==="terminated"   ? "CRISP / MDH"
                    : dtype==="not_enrolled" ? ecwPlan+" enrollment"
                    : dtype==="dual_mco"     ? "MCO eligibility"
                    : "Medicare + Medicaid";
      const cov = dtype==="dual_mco" ? "COV-016"
                : dtype==="dual_eligible" ? "COV-017"
                : "COV-00"+(7+i%3);
      return { id:"rcase_"+p.mrn, mrn:p.mrn, patient:p.first+" "+p.last,
               first:p.first, last:p.last, tier:p.tier, renewalDays:p.renewalDays,
               ecwPlan, truePlan, dtype, disc, openHrs, claimsAtRisk, claimAmt,
               status, blocker, waitOn, cov,
               isDualEligible: dtype==="dual_eligible",
               auditLog:[
                 {ts:"Aug 24 \u00b7 09:14", msg:"Roster mismatch detected \u00b7 "+cov+" \u00b7 confidence "+(88+i%8)+"%"},
                 {ts:"Aug 24 \u00b7 09:15", msg:"Case opened \u00b7 routed to navigator queue"},
               ],
             };
    });
}

// ── MCO phone directory ──
const MCO_PHONES = {
  "Wellpoint (Amerigroup)":         "(800) 454-3730",
  "CareFirst Community":            "(800) 730-8530",
  "UnitedHealthcare Community":     "(800) 903-5253",
  "Priority Partners":              "(800) 654-9728",
  "MedStar Family Choice":          "(800) 261-3371",
  "State Medicaid Plan":       "(800) 953-8854",
  "Aetna Better Health":            "(866) 444-5359",
  "Jai Medical Systems":            "(888) 524-1999",
};

// ── Build unified patient worklist from panel ──
function buildWorklist(panel, rosterCases) {
  return panel.map(p => {
    const rc = (rosterCases||[]).filter(c => c.mrn === p.mrn);
    const hasWrongPlan    = rc.some(c => c.dtype === "wrong_plan");
    const hasTerminated   = rc.some(c => c.dtype === "terminated");
    const hasNotEnrolled  = rc.some(c => c.dtype === "not_enrolled");
    const hasDualMco      = rc.some(c => c.dtype === "dual_mco");
    const hasDualEligible = rc.some(c => c.dtype === "dual_eligible");
    const hasRxReject     = !!p.pharmacyReject;
    const has340B         = p.crisp?.mcoMismatch || hasWrongPlan;
    const claimAmt        = rc.reduce((s,c)=>s+(c.claimAmt||0),0);
    const claimsCount     = rc.reduce((s,c)=>s+(c.claimsAtRisk||0),0);
    const mco             = mcoOf(p);
    const truePlan        = hasWrongPlan ? mcoNew(p) : mco;

    const issues = [
      hasWrongPlan    && { type:"wrong_plan",    label:"Wrong plan",       color:T.red,     priority:1 },
      hasTerminated   && { type:"terminated",    label:"Terminated",       color:T.orange,  priority:2 },
      hasNotEnrolled  && { type:"not_enrolled",  label:"Not enrolled",     color:T.orange,  priority:2 },
      hasDualEligible && { type:"dual_eligible", label:"Dual eligible",    color:T.indigo,  priority:2 },
      hasDualMco      && { type:"dual_mco",      label:"Dual MCO roster",  color:T.textMid, priority:3 },
      hasRxReject     && { type:"rx_reject",     label:"Rx reject",        color:T.indigo,  priority:3 },
      has340B&&!hasWrongPlan && { type:"b340",   label:"340B at risk",     color:T.teal,    priority:3 },
    ].filter(Boolean).sort((a,b)=>a.priority-b.priority);

    if(!issues.length) return null;

    const urgency = issues[0]?.priority || 9;
    const nextAction = hasWrongPlan||hasTerminated ? "Call MCO"
                     : hasNotEnrolled ? "Enroll with MCO"
                     : hasDualEligible ? "Bill Medicare primary"
                     : hasRxReject    ? "Call pharmacy"
                     : "Review";
    const needsMcoCall = hasWrongPlan||hasTerminated||hasNotEnrolled||hasDualMco;

    return { ...p, issues, urgency, nextAction, needsMcoCall,
             claimAmt, claimsCount, truePlan, mco,
             isDualEligible: hasDualEligible,
             rosterCases: rc };
  }).filter(Boolean).sort((a,b)=>a.urgency-b.urgency||a.renewalDays-b.renewalDays);
}

function PatientWorklist({ panel, routeToQueue }) {
  const [rosterCases]   = React.useState(() => buildRosterCases(panel));
  const [worklist]      = React.useState(() => buildWorklist(panel, buildRosterCases(panel)));
  const [sel, setSel]   = React.useState(null);
  const [search, setSearch]   = React.useState("");
  const [filter, setFilter]   = React.useState("all");
  const [noteText, setNoteText]   = React.useState("");
  const [logByMrn, setLogByMrn]   = React.useState({});
  const [pendingModal, setPendingModal] = React.useState(null);
  const [pendingReason, setPendingReason] = React.useState("");
  const [pendingNote, setPendingNote] = React.useState("");
  const [pendingByMrn, setPendingByMrn] = React.useState({});
  const [routeModal, setRouteModal]   = React.useState(null);
  const [routeTarget, setRouteTarget] = React.useState("");
  const [routedMrns, setRoutedMrns]   = React.useState({});
  const [updateLog, setUpdateLog]     = React.useState([]);
  const [showTaxonomy, setShowTaxonomy] = React.useState(false);
  const [covFilter, setCovFilter]       = React.useState(null);
  const [showExplain, setShowExplain]   = React.useState(false);

  const selPt = worklist.find(p=>p.mrn===sel)||null;

  const filtered = worklist.filter(p => {
    if(routedMrns[p.mrn]) return false;
    if(covFilter) return p.recon?.code === covFilter;
    if(search) {
      const q = search.toLowerCase();
      return p.first.toLowerCase().includes(q)||p.last.toLowerCase().includes(q)||p.mrn.toLowerCase().includes(q);
    }
    if(filter==="urgent")        return p.urgency===1;
    if(filter==="mco")           return p.needsMcoCall;
    if(filter==="claims")        return p.claimAmt>0;
    if(filter==="rx")            return p.issues.some(i=>i.type==="rx_reject");
    if(filter==="dual_eligible") return p.isDualEligible;
    return true;
  });

  const urgentN  = worklist.filter(p=>!routedMrns[p.mrn]&&p.urgency===1).length;
  const mcoN     = worklist.filter(p=>!routedMrns[p.mrn]&&p.needsMcoCall).length;
  const claimsN  = worklist.filter(p=>!routedMrns[p.mrn]&&p.claimAmt>0).length;
  const rxN      = worklist.filter(p=>!routedMrns[p.mrn]&&p.issues.some(i=>i.type==="rx_reject")).length;
  const dualEligN = worklist.filter(p=>!routedMrns[p.mrn]&&p.isDualEligible).length;
  const totalAmt = worklist.filter(p=>!routedMrns[p.mrn]).reduce((s,p)=>s+p.claimAmt,0);

  const covCounts = {};
  worklist.forEach(p => { if(p.recon?.code) covCounts[p.recon.code] = (covCounts[p.recon.code]||0)+1; });

  const logAction = (mrn, text) => {
    const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setLogByMrn(l=>({...l,[mrn]:[...(l[mrn]||[]),{ts,msg:text}]}));
    setUpdateLog(u=>[{ts,patient:worklist.find(p=>p.mrn===mrn)?.first+" "+worklist.find(p=>p.mrn===mrn)?.last,action:text},...u]);
  };

  const FiltBtn = ({k,label,count,color}) => (
    <button onClick={()=>{setFilter(k);setSel(null);}}
      style={{fontSize:11,fontWeight:700,padding:"4px 11px",borderRadius:999,cursor:"pointer",
              border:`1px solid ${filter===k?(color||T.indigo):T.border}`,
              background:filter===k?(color||T.indigo)+"14":"none",
              color:filter===k?(color||T.indigo):T.textMid}}>
      {label}{count>0?` · ${count}`:""}
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{label:"Patients with open items",val:worklist.filter(p=>!routedMrns[p.mrn]).length,color:T.text},
          {label:"Urgent (MCO / plan issue)",val:urgentN,color:T.red},
          {label:"MCO call needed",val:mcoN,color:T.orange},
          {label:"Claims at risk",val:`$${(totalAmt/1000).toFixed(1)}k`,color:T.red},
        ].map(s=>(
          <div key={s.label} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:11,color:T.textMid,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Conflict taxonomy — collapsible */}
      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",background:T.surface2,borderBottom:showTaxonomy?`1px solid ${T.border}`:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
          onClick={()=>setShowTaxonomy(x=>!x)}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,fontWeight:700,color:T.textMid}}>Conflict taxonomy</span>
            <span style={{fontSize:11,color:T.textLo}}>17 conflict types · click any code to filter worklist</span>
            {covFilter&&<span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.indigo,borderRadius:999,padding:"1px 8px"}}>{covFilter} active</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {covFilter&&<button onClick={e=>{e.stopPropagation();setCovFilter(null);}} style={{fontSize:11,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"1px 8px",cursor:"pointer"}}>Clear</button>}
            <span style={{fontSize:11.5,color:T.textLo,transform:showTaxonomy?"rotate(180deg)":"none",display:"inline-block",transition:"transform .15s"}}>▾</span>
          </div>
        </div>
        {showTaxonomy&&(
          <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:7}}>
            {CONFLICT_TAXONOMY.map(t=>{
              const tone = STATE_TONE[t.state]||T.textMid;
              const cnt  = covCounts[t.code]||0;
              const active = covFilter===t.code;
              return (
                <div key={t.code} onClick={()=>{setCovFilter(active?null:t.code);setSel(null);}}
                  style={{border:`1px solid ${active?tone:T.border}`,background:active?tone+"0C":T.surface,borderRadius:9,padding:"8px 10px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,fontWeight:800,fontFamily:"monospace",color:tone}}>{t.code}</span>
                    {cnt>0&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:tone,borderRadius:999,padding:"1px 6px"}}>{cnt}</span>}
                  </div>
                  <div style={{fontSize:10.5,color:T.textMid,lineHeight:1.4}}>{t.pattern}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:10}}>
        {/* Worklist */}
        <div style={{flex:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          {/* Toolbar */}
          <div style={{padding:"10px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or MRN..."
              style={{fontSize:12,padding:"5px 10px",border:`1px solid ${T.border}`,borderRadius:6,width:180,background:T.surface,color:T.text,outline:"none"}}/>
            <FiltBtn k="all"    label="All"          count={0}      />
            <FiltBtn k="urgent" label="Urgent"       count={urgentN} color={T.red}    />
            <FiltBtn k="mco"    label="MCO call"     count={mcoN}   color={T.orange}  />
            <FiltBtn k="claims" label="Claims"       count={claimsN} color={T.red}    />
            <FiltBtn k="rx"     label="Rx"           count={rxN}    color={T.indigo}  />
            <FiltBtn k="dual_eligible" label="Dual eligible" count={dualEligN} color={T.indigo} />
            <span style={{marginLeft:"auto",fontSize:11.5,color:T.textLo}}>{filtered.length} patients</span>
          </div>

          {/* Col headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 200px 80px 120px",padding:"7px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`}}>
            {["Patient","Open issues","At risk","Next action"].map(h=>(
              <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{maxHeight:480,overflowY:"auto"}}>
            {filtered.map((p,i)=>{
              const topColor = p.issues[0]?.color||T.border;
              const isOpen = sel===p.mrn;
              return (
                <div key={p.mrn} onClick={()=>{if(isOpen){setSel(null);setShowExplain(false);}else setSel(p.mrn);}}
                  style={{display:"grid",gridTemplateColumns:"1fr 200px 80px 120px",padding:"10px 14px",
                          borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",
                          cursor:"pointer",borderLeft:`3px solid ${topColor}`,
                          background:isOpen?T.indigo+"06":pendingByMrn[p.mrn]?T.amber+"06":T.surface}}
                  onMouseEnter={e=>!isOpen&&(e.currentTarget.style.background=T.surface2)}
                  onMouseLeave={e=>e.currentTarget.style.background=isOpen?T.indigo+"06":pendingByMrn[p.mrn]?T.amber+"06":T.surface}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.first} {p.last}
                      {pendingByMrn[p.mrn]&&<span style={{fontSize:10,fontWeight:700,color:T.amber,background:T.amber+"14",border:`1px solid ${T.amber}44`,borderRadius:4,padding:"1px 5px",marginLeft:6}}>pending</span>}
                    </div>
                    <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{p.mrn} · renewal {p.renewalDays}d</div>
                  </div>
                  <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                    {p.issues.slice(0,3).map(iss=>(
                      <span key={iss.type} style={{fontSize:10.5,fontWeight:700,color:iss.color,background:iss.color+"12",border:`1px solid ${iss.color}44`,borderRadius:4,padding:"1px 6px"}}>{iss.label}</span>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:800,color:p.claimAmt>0?T.red:T.textLo}}>{p.claimAmt>0?`$${p.claimAmt.toLocaleString()}`:"—"}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <span style={{fontSize:11.5,fontWeight:700,color:p.urgency===1?T.red:p.urgency===2?T.orange:T.textMid}}>{p.nextAction}</span>
                  </div>
                </div>
              );
            })}
            {filtered.length===0&&(
              <div style={{padding:32,textAlign:"center",color:T.textLo,fontSize:13}}>
                {search?"No patients match your search.":"No open items — all patients resolved."}
              </div>
            )}
          </div>
        </div>

        {/* Patient drawer */}
        {selPt&&(
          <div style={{width:360,flexShrink:0,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.surface,display:"flex",flexDirection:"column"}}>
            <div style={{overflowY:"auto",flex:1,padding:14,display:"flex",flexDirection:"column",gap:10}}>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:T.text}}>{selPt.first} {selPt.last}
                    {selPt.recon?.code&&(
                      <span onClick={()=>setShowExplain(x=>!x)}
                        style={{display:"inline-block",marginLeft:8,fontSize:11,fontWeight:800,fontFamily:"monospace",color:selPt.recon.tone||T.indigo,background:(selPt.recon.tone||T.indigo)+"14",border:`1px solid ${(selPt.recon.tone||T.indigo)}44`,borderRadius:6,padding:"2px 7px",cursor:"pointer",verticalAlign:"middle"}}>
                        {selPt.recon.code}
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{selPt.mrn} · renewal {selPt.renewalDays}d</div>
                </div>
                <button onClick={()=>{setSel(null);setShowExplain(false);}} style={{background:"none",border:"none",cursor:"pointer",color:T.textLo,fontSize:16,padding:"2px 6px"}}>✕</button>
              </div>

              {/* AI Explainability panel */}
              {showExplain&&selPt.recon&&(
                <div style={{border:`1px solid ${selPt.recon.tone||T.indigo}44`,borderRadius:10,overflow:"hidden",marginBottom:4}}>
                  {/* Panel header */}
                  <div style={{padding:"8px 12px",background:(selPt.recon.tone||T.indigo)+"0C",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:800,fontFamily:"monospace",color:selPt.recon.tone||T.indigo}}>{selPt.recon.code}</span>
                      <span style={{fontSize:11.5,color:T.textMid}}>{selPt.recon.pattern}</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#fff",background:selPt.recon.tone||T.indigo,borderRadius:999,padding:"2px 8px"}}>{selPt.recon.confidence}% confidence</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:selPt.recon.tone||T.indigo}}>{selPt.recon.state}</span>
                  </div>
                  {/* Two-column body */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                    {/* Left col */}
                    <div style={{padding:"10px 12px",borderRight:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:5}}>Why CoverageGuard decided this</div>
                      <div style={{fontSize:11.5,color:T.text,lineHeight:1.5,marginBottom:10}}>{selPt.recon.evidence}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div>
                          <div style={{fontSize:9.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Top evidence</div>
                          <div style={{fontSize:11,color:T.textMid,lineHeight:1.4}}>{selPt.recon.sources?.[0]?.evidence||selPt.recon.evidence?.split(".")[0]||"Multi-source agreement"}</div>
                        </div>
                        <div>
                          <div style={{fontSize:9.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Contradictory</div>
                          <div style={{fontSize:11,color:T.textMid,lineHeight:1.4}}>{selPt.recon.contra||"No contradictory signals"}</div>
                        </div>
                        <div>
                          <div style={{fontSize:9.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Weighting</div>
                          <div style={{fontSize:11,color:T.textMid,lineHeight:1.4}}>{selPt.recon.weighting||"Standard reconciliation weights"}</div>
                        </div>
                        <div>
                          <div style={{fontSize:9.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Routing trigger</div>
                          <div style={{fontSize:11,color:T.textMid,lineHeight:1.4}}>{selPt.recon.action||"Navigator review"}</div>
                        </div>
                      </div>
                    </div>
                    {/* Right col */}
                    <div style={{padding:"10px 12px"}}>
                      {selPt.pharmacyReject&&(
                        <>
                          <div style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Pharmacy reject detail</div>
                          <div style={{border:`1px solid ${T.border}`,borderRadius:7,overflow:"hidden",marginBottom:10}}>
                            {[
                              {code:"69",label:"Plan/coverage mismatch"},
                              {code:"70",label:"Product/service not covered"},
                              {code:"75",label:"Prior auth required"},
                              {code:"76",label:"Plan limitations exceeded"},
                              {code:"85",label:"Claim denied — not eligible"},
                            ].map((nc,ri)=>{
                              const isActive = String(selPt.rejectCode||"") === nc.code;
                              return (
                                <div key={nc.code} style={{display:"grid",gridTemplateColumns:"70px 1fr",padding:"5px 9px",borderBottom:ri<4?`1px solid ${T.border}`:"none",background:isActive?T.amber+"0C":T.surface}}>
                                  <span style={{fontSize:11,fontWeight:isActive?800:400,color:isActive?T.amber:T.textMid,fontFamily:"monospace"}}>{"NCPDP "+nc.code}</span>
                                  <span style={{fontSize:11,color:isActive?T.text:T.textLo}}>{nc.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      <div style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:4}}>What happens next</div>
                      <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5,marginBottom:10}}>
                        {selPt.recon.route==="pharmacy"?"Routed to Pharmacy queue (plan change) — navigator flagged for MCO call · claims flagged in Billing queue."
                        :selPt.recon.route==="eligibility"?"Routed to eligibility review — renewal intake triggered."
                        :selPt.recon.route==="rcm"?"Rebilling task created — claims resubmission in progress."
                        :selPt.recon.route==="care"?"Routed to MCO / roster review — navigator assigned."
                        :"Navigator review assigned — awaiting staff action."}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button style={{flex:1,padding:"6px 8px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,fontSize:11,fontWeight:700,color:T.textMid,cursor:"pointer"}}>
                          Hide evidence timeline
                        </button>
                        <button style={{flex:1,padding:"6px 8px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,fontSize:11,fontWeight:700,color:T.textMid,cursor:"pointer"}}>
                          View audit trail
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{padding:"7px 12px",background:T.surface2,borderTop:`1px solid ${T.border}`,fontSize:10.5,color:T.textLo,display:"flex",alignItems:"center",gap:5}}>
                    <Lock size={11}/>
                    {"Deterministic, explainable reconciliation · every decision logged"}
                  </div>
                </div>
              )}

              {/* Pending banner */}
              {pendingByMrn[selPt.mrn]&&(
                <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:8,padding:"8px 11px",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <Clock size={13} color={T.amber} style={{flexShrink:0,marginTop:1}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11.5,fontWeight:700,color:T.amber}}>Pending — {pendingByMrn[selPt.mrn].reason}</div>
                    {pendingByMrn[selPt.mrn].note&&<div style={{fontSize:11,color:T.textMid,marginTop:2}}>{pendingByMrn[selPt.mrn].note}</div>}
                  </div>
                  <button onClick={()=>setPendingByMrn(p=>({...p,[selPt.mrn]:null}))}
                    style={{fontSize:10,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"1px 7px",cursor:"pointer"}}>clear</button>
                </div>
              )}

              {/* Coverage conflict */}
              {selPt.issues.some(i=>i.type==="wrong_plan"||i.type==="terminated"||i.type==="not_enrolled"||i.type==="dual_mco"||i.type==="dual_eligible")&&(
                selPt.isDualEligible ? (
                  <div>
                    <div style={{background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                      <span style={{fontSize:11.5,fontWeight:700,color:T.indigo}}>Medicare primary · Medicaid secondary · work requirement exempt</span>
                    </div>
                    <div style={{border:`1px solid ${T.indigo}44`,borderRadius:10,overflow:"hidden"}}>
                      <div style={{padding:"8px 12px",background:T.indigo+"0C",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.indigo}}>Dual eligible</span>
                        <span style={{fontSize:10.5,color:T.textLo,fontFamily:T.mono}}>COV-017</span>
                      </div>
                      <div style={{padding:"10px 12px",fontSize:11.5,color:T.textMid,lineHeight:1.6}}>
                        {"Medicare + Medicaid both active. Always bill Medicare primary \u2014 Medicaid wraps around. Patient is categorically exempt from work requirements."}
                        {/* PART3_BRIDGE: dual_eligible flag \u2192 CertCore auto-confirms work requirement exemption when Full platform licensed */}
                      </div>
                    </div>
                  </div>
                ) : selPt.issues.some(i=>i.type==="dual_mco") ? (
                  <div style={{border:`1px solid ${T.textMid}44`,borderRadius:10,overflow:"hidden"}}>
                    <div style={{padding:"8px 12px",background:T.textMid+"0C",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,fontWeight:700,color:T.textMid}}>Dual MCO roster</span>
                      <span style={{fontSize:10.5,color:T.textLo,fontFamily:T.mono}}>COV-016</span>
                    </div>
                    <div style={{padding:"10px 12px"}}>
                      <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5,marginBottom:8}}>
                        {"Patient appears on "}<b>{selPt.mco}</b>{" and "}<b>{selPt.truePlan}</b>{" rosters simultaneously. Identify primary plan by effective date \u2014 call both MCO eligibility lines. Update eCW and notify State if system error confirmed."}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>logAction(selPt.mrn,"MCO call logged \u2014 both plans contacted for dual roster")}
                          style={{flex:1,padding:"7px",background:T.ink,border:"none",borderRadius:7,fontSize:11.5,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                          Contact both MCOs
                        </button>
                        <button onClick={()=>logAction(selPt.mrn,"State notified of dual roster error \u2014 COV-016")}
                          style={{flex:1,padding:"7px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,fontSize:11.5,fontWeight:700,color:T.text,cursor:"pointer"}}>
                          Notify State
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{border:`1px solid ${selPt.issues[0].color}44`,borderRadius:10,overflow:"hidden"}}>
                    <div style={{padding:"8px 12px",background:selPt.issues[0].color+"0C",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,fontWeight:700,color:selPt.issues[0].color}}>Coverage / enrollment</span>
                      <span style={{fontSize:10.5,color:T.textLo,fontFamily:T.mono}}>{selPt.rosterCases[0]?.cov||"COV-007"}</span>
                    </div>
                    <div style={{padding:"10px 12px"}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
                        {[["eCW",selPt.mco,true],["271",selPt.truePlan,false],["Roster",selPt.truePlan,false],["CRISP",selPt.truePlan,false]].map(([src,val,err],idx)=>(
                          <div key={src} style={{background:err?selPt.issues[0].color+"0C":T.green+"0C",border:`1px solid ${err?selPt.issues[0].color+"44":T.green+"44"}`,borderRadius:6,padding:"5px 7px"}}>
                            <div style={{fontSize:9.5,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{src}</div>
                            <div style={{fontSize:11,fontWeight:700,color:err?selPt.issues[0].color:T.green}}>{val.split(" ")[0]}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:11.5,color:T.textMid}}>{selPt.issues[0].label} \u00b7 {selPt.rosterCases[0]?.disc?.action||"Update eCW enrollment record"}</div>
                    </div>
                  </div>
                )
              )}

              {/* Claims at risk */}
              {selPt.claimAmt>0&&(
                <div style={{background:T.red+"0A",border:`1px solid ${T.red}33`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:4}}>Claims at risk</div>
                    <div style={{fontSize:22,fontWeight:800,color:T.red,lineHeight:1}}>${selPt.claimAmt.toLocaleString()}</div>
                    <div style={{fontSize:11,color:T.textMid,marginTop:3}}>{selPt.claimsCount} claim{selPt.claimsCount!==1?"s":""} · resubmit to {selPt.truePlan}</div>
                  </div>
                  <DollarSign size={28} color={T.red+"66"}/>
                </div>
              )}

              {/* Rx reject */}
              {selPt.issues.some(i=>i.type==="rx_reject")&&(
                <div style={{border:`1px solid ${T.indigo}44`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.indigo,marginBottom:4}}>Pharmacy / Rx</div>
                  <div style={{fontSize:11.5,color:T.textMid}}>Active pharmacy reject — coverage gap likely. Contact MCO pharmacy line to verify benefit.</div>
                </div>
              )}

              {/* 340B */}
              {selPt.issues.some(i=>i.type==="b340")&&(
                <div style={{border:`1px solid ${T.teal}44`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.tealD,marginBottom:4}}>340B / pharmacy</div>
                  <div style={{fontSize:11.5,color:T.textMid}}>Plan mismatch — proactive flag.</div>
                </div>
              )}

              {/* MCO contact */}
              <div style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>MCO contact</div>
                <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",marginBottom:8}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{selPt.truePlan}</div>
                  <div style={{fontSize:11.5,color:T.textMid}}>{MCO_PHONES[selPt.truePlan]||"Check MCO directory"} · provider eligibility</div>
                </div>
                <button onClick={()=>logAction(selPt.mrn,`MCO call logged — ${selPt.truePlan}`)}
                  style={{width:"100%",padding:"9px",background:T.ink,border:"none",borderRadius:8,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  <PhoneIcon size={14}/> Log MCO call
                </button>
              </div>

              {/* Notes */}
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Add note</div>
                <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={2}
                  placeholder="Call log, ref #, what was agreed..."
                  style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginBottom:6}}/>
                <div style={{display:"flex",gap:6}}>
                  <button disabled={!noteText.trim()} onClick={()=>{logAction(selPt.mrn,noteText.trim());setNoteText("");}}
                    style={{flex:1,padding:"6px",background:noteText.trim()?T.ink:T.border,border:"none",borderRadius:7,fontSize:11.5,fontWeight:700,color:"#fff",cursor:noteText.trim()?"pointer":"not-allowed",opacity:noteText.trim()?1:0.5}}>
                    Save note
                  </button>
                  <button onClick={()=>{setPendingModal(selPt.mrn);setPendingReason("");setPendingNote("");}}
                    style={{flex:1,padding:"6px",background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:7,fontSize:11.5,fontWeight:700,color:T.amber,cursor:"pointer"}}>
                    <Clock size={11}/> Pending
                  </button>
                  <button onClick={()=>{setRouteModal(selPt.mrn);setRouteTarget("");setPendingNote("");}}
                    style={{flex:1,padding:"6px",background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:7,fontSize:11.5,fontWeight:700,color:T.indigo,cursor:"pointer"}}>
                    <ArrowRight size={11}/> Route
                  </button>
                </div>
              </div>

              {/* Activity log */}
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Activity log</div>
                <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:110,overflowY:"auto"}}>
                  {[...(selPt.rosterCases[0]?.auditLog||[{ts:"Today · 09:14",msg:`COV issue detected · ${selPt.issues[0]?.label||"discrepancy"}`}]),
                    ...(logByMrn[selPt.mrn]||[])].map((e,i)=>(
                    <div key={i} style={{fontSize:11,color:T.textMid,display:"flex",gap:7}}>
                      <span style={{color:T.textLo,whiteSpace:"nowrap",minWidth:80}}>{e.ts}</span>
                      <span>{e.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update log */}
      {updateLog.length>0&&(
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"9px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,fontSize:12,fontWeight:700,color:T.text}}>Session activity log</div>
          {updateLog.slice(0,8).map((u,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"8px 14px",borderBottom:i<updateLog.length-1?`1px solid ${T.border}`:"none",background:T.surface,fontSize:12}}>
              <span style={{color:T.textLo,minWidth:55}}>{u.ts}</span>
              <span style={{fontWeight:700,color:T.text,minWidth:140}}>{u.patient}</span>
              <span style={{color:T.textMid,flex:1}}>{u.action}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pending modal */}
      {pendingModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setPendingModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Mark patient pending</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{worklist.find(p=>p.mrn===pendingModal)?.first} — will show pending banner</div>
            {["Waiting for MCO callback","Waiting for State portal update","Waiting for CRISP refresh","Waiting for billing confirmation","Waiting for patient response","Other"].map(opt=>(
              <button key={opt} onClick={()=>setPendingReason(opt)}
                style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",border:`1px solid ${pendingReason===opt?T.amber:T.border}`,background:pendingReason===opt?T.amber+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5,fontSize:12.5}}>
                <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${pendingReason===opt?T.amber:T.border}`,flexShrink:0,background:pendingReason===opt?T.amber:"transparent"}}/>
                {opt}
              </button>
            ))}
            <textarea value={pendingNote} onChange={e=>setPendingNote(e.target.value)} rows={2}
              placeholder="Note — ref #, expected callback date..."
              style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginTop:6,marginBottom:12}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setPendingModal(null)} style={{padding:"8px 13px",background:"none",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:700,color:T.textMid,cursor:"pointer"}}>Cancel</button>
              <button disabled={!pendingReason} onClick={()=>{
                setPendingByMrn(p=>({...p,[pendingModal]:{reason:pendingReason,note:pendingNote}}));
                logAction(pendingModal,`Marked pending — ${pendingReason}${pendingNote?" · "+pendingNote:""}`);
                setPendingModal(null);
              }} style={{padding:"8px 14px",background:pendingReason?T.amber:T.border,border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:"#fff",cursor:pendingReason?"pointer":"not-allowed",opacity:pendingReason?1:0.5}}>
                Mark pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route modal */}
      {routeModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setRouteModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Route patient</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{worklist.find(p=>p.mrn===routeModal)?.first} — select destination</div>
            {(()=>{
              const routeModalPt = worklist.find(p=>p.mrn===routeModal);
              const routeModalDualElig = routeModalPt?.isDualEligible || false;
              return [
                // PART2 STANDALONE — four destinations + park
                {key:"billing",    label:"Billing queue",           sub:"Claims resubmission \u00b7 wrong plan confirmed",        dot:T.red},
                {key:"pharmacy",   label:"Pharmacy / 340B",         sub:"Rx reject \u00b7 plan change \u00b7 coverage lapse",     dot:T.amber},
                {key:"caregap",    label:"Quality / CareGap",       sub:"Missed quality measure \u00b7 schedule visit",           dot:T.green},
                {key:"supervisor", label:"Supervisor / escalation", sub:"Needs manager review",                                   dot:T.textMid},
                {key:"park",       label:"Park \u2014 awaiting response", sub:"Remove from active queue \u00b7 keep in log",      dot:T.textMid},
                // PART3_BRIDGE: add CertCore route option here when Full platform licensed
                // {key:"certcore", label:"CertCore / Recert team", sub:"Coverage lapse \u00b7 patient needs recertification", dot:T.indigo},
              ].map(opt=>{
                const disabled = opt.key==="pharmacy" && routeModalDualElig;
                return (
                  <div key={opt.key} style={{marginBottom:5}}>
                    {disabled ? (
                      <div style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 11px",border:`1px solid ${T.border}`,background:T.surface2,borderRadius:8,opacity:.5,cursor:"not-allowed"}}>
                        <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${T.border}`,flexShrink:0,marginTop:2,background:"transparent"}}/>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:700,color:T.textMid}}>{opt.label}</div>
                          <div style={{fontSize:11.5,color:T.textLo}}>{"340B routing not applicable for dual eligible \u2014 handle through billing correction"}</div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={()=>setRouteTarget(opt.key)}
                        style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 11px",border:`1px solid ${routeTarget===opt.key?opt.dot:T.border}`,background:routeTarget===opt.key?opt.dot+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left"}}>
                        <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${routeTarget===opt.key?opt.dot:T.border}`,flexShrink:0,marginTop:2,background:routeTarget===opt.key?opt.dot:"transparent"}}/>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{opt.label}</div>
                          <div style={{fontSize:11.5,color:T.textLo}}>{opt.sub}</div>
                        </div>
                      </button>
                    )}
                  </div>
                );
              });
            })()}
            <textarea value={pendingNote} onChange={e=>setPendingNote(e.target.value)} rows={2}
              placeholder="Note for receiving team..."
              style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginTop:6,marginBottom:12}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setRouteModal(null)} style={{padding:"8px 13px",background:"none",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:700,color:T.textMid,cursor:"pointer"}}>Cancel</button>
              <button disabled={!routeTarget} onClick={()=>{
                const pt = worklist.find(p=>p.mrn===routeModal);
                const name = pt ? `${pt.first} ${pt.last}` : routeModal;
                const label = {billing:"Billing queue",pharmacy:"Pharmacy / 340B",caregap:"Quality / CareGap",supervisor:"Supervisor",park:"Parked"}[routeTarget]||routeTarget;
                logAction(routeModal,`Routed to ${label}${pendingNote?" — "+pendingNote:""}`);
                if(routeTarget==="park") setPendingByMrn(p=>({...p,[routeModal]:{reason:"Parked — awaiting response",note:pendingNote}}));
                else { setRoutedMrns(r=>({...r,[routeModal]:label})); if(routeToQueue) routeToQueue(routeModal, name, routeTarget, pendingNote); }
                setRouteModal(null); setPendingNote(""); setSel(null);
              }} style={{padding:"8px 14px",background:routeTarget?T.teal:T.border,border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:"#fff",cursor:routeTarget?"pointer":"not-allowed",opacity:routeTarget?1:0.5}}>
                <ArrowRight size={12}/> Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SessionLog — shared bottom log strip
   ============================================================ */
function SessionLog({ sessionLog, queue }) {
  const [open, setOpen] = useState(false);
  const items = (sessionLog||[]).filter(l => !queue || l.queue === queue);
  if(items.length === 0) return null;
  const qColor = { billing:T.red, pharmacy:T.amber, caregap:T.green };
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, boxShadow:"0 1px 2px rgba(16,23,38,.04)" }}>
      <button onClick={()=>setOpen(x=>!x)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"none", border:"none", cursor:"pointer", borderRadius:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:T.textMid }}>Session activity</span>
          <span style={{ fontSize:10.5, fontWeight:700, color:"#fff", background:T.textLo, borderRadius:999, padding:"1px 7px" }}>{items.length}</span>
        </div>
        <span style={{ fontSize:12, color:T.textLo, transform: open?"rotate(180deg)":"none", transition:"transform .15s", display:"inline-block" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding:"0 16px 12px" }}>
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:10 }}>
            {items.slice(0,20).map((l,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"5px 0", borderBottom: i<items.length-1?`1px solid ${T.border}`:"none", fontSize:12 }}>
                <span style={{ fontFamily:T.mono, color:T.textLo, flexShrink:0, fontSize:11 }}>{l.ts}</span>
                <span style={{ fontWeight:700, color:qColor[l.queue]||T.textMid, flexShrink:0 }}>{l.patient}</span>
                <span style={{ color:T.textMid }}>{l.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BillingQueueView
   ============================================================ */
function BillingQueueView({ billingCases, setBillingCases, sessionLog, addSessionLog }) {
  const TODAY = new Date().toISOString().slice(0, 10);
  const nowStr = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const [tab, setTab]       = useState("active");
  const [sel, setSel]       = useState(null);
  const [refNo, setRefNo]   = useState("");
  const [mcoNotes, setMcoNotes] = useState("");
  const [otherText, setOtherText] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [amountRecovered, setAmountRecovered] = useState("");

  const updCase = (id, patch) => setBillingCases(l => l.map(c => c.id === id ? { ...c, ...patch } : c));
  const addBLog = (id, txt)  => setBillingCases(l => l.map(c => c.id === id ? { ...c, billingLog:[...(c.billingLog||[]),{t:nowStr(),txt}] } : c));

  const activeList  = billingCases.filter(c => !c.resolved && c.billingStatus !== "pending");
  const pendingList = billingCases.filter(c => !c.resolved && c.billingStatus === "pending");
  const resolvedN   = billingCases.filter(c => c.resolved).length;
  const totalAtRisk = billingCases.filter(c => !c.resolved).reduce((s,c) => s + (c.amount||0), 0);

  const money2 = n => "$" + Math.round(n).toLocaleString("en-US");
  const displayList = tab === "active" ? activeList : pendingList;

  const DrawerBody = ({ c }) => {
    const isPending = c.billingStatus === "pending";
    const daysPend  = c.resubDate ? Math.floor((Date.now()-new Date(c.resubDate).getTime())/(1000*60*60*24)) : 0;
    const hasPlan   = !!(c.plan && c.plan.trim());
    const dosDate   = c.routedDate || TODAY;
    const canResub  = refNo.trim() && hasPlan;
    return (
      <div>
        {/* Work instruction */}
        {hasPlan ? (
          <div style={{ background:T.indigo+"0C", border:`1px solid ${T.indigo}33`, borderRadius:8, padding:"10px 12px", fontSize:12, color:T.text, marginBottom:12, lineHeight:1.6 }}>
            {"Plan corrected by navigator — resubmit claims to "}
            <strong>{c.plan}</strong>
            {". Pull claims from DOS "}
            <strong>{dosDate}</strong>
            {" and prior 30 days."}
          </div>
        ) : (
          <div style={{ background:T.amber+"0C", border:`1px solid ${T.amber}44`, borderRadius:8, padding:"10px 12px", fontSize:12, color:T.text, marginBottom:12, lineHeight:1.6 }}>
            <span style={{ fontWeight:700, color:T.amber }}>Correct plan not confirmed</span>
            {" — verify with navigator before resubmitting."}
          </div>
        )}
        {c.navNote && <div style={{ background:T.amber+"12", border:`1px solid ${T.amber}44`, borderRadius:8, padding:"8px 11px", fontSize:12, color:T.text, marginBottom:12 }}><span style={{ fontWeight:700 }}>Navigator note:</span> {c.navNote}</div>}
        <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"12px 0" }}/>

        {isPending ? (
          <>
            <div style={{ background:"#FFFBEA", border:`1px solid ${T.amber}`, borderRadius:8, padding:"10px 12px", fontSize:12, marginBottom:14 }}>
              Claim resubmitted · ref <strong style={{ fontFamily:T.mono }}>{c.resubRef}</strong> · submitted {c.resubDate} · {daysPend} day{daysPend!==1?"s":""} waiting
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>Amount recovered</div>
            <input value={amountRecovered} onChange={e=>setAmountRecovered(e.target.value)} placeholder="Enter actual reimbursement received…"
              style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, outline:"none", marginBottom:10 }}/>
            {(c.billingLog||[]).length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:T.textLo, textTransform:"uppercase", letterSpacing:.3, marginBottom:4 }}>Activity log</div>
                {c.billingLog.map((e,i) => <div key={i} style={{ display:"flex", gap:8, fontSize:11.5, color:T.textMid, marginBottom:3 }}><span style={{ fontFamily:T.mono, color:T.textLo }}>{e.t}</span><span>{e.txt}</span></div>)}
              </div>
            )}
            <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"12px 0" }}/>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              <button
                disabled={!amountRecovered.trim()}
                onClick={()=>{
                  addBLog(c.id, "Payment received — amount: "+amountRecovered);
                  updCase(c.id, { resolved:true, amountRecovered });
                  addSessionLog(c.patient, "Billing resolved — payment received: "+amountRecovered, "billing");
                  setAmountRecovered(""); setShowOther(false); setSel(null);
                }}
                style={{ flex:1, minWidth:130, padding:"8px", background:amountRecovered.trim()?T.teal:"#ccc", border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:amountRecovered.trim()?"pointer":"default" }}>
                Mark resolved ✓
              </button>
              <button onClick={()=>{
                addBLog(c.id, "Denied by MCO. Returned to Active for appeal.");
                updCase(c.id, { billingStatus:"active", denied:true });
                addSessionLog(c.patient, "Claim denied — back in Active for appeal.", "billing");
                setTab("active"); setSel(null);
              }} style={{ flex:1, minWidth:110, padding:"8px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:T.text, cursor:"pointer" }}>
                Denied — appeal
              </button>
              <button onClick={()=>setShowOther(x=>!x)}
                style={{ flex:1, minWidth:80, padding:"8px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:T.text, cursor:"pointer" }}>
                Other…
              </button>
            </div>
            {showOther && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:4 }}>Describe outcome <span style={{ color:T.red }}>*</span></div>
                <textarea value={otherText} onChange={e=>setOtherText(e.target.value)} rows={3}
                  placeholder="Write-off approved, escalated to supervisor, patient deceased, coverage lapsed…"
                  style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginBottom:8 }}/>
                <button onClick={()=>{
                  if(!otherText.trim()){ alert("Describe the outcome before submitting."); return; }
                  addBLog(c.id, "Closed — Other: "+otherText);
                  updCase(c.id, { resolved:true });
                  addSessionLog(c.patient, "Billing closed (other): "+otherText, "billing");
                  setOtherText(""); setShowOther(false); setSel(null);
                }} style={{ padding:"8px 14px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                  Submit &amp; close case
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>Resubmission ref #</div>
            <input value={refNo} onChange={e=>setRefNo(e.target.value)} placeholder="Enter ref number after resubmitting…"
              style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, outline:"none", marginBottom:10 }}/>
            {(c.billingLog||[]).length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:T.textLo, textTransform:"uppercase", letterSpacing:.3, marginBottom:4 }}>Activity log</div>
                {c.billingLog.map((e,i) => <div key={i} style={{ display:"flex", gap:8, fontSize:11.5, color:T.textMid, marginBottom:3 }}><span style={{ fontFamily:T.mono, color:T.textLo }}>{e.t}</span><span>{e.txt}</span></div>)}
              </div>
            )}
            <button
              disabled={!canResub}
              onClick={()=>{
                addBLog(c.id, "Claim resubmitted — ref "+refNo+". Moved to Pending — awaiting MCO response.");
                updCase(c.id, { billingStatus:"pending", resubRef:refNo, resubDate:TODAY });
                addSessionLog(c.patient, "Claim resubmitted (ref: "+refNo+"). Awaiting MCO.", "billing");
                setRefNo(""); setTab("pending"); setSel(null);
              }}
              style={{ width:"100%", padding:"9px", background:canResub?T.indigo:"#ccc", border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:canResub?"pointer":"default" }}>
              Mark resubmitted
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ModHeader tone={T.red} kicker="Billing Queue" line="Billing staff view — claims resubmission, wrong-plan corrections, and MCO response tracking." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
        <Stat icon={DollarSign} label="Active — needs work" value={fmt(activeList.length)} tone={T.red} />
        <Stat icon={Clock} label="Awaiting MCO" value={fmt(pendingList.length)} tone={T.amber} />
        <Stat icon={DollarSign} label="At risk" value={money2(totalAtRisk)} tone={T.orange} />
        <Stat icon={CheckCircle2} label="Resolved today" value={fmt(resolvedN)} tone={T.teal} />
      </div>
      <div style={{ display:"flex", gap:6, borderBottom:`1px solid ${T.border}` }}>
        {[{key:"active",label:"Active — needs work"},{key:"pending",label:`Pending — awaiting MCO${pendingList.length>0?` · ${pendingList.length}`:""}`}].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setSel(null);setShowOther(false);}}
            style={{ padding:"8px 14px", border:"none", borderBottom:`2px solid ${tab===t.key?T.red:"transparent"}`, background:"transparent", fontSize:12.5, fontWeight:700, color:tab===t.key?T.red:T.textMid, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:14, minHeight:400 }}>
        <Card style={{ flex:1, minWidth:0 }} pad={0}>
          {displayList.length === 0
            ? <Empty>{tab==="active" ? (billingCases.length===0?"No cases routed yet. Route from Patient Worklist → Billing queue.":"All active cases resubmitted — check Pending tab.") : "No claims awaiting MCO response."}</Empty>
            : displayList.map(c => {
                const daysPend = c.resubDate ? Math.floor((Date.now()-new Date(c.resubDate).getTime())/(1000*60*60*24)) : 0;
                return (
                  <div key={c.id} onClick={()=>{setSel(c);setShowOther(false);setRefNo("");setMcoNotes("");setOtherText("");}}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", background:sel?.id===c.id?T.red+"08":T.surface }}>
                    <div style={{ width:3, height:36, background:T.red, borderRadius:99 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                        {c.patient}
                        {c.denied && <span style={{ fontSize:10, fontWeight:800, color:"#fff", background:T.red, borderRadius:4, padding:"1px 6px" }}>Denied — appeal</span>}
                      </div>
                      <div style={{ fontSize:11.5, color:T.textMid }}>{c.mrn} · {c.plan||"Plan TBD"}</div>
                      {tab==="pending" && <div style={{ fontSize:11, color:T.amber }}>{daysPend} day{daysPend!==1?"s":""} waiting · ref {c.resubRef}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:10.5, fontWeight:700, color:tab==="pending"?T.amber:T.red, background:(tab==="pending"?T.amber:T.red)+"18", borderRadius:999, padding:"2px 8px" }}>
                        {tab==="pending"?"Awaiting MCO":"Open"}
                      </span>
                      <ChevronRight size={14} color={T.textLo}/>
                    </div>
                  </div>
                );
              })
          }
        </Card>
        {sel && (
          <Card style={{ width:340, flexShrink:0, position:"sticky", top:0, maxHeight:"80vh", overflowY:"auto" }} pad={14}
            title={sel.patient} right={<button onClick={()=>{setSel(null);setShowOther(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:T.textLo }}><X size={15}/></button>}>
            <DrawerBody c={billingCases.find(x=>x.id===sel.id)||sel} />
          </Card>
        )}
      </div>
      <SessionLog sessionLog={sessionLog} queue="billing" />
    </div>
  );
}

/* ============================================================
   PharmacyQueueView
   ============================================================ */
function PharmacyQueueView({ pharmacyCases, setPharmacyCases, sessionLog, addSessionLog }) {
  const nowStr = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const [tab, setTab]               = useState("plan_change");
  const [sel, setSel]               = useState(null);
  // plan change drawer state
  const [actionPlan, setActionPlan] = useState("");
  const [resPlan, setResPlan]       = useState("");
  const [otherActionPlan, setOtherActionPlan] = useState("");
  const [otherResPlan, setOtherResPlan]       = useState("");
  // coverage lapse drawer state
  const [actionLapse, setActionLapse]         = useState("");
  const [resLapse, setResLapse]               = useState("");
  const [otherActionLapse, setOtherActionLapse] = useState("");
  const [otherResLapse, setOtherResLapse]       = useState("");

  const updCase = (id, patch) => setPharmacyCases(l => l.map(c => c.id === id ? { ...c, ...patch } : c));
  const addPLog = (id, txt)   => setPharmacyCases(l => l.map(c => c.id === id ? { ...c, pharmLog:[...(c.pharmLog||[]),{t:nowStr(),txt}] } : c));

  const planChangeList = pharmacyCases.filter(c => !c.pharmResolved && !c.is340b);
  const lapseList      = pharmacyCases.filter(c => !c.pharmResolved && c.is340b);
  const resolvedN      = pharmacyCases.filter(c => c.pharmResolved).length;
  const displayList    = tab === "plan_change" ? planChangeList : lapseList;

  const OtherField = ({ value, onChange }) => (
    <textarea value={value} onChange={e=>onChange(e.target.value)} rows={2} placeholder="Please describe…"
      style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginTop:6, marginBottom:4 }}/>
  );

  const DrawerBody = ({ c }) => {
    const isCoverageLapse = c.is340b;
    const Lbl = ({ children }) => (
      <div style={{ fontSize:10.5, color:T.textLo, fontWeight:600, textTransform:"uppercase", letterSpacing:.3 }}>{children}</div>
    );
    return (
      <div>
        {c.isDualEligible&&(
          <div style={{ background:T.indigo+"0C", border:`1px solid ${T.indigo}44`, borderRadius:8, padding:"9px 12px", fontSize:12, color:T.textMid, marginBottom:12, lineHeight:1.5 }}>
            <span style={{ fontWeight:700, color:T.indigo }}>Dual eligible patient</span>
            {" \u2014 Bill Medicare primary. Verify payer before dispensing."}
          </div>
        )}
        {/* Signal header grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12, fontSize:12 }}>
          {isCoverageLapse ? (
            <>
              <div><Lbl>Signal</Lbl><div style={{ fontWeight:700, marginTop:2, color:T.red }}>Coverage lapse</div></div>
              <div><Lbl>Route to</Lbl><div style={{ fontWeight:700, marginTop:2 }}>Recert team</div></div>
            </>
          ) : (
            <>
              <div><Lbl>Signal</Lbl><div style={{ fontWeight:700, marginTop:2, color:T.amber }}>Plan change</div></div>
              <div><Lbl>Code</Lbl><div style={{ fontWeight:700, marginTop:2, fontFamily:T.mono }}>{c.rejectCode}</div></div>
            </>
          )}
        </div>

        {/* Signal banner */}
        {isCoverageLapse ? (
          <div style={{ background:T.red+"0C", border:`1px solid ${T.red}33`, borderRadius:8, padding:"9px 12px", fontSize:12, color:T.text, marginBottom:12, lineHeight:1.5 }}>
            <span style={{ fontWeight:700, color:T.red }}>Coverage lapsed.</span> {"Patient's Medicaid coverage has dropped. Notify the recert team before the patient's next medical visit — pharmacy caught this first because claims fire in real time."}
            <div style={{ marginTop:6, fontSize:11, color:T.textMid }}>
              {/* Full platform: combined lens — CertCore auto-receives this signal without manual routing */}
              Route to CertCore if Full platform licensed, otherwise flag manually.
            </div>
          </div>
        ) : (
          <div style={{ background:T.amber+"0C", border:`1px solid ${T.amber}33`, borderRadius:8, padding:"9px 12px", fontSize:12, color:T.text, marginBottom:12, lineHeight:1.5 }}>
            <span style={{ fontWeight:700, color:T.amber }}>MCO plan changed.</span>{" "}
            {"Patient's MCO changed from "}
            <span style={{ fontWeight:700 }}>{c.oldPlan || "previous plan"}</span>
            {" to "}
            <span style={{ fontWeight:700 }}>{c.newPlan || "new plan"}</span>
            {" — update pharmacy billing records before next fill. 340B eligibility is unaffected (patient-based, not plan-based)."}
          </div>
        )}

        {c.navNote && <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 11px", fontSize:12, color:T.text, marginBottom:12 }}><span style={{ fontWeight:700 }}>Navigator note:</span> {c.navNote}</div>}
        <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"12px 0" }}/>

        {isCoverageLapse ? (
          /* ── Signal 2: Coverage lapse → Recert team ── */
          <>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>Action taken</div>
            <select value={actionLapse} onChange={e=>{ setActionLapse(e.target.value); if(e.target.value!=="Other") setOtherActionLapse(""); }}
              style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, marginBottom:4, outline:"none" }}>
              <option value="">— select —</option>
              <option>Notified recert team — manual</option>
              <option>Flagged in navigator notes</option>
              <option>Routed to CertCore (Full Platform)</option>
              <option>Other</option>
            </select>
            {actionLapse==="Other" && <OtherField value={otherActionLapse} onChange={setOtherActionLapse}/>}
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4, marginTop:8 }}>Resolution</div>
            <select value={resLapse} onChange={e=>{ setResLapse(e.target.value); if(e.target.value!=="Other") setOtherResLapse(""); }}
              style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, marginBottom:4, outline:"none" }}>
              <option value="">— select —</option>
              <option>Recert team notified</option>
              <option>Routed to CertCore (Full Platform)</option>
              <option>Coverage reinstated — no action needed</option>
              <option>Other</option>
            </select>
            {resLapse==="Other" && <OtherField value={otherResLapse} onChange={setOtherResLapse}/>}
          </>
        ) : (
          /* ── Signal 1: Plan change → Pharmacy billing staff ── */
          <>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>Action taken</div>
            <select value={actionPlan} onChange={e=>{ setActionPlan(e.target.value); if(e.target.value!=="Other") setOtherActionPlan(""); }}
              style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, marginBottom:4, outline:"none" }}>
              <option value="">— select —</option>
              <option>Updated pharmacy billing record</option>
              <option>Confirmed new MCO contract</option>
              <option>Both — record updated and contract confirmed</option>
              <option>Other</option>
            </select>
            {actionPlan==="Other" && <OtherField value={otherActionPlan} onChange={setOtherActionPlan}/>}
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4, marginTop:8 }}>Resolution</div>
            <select value={resPlan} onChange={e=>{ setResPlan(e.target.value); if(e.target.value!=="Other") setOtherResPlan(""); }}
              style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, marginBottom:4, outline:"none" }}>
              <option value="">— select —</option>
              <option>Billing record updated — ready for next fill</option>
              <option>New MCO contract confirmed</option>
              <option>Medication rebilled to correct plan</option>
              <option>Override approved — billed to old plan pending update</option>
              <option>Other</option>
            </select>
            {resPlan==="Other" && <OtherField value={otherResPlan} onChange={setOtherResPlan}/>}
          </>
        )}

        {(c.pharmLog||[]).length > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:T.textLo, textTransform:"uppercase", letterSpacing:.3, marginBottom:4 }}>Activity log</div>
            {c.pharmLog.map((e,i) => <div key={i} style={{ display:"flex", gap:8, fontSize:11.5, color:T.textMid, marginBottom:3 }}><span style={{ fontFamily:T.mono, color:T.textLo }}>{e.t}</span><span>{e.txt}</span></div>)}
          </div>
        )}
        <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"12px 0" }}/>
        <button onClick={()=>{
          if(isCoverageLapse){
            if(actionLapse==="Other"&&!otherActionLapse.trim()){ alert("A comment is required when \"Other\" is selected."); return; }
            if(resLapse==="Other"&&!otherResLapse.trim()){ alert("A comment is required when \"Other\" is selected."); return; }
          } else {
            if(actionPlan==="Other"&&!otherActionPlan.trim()){ alert("A comment is required when \"Other\" is selected."); return; }
            if(resPlan==="Other"&&!otherResPlan.trim()){ alert("A comment is required when \"Other\" is selected."); return; }
          }
          updCase(c.id, { pharmResolved:true });
          addSessionLog(c.patient, isCoverageLapse ? "Coverage lapse — recert team notified." : "Plan change resolved — billing record updated.", "pharmacy");
          setActionPlan(""); setResPlan(""); setOtherActionPlan(""); setOtherResPlan("");
          setActionLapse(""); setResLapse(""); setOtherActionLapse(""); setOtherResLapse("");
          setSel(null);
        }} style={{ width:"100%", padding:"9px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
          Mark resolved ✓
        </button>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ModHeader tone={T.amber} kicker="Pharmacy / 340B Queue" line="Real-time signal relay — MCO plan changes and coverage lapses caught at the pharmacy counter." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
        <Stat icon={Pill} label="Plan changes" value={fmt(planChangeList.length)} tone={T.amber} />
        <Stat icon={Pill} label="Coverage lapses" value={fmt(lapseList.length)} tone={T.red} />
        <Stat icon={CheckCircle2} label="Resolved today" value={fmt(resolvedN)} tone={T.teal} />
      </div>
      <div style={{ display:"flex", gap:6, borderBottom:`1px solid ${T.border}` }}>
        {[{key:"plan_change",label:"Plan change"},{key:"coverage_lapse",label:"Coverage lapse"}].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setSel(null);}}
            style={{ padding:"8px 14px", border:"none", borderBottom:`2px solid ${tab===t.key?T.amber:"transparent"}`, background:"transparent", fontSize:12.5, fontWeight:700, color:tab===t.key?T.amber:T.textMid, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:14, minHeight:400 }}>
        <Card style={{ flex:1, minWidth:0 }} pad={0}>
          {displayList.length === 0
            ? <Empty>No cases in this queue yet. Route from Patient Worklist → Pharmacy / 340B.</Empty>
            : displayList.map(c => (
                <div key={c.id} onClick={()=>{setSel(c);setActionPlan("");setResPlan("");setOtherActionPlan("");setOtherResPlan("");setActionLapse("");setResLapse("");setOtherActionLapse("");setOtherResLapse("");}}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", background:sel?.id===c.id?T.amber+"08":T.surface }}>
                  <div style={{ width:3, height:36, background:T.amber, borderRadius:99 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{c.patient}</div>
                    <div style={{ fontSize:11.5, color:T.textMid }}>
                      {c.mrn} · {c.is340b
                        ? "Coverage lapsed · notify recert team"
                        : (c.oldPlan && c.newPlan ? c.oldPlan + " → " + c.newPlan : "plan change") + " · " + c.rejectCode}
                    </div>
                  </div>
                  <ChevronRight size={14} color={T.textLo}/>
                </div>
              ))
          }
        </Card>
        {sel && (
          <Card style={{ width:340, flexShrink:0, position:"sticky", top:0, maxHeight:"80vh", overflowY:"auto" }} pad={14}
            title={sel.patient} right={<button onClick={()=>setSel(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.textLo }}><X size={15}/></button>}>
            <DrawerBody c={pharmacyCases.find(x=>x.id===sel.id)||sel} />
          </Card>
        )}
      </div>
      <SessionLog sessionLog={sessionLog} queue="pharmacy" />
    </div>
  );
}

function MCORosterView({ panel, routeToQueue }) {
  const [cases]    = React.useState(() => buildRosterCases(panel));
  const [sel, setSel]   = React.useState(null);
  const [viewMode, setViewMode] = React.useState("queue"); // queue | pending
  const [typeFilter, setTypeFilter] = React.useState(null); // null | wrong_plan | terminated | not_enrolled | dual_mco | dual_eligible
  const [logByCase, setLogByCase] = React.useState({});
  const [resByCase, setResByCase] = React.useState({});
  const [billingByCase, setBillingByCase] = React.useState({});
  const [billingModal, setBillingModal] = React.useState(null);
  const [pendingModal, setPendingModal] = React.useState(null);
  const [pendingReason, setPendingReason] = React.useState("");
  const [pendingNote, setPendingNote] = React.useState("");
  const [pendingByCase, setPendingByCase] = React.useState({});
  const [noteText, setNoteText] = React.useState("");
  const [routeModal, setRouteModal] = React.useState(null);
  const [routeTarget, setRouteTarget] = React.useState("");
  const [routedByCase, setRoutedByCase] = React.useState({});
  const [billingRef, setBillingRef] = React.useState("");
  const [billingClaims, setBillingClaims] = React.useState("");
  const [updateLog, setUpdateLog] = React.useState([]);
  const [showTaxonomy, setShowTaxonomy] = React.useState(false);
  const [rosterFilter, setRosterFilter] = React.useState("all");
  const [rosterSearch, setRosterSearch] = React.useState("");
  const [covFilter, setCovFilter] = React.useState(null);

  const selCase = cases.find(c=>c.mrn===sel)||null;

  const dtypeToCov = {
    wrong_plan:    "COV-007",
    terminated:    "COV-003",
    not_enrolled:  "COV-011",
    dual_mco:      "COV-016",
    dual_eligible: "COV-017",
  };

  const covToDtype = {
    "COV-003": "terminated",
    "COV-007": "wrong_plan",
    "COV-011": "not_enrolled",
    "COV-016": "dual_mco",
    "COV-017": "dual_eligible",
  };

  const filteredCases = cases.filter(c => {
    if (covFilter) {
      const dtype = covToDtype[covFilter];
      return dtype ? c.dtype === dtype : false;
    }
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      if (!c.patient.toLowerCase().includes(q) && !c.mrn.includes(rosterSearch)) return false;
    }
    if (rosterFilter === "urgent")   return c.dtype === "wrong_plan";
    if (rosterFilter === "mcocall")  return c.needsMcoCall === true;
    if (rosterFilter === "claims")   return (c.claimAmt || 0) > 0;
    if (rosterFilter === "rx")       return !!panel.find(p => p.mrn === c.mrn)?.pharmacyReject;
    if (rosterFilter === "dual")     return c.isDualEligible === true;
    return true;
  });

  const wrongPlan    = cases.filter(c=>c.dtype==="wrong_plan").length;
  const terminated   = cases.filter(c=>c.dtype==="terminated").length;
  const notEnrolled  = cases.filter(c=>c.dtype==="not_enrolled").length;
  const dualMco      = cases.filter(c=>c.dtype==="dual_mco").length;
  const dualEligible = cases.filter(c=>c.dtype==="dual_eligible").length;

  const pendingCases = cases.filter(c=>!resByCase[c.id]&&routedByCase[c.id]?.target==="pending");
  const overdue   = pendingCases.filter(c=>c.status==="overdue").length;
  const dueToday  = pendingCases.filter(c=>c.status==="due_today").length;
  const billing   = pendingCases.filter(c=>c.status==="billing").length;

  const logAction = (caseId, text, resolution) => {
    const c = cases.find(x=>x.id===caseId);
    const entry = `${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})} — ${text}`;
    setLogByCase(l => ({...l, [caseId]: [...(l[caseId]||[]), entry]}));
    if(resolution) {
      setResByCase(r => ({...r, [caseId]: resolution}));
      setUpdateLog(u => [{ts:new Date().toLocaleTimeString(), patient:c?.patient, action:text, resolution}, ...u]);
    }
  };

  const confirmBilling = (caseId) => {
    const c = cases.find(x=>x.id===caseId);
    setBillingByCase(b=>({...b,[caseId]:{ref:billingRef,claims:billingClaims,date:"Today",amt:c?.claimAmt}}));
    logAction(caseId, `Billing confirmed · ${billingClaims} claims resubmitted · ref ${billingRef} · $${c?.claimAmt?.toLocaleString()} recovered`, "billing_resolved");
    setBillingModal(null); setBillingRef(""); setBillingClaims("");
  };

  const statusColor = (s) => s==="overdue"?T.red:s==="due_today"?T.orange:s==="billing"?T.indigo:T.teal;
  const statusLabel = (s) => s==="overdue"?"Escalate now":s==="due_today"?"Act today":s==="billing"?"Routed to billing":"Open";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Taxonomy panel */}
      <div style={{background:"#fff",border:"1px solid "+T.border,borderRadius:8,marginBottom:0}}>
        <div onClick={()=>setShowTaxonomy(x=>!x)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:600,fontSize:13,color:T.textDark||T.text}}>{"Coverage Conflict Taxonomy"}</span>
            {covFilter&&(
              <span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.indigo,borderRadius:999,padding:"2px 9px",display:"flex",alignItems:"center",gap:4}}
                onClick={e=>{e.stopPropagation();setCovFilter(null);}}>
                {covFilter}{" \u00d7"}
              </span>
            )}
          </div>
          <span style={{fontSize:12,color:T.textMid}}>{showTaxonomy?"Hide \u25b2":"Show \u25bc"}{" \u00b7 "}{CONFLICT_TAXONOMY.length}{" COV codes"}</span>
        </div>
        {showTaxonomy&&(
          <div style={{borderTop:"1px solid "+T.border,padding:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:6}}>
            {CONFLICT_TAXONOMY.map(c=>{
              const isActive = covFilter===c.code;
              const hasCases = !!covToDtype[c.code];
              return (
                <div key={c.code}
                  onClick={hasCases?()=>{setCovFilter(isActive?null:c.code);if(!isActive)setShowTaxonomy(false);}:undefined}
                  style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",borderRadius:6,
                    background:isActive?T.indigo+"12":"#F9FAFB",
                    border:"1px solid "+(isActive?T.indigo+"55":"transparent"),
                    cursor:hasCases?"pointer":"default",
                    opacity:hasCases?1:0.55,
                    pointerEvents:hasCases?"auto":"none",
                    transition:"background .12s"}}>
                  <span style={{fontWeight:700,fontSize:11,color:isActive?T.indigo:T.textMid,minWidth:62,fontFamily:"monospace",paddingTop:1}}>{c.code}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:isActive?T.indigo:T.text}}>{c.state}</div>
                    <div style={{fontSize:11,color:T.textMid,marginTop:1}}>{c.pattern}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search + filter toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <input
          value={rosterSearch}
          onChange={e=>setRosterSearch(e.target.value)}
          placeholder="Search patient name or MRN..."
          style={{fontSize:12,padding:"6px 10px",border:"1px solid "+T.border,borderRadius:8,outline:"none",minWidth:220,fontFamily:"inherit",color:T.text,background:T.surface||"#fff"}}
        />
        {[
          {key:"all",   label:"All"},
          {key:"urgent",label:"Urgent"},
          {key:"mcocall",label:"MCO call"},
          {key:"claims",label:"Claims"},
          {key:"rx",    label:"Rx"},
          {key:"dual",  label:"Dual eligible"},
        ].map(pill=>(
          <button key={pill.key} onClick={()=>setRosterFilter(pill.key)}
            style={{fontSize:12,padding:"5px 12px",borderRadius:999,border:"1px solid "+(rosterFilter===pill.key?T.indigo:T.border),background:rosterFilter===pill.key?T.indigo:"#F3F4F6",color:rosterFilter===pill.key?"#fff":"#4B5563",cursor:"pointer",fontWeight:rosterFilter===pill.key?700:400}}>
            {pill.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.indigo,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>MCO / RosterGuard</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>Roster discrepancies requiring navigator action</div>
          <div style={{fontSize:12,color:T.textMid,marginTop:3}}>Reconciled daily · sources: eCW · Availity 271 · MCO roster files · CRISP</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{n:wrongPlan,l:"wrong plan",c:T.red,t:"wrong_plan"},{n:terminated,l:"terminated",c:T.orange,t:"terminated"},{n:notEnrolled,l:"not enrolled",c:T.orange,t:"not_enrolled"},{n:dualMco,l:"dual MCO",c:T.textMid,t:"dual_mco"},{n:dualEligible,l:"dual eligible",c:T.indigo,t:"dual_eligible"}].map(k=>(
            <button key={k.l} onClick={()=>{setTypeFilter(typeFilter===k.t?null:k.t);setViewMode("queue");setSel(null);}}
              style={{background:typeFilter===k.t?k.c+"28":k.c+"12",border:`${typeFilter===k.t?"2px":"1px"} solid ${k.c}${typeFilter===k.t?"99":"44"}`,borderRadius:9,padding:"7px 12px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:1}}>{k.n}</div>
              <div style={{fontSize:10,color:T.textMid,marginTop:2}}>{k.l}</div>
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {[["queue","Active queue"],["pending","Pending resolution"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setViewMode(k);setSel(null);}}
            style={{fontSize:12,fontWeight:700,border:`1px solid ${viewMode===k?T.indigo:T.border}`,background:viewMode===k?T.indigo+"12":T.surface,color:viewMode===k?T.indigo:T.textMid,borderRadius:999,padding:"5px 14px",cursor:"pointer"}}>
            {l}{k==="pending"&&pendingCases.length>0?` · ${pendingCases.length}`:""}
          </button>
        ))}
        {overdue>0&&<button onClick={()=>{setViewMode("pending");setSel(null);}} style={{fontSize:11,fontWeight:800,color:T.red,background:T.red+"12",border:`1px solid ${T.red}44`,borderRadius:999,padding:"3px 9px",cursor:"pointer"}}>{overdue} overdue</button>}
        {billing>0&&<button onClick={()=>{setViewMode("pending");setSel(null);}} style={{fontSize:11,fontWeight:800,color:T.indigo,background:T.indigo+"10",border:`1px solid ${T.indigo}44`,borderRadius:999,padding:"3px 9px",cursor:"pointer"}}>{billing} with billing</button>}
      </div>

      {/* ACTIVE QUEUE VIEW */}
      {viewMode==="queue"&&(
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
            {/* Col headers */}
            {typeFilter&&<div style={{padding:"6px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.textMid,display:"flex",alignItems:"center",gap:8}}>
              Showing: <span style={{fontWeight:700,color:MCO_DISC_TYPES[typeFilter]?.color||T.text}}>{MCO_DISC_TYPES[typeFilter]?.label}</span>
              <button onClick={()=>setTypeFilter(null)} style={{fontSize:11,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"1px 8px",cursor:"pointer",marginLeft:4}}>✕ show all</button>
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1.4fr 130px 175px 150px 1fr",padding:"9px 16px",background:T.surface2,borderBottom:`1px solid ${T.border}`}}>
              {["Patient","eCW shows","Roster / 271 shows","Discrepancy · COV","Action needed"].map(h=>(
                <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
              ))}
            </div>
            {filteredCases.filter(c=>!resByCase[c.id]&&!routedByCase[c.id]&&(!typeFilter||c.dtype===typeFilter)).map((c,i)=>{
              const bColor = c.disc.color;
              const covCode = dtypeToCov[c.dtype];
              return (
                <div key={c.id} onClick={()=>setSel(sel===c.mrn?null:c.mrn)}
                  style={{display:"grid",gridTemplateColumns:"1.4fr 130px 175px 150px 1fr",padding:"12px 16px",borderBottom:i<filteredCases.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",background:sel===c.mrn?T.indigo+"06":T.surface,borderLeft:`3px solid ${bColor}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background=sel===c.mrn?T.indigo+"06":T.surface}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.patient}</div>
                    <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{c.mrn} · renewal {c.renewalDays}d</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:12,color:T.text}}>{c.ecwPlan}</span></div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:12,fontWeight:700,color:bColor}}>{c.dtype==="not_enrolled"?"Not on any roster":c.dtype==="dual_mco"?c.ecwPlan+" + "+c.truePlan:c.dtype==="dual_eligible"?"Medicare + Medicaid":c.truePlan}</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,fontWeight:700,color:bColor,background:bColor+"12",border:`1px solid ${bColor}44`,borderRadius:999,padding:"2px 8px"}}>{c.disc.label}</span>
                    {covCode&&<span style={{fontFamily:"monospace",fontSize:11,color:T.indigo,background:"#EEF2FF",padding:"1px 5px",borderRadius:4}}>{covCode}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:11.5,color:T.textMid}}>{c.disc.action}</span></div>
                </div>
              );
            })}
            {filteredCases.filter(c=>!resByCase[c.id]&&(!typeFilter||c.dtype===typeFilter)).length===0&&<div style={{padding:24,textAlign:"center",color:T.textLo,fontSize:13}}>{typeFilter?`No ${MCO_DISC_TYPES[typeFilter]?.label?.toLowerCase()||typeFilter} cases open.`:routedByCase&&Object.keys(routedByCase).length>0?"All cases resolved or routed.":"No open discrepancies — all cases resolved."}</div>}
          </div>

          {/* Patient drawer */}
          {selCase&&(
            <div style={{width:340,flexShrink:0,border:`1px solid ${T.border}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:10,background:T.surface}}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:T.text}}>{selCase.patient}</div>
                  <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{selCase.mrn} · renewal {selCase.renewalDays}d</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:selCase.disc.color,background:selCase.disc.color+"12",border:`1px solid ${selCase.disc.color}44`,borderRadius:999,padding:"3px 10px"}}>{selCase.disc.label}</span>
              </div>

              {/* Dual eligible Medicare banner */}
              {selCase.isDualEligible&&(
                <div style={{background:"#EEF2FF",border:"1px solid "+T.indigo,borderRadius:8,padding:"10px 14px",marginBottom:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.indigo}}>{"Medicare + Medicaid \u2014 Dual Eligible"}</div>
                  <div style={{fontSize:12,color:T.indigo,marginTop:4}}>{"Bill Medicare primary. Medicaid secondary payer. Work requirement exempt."}</div>
                  <div style={{fontSize:11,color:T.textMid,marginTop:4}}>{"// PART3_BRIDGE: dual_eligible \u2192 CertCore auto-confirms exemption when Full platform licensed"}</div>
                </div>
              )}

              {/* Alert */}
              {selCase.isDualEligible ? (
                <div>
                  <div style={{background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:8,padding:"9px 12px",marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.indigo,marginBottom:2}}>{"Dual eligible · "}{selCase.cov}</div>
                    <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>
                      {"Medicare + Medicaid both active. Always bill Medicare primary \u2014 Medicaid wraps around. Patient is categorically exempt from work requirements."}
                      {/* PART3_BRIDGE: dual_eligible flag \u2192 CertCore auto-confirms work requirement exemption when Full platform licensed */}
                    </div>
                  </div>
                </div>
              ) : selCase.dtype==="dual_mco" ? (
                <div style={{background:T.textMid+"0C",border:`1px solid ${T.textMid}44`,borderRadius:8,padding:"9px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:2}}>{"Dual MCO roster · "}{selCase.cov}</div>
                  <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>
                    {"Patient appears on "}<b>{selCase.ecwPlan}</b>{" and "}<b>{selCase.truePlan}</b>{" rosters simultaneously. Identify primary plan by effective date \u2014 call both MCO eligibility lines. Update eCW and notify State if system error confirmed."}
                  </div>
                </div>
              ) : (
                <div style={{background:selCase.disc.color+"0C",border:`1px solid ${selCase.disc.color}44`,borderRadius:8,padding:"9px 12px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:selCase.disc.color,marginBottom:2}}>{"Roster mismatch \u00b7 "}{selCase.cov}</div>
                  <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>
                    {"eCW shows "}<b>{selCase.ecwPlan}</b>{" \u2014 "}{selCase.dtype==="not_enrolled"?"patient not found on any MCO roster":selCase.dtype==="terminated"?"MCO roster shows terminated":"MCO roster and 271 show "+selCase.truePlan}. {selCase.claimsAtRisk} {"claim"+(selCase.claimsAtRisk!==1?"s":"")+" at risk."}
                  </div>
                </div>
              )}

              {/* Source comparison */}
              {!selCase.isDualEligible&&(
                <>
                  <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:2}}>Source comparison</div>
                  <div style={{border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",marginBottom:4}}>
                    {(selCase.dtype==="dual_mco"
                      ? [["eCW / EMR",selCase.ecwPlan,"\u26a0\ufe0f",selCase.disc.color],["Availity 271",selCase.truePlan,"\u26a0\ufe0f",selCase.disc.color],["MCO roster",selCase.ecwPlan+" + "+selCase.truePlan,"\u26a0\ufe0f",selCase.disc.color],["CRISP","Multiple plans","\u26a0\ufe0f",selCase.disc.color]]
                      : [["eCW / EMR",selCase.ecwPlan,"\u26a0\ufe0f",selCase.disc.color],["Availity 271",selCase.truePlan,"\u2713",T.green],["MCO roster",selCase.truePlan,"\u2713",T.green],["CRISP",selCase.truePlan+" \u00b7 active","\u2713",T.green]]
                    ).map(([src,val,icon,clr],ri)=>(
                      <div key={src} style={{display:"grid",gridTemplateColumns:"90px 1fr 20px",padding:"6px 10px",borderBottom:ri<3?`1px solid ${T.border}`:"none",background:ri===0||selCase.dtype==="dual_mco"?selCase.disc.color+"06":T.surface}}>
                        <span style={{fontSize:11,color:T.textMid}}>{src}</span>
                        <span style={{fontSize:11.5,fontWeight:ri===0||selCase.dtype==="dual_mco"?700:400,color:ri===0||selCase.dtype==="dual_mco"?selCase.disc.color:T.green}}>{val}</span>
                        <span style={{fontSize:11}}>{icon}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Recommended action */}
              <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Recommended action</div>
              <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",fontSize:12,color:T.textMid,lineHeight:1.5}}>
                {selCase.isDualEligible
                  ? "Bill Medicare primary \u2014 Medicaid wraps around. No MCO call needed. Patient is work requirement exempt."
                  : selCase.dtype==="dual_mco"
                  ? "Identify primary MCO by effective date. Call both plans: "+selCase.ecwPlan+" and "+selCase.truePlan+". Update eCW when primary is confirmed. Notify State enrollment team of roster error."
                  : selCase.disc.action+". Review "+selCase.claimsAtRisk+" claim"+(selCase.claimsAtRisk!==1?"s":"")+" billed to "+selCase.ecwPlan+" \u2014 route to billing for resubmission to "+selCase.truePlan+". Estimated $"+selCase.claimAmt.toLocaleString()+" at risk."
                }
              </div>

              {/* Claims at risk */}
              <div style={{background:T.red+"0A",border:`1px solid ${T.red}33`,borderRadius:8,padding:"8px 11px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:11,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Claims at risk</div>
                  <div style={{fontSize:20,fontWeight:800,color:T.red}}>${selCase.claimAmt.toLocaleString()}</div>
                  <div style={{fontSize:11,color:T.textMid}}>{selCase.claimsAtRisk} claim{selCase.claimsAtRisk>1?"s":""} · needs resubmission</div>
                </div>
                <DollarSign size={28} color={T.red+"88"}/>
              </div>

              {/* Pharmacy / Rx section */}
              {(()=>{const panelPt=panel.find(p=>p.mrn===selCase.mrn);return panelPt?.pharmacyReject?(
                <div style={{background:"#FFFBEB",border:"1px solid "+T.amber,borderRadius:8,padding:"10px 14px",marginBottom:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.amber}}>{"Pharmacy / Rx"}</div>
                  <div style={{fontSize:12,color:T.text,marginTop:6}}>
                    <span style={{fontWeight:600}}>{"NCPDP Reject: "}</span>{panelPt.pharmacyReject}
                  </div>
                  <div style={{fontSize:12,color:T.textMid,marginTop:4}}>
                    {"Reject 69 = COV-012 (plan change signal). Alert pharmacy to bill correct plan."}
                  </div>
                </div>
              ):null;})()}

              {/* 340B flag */}
              {(()=>{const panelPt=panel.find(p=>p.mrn===selCase.mrn);return (panelPt?.has340B&&!panelPt?.pharmacyReject)?(
                <div style={{background:"#F0FDF4",border:"1px solid "+T.green,borderRadius:8,padding:"8px 14px",marginBottom:0}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.green}}>{"340B Eligible"}</div>
                  <div style={{fontSize:12,color:T.textMid}}>{"Patient qualifies for 340B pricing."}</div>
                </div>
              ):null;})()}

              {/* MCO contact */}
              {(()=>{const panelPt=panel.find(p=>p.mrn===selCase.mrn)||{};const planName=mcoNew(panelPt||{idx:0});return (
                <div style={{background:T.surface2||T.bg,borderRadius:8,padding:"10px 14px",marginBottom:0}}>
                  <div style={{fontWeight:600,fontSize:12,color:T.text,marginBottom:6}}>{"MCO Contact"}</div>
                  <div style={{fontSize:12,color:T.textMid,marginBottom:8}}>
                    <span style={{fontWeight:600,color:T.text}}>{planName}</span>
                    {" \u00b7 "}{MCO_PHONES[planName]||"Contact plan directory"}
                  </div>
                  <button onClick={()=>logAction(selCase.id,"MCO call logged")} style={{fontSize:12,padding:"6px 14px",borderRadius:6,background:T.indigo,color:"#fff",border:"none",cursor:"pointer"}}>{"Log MCO call"}</button>
                </div>
              );})()}

              {/* ── PENDING STATUS BANNER ── */}
              {pendingByCase[selCase.id]&&!resByCase[selCase.id]&&(
                <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:8,padding:"8px 11px",display:"flex",alignItems:"flex-start",gap:8}}>
                  <Clock size={13} color={T.amber} style={{flexShrink:0,marginTop:1}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11.5,fontWeight:700,color:T.amber}}>Pending — {pendingByCase[selCase.id].reason}</div>
                    {pendingByCase[selCase.id].note&&<div style={{fontSize:11,color:T.textMid,marginTop:2}}>{pendingByCase[selCase.id].note}</div>}
                    <div style={{fontSize:10.5,color:T.textLo,marginTop:2}}>Since {pendingByCase[selCase.id].date}</div>
                  </div>
                  <button onClick={()=>setPendingByCase(p=>({...p,[selCase.id]:null}))}
                    style={{fontSize:10,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"1px 7px",cursor:"pointer",flexShrink:0}}>clear</button>
                </div>
              )}

              {/* ── NOTES ── */}
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Add note</div>
                <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                  placeholder="Call log, MCO ref #, what was said, next step..."
                  rows={2}
                  style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginBottom:6}}/>
                <div style={{display:"flex",gap:6}}>
                  <button disabled={!noteText.trim()} onClick={()=>{
                    if(!noteText.trim()) return;
                    logAction(selCase.id, noteText.trim(), null);
                    setNoteText("");
                  }} style={{flex:1,padding:"6px",background:noteText.trim()?T.ink:T.border,border:"none",borderRadius:7,fontSize:11.5,fontWeight:700,color:"#fff",cursor:noteText.trim()?"pointer":"not-allowed",opacity:noteText.trim()?1:0.5}}>
                    Save note
                  </button>
                  <button onClick={()=>{setPendingModal(selCase.id);setPendingReason("");setPendingNote("");}}
                    style={{flex:1,padding:"6px",background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:7,fontSize:11.5,fontWeight:700,color:T.amber,cursor:"pointer"}}>
                    <Clock size={11}/> Mark pending
                  </button>
                  <button onClick={()=>{setRouteModal(selCase.id);setRouteTarget("");}}
                    style={{flex:1,padding:"6px",background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:7,fontSize:11.5,fontWeight:700,color:T.indigo,cursor:"pointer"}}>
                    <ArrowRight size={11}/> Route
                  </button>
                </div>
              </div>

              {/* ── ACTION LOG ── */}
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Activity log</div>
                <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8,maxHeight:120,overflowY:"auto"}}>
                  {[...selCase.auditLog, ...(logByCase[selCase.id]||[]).map(m=>({ts:"",msg:m}))].map((e,i)=>(
                    <div key={i} style={{fontSize:11,color:T.textMid,display:"flex",gap:7}}>
                      {e.ts&&<span style={{color:T.textLo,whiteSpace:"nowrap",minWidth:80}}>{e.ts}</span>}
                      <span>{e.msg}</span>
                    </div>
                  ))}
                </div>
                {resByCase[selCase.id]&&(
                  <div style={{background:T.green+"0C",border:`1px solid ${T.green}33`,borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:700,color:T.green}}>
                    ✓ Case resolved — {resByCase[selCase.id]==="billing_resolved"?"billing confirmed":"eCW updated"}
                  </div>
                )}
                {(logByCase[selCase.id]||[]).some(l=>l.includes("Billing handoff"))&&!resByCase[selCase.id]&&!billingByCase[selCase.id]&&(
                  <button onClick={()=>setBillingModal(selCase.id)}
                    style={{width:"100%",padding:"8px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:8,fontSize:12,fontWeight:700,color:T.tealD,cursor:"pointer",marginTop:6}}>
                    Billing confirmed resubmission — close case
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PENDING RESOLUTION VIEW */}
      {viewMode==="pending"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* SLA note */}
          <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 14px",fontSize:11.5,color:T.textMid}}>
            {"SLA: "}<b style={{color:T.red}}>24h</b>{" wrong plan \u00b7 "}<b style={{color:T.orange}}>48h</b>{" terminated \u00b7 "}<b style={{color:T.orange}}>72h</b>{" not enrolled \u00b7 "}<b style={{color:T.textMid}}>96h</b>{" dual MCO \u00b7 Dual eligible = informational, no SLA \u00b7 auto-escalates to supervisor at breach"}
          </div>

          <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:700,color:T.text}}>Awaiting resolution <span style={{fontSize:12,fontWeight:400,color:T.textMid}}>· {pendingCases.length} cases</span></span>
              <div style={{display:"flex",gap:6}}>
                {overdue>0&&<span style={{fontSize:11,fontWeight:700,color:T.red,background:T.red+"12",border:`1px solid ${T.red}44`,borderRadius:999,padding:"2px 9px"}}>{overdue} overdue</span>}
                {dueToday>0&&<span style={{fontSize:11,fontWeight:700,color:T.orange,background:T.orange+"12",border:`1px solid ${T.orange}44`,borderRadius:999,padding:"2px 9px"}}>{dueToday} due today</span>}
                {billing>0&&<span style={{fontSize:11,fontWeight:700,color:T.indigo,background:T.indigo+"10",border:`1px solid ${T.indigo}44`,borderRadius:999,padding:"2px 9px"}}>{billing} with billing</span>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 140px 150px 120px",padding:"7px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`}}>
              {["Patient","Open for","Blocking step","Waiting on","Status"].map(h=>(
                <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
              ))}
            </div>
            {pendingCases.sort((a,b)=>b.openHrs-a.openHrs).map((c,i)=>{
              const sc = statusColor(c.status);
              const sl = statusLabel(c.status);
              const overtimeHrs = Math.max(0, c.openHrs - c.disc.sla);
              return (
                <div key={c.id} onClick={()=>{setViewMode("queue");setSel(c.id);}} style={{display:"grid",gridTemplateColumns:"1fr 100px 140px 150px 120px",padding:"10px 14px",borderBottom:i<pendingCases.length-1?`1px solid ${T.border}`:"none",background:c.status==="overdue"?T.red+"06":c.status==="due_today"?T.orange+"06":T.surface,borderLeft:`3px solid ${sc}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.patient}</div>
                    <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{c.mrn} · {c.disc.label} · {c.cov}</div>
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:sc,lineHeight:1}}>{c.openHrs}h</div>
                    {overtimeHrs>0&&<div style={{fontSize:10,color:T.red}}>{overtimeHrs}h overdue</div>}
                    {overtimeHrs===0&&<div style={{fontSize:10,color:T.textLo}}>of {c.disc.sla}h SLA</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:11.5,color:sc,fontWeight:c.status==="overdue"?700:400}}>{c.blocker}</span></div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:11.5,color:T.textMid}}>{c.waitOn}</span></div>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,color:sc,background:sc+"12",border:`1px solid ${sc}44`,borderRadius:999,padding:"2px 8px"}}>{sl}</span>
                  </div>
                </div>
              );
            })}
            {pendingCases.length===0&&<div style={{padding:24,textAlign:"center",color:T.textLo,fontSize:13}}>All cases resolved — no pending items.</div>}
          </div>
        </div>
      )}

      {/* UPDATE LOG — always visible at bottom */}
      {updateLog.length>0&&(
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"9px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,fontSize:12,fontWeight:700,color:T.text}}>Update log — session activity</div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {updateLog.map((u,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 14px",borderBottom:i<updateLog.length-1?`1px solid ${T.border}`:"none",background:T.surface}}>
                <span style={{fontSize:11,color:T.textLo,minWidth:60}}>{u.ts}</span>
                <span style={{fontSize:12.5,fontWeight:700,color:T.text,minWidth:140}}>{u.patient}</span>
                <span style={{fontSize:12,color:T.textMid,flex:1}}>{u.action}</span>
                <span style={{fontSize:11,fontWeight:700,color:u.resolution==="billing_resolved"?T.green:u.resolution==="routed"?T.indigo:T.teal,background:(u.resolution==="billing_resolved"?T.green:u.resolution==="routed"?T.indigo:T.teal)+"12",border:`1px solid ${(u.resolution==="billing_resolved"?T.green:u.resolution==="routed"?T.indigo:T.teal)}44`,borderRadius:999,padding:"2px 8px"}}>
                  {u.resolution==="billing_resolved"?"Resolved":u.resolution==="routed"?"Routed":"Updated"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING MODAL */}
      {pendingModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setPendingModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Mark case pending</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{cases.find(c=>c.id===pendingModal)?.patient} · will show pending banner in drawer</div>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Reason *</div>
            {["Waiting for MCO callback","Waiting for State portal update","Waiting for CRISP data refresh","Waiting for patient response","Waiting for billing confirmation","Other"].map(opt=>(
              <button key={opt} onClick={()=>setPendingReason(opt)}
                style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",border:`1px solid ${pendingReason===opt?T.amber:T.border}`,background:pendingReason===opt?T.amber+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5,fontSize:12.5}}>
                <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${pendingReason===opt?T.amber:T.border}`,flexShrink:0,background:pendingReason===opt?T.amber:"transparent"}}/>
                {opt}
              </button>
            ))}
            <textarea value={pendingNote} onChange={e=>setPendingNote(e.target.value)}
              placeholder="Optional note — ref #, expected callback date, what was agreed..."
              rows={2}
              style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginTop:4,marginBottom:12}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setPendingModal(null)} style={{padding:"8px 13px",background:"none",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:700,color:T.textMid,cursor:"pointer"}}>Cancel</button>
              <button disabled={!pendingReason} onClick={()=>{
                const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
                setPendingByCase(p=>({...p,[pendingModal]:{reason:pendingReason,note:pendingNote,date:ts}}));
                setRoutedByCase(r=>({...r,[pendingModal]:{target:"pending",label:"Pending resolution",note:pendingNote,date:ts}}));
                setUpdateLog(u=>[{ts,patient:cases.find(c=>c.id===pendingModal)?.patient,action:`Marked pending — ${pendingReason}${pendingNote?" · "+pendingNote:""}`,resolution:"routed"},...u]);
                logAction(pendingModal,`Marked pending — ${pendingReason}${pendingNote?" · "+pendingNote:""}`,null);
                setPendingModal(null); setSel(null);
              }} style={{padding:"8px 14px",background:pendingReason?T.amber:T.border,border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:pendingReason?"#fff":T.textLo,cursor:pendingReason?"pointer":"not-allowed",opacity:pendingReason?1:0.5}}>
                <Clock size={12}/> Mark pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUTE MODAL */}
      {routeModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setRouteModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Route to queue</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{cases.find(c=>c.id===routeModal)?.patient} · select destination queue</div>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Destination *</div>
            {[
              {key:"billing",   label:"Revenue Recovery / Billing",  sub:"Claims resubmission · dollar recovery tracking"},
              {key:"pharmacy",  label:"Pharmacy / 340B",             sub:"Coverage lapse or plan change at pharmacy"},
              {key:"caregap",   label:"Quality / CareGap",           sub:"Open care gap needing follow-up"},
              {key:"supervisor",label:"Supervisor / escalation",     sub:"Needs manager review or override"},
              {key:"pending",   label:"Pending resolution queue",    sub:"Park case · awaiting external response"},
            ].map(opt=>(
              <button key={opt.key} onClick={()=>setRouteTarget(opt.key)}
                style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 11px",border:`1px solid ${routeTarget===opt.key?T.indigo:T.border}`,background:routeTarget===opt.key?T.indigo+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5}}>
                <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${routeTarget===opt.key?T.indigo:T.border}`,flexShrink:0,marginTop:2,background:routeTarget===opt.key?T.indigo:"transparent"}}/>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{opt.label}</div>
                  <div style={{fontSize:11.5,color:T.textLo}}>{opt.sub}</div>
                </div>
              </button>
            ))}
            <textarea value={pendingNote} onChange={e=>setPendingNote(e.target.value)}
              placeholder="Note for receiving team — what needs to happen, context..."
              rows={2}
              style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:T.sans,color:T.text,background:T.surface,resize:"none",outline:"none",marginTop:4,marginBottom:12}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setRouteModal(null)} style={{padding:"8px 13px",background:"none",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:700,color:T.textMid,cursor:"pointer"}}>Cancel</button>
              <button disabled={!routeTarget} onClick={()=>{
                const label = {billing:"Revenue Recovery",pharmacy:"Pharmacy / 340B",caregap:"Quality / CareGap",supervisor:"Supervisor",pending:"Pending resolution"}[routeTarget]||routeTarget;
                const rc = cases.find(c=>c.id===routeModal);
                logAction(routeModal,`Routed to ${label}${pendingNote?" — "+pendingNote:""}`,null);
                setRoutedByCase(r=>({...r,[routeModal]:{target:routeTarget,label,note:pendingNote,date:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}}));
                setUpdateLog(u=>[{ts:new Date().toLocaleTimeString(),patient:rc?.patient,action:`Routed to ${label}${pendingNote?" — "+pendingNote:""}`,resolution:"routed"},...u]);
                if(routeTarget!=="pending"&&routeTarget!=="supervisor"&&routeToQueue&&rc) routeToQueue(rc.mrn,rc.patient,routeTarget,pendingNote);
                setRouteModal(null); setPendingNote(""); setSel(null);
              }} style={{padding:"8px 14px",background:routeTarget?T.indigo:T.border,border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:routeTarget?"#fff":T.textLo,cursor:routeTarget?"pointer":"not-allowed",opacity:routeTarget?1:0.5}}>
                <ArrowRight size={12}/> Route case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING CONFIRMATION MODAL */}
      {billingModal&&(()=>{
        const c = cases.find(x=>x.id===billingModal);
        return (
          <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setBillingModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(460px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
              <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Billing resubmission confirmed</div>
              <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{c?.patient} · {c?.claimsAtRisk} claims · ${c?.claimAmt?.toLocaleString()} at risk</div>
              <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",marginBottom:12,fontSize:12,color:T.textMid,lineHeight:1.6}}>
                <div><b style={{color:T.text}}>Issue:</b> Claims billed to {c?.ecwPlan} — resubmitted to {c?.truePlan}</div>
                <div><b style={{color:T.text}}>eCW updated:</b> Yes · plan corrected</div>
                <div><b style={{color:T.text}}>Claims:</b> {c?.claimsAtRisk} claims · ${c?.claimAmt?.toLocaleString()} expected recovery</div>
              </div>
              <label style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:5}}>Resubmission reference # *</label>
              <input value={billingRef} onChange={e=>setBillingRef(e.target.value)} placeholder="e.g. UHC-2026-0823-7741"
                style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",fontSize:13,color:T.text,background:T.surface,outline:"none",marginBottom:10}}/>
              <label style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:5}}>Claims resubmitted *</label>
              <input value={billingClaims} onChange={e=>setBillingClaims(e.target.value)} placeholder={`e.g. ${c?.claimsAtRisk} of ${c?.claimsAtRisk}`}
                style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",fontSize:13,color:T.text,background:T.surface,outline:"none",marginBottom:14}}/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setBillingModal(null)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                <button disabled={!billingRef||!billingClaims} onClick={()=>confirmBilling(billingModal)}
                  style={{...primaryBtn,background:(billingRef&&billingClaims)?T.green:T.border,padding:"8px 14px",opacity:(billingRef&&billingClaims)?1:0.45,cursor:(billingRef&&billingClaims)?"pointer":"not-allowed"}}>
                  <CheckCircle2 size={13}/> Mark resolved — close case
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CareGapView({ cgQueueCases, setCgQueueCases, addSessionLog }) {
  const TODAY = new Date().toISOString().slice(0, 10);
  const [tab, setTab]         = useState("open");
  const [sel, setSel]         = useState(null);
  const [schedDate, setSchedDate]     = useState("");
  const [cgConfirm, setCgConfirm]     = useState("");
  const [cgOutcome, setCgOutcome]     = useState("");
  const [otherConfirm, setOtherConfirm] = useState("");
  const [otherClose, setOtherClose]   = useState("");
  const [showOtherClose, setShowOtherClose] = useState(false);

  const nowStr = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const updCase = (id, patch) => setCgQueueCases(l => l.map(c => c.id === id ? { ...c, ...patch } : c));
  const addLog  = (id, txt)  => setCgQueueCases(l => l.map(c => c.id === id ? { ...c, cgLog: [...(c.cgLog||[]), { t: nowStr(), txt }] } : c));

  const openList  = cgQueueCases.filter(c => !c.cgStatus || c.cgStatus === "open" || c.cgStatus === "seen");
  const pendList  = cgQueueCases.filter(c => c.cgStatus === "scheduled");
  const overdueN  = pendList.filter(c => c.cgDate && c.cgDate < TODAY).length;
  const closedN   = cgQueueCases.filter(c => c.cgStatus === "closed").length;

  const STEP_ORDER = { open: 0, scheduled: 1, seen: 2, closed: 3 };
  const Stepper = ({ status }) => {
    const steps = ["Open","Scheduled","Seen","Closed"];
    const keys  = ["open","scheduled","seen","closed"];
    const cur = STEP_ORDER[status] || 0;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:16 }}>
        {steps.map((s,i) => {
          const done = cur > i, active = cur === i;
          const c = done ? T.teal : active ? T.teal : T.border;
          return (
            <React.Fragment key={s}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:56 }}>
                <div style={{ width:26, height:26, borderRadius:999, background: done||active ? T.teal : T.surface, border:`2px solid ${c}`, display:"grid", placeItems:"center", fontSize:11, fontWeight:800, color: done||active ? "#fff" : T.textLo }}>
                  {done ? "✓" : i+1}
                </div>
                <div style={{ fontSize:10.5, fontWeight:active?700:500, color:active?T.teal:done?T.textMid:T.textLo }}>{s}</div>
              </div>
              {i < 3 && <div style={{ flex:1, height:2, background: cur > i ? T.teal : T.border, marginBottom:16 }} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const DrawerBody = ({ c }) => {
    const status = c.cgStatus || "open";
    return (
      <div>
        <Stepper status={status} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12, fontSize:12 }}>
          <div><div style={{ fontSize:10.5, color:T.textLo, fontWeight:600, textTransform:"uppercase", letterSpacing:.3 }}>HEDIS measure</div><div style={{ fontWeight:700, marginTop:2 }}>{c.measure}</div></div>
          <div><div style={{ fontSize:10.5, color:T.textLo, fontWeight:600, textTransform:"uppercase", letterSpacing:.3 }}>Gap open</div><div style={{ fontWeight:700, marginTop:2, color:T.red }}>{c.gapDays} days</div></div>
        </div>
        {c.navNote && <div style={{ background:T.amber+"12", border:`1px solid ${T.amber}44`, borderRadius:8, padding:"8px 11px", fontSize:12, color:T.text, marginBottom:12 }}><span style={{ fontWeight:700 }}>Navigator note:</span> {c.navNote}</div>}
        <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"12px 0" }}/>

        {status === "open" && (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:6 }}>Schedule visit</div>
            <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, marginBottom:10, color:T.text, background:T.surface, outline:"none" }}/>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{
                if(!schedDate){ alert("Select a visit date first."); return; }
                updCase(c.id, { cgStatus:"scheduled", cgDate:schedDate });
                addLog(c.id, `Visit scheduled for ${schedDate} — moved to Pending queue.`);
                addSessionLog(c.patient, `Visit scheduled ${schedDate} — moved to Pending queue.`, "caregap");
                setSchedDate(""); setTab("pending"); setSel(null);
              }} style={{ flex:1, padding:"8px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                Confirm schedule →
              </button>
              <button onClick={()=>setShowOtherClose(x=>!x)}
                style={{ flex:1, padding:"8px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:T.text, cursor:"pointer" }}>
                Other — close gap
              </button>
            </div>
            {showOtherClose && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:4 }}>Reason for closing <span style={{ color:T.red }}>*</span></div>
                <textarea value={otherClose} onChange={e=>setOtherClose(e.target.value)} rows={3}
                  placeholder="Chronic no-show — 3 missed visits, patient refused care, moved out of service area, deceased…"
                  style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginBottom:8 }}/>
                <button onClick={()=>{
                  if(!otherClose.trim()){ alert("Document the reason before closing."); return; }
                  updCase(c.id, { cgStatus:"closed" });
                  addLog(c.id, `Gap closed — Other: ${otherClose}`);
                  addSessionLog(c.patient, `CareGap closed (other): ${otherClose}`, "caregap");
                  setOtherClose(""); setShowOtherClose(false); setSel(null);
                }} style={{ padding:"8px 14px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                  Close gap — document reason
                </button>
              </div>
            )}
          </>
        )}

        {status === "scheduled" && (
          <>
            <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", fontSize:12, marginBottom:14 }}>
              Visit scheduled for <strong>{c.cgDate}</strong>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:.3, marginBottom:8 }}>Did the patient attend?</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              <button onClick={()=>{
                updCase(c.id, { cgStatus:"seen" });
                addLog(c.id, `Patient attendance confirmed — visit occurred ${c.cgDate}. Moved to Open — document outcome.`);
                addSessionLog(c.patient, "Attendance confirmed — moved to Open for outcome documentation.", "caregap");
                setTab("open"); setSel(s => s ? { ...s, cgStatus:"seen" } : null);
              }} style={{ flex:1, minWidth:120, padding:"8px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                Patient was seen ✓
              </button>
              <button onClick={()=>{
                const prev = c.cgDate;
                updCase(c.id, { cgStatus:"open", cgDate:null });
                addLog(c.id, `No-show for ${prev} — returned to Open queue for rescheduling.`);
                addSessionLog(c.patient, `No-show for ${prev}. Back in Open queue.`, "caregap");
                setTab("open"); setSel(null);
              }} style={{ flex:1, minWidth:120, padding:"8px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:T.text, cursor:"pointer" }}>
                No-show — reschedule
              </button>
              <button onClick={()=>setShowOtherClose(x=>!x)}
                style={{ flex:1, minWidth:120, padding:"8px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:T.text, cursor:"pointer" }}>
                Other — close gap
              </button>
            </div>
            {showOtherClose && (
              <div style={{ marginTop:6 }}>
                <textarea value={otherClose} onChange={e=>setOtherClose(e.target.value)} rows={3}
                  placeholder="Chronic no-show — 3 missed visits, patient refused care, moved out of service area, deceased…"
                  style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginBottom:8 }}/>
                <button onClick={()=>{
                  if(!otherClose.trim()){ alert("Document the reason before closing."); return; }
                  updCase(c.id, { cgStatus:"closed" });
                  addLog(c.id, `Gap closed — Other: ${otherClose}`);
                  addSessionLog(c.patient, `CareGap closed (other): ${otherClose}`, "caregap");
                  setOtherClose(""); setShowOtherClose(false); setTab("open"); setSel(null);
                }} style={{ padding:"8px 14px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
                  Close gap — document reason
                </button>
              </div>
            )}
          </>
        )}

        {status === "seen" && (
          <>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:T.teal, background:T.teal+"14", border:`1px solid ${T.teal}44`, borderRadius:999, padding:"3px 10px", marginBottom:12 }}>
              Visit confirmed · {c.cgDate}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>
              Document outcome <span style={{ color:T.red }}>*</span>
            </div>
            <textarea value={cgOutcome} onChange={e=>setCgOutcome(e.target.value)} rows={3}
              placeholder="Lab result, measure met, follow-up orders…"
              style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginBottom:10 }}/>
            <div style={{ fontSize:12, fontWeight:600, color:T.textMid, marginBottom:4 }}>Gap closure confirmation <span style={{ color:T.red }}>*</span></div>
            <select value={cgConfirm} onChange={e=>{ setCgConfirm(e.target.value); if(e.target.value !== "Other") setOtherConfirm(""); }}
              style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, color:T.text, background:T.surface, marginBottom:6, outline:"none" }}>
              <option value="">— select —</option>
              <option>Measure met — documented in chart</option>
              <option>Lab resulted — meets threshold</option>
              <option>Referral completed</option>
              <option>Counseling provided</option>
              <option>Measure not met — follow-up scheduled</option>
              <option>Other</option>
            </select>
            {cgConfirm === "Other" && (
              <textarea value={otherConfirm} onChange={e=>setOtherConfirm(e.target.value)} rows={2}
                placeholder="Please describe…"
                style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 9px", fontSize:12, fontFamily:T.sans, color:T.text, background:T.surface, resize:"none", outline:"none", marginBottom:10 }}/>
            )}
            <button onClick={()=>{
              if(!cgConfirm){ alert("Select a gap closure confirmation before closing."); return; }
              if(cgConfirm === "Other" && !otherConfirm.trim()){ alert("A comment is required when \"Other\" is selected."); return; }
              const conf = cgConfirm === "Other" ? `Other — ${otherConfirm}` : cgConfirm;
              updCase(c.id, { cgStatus:"closed", cgOutcome, cgConfirm: conf });
              addLog(c.id, `Gap closed — ${conf}.${cgOutcome ? " Notes: "+cgOutcome : ""}`);
              addSessionLog(c.patient, `CareGap closed: ${conf}.`, "caregap");
              setCgConfirm(""); setCgOutcome(""); setOtherConfirm(""); setSel(null);
            }} style={{ width:"100%", padding:"9px", background:T.teal, border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }}>
              Close gap ✓
            </button>
          </>
        )}

        {status === "closed" && (
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:T.teal, background:T.teal+"14", border:`1px solid ${T.teal}44`, borderRadius:999, padding:"3px 10px", marginBottom:10 }}>Gap closed</div>
            {c.cgConfirm && <div style={{ fontSize:12, fontWeight:700, color:T.teal, marginBottom:6 }}>{c.cgConfirm}</div>}
            {c.cgOutcome && <div style={{ fontSize:12, color:T.textMid }}>{c.cgOutcome}</div>}
          </div>
        )}

        {(c.cgLog||[]).length > 0 && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:T.textLo, textTransform:"uppercase", letterSpacing:.3, marginBottom:6 }}>Activity log</div>
            {(c.cgLog).map((e,i) => (
              <div key={i} style={{ display:"flex", gap:8, fontSize:11.5, color:T.textMid, marginBottom:4 }}>
                <span style={{ fontFamily:T.mono, color:T.textLo, flexShrink:0 }}>{e.t}</span>
                <span>{e.txt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const displayList = tab === "open" ? openList : pendList;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ModHeader tone={T.green} kicker="Quality / CareGap Queue" line="Care coordinator view — schedule visits, confirm attendance, document outcomes, and close gaps." />

      {/* Stat tiles */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
        <Stat icon={Activity} label="Open gaps" value={fmt(openList.length)} tone={T.green} />
        <Stat icon={Clock} label="Pending visits" value={fmt(pendList.length)} tone={T.teal} />
        {overdueN > 0 && <Stat icon={AlertTriangle} label="Overdue" value={fmt(overdueN)} tone={T.red} />}
        <Stat icon={CheckCircle2} label="Closed today" value={fmt(closedN)} tone={T.textMid} />
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {[{key:"open",label:"Open gaps"},{key:"pending",label:`Pending / Scheduled${overdueN > 0 ? ` · ${overdueN} overdue` : ""}`}].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setSel(null);setShowOtherClose(false);}}
            style={{ padding:"8px 14px", border:"none", borderBottom:`2px solid ${tab===t.key?T.teal:"transparent"}`, background:"transparent", fontSize:12.5, fontWeight:700, color:tab===t.key?T.teal:T.textMid, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", gap:14, minHeight:400 }}>
        {/* Case list */}
        <Card style={{ flex:1, minWidth:0 }} pad={0}>
          {displayList.length === 0
            ? <Empty>{tab==="open" ? "No open gaps. Route from Patient Worklist → Quality / CareGap." : "No visits scheduled yet."}</Empty>
            : displayList.map(c => {
                const status = c.cgStatus || "open";
                const isOverdue = status === "scheduled" && c.cgDate && c.cgDate < TODAY;
                const pillC = status === "seen" ? T.amber : isOverdue ? T.red : T.green;
                const pillL = status === "seen" ? "Seen — document outcome" : isOverdue ? "⚠ Overdue" : status === "scheduled" ? `Visit ${c.cgDate}` : "Open";
                return (
                  <div key={c.id} onClick={()=>{setSel(c); setShowOtherClose(false); setSchedDate(""); setCgConfirm(""); setCgOutcome(""); setOtherConfirm(""); setOtherClose("");}}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", background:sel?.id===c.id?T.teal+"08":T.surface }}>
                    <div style={{ width:3, height:36, background:T.green, borderRadius:99 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{c.patient}</div>
                      <div style={{ fontSize:11.5, color:T.textMid }}>{c.mrn} · {c.measure}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:10.5, fontWeight:700, color:pillC, background:pillC+"18", border:`1px solid ${pillC}44`, borderRadius:999, padding:"2px 8px" }}>{pillL}</span>
                      <ChevronRight size={14} color={T.textLo}/>
                    </div>
                  </div>
                );
              })
          }
        </Card>

        {/* Drawer */}
        {sel && (
          <Card style={{ width:340, flexShrink:0, position:"sticky", top:0, maxHeight:"80vh", overflowY:"auto" }} pad={14}
            title={sel.patient} right={<button onClick={()=>{setSel(null);setShowOtherClose(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:T.textLo }}><X size={15}/></button>}>
            <DrawerBody c={cgQueueCases.find(x=>x.id===sel.id)||sel} />
          </Card>
        )}
      </div>

      {/* Session log */}
      <SessionLog log={[]} queue="caregap" />
    </div>
  );
}

function Impact340BView({ panel, setSelected }) {
  const codes = ["COV-001", "COV-005", "COV-004", "COV-003"];
  const risk = panel.filter((p) => p.recon && codes.includes(p.recon.code) && ((p.clinicalFlags || []).length || p.pharmacyReject));
  const impactOf = (p) => p.recon.code === "COV-003" ? "MCO carve change · capture shift" : (p.recon.code === "COV-004" ? "Pharmacy reject · fill at risk" : "Medicaid → uninsured · capture at risk");
  const toneOf = (p) => p.recon.code === "COV-003" ? T.indigo : (p.recon.code === "COV-004" ? T.amber : T.red);
  const exposure = risk.reduce((a, p) => a + marginOf(p), 0);
  const conversions = risk.filter((p) => p.recon.code === "COV-001" || p.recon.code === "COV-005").length;
  const carve = risk.filter((p) => p.recon.code === "COV-003").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.red} kicker="340B Impact Monitor" line="Connects Medicaid coverage changes to FQHC pharmacy capture — flagging Medicaid-to-uninsured conversions and MCO carve changes that put 340B margin and contract-pharmacy capture at risk." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={Pill} label="Scripts at capture risk" value={fmt(risk.length)} tone={T.red} foot="payer/coverage change" />
        <Stat icon={DollarSign} label="Est. monthly exposure" value={money(exposure)} tone={T.orange} foot="340B margin at risk" />
        <Stat icon={ArrowRight} label="Medicaid → uninsured" value={fmt(conversions)} tone={T.red} foot="capture lost if lapsed" />
        <Stat icon={Boxes} label="MCO carve changes" value={fmt(carve)} tone={T.indigo} foot="capture shift" />
      </div>
      <Card pad={0} title={`340B capture-risk worklist · ${risk.length}`} sub="Pharmacy compliance review — protect capture before the fill is lost">
        <ModTable cols={["Patient", "340B impact", "Medication(s)", "Coverage state", "Est. $/mo", ""]} rows={risk.map((p) => (
          <tr key={p.id} onClick={() => setSelected(p)} style={rowHover} onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
            <td style={tdC}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
            <td style={tdC}><Badge c={toneOf(p)} bg={toneOf(p) + "16"}>{impactOf(p)}</Badge></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{(p.clinicalFlags || []).length ? p.clinicalFlags.join(", ") : "Maintenance Rx"}</span></td>
            <td style={tdC}><span style={{ fontWeight: 700, color: p.recon.tone }}>{p.recon.state}</span></td>
            <td style={tdC}><span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{money(marginOf(p))}</span></td>
            <td style={tdC}><ChevronRight size={15} color={T.textLo} /></td>
          </tr>
        ))} />
        {risk.length === 0 && <Empty>No 340B capture risk detected in this panel.</Empty>}
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Margin figures are synthetic estimates for demonstration · not actual 340B accounting.</div>
    </div>
  );
}

function RuleToggle({ on, set }) {
  return <button onClick={() => set(!on)} style={{ width: 38, height: 22, borderRadius: 99, border: "none", cursor: "pointer", background: on ? T.teal : T.borderHi, position: "relative", transition: "background .15s" }}>
    <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: 99, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.2)", transition: "left .15s" }} />
  </button>;
}
function RuleStep({ v, set, suffix }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <button onClick={() => set(Math.max(0, v - (suffix === "%" ? 5 : 1)))} style={{ ...stepBtn }}>–</button>
    <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 42, textAlign: "center" }}>{v}{suffix}</span>
    <button onClick={() => set(v + (suffix === "%" ? 5 : 1))} style={{ ...stepBtn }}>+</button>
  </span>;
}
const stepBtn = { width: 24, height: 24, borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 800, cursor: "pointer", lineHeight: 1 };

function RuleRow({ label, detail, control }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface2 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: T.textLo, marginTop: 2 }}>{detail}</div>}
      </div>
      <div style={{ flex: "0 0 auto" }}>{control}</div>
    </div>
  );
}
function RulesEngineView() {
  const [staleEMR, setStaleEMR] = useState(30);
  const [freshWin, setFreshWin] = useState(72);
  const [renewWin, setRenewWin] = useState(45);
  // ── TRADE SECRET SEAM [B] · document-readiness threshold (demo default). Production threshold managed server-side under change control.
  const [docMin, setDocMin] = useState(75);
  const [codes, setCodes] = useState(() => CONFLICT_TAXONOMY.reduce((o, t) => ({ ...o, [t.code]: true }), {}));
  const [immHuman, setImmHuman] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.teal} kicker="Settings / Rules Engine" line="The reconciliation engine is deterministic and configurable — not a black box. Source precedence, staleness windows, conflict definitions, and routing are explicit rules an FQHC can tune and audit." />
      <Card title="Source reliability & temporal rules" sub="How sources are weighted and when they go stale">
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <RuleRow label="270/271 outranks EMR when recently checked" detail={`Real-time eligibility wins if checked within ${freshWin} hours`} control={<RuleStep v={freshWin} set={setFreshWin} suffix="h" />} />
          <RuleRow label="EMR payer record marked stale" detail={`Flag EMR registration as low-reliability after ${staleEMR} days without verification`} control={<RuleStep v={staleEMR} set={setStaleEMR} suffix="d" />} />
          <RuleRow label="State Medicaid file is authoritative for termination" detail="State termination + 270 inactive → Inactive — High Confidence" control={<Badge c={T.teal} bg={T.teal + "16"}>locked</Badge>} />
        </div>
      </Card>
      <Card title="Conflict definitions" sub="Toggle which coverage-conflict codes are active in reconciliation">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 9 }}>
          {CONFLICT_TAXONOMY.map((t) => (
            <RuleRow key={t.code} label={`${t.code} · ${t.state}`} detail={t.pattern} control={<RuleToggle on={codes[t.code]} set={(v) => setCodes((c) => ({ ...c, [t.code]: v }))} />} />
          ))}
        </div>
      </Card>
      <Card title="Routing, communication & documents" sub="Deterministic next-action rules">
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <RuleRow label="COV-005 + critical medication → pharmacy + eligibility" detail="Coverage loss likely with a high-risk med routes to two queues" control={<Badge c={T.red} bg={T.red + "14"}>critical</Badge>} />
          <RuleRow label="COV-007 (denial / active on DOS) → RCM recovery" detail="Auto-create a rebilling task with date-of-service evidence" control={<Badge c={T.green} bg={T.green + "16"}>on</Badge>} />
          <RuleRow label="Renewal-due triggers intake sequence" detail={`Start the eligibility intake agent when renewal is within ${renewWin} days`} control={<RuleStep v={renewWin} set={setRenewWin} suffix="d" />} />
          <RuleRow label="Document replacement threshold" detail={`Request a clearer image when document readiness is below ${docMin}%`} control={<RuleStep v={docMin} set={setDocMin} suffix="%" />} />
        </div>
      </Card>
      <Card title="Compliance guardrails" sub="Safety rules the platform will not auto-override">
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <RuleRow label="Immigration / sensitive responses route to human staff" detail="Never auto-acted; always a human exception" control={<RuleToggle on={immHuman} set={setImmHuman} />} />
          <RuleRow label="No autonomous eligibility determination" detail="The platform reconciles and recommends — it never tells a patient they are eligible or ineligible" control={<Badge c={T.teal} bg={T.teal + "16"}>enforced</Badge>} />
          <RuleRow label="Every decision written to the audit trail" detail="Reconciliation, routing, and overrides are all logged" control={<Badge c={T.teal} bg={T.teal + "16"}>enforced</Badge>} />
        </div>
      </Card>
      <Card title="Exemption rules table (governed)" sub="Probable-exemption detection is driven by an approved rules table — not hardcoded logic. Every rule requires clinician confirmation.">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead><tr style={{ textAlign: "left", color: T.textLo, fontSize: 9.5, textTransform: "uppercase", letterSpacing: .4 }}>
              {["Rule", "Category", "Type", "Code / keyword", "Conf.", "Sensitive", "Confirm", "Approved", "Active"].map((h) => <th key={h} style={{ padding: "7px 8px", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {EXEMPTION_RULES.map((r) => (
                <tr key={r.rule_id} style={{ borderBottom: `1px solid ${T.surface2}` }}>
                  <td style={{ padding: "6px 8px", fontFamily: T.mono, fontWeight: 700 }}>{r.rule_id}</td>
                  <td style={{ padding: "6px 8px" }}>{r.exemption_category}</td>
                  <td style={{ padding: "6px 8px" }}>{r.evidence_type === "structured_dx" ? "Structured dx" : "Note NLP"}</td>
                  <td style={{ padding: "6px 8px", fontFamily: T.mono }}>{r.code_or_keyword}</td>
                  <td style={{ padding: "6px 8px" }}>{r.confidence_default}</td>
                  <td style={{ padding: "6px 8px" }}>{r.sensitive ? <Badge c={T.orange} bg={T.orange + "16"}>sensitive</Badge> : "\u2014"}</td>
                  <td style={{ padding: "6px 8px" }}><CheckCircle2 size={13} color={T.green} /></td>
                  <td style={{ padding: "6px 8px", color: T.textLo, whiteSpace: "nowrap" }}>{r.approved_date}</td>
                  <td style={{ padding: "6px 8px" }}>{r.active_flag ? <span style={{ color: T.green, fontWeight: 700 }}>active</span> : "retired"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: T.textMid, marginTop: 10, lineHeight: 1.5 }}><b>Negation / context handling (note rules):</b> {NEGATION_TERMS.join(" \u00b7 ")} — a keyword match is suppressed when any of these co-occur, so family-history, denied, resolved, or other-subject mentions do not create a candidate.</div>
        <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 6, lineHeight: 1.5 }}>Rules are approved by compliance + clinical leads with effective / retired dates. Sensitive-category candidates are restricted to authorized reviewers and routed to compliance review. Every rule hit, view, confirmation, rejection, override, and export is audited.</div>
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Cpu size={12} /> Demo controls adjust the displayed rule set · production weights and thresholds are managed under change control.</div>
    </div>
  );
}

const MED_NAME = { "Diabetes": "Insulin", "Asthma": "Inhaler (ICS)", "Behavioral health": "Antipsychotic", "Hypertension": "Antihypertensive", "HIV": "Antiretroviral", "Pregnancy": "Prenatal vitamins" };
const medOf = (p) => ((p.clinicalFlags || []).map((f) => MED_NAME[f]).filter(Boolean)[0]) || "Maintenance Rx";
const critMed = (p) => (p.clinicalFlags || []).some((f) => f === "Diabetes" || f === "HIV" || f === "Behavioral health");

const routeBtnSm = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, padding: "5px 9px", borderRadius: 7, border: "none", background: T.ink, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" };
function RouteCell({ p, routed, setRouted, onRoute }) {
  if (!p.recon || !p.recon.route) return null;
  if (routed[p.id]) return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.green, fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap" }}><CheckCircle2 size={13} /> Routed</span>;
  return <button onClick={(e) => { e.stopPropagation(); if (onRoute) { onRoute(p, p.recon.route); setRouted((m) => ({ ...m, [p.id]: true })); } }} style={routeBtnSm} title={`Route to ${labelFor(p.recon.route)}`}><ArrowRight size={12} /> Route</button>;
}
function RxCoverageView({ panel, setSelected, onRoute }) {
  const [routed, setRouted] = useState({});
  const rx = panel.filter((p) => p.pharmacyReject);
  const accessOnly = rx.filter((p) => p.recon && p.recon.code === "COV-004");
  const loss = rx.filter((p) => p.recon && p.recon.code === "COV-005");
  const med = (p) => p.coverage === "inactive" ? { st: "Inactive (likely)", stc: T.red } : { st: "Active", stc: T.green };
  const action = (p) => { const c = rejectClassOf(p.rejectCode); return c === "loss" ? "Eligibility + pharmacy rescue" : c === "cob" ? "Resubmit to correct payer" : "Pharmacy payer-profile / PA"; };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.red} kicker="RxCoverage Guard" line="Uses pharmacy claim rejects as an early-warning signal — and distinguishes pharmacy access risk (a fixable payer-profile issue) from likely medical coverage loss, so insulin and other critical fills don't fail silently." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={Pill} label="Pharmacy rejects" value={fmt(rx.length)} tone={T.red} foot="near-real-time" />
        <Stat icon={ShieldCheck} label="Access risk only" value={fmt(accessOnly.length)} tone={T.amber} foot="medical still active" />
        <Stat icon={AlertTriangle} label="Coverage loss likely" value={fmt(loss.length)} tone={T.red} foot="eligibility + pharmacy" />
        <Stat icon={Activity} label="Critical-med rejects" value={fmt(rx.filter(critMed).length)} tone={T.orange} foot="insulin / BH / HIV" />
      </div>
      <Card pad={0} title={`Pharmacy rescue worklist · ${rx.length}`} sub="Reconciled pharmacy-vs-medical state · route to pharmacy rescue">
        <ModTable cols={["Patient", "Medical Medicaid", "Pharmacy", "Medication", "Risk", "Action", "Route"]} rows={rx.map((p) => { const m = med(p); return (
          <tr key={p.id} onClick={() => setSelected(p)} style={rowHover} onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
            <td style={tdC}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
            <td style={tdC}><span style={{ fontWeight: 700, color: m.stc }}>{m.st}</span></td>
            <td style={tdC}><Badge c={T.red} bg={T.red + "16"}>Reject {p.rejectCode || "?"}</Badge><div style={{ fontSize: 10.5, color: T.textLo, marginTop: 3 }}>{rejectLabel(p.rejectCode)}</div><span style={{ display: "inline-block", marginTop: 4, fontSize: 9.5, fontWeight: 800, color: CLASS_META[rejectClassOf(p.rejectCode)].tone, background: CLASS_META[rejectClassOf(p.rejectCode)].tone + "16", padding: "1px 6px", borderRadius: 5 }}>{CLASS_META[rejectClassOf(p.rejectCode)].label}</span></td>
            <td style={tdC}>{medOf(p)}</td>
            <td style={tdC}>{critMed(p) ? <Badge c={T.red} bg={T.red + "14"}>Critical</Badge> : <Badge c={T.amber} bg={T.amber + "16"}>High</Badge>}</td>
            <td style={tdC}><span style={{ color: T.textMid }}>{action(p)}</span></td>
            <td style={tdC}><RouteCell p={p} routed={routed} setRouted={setRouted} onRoute={onRoute} /></td>
          </tr>
        ); })} />
        {rx.length === 0 && <Empty>No pharmacy rejects in this panel.</Empty>}
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Reject is classified within the reconciled coverage state — it does not auto-submit any eligibility transaction.</div>
    </div>
  );
}

function RevenueRecoveryView({ panel, setSelected, onRoute }) {
  const [routed, setRouted] = useState({});
  const rr = panel.filter((p) => p.recon && p.recon.code === "COV-007");
  const recVal = (p) => 180 + ((p.idx * 53) % 220);
  const claimNo = (p) => "100" + (200 + (p.idx % 700));
  const denial = (p) => ["Eligibility denied", "Medicaid inactive at filing", "Payer / plan mismatch"][p.idx % 3];
  const dos = (p) => ["270 active on date of service", "Coverage restored retroactively", "MCO plan corrected"][p.idx % 3];
  const act = (p) => ["Rebill", "Reprocess", "Correct payer & resubmit"][p.idx % 3];
  const total = rr.reduce((a, p) => a + recVal(p), 0);
  const avg = rr.length ? Math.round(total / rr.length) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.green} kicker="Revenue Recovery Guard" line="Turns eligibility denials into recoverable revenue — when 270/271 shows coverage was active on the date of service, the denial is wrong and the claim is rebillable. Coverage protection plus denial recovery." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={DollarSign} label="Recoverable claims" value={fmt(rr.length)} tone={T.green} foot="active on DOS" />
        <Stat icon={Activity} label="Recovery potential" value={money(total)} tone={T.teal} foot="rebillable revenue" />
        <Stat icon={ArrowRight} label="Avg per claim" value={money(avg)} tone={T.indigo} foot="estimated" />
        <Stat icon={AlertTriangle} label="High-dollar (>$300)" value={fmt(rr.filter((p) => recVal(p) > 300).length)} tone={T.orange} foot="prioritize" />
      </div>
      <Card pad={0} title={`Rebilling worklist · ${rr.length}`} sub="Eligibility denials with date-of-service coverage evidence · route to RCM recovery">
        <ModTable cols={["Patient", "Claim #", "Denial reason", "DOS coverage evidence", "Recovery", "Action", "Route"]} rows={rr.map((p) => (
          <tr key={p.id} onClick={() => setSelected(p)} style={rowHover} onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
            <td style={tdC}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
            <td style={tdC}><span style={{ fontFamily: T.mono }}>#{claimNo(p)}</span></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{denial(p)}</span></td>
            <td style={tdC}><Badge c={T.green} bg={T.green + "16"}>{dos(p)}</Badge></td>
            <td style={tdC}><span style={{ fontWeight: 800, color: T.green, fontVariantNumeric: "tabular-nums" }}>{money(recVal(p))}</span></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{act(p)}</span></td>
            <td style={tdC}><RouteCell p={p} routed={routed} setRouted={setRouted} onRoute={onRoute} /></td>
          </tr>
        ))} />
        {rr.length === 0 && <Empty>No rebilling opportunities in this panel.</Empty>}
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Recovery amounts are synthetic estimates for demonstration.</div>
    </div>
  );
}

function deriveFQHC(panel) {
  const w = panel.filter((p) => p.recon);
  const conflicts = w.filter((p) => p.recon.code);
  const lost = w.filter((p) => p.recon.code === "COV-001" || p.recon.code === "COV-005");
  const captureCodes = ["COV-001", "COV-005", "COV-004", "COV-003"];
  const capture = w.filter((p) => captureCodes.includes(p.recon.code) && ((p.clinicalFlags || []).length || p.pharmacyReject));
  const udsGaps = w.filter((p) => (p.clinicalFlags || []).length && (p.recon.code || p.coverage !== "active")).length;
  return {
    ppsAtRisk: Math.round(conflicts.length * FIN_DEFAULT.visits * FIN_DEFAULT.pps),
    sliding: lost.length,
    exposure340B: capture.reduce((a, p) => a + marginOf(p), 0),
    pharmacyCapture: w.filter((p) => p.pharmacyReject).length,
    udsGaps,
    mcoChurn: w.filter((p) => p.recon.code === "COV-003").length,
  };
}

function MedicaidReviewView({ reviewCohort = [], setReview = () => {} }) {
  const [filter, setFilter] = useState("due"); // due | progress | resolved | all
  const [open, setOpen] = useState(null);
  const [chg, setChg] = useState({ income: false, household: false, address: false });
  const [notice, setNotice] = useState("yes");
  const [status, setStatus] = useState("renewal_ready");
  const [note, setNote] = useState("");
  const cohort = reviewCohort;
  const dueN = cohort.filter((r) => r.status === "review_due").length;
  const progN = cohort.filter((r) => REVIEW_INPROGRESS.includes(r.status)).length;
  const resN = cohort.filter((r) => REVIEW_RESOLVED.includes(r.status)).length;
  const rows = cohort.filter((r) => filter === "all" ? true : filter === "due" ? r.status === "review_due" : filter === "progress" ? REVIEW_INPROGRESS.includes(r.status) : REVIEW_RESOLVED.includes(r.status));
  const suggested = suggestReview(chg, notice);
  const openReview = (mrn) => { setChg({ income: false, household: false, address: false }); setNotice("yes"); setStatus("renewal_ready"); setNote(""); setOpen(open === mrn ? null : mrn); };
  const chip = (val, label, n) => (
    <button onClick={() => setFilter(val)} style={{ fontSize: 11.5, fontWeight: 700, border: `1px solid ${filter === val ? T.ink : T.border}`, background: filter === val ? T.ink : T.surface, color: filter === val ? "#fff" : T.textMid, borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{label}{n != null ? ` · ${n}` : ""}</button>
  );
  const box = (b, set, label) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text, cursor: "pointer" }}>
      <input type="checkbox" checked={b} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.teal} kicker="Coverage Review" line="Proactive, two-stage Medicaid coverage review. Stage 1 places a screening prompt on the Medicaid / MCO population; Stage 2 resolves to an evidence-based case status. Flags round-trip to the eCW chart." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ border: `1px solid ${T.amber}44`, background: T.amber + "0C", borderRadius: 10, padding: "9px 11px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: T.amber, textTransform: "uppercase", letterSpacing: .3 }}>Stage 1 · population flag</div>
          <div style={{ fontSize: 11.5, color: T.textMid, marginTop: 2, lineHeight: 1.45 }}>"Annual Medicaid Coverage Review Due." Based on Medicaid / MCO enrollment. <b>Prompts a screening</b> — asserts nothing missing.</div>
        </div>
        <div style={{ border: `1px solid ${T.indigo}44`, background: T.indigo + "0C", borderRadius: 10, padding: "9px 11px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: T.indigo, textTransform: "uppercase", letterSpacing: .3 }}>Stage 2 · case status</div>
          <div style={{ fontSize: 11.5, color: T.textMid, marginTop: 2, lineHeight: 1.45 }}>e.g. "Documentation Missing." Based on the review or source evidence. <b>Creates an actionable task</b> — only when a specific need is found.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <Stat icon={Users} label="Medicaid / MCO cohort" value={fmt(cohort.length)} tone={T.teal} foot="primary/secondary + MCO" />
        <Stat icon={Bell} label="Review due (Stage 1)" value={fmt(dueN)} tone={T.amber} foot="screening prompt" />
        <Stat icon={Clock} label="In progress (Stage 2)" value={fmt(progN)} tone={T.indigo} foot="actionable tasks" />
        <Stat icon={CheckCircle2} label="Resolved" value={fmt(resN)} tone={T.green} foot="ready / verified / declined" />
      </div>
      <Card pad={0} title="Coverage review worklist" sub="Medicaid / MCO patients · Stage 1 prompt through Stage 2 resolution" right={
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{chip("due", "Due", dueN)}{chip("progress", "In progress", progN)}{chip("resolved", "Resolved", resN)}{chip("all", "All", cohort.length)}</div>
      }>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: T.textLo, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>
                {["Patient", "MCO plan", "Renewal", "Trigger", "Status", "Action"].map((h) => <th key={h} style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = REVIEW_STATUS[r.status] || REVIEW_STATUS.not_due;
                const isDue = r.status === "review_due" || r.status === "not_due";
                return (
                  <React.Fragment key={r.mrn}>
                    <tr style={{ borderBottom: open === r.mrn ? "none" : `1px solid ${T.surface2}` }}>
                      <td style={{ padding: "10px 14px" }}><div style={{ fontWeight: 700 }}>{r.patient}</div><div style={{ fontSize: 11, color: T.textLo, fontFamily: T.mono }}>{r.mrn} · {r.lang}</div></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 12 }}>{r.mco}</span></td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}><span style={{ fontWeight: 600 }}>{r.renewalDays}d</span> <span style={{ color: T.textLo, fontSize: 11 }}>{r.renewalDate.slice(5)}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11.5, color: T.textMid }}>{r.trigger}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10.5, fontWeight: 800, color: st.c, background: st.c + "18", border: `1px solid ${st.c}44`, borderRadius: 999, padding: "2px 9px" }}>{st.label}</span>{r.reviewedDate && <div style={{ fontSize: 9.5, color: T.textLo, marginTop: 2 }}>reviewed {r.reviewedDate}</div>}</td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <button onClick={() => openReview(r.mrn)} style={{ ...(isDue ? primaryBtn : ghostBtn), padding: "7px 11px" }}>{isDue ? "Complete review" : "Update"}</button>
                      </td>
                    </tr>
                    {open === r.mrn && (
                      <tr style={{ borderBottom: `1px solid ${T.surface2}` }}>
                        <td colSpan={6} style={{ padding: "4px 16px 16px 16px", background: T.teal + "06" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: T.teal, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Short annual review — {r.patient}</div>
                          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textLo, marginBottom: 5 }}>Any change since last renewal?</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{box(chg.income, (v) => setChg({ ...chg, income: v }), "Income / employment")}{box(chg.household, (v) => setChg({ ...chg, household: v }), "Household / dependents")}{box(chg.address, (v) => setChg({ ...chg, address: v }), "Address / contact")}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textLo, marginBottom: 5 }}>State renewal packet</div>
                              <select value={notice} onChange={(e) => setNotice(e.target.value)} style={{ ...drawerInput, width: 220 }}>
                                <option value="yes">Received / accessible</option>
                                <option value="no">Not received</option>
                                <option value="help">Needs help completing it</option>
                              </select>
                            </div>
                            <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textLo, marginBottom: 5 }}>Suggested outcome</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: (REVIEW_STATUS[suggested.status] || {}).c }}>{(REVIEW_STATUS[suggested.status] || {}).label}</div>
                              {suggested.checklist.length > 0 && <div style={{ fontSize: 10.5, color: T.textMid, marginTop: 3 }}>Checklist: {suggested.checklist.join(" · ")}</div>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
                            <label style={{ fontSize: 11, color: T.textMid }}>Set status<br /><select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...drawerInput, width: 260, marginTop: 3 }}>{["renewal_ready", "documentation_requested", "documentation_missing", "staff_verification_required", "patient_assistance_requested", "submitted", "verified_resolved", "patient_declined"].map((k) => <option key={k} value={k}>{REVIEW_STATUS[k].label}</option>)}</select></label>
                            <button onClick={() => setStatus(suggested.status)} style={{ ...ghostBtn, padding: "7px 10px" }}>Use suggested</button>
                          </div>
                          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" style={{ ...drawerInput, width: "100%", maxWidth: 520, marginBottom: 10 }} />
                          <div style={{ fontSize: 10, color: T.textLo, lineHeight: 1.5, marginBottom: 9 }}>Resolving writes the Stage-2 status back to the eCW chart flag and to the audit trail. A screening prompt only becomes a documentation task when the review identifies a specific need.</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setReview(r.mrn, status, { checklist: suggested.checklist, note }); setOpen(null); }} style={{ ...primaryBtn, padding: "8px 12px" }}><CheckCircle2 size={14} /> Resolve review</button>
                            <button onClick={() => { setReview(r.mrn, "patient_declined", { note }); setOpen(null); }} style={{ ...ghostBtn, padding: "8px 12px" }}>Patient declined</button>
                            <button onClick={() => setOpen(null)} style={{ ...ghostBtn, padding: "8px 12px" }}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>No patients in this view.</Empty>}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={12} /> Stage 1 never labels the panel "documentation missing" — it prompts a review. Stage 2 is written from the review or source evidence, round-tripped to the eCW flag, and audited.</div>
    </div>
  );
}
function DataSourceHealthView({ panel }) {
  const inFile = panel.filter((p) => p.crisp);
  const cur = inFile.filter((p) => p.crisp.window === "current").length;
  const nxt = inFile.filter((p) => p.crisp.window === "upcoming").length;
  const suppressed = panel.filter((p) => p.recon && p.recon.guardrail && !p.recon.guardrail.allow).length;
  const mm = pad((new Date()).getMonth() + 1);
  const nullMcaid = panel.filter((p) => !p.medicaidId).length;
  const nullPhone = panel.filter((p) => p.crisp && p.crisp.noPhone).length;
  const staleCov = panel.filter((p) => p.recon && p.recon.sources.some((x) => x.key.indexOf("EMR") === 0 && x.reliability === "Low")).length;
  const feeds = [
    ["Availity 271 — eligibility", "SFTP mailbox · .271 files", "Today", "Active", T.green, "\u2014"],
    ["Availity 835 / 277 — claims & denials", "SFTP mailbox · ERA / status", "Today", "Active", T.green, "\u2014"],
    ["CRISP Medicaid Redetermination File", "CRISP MFT · pipe-delimited .csv", mm + "/28", "Received", T.green, "Ingested"],
    ["eCW / Snowflake — coverage snapshot", "Snowflake extract + eCW API/FHIR", "Today 02:14", "Active", T.green, "Refreshed"],
    ["Pharmacy Management System rejects — in-house Snowflake", "Nightly report export (Snowflake)", "Today", "Active", T.green, "\u2014"],
    ["MCO roster (834)", "Direct from MCO (per plan)", "06/01", "Stale", T.orange, "Request updated file"],
  ];
  const kv = [
    ["Expected delivery", "End of each month"], ["MFT availability window", "72 hours"],
    ["Download deadline", mm + "/30 23:59"], ["Download status", "Downloaded"],
    ["Ingestion status", "Parsed"], ["Patients in file", fmt(inFile.length)],
    ["Current-month renewals", fmt(cur)], ["Next-month renewals", fmt(nxt)],
    ["Outreach suppressed", fmt(suppressed)], ["Errors", "0"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.teal} kicker="Data Source Health" line="Every reconciled coverage state is only as fresh as its feeds. This tracks each source — and the CRISP file's 72-hour MFT retrieval window, so a monthly renewal file is never missed." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={RotateCcw} label="Feeds reporting" value={"5 / 6"} tone={T.green} foot="1 stale (MCO roster)" />
        <Stat icon={ClipboardCheck} label="CRISP patients in file" value={fmt(inFile.length)} tone={T.teal} foot="due within 3 months" />
        <Stat icon={Clock} label="Current-month renewals" value={fmt(cur)} tone={T.amber} foot="outreach now" />
        <Stat icon={Bell} label="Outreach suppressed" value={fmt(suppressed)} tone={T.textMid} foot="guardrail enforced" />
      </div>
      <Card pad={0} title="Source feeds" sub="Live status of each reconciliation input">
        <ModTable cols={["Source", "Delivery method", "Last received", "Status", "Action"]} rows={feeds.map((fd, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${T.surface2}` }}>
            <td style={tdC}><span style={{ fontWeight: 700 }}>{fd[0]}</span></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{fd[1]}</span></td>
            <td style={tdC}><span style={{ fontFamily: T.mono, fontSize: 11.5 }}>{fd[2]}</span></td>
            <td style={tdC}><Badge c={fd[4]} bg={fd[4] + "16"}>{fd[3]}</Badge></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{fd[5]}</span></td>
          </tr>
        ))} />
      </Card>
      <Card title="eCW / Snowflake — coverage snapshot health" sub="Source freshness + data-quality checks on the in-house eCW extract">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {[["Last Snowflake refresh", "Today 02:14"], ["Last eCW API pull", "Today 06:00"], ["Patient records", fmt(panel.length)], ["Coverage records", fmt(panel.length)], ["Null Medicaid ID", fmt(nullMcaid)], ["Null / invalid phone", fmt(nullPhone)], ["Coverage stale > 60 days", fmt(staleCov)], ["Appointment feed", "Active"], ["ETL errors", "0"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, padding: "7px 10px", background: T.surface2, borderRadius: 8 }}>
              <span style={{ color: T.textLo }}>{k}</span><span style={{ fontWeight: 700, color: (k === "Coverage stale > 60 days" && staleCov > 0) ? T.amber : (k === "Null / invalid phone" && nullPhone > 0) ? T.amber : T.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="CRISP file — retrieval & ingestion" sub="72-hour MFT window · POC notified by crisp_insights_notify@crisphealth.org">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {kv.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, padding: "7px 10px", background: T.surface2, borderRadius: 8 }}>
              <span style={{ color: T.textLo }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Synthetic feed status for demonstration · production monitors real MFT delivery + ingestion.</div>
    </div>
  );
}
function AuditRow({ a, compact }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: compact ? "7px 0" : "9px 12px", borderBottom: `1px solid ${T.surface2}` }}>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textLo, flex: "0 0 56px", paddingTop: 1 }}>{a.ts}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.indigo, fontWeight: 600 }}>{a.actor}</span>
        <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}> {a.action}</span>
        <div style={{ fontSize: 11.5, color: T.textMid }}>{a.detail}</div>
      </span>
      {a.phi && <Badge c={T.amber}>PHI</Badge>}
    </div>
  );
}

/* ============================================================
   VIEW · Work Queues
   ============================================================ */
function Queues({ queues, viewerRole = "authorized", panel = [], setSelected = () => {}, decideExemption = () => {} }) {
  const [tab, setTab] = useState("eligibility");
  const [exp, setExp] = useState(null); // { id, mode: "confirm" | "reject" }
  const [stmt, setStmt] = useState(""); const [evid, setEvid] = useState("Clinician exam / attestation"); const [rev, setRev] = useState(""); const [rej, setRej] = useState("No functional impairment established");
  const EVIDENCE = ["State claims / encounter data", "Clinician exam / attestation", "Both"];
  const REJECTS = ["No functional impairment established", "Condition resolved / historical", "Insufficient evidence — records needed"];
  const canAct = viewerRole === "authorized";
  const closeExp = () => setExp(null);
  const q = queues.find((x) => x.key === tab) || queues[0];
  const urgC = { high: T.red, normal: T.amber };
  const visible = q.items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {queues.map((x) => {
          const openN = x.items.length;
          return (
            <button key={x.key} onClick={() => setTab(x.key)} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${tab === x.key ? x.color : T.border}`, background: tab === x.key ? x.color + "12" : T.surface, color: tab === x.key ? x.color : T.textMid, borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              <x.icon size={15} /> {x.label}
              <span style={{ fontSize: 11, fontWeight: 800, background: tab === x.key ? x.color : T.border, color: tab === x.key ? "#fff" : T.textMid, borderRadius: 99, padding: "0 7px" }}>{openN}</span>
            </button>
          );
        })}
      </div>
      <Card title={q.label} sub={q.blurb} pad={0} right={null}>
        {visible.length === 0 ? <Empty>This queue is clear. The system is keeping up — staff only see the exceptions.</Empty> : (
          <div>
            {visible.map((c) => {
              const restricted = c.exemption && c.exemption.sensitive && viewerRole !== "authorized";
              return (
              <div key={c.id} style={{ borderBottom: `1px solid ${T.surface2}` }}>
              <div onClick={() => { const pp = panel.find((x) => x.mrn === c.mrn); if (pp) setSelected(pp); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: "transparent" }} onMouseEnter={e => e.currentTarget.style.background = T.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: 8, height: 40, borderRadius: 99, background: urgC[c.urgency] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.patient}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textLo }}>{c.mrn}</span>
                    {c.tier && <TierPill tier={c.tier} small />}
                    {c.transcript && <Badge c={T.indigo}>transcript</Badge>}
                    {c.docs && <Badge c={c.docs.review ? T.orange : T.green}>{c.docs.review ? `${c.docs.total} docs · ${c.docs.review} needs review` : `${c.docs.total} docs ✓`}</Badge>}
                    {c.exemption && (c.exemption.sensitive && viewerRole !== "authorized"
                      ? <Badge c={T.textLo} bg={T.surface2}>restricted · authorized only</Badge>
                      : <Badge c={T.indigo}>{c.exemption.category}</Badge>)}
                    {c.exemption && EXEMPTION_STATUS[c.exemption.status] && <Badge c={EXEMPTION_STATUS[c.exemption.status].c}>{EXEMPTION_STATUS[c.exemption.status].label}</Badge>}
                    {c.exemption && c.exemption.requires_impairment_element && IMPAIRMENT[c.exemption.impairment_status] && <Badge c={IMPAIRMENT[c.exemption.impairment_status].c}>Element 2: {IMPAIRMENT[c.exemption.impairment_status].label}</Badge>}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.textMid, marginTop: 3 }}>{c.exemption && c.exemption.sensitive && viewerRole !== "authorized" ? "Sensitive clinical candidate — evidence restricted to authorized clinical reviewers." : c.reason}{c.exemption && !(c.exemption.sensitive && viewerRole !== "authorized") && <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.textLo }}>{"  ·  " + c.exemption.rule_id + "  ·  Element 1: condition \u2713"}</span>}</div>
                </div>
                <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: c.ageHours > 24 ? T.red : T.textMid }}><Clock size={11} style={{ verticalAlign: -1 }} /> {c.ageHours}h old</div>
                  <div style={{ fontSize: 10.5, color: T.textLo }}>{c.sla}</div>
                </div>
                {c.exemption && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
                    {(() => { const pp = panel.find((x) => x.mrn === c.mrn); return pp ? <button onClick={() => setSelected(pp)} style={{ ...ghostBtn, padding: "7px 10px" }}><Stethoscope size={13} /> Review</button> : null; })()}
                    {canAct ? (<>
                      <button onClick={() => { const open = exp && exp.id === c.id && exp.mode === "confirm"; setStmt(""); setEvid("Clinician exam / attestation"); setRev(""); setExp(open ? null : { id: c.id, mode: "confirm" }); }} style={{ ...primaryBtn, padding: "7px 10px" }}><CheckCircle2 size={13} /> Confirm</button>
                      <button onClick={() => decideExemption(c.mrn, "assess")} style={{ ...ghostBtn, padding: "7px 10px" }}>Needs visit</button>
                      <button onClick={() => { const open = exp && exp.id === c.id && exp.mode === "reject"; setRej(REJECTS[0]); setExp(open ? null : { id: c.id, mode: "reject" }); }} style={{ ...ghostBtn, padding: "7px 10px", color: T.red, borderColor: T.red + "55" }}>Reject</button>
                    </>) : (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: T.textLo, background: T.surface2, borderRadius: 999, padding: "5px 10px" }}>Authorized clinician review required</span>
                    )}
                  </div>
                )}
              </div>
              {exp && exp.id === c.id && canAct && c.exemption && (
                <div style={{ padding: "12px 16px 16px 36px", background: T.indigo + "07", borderTop: `1px dashed ${T.border}` }}>
                  {exp.mode === "confirm" ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.indigo, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Clinician attestation — two-element medical frailty</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
                        <div style={{ flex: "1 1 240px", border: `1px solid ${T.green}44`, background: T.green + "0C", borderRadius: 8, padding: "7px 9px" }}>
                          <div style={{ fontSize: 8.5, fontWeight: 800, color: T.green, textTransform: "uppercase" }}>Element 1 · qualifying condition ✓</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>{restricted ? "Restricted" : c.exemption.category}</div>
                          <div style={{ fontSize: 10, color: T.textLo, fontFamily: T.mono, marginTop: 1 }}>{c.exemption.rule_id}</div>
                        </div>
                        <div style={{ flex: "1 1 240px", border: `1px solid ${T.indigo}44`, background: T.indigo + "0C", borderRadius: 8, padding: "7px 9px" }}>
                          <div style={{ fontSize: 8.5, fontWeight: 800, color: T.indigo, textTransform: "uppercase" }}>Element 2 · functional impairment (required)</div>
                          <textarea value={stmt} onChange={(e) => setStmt(e.target.value)} placeholder="State how the condition significantly impairs this patient's ability to meet the 80-hour community-engagement requirement." style={{ width: "100%", marginTop: 4, minHeight: 46, resize: "vertical", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontFamily: "inherit", color: T.text, background: T.surface, boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 9 }}>
                        <label style={{ fontSize: 11, color: T.textMid }}>Evidence source<br /><select value={evid} onChange={(e) => setEvid(e.target.value)} style={{ ...drawerInput, width: 220, marginTop: 3 }}>{EVIDENCE.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
                        <label style={{ fontSize: 11, color: T.textMid }}>Re-verify by<br /><input type="date" value={rev} onChange={(e) => setRev(e.target.value)} style={{ ...drawerInput, width: 160, marginTop: 3 }} /><div style={{ fontSize: 9.5, color: T.textLo }}>defaults to +12 months</div></label>
                      </div>
                      <div style={{ fontSize: 10, color: T.textLo, lineHeight: 1.5, marginBottom: 9 }}>Records a clinician attestation and prepares a printable form (CG-FA-01). Confirm the State accepts this form, or use the State\u2019s preferred form. Documentation on behalf of the individual under 42 CFR 435.557(f); the State determines eligibility. Written to the audit trail.</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button disabled={!stmt.trim()} onClick={() => { decideExemption(c.mrn, "confirm", { statement: stmt.trim(), evidence: evid, reverify: rev || undefined }); closeExp(); }} style={{ ...primaryBtn, padding: "8px 12px", opacity: stmt.trim() ? 1 : .5, cursor: stmt.trim() ? "pointer" : "not-allowed" }}><CheckCircle2 size={14} /> Attest & confirm exemption</button>
                        <button onClick={closeExp} style={{ ...ghostBtn, padding: "8px 12px" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Reject exemption candidate</div>
                      <label style={{ fontSize: 11, color: T.textMid }}>Reason<br /><select value={rej} onChange={(e) => setRej(e.target.value)} style={{ ...drawerInput, width: 320, marginTop: 3 }}>{REJECTS.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
                      <div style={{ fontSize: 10, color: T.textLo, lineHeight: 1.5, margin: "8px 0 9px" }}>The patient returns to the normal activity-reporting / self-attestation path — not to termination. Written to the audit trail.</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { decideExemption(c.mrn, "reject", { reason: rej }); closeExp(); }} style={{ ...primaryBtn, padding: "8px 12px", background: T.red, borderColor: T.red }}>Confirm rejection</button>
                        <button onClick={closeExp} style={{ ...ghostBtn, padding: "8px 12px" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              );
            })}
          </div>
        )}
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Activity size={12} /> Claiming a case sets you as owner, logs <span style={{ fontFamily: T.mono }}>case.assigned</span> to the audit trail, and drops it out of the open queue.</div>
    </div>
  );
}

/* ============================================================
   VIEW · Agents & Orchestration
   ============================================================ */
function Agents({ agents, setAgents }) {
  const [open, setOpen] = useState(null);
  const layers = [
    { name: "Orchestration layer", keys: agents.filter((a) => a.layer === "Orchestration") },
    { name: "Agent layer", keys: agents.filter((a) => a.layer === "Agents") },
  ];
  const dot = (s) => s === "running" ? T.green : T.textLo;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card pad={16} style={{ background: `linear-gradient(120deg, ${T.ink}, ${T.panel2})`, border: "none", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Boxes size={17} color={T.teal} /> 16 modular agents · event-driven</div>
            <div style={{ fontSize: 12, color: T.textInvLo, marginTop: 3 }}>Each agent is independently deployable and replaceable. They coordinate through events, not direct calls — built to migrate to Azure AI Foundry.</div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: T.green }}>{agents.filter((a) => a.status === "running").length}</div><div style={{ fontSize: 11, color: T.textInvLo }}>running now</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>16</div><div style={{ fontSize: 11, color: T.textInvLo }}>total agents</div></div>
          </div>
        </div>
      </Card>

      {layers.map((L) => (
        <div key={L.name}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .4, margin: "2px 2px 10px" }}>{L.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
            {L.keys.map((a, i) => (
              <div key={a.n} onClick={() => setOpen(open === a.n ? null : a.n)} style={{ background: T.surface, border: `1px solid ${open === a.n ? T.teal : T.border}`, borderRadius: 12, padding: 13, cursor: "pointer", boxShadow: "0 1px 2px rgba(16,23,38,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textLo, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: dot(a.status), boxShadow: a.status === "running" ? `0 0 0 3px ${T.green}22` : "none" }} />{a.status}</span>
                  <Badge c={T.indigo}>Phase {a.phase}</Badge>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 8 }}>{a.n}</div>
                <div style={{ fontSize: 11, color: T.teal, fontWeight: 600, marginTop: 1 }}>{a.dom}</div>
                {open === a.n && <div style={{ fontSize: 12, color: T.textMid, marginTop: 9, lineHeight: 1.5, borderTop: `1px solid ${T.border}`, paddingTop: 9 }}>{a.role}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   VIEW · Executive Intelligence
   ============================================================ */
function Executive({ kpis, panel, assumptions, setAssumptions, impact, setImpact }) {
  const trend = [
    { w: "W1", critical: 9, high: 14 }, { w: "W2", critical: 8, high: 13 }, { w: "W3", critical: 7, high: 12 },
    { w: "W4", critical: 6, high: 11 }, { w: "W5", critical: kpis.crit, high: panel.filter((p) => p.tier === "high").length },
  ];
  const fin = deriveRecertFinance(assumptions);
  const hr1 = deriveHR1(panel, fin);
  const fq = deriveFQHC(panel);
  const cards = [
    { icon: ClipboardCheck, label: "Recert success rate", v: fin.successRate + "%", tone: T.green, foot: `${fmt(fin.renewed)} of ${fmt(fin.processed)} renewed` },
    { icon: DollarSign, label: "Revenue retained", v: money(fin.retained$), tone: T.teal, foot: "renewed patients · annualized" },
    { icon: AlertTriangle, label: "Lost to procedural", v: money(fin.proceduralLost$), tone: T.red, foot: `${fin.procedural} patients · recoverable` },
    { icon: ShieldCheck, label: "Protected by outreach", v: money(fin.prevented$), tone: T.indigo, foot: `${fin.prevented} disenrollments prevented` },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {cards.map((c) => <Stat key={c.label} icon={c.icon} label={c.label} value={c.v} tone={c.tone} foot={c.foot} />)}
      </div>
      <Card title="FQHC coverage exposure" sub="Reconciled coverage risk translated into safety-net financial and quality exposure — built for FQHCs, not hospital RCM">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 12 }}>
          <Stat icon={DollarSign} label="PPS/APM revenue at risk" value={money(fq.ppsAtRisk)} tone={T.red} foot="visits tied to coverage risk" />
          <Stat icon={UserPlus} label="Sliding-fee conversions" value={fmt(fq.sliding)} tone={T.orange} foot="Medicaid → uninsured" />
          <Stat icon={Pill} label="340B exposure" value={money(fq.exposure340B)} tone={T.indigo} foot="monthly margin at risk" />
          <Stat icon={AlertTriangle} label="Pharmacy capture risk" value={fmt(fq.pharmacyCapture)} tone={T.amber} foot="rejecting fills" />
          <Stat icon={Stethoscope} label="UDS/HEDIS gaps at risk" value={fmt(fq.udsGaps)} tone={T.teal} foot="coverage-linked" />
          <Stat icon={Globe} label="MCO attribution churn" value={fmt(fq.mcoChurn)} tone={T.green} foot="roster changes" />
        </div>
      </Card>
      <RecertPerformance fin={fin} assumptions={assumptions} onAssumptions={setAssumptions} />
      <HR1Readiness hr1={hr1} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card title="Risk tier trend" sub="High + critical cohort, week over week">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 10, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11.5, fill: T.textMid }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.textLo }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Line type="monotone" dataKey="critical" stroke={T.red} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="high" stroke={T.orange} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: T.textMid, marginTop: 4 }}>
            <span><span style={{ color: T.red }}>●</span> Critical</span><span><span style={{ color: T.orange }}>●</span> High</span>
          </div>
        </Card>
        <Card title="Weekly leadership digest" sub="Drafted by the Executive Intelligence Agent · pending review" right={<Badge c={T.amber}>draft</Badge>}>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: T.text }}>
            <p style={{ margin: "0 0 10px" }}>This week the platform monitored <b>{fmt(kpis.panel)}</b> Medicaid patients and processed <b>{fmt(fin.processed)}</b> recertifications season-to-date, renewing <b>{fin.successRate}%</b>. <b>{fmt(kpis.dueSoon)}</b> renewals remain due within 30 days.</p>
            <p style={{ margin: "0 0 10px" }}>Of the {fmt(fin.lost)} coverage losses, <b>{fin.proceduralShare}%</b> were procedural — paperwork, not ineligibility — representing <b>{money(fin.proceduralLost$)}</b> in recoverable PPS revenue. Proactive outreach is estimated to have protected <b>{money(fin.prevented$)}</b> this season, against <b>{money(fin.retained$)}</b> retained overall.</p>
            <p style={{ margin: 0, color: T.textMid }}>No autonomous eligibility determinations were made; every final decision routed to qualified staff. Full audit trail available.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={primaryBtn}><CheckCircle2 size={14} /> Approve & send</button>
            <button style={ghostBtn}>Edit draft</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW · Audit & Compliance
   ============================================================ */
function AuditView({ audit, panel }) {
  const optOut = panel.filter((p) => p.factors.failedOutreach >= 3).slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <Stat icon={ShieldCheck} label="Audit events today" value={fmt(audit.length)} tone={T.indigo} foot="append-only" />
        <Stat icon={Lock} label="Messages blocked" value="1" tone={T.red} foot="opt-out enforced" />
        <Stat icon={CheckCircle2} label="Templates approved" value="14" tone={T.green} foot="review workflow" />
        <Stat icon={Bell} label="Opt-outs honored" value={fmt(optOut.length)} tone={T.amber} foot="zero further sends" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16 }}>
        <Card title="Audit trail" sub="actor · action · entity — written before each action completes" pad={0} style={{ minWidth: 0 }}>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {audit.map((a) => <AuditRow key={a.id} a={a} />)}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Compliance Guardrail" sub="Built first · wraps every outbound send">
            {[["Consent on file", "Checks sms_opt_in before every send"], ["No PHI in plain text", "Sensitive data via secure links only"], ["No state-agency impersonation", "Always identifies as the health center"], ["Approved template only", "Reviewed template library"], ["Content safety", "Claude review of new templates"]].map(([t, s]) => (
              <div key={t} style={{ display: "flex", gap: 9, padding: "7px 0", borderBottom: `1px solid ${T.surface2}` }}>
                <CheckCircle2 size={16} color={T.green} style={{ flex: "0 0 auto", marginTop: 1 }} />
                <div><div style={{ fontSize: 12.5, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 11.5, color: T.textLo }}>{s}</div></div>
              </div>
            ))}
          </Card>
          <Card title="Guardrails in force">
            <div style={{ fontSize: 12.5, color: T.textMid, lineHeight: 1.6 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 7 }}><Lock size={14} color={T.teal} style={{ flex: "0 0 auto", marginTop: 1 }} /> No autonomous Medicaid eligibility determinations — staff decide.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 7 }}><Lock size={14} color={T.teal} style={{ flex: "0 0 auto", marginTop: 1 }} /> Minimum-necessary PHI; every score is explainable.</div>
              <div style={{ display: "flex", gap: 8 }}><Lock size={14} color={T.teal} style={{ flex: "0 0 auto", marginTop: 1 }} /> Synthetic data only until BAA-covered Azure environment is live.</div>
            </div>
          </Card>
          <Card title="Complements Oklahoma Health Care Authority" sub="Never duplicates or impersonates the State">
            <div style={{ fontSize: 12.5, color: T.textMid, lineHeight: 1.6 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 7 }}><CheckCircle2 size={14} color={T.green} style={{ flex: "0 0 auto", marginTop: 1 }} /> Outreach points members to the official check-in at <b>{MHC.checkin}</b> and their Oklahoma Health Care Authority notice.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 7 }}><CheckCircle2 size={14} color={T.green} style={{ flex: "0 0 auto", marginTop: 1 }} /> Messages identify as the health center — never as the State or its agencies.</div>
              <div style={{ display: "flex", gap: 8 }}><CheckCircle2 size={14} color={T.green} style={{ flex: "0 0 auto", marginTop: 1 }} /> Timed around the State's member-notification deadline of {MHC.notifyDeadline} and the {MHC.goLive} start — reinforcing, not competing with, official communications.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW · Live Intake — Patient Eligibility Communication Agent
   (bidirectional intake + Compliance Guardrail, running inline)
   ============================================================ */
const I_STATES = ["START", "CONSENT_CHECK", "AUTH_REP", "EMPLOYMENT_INTAKE", "INCOME_COLLECTION", "HOUSEHOLD_COLLECTION", "DOCUMENT_REQUEST", "DOCUMENT_REVIEW", "SUMMARY_CONFIRMATION", "READY_FOR_REVIEW"];
const DOC_CHECKLIST = [
  { key: "paystub", name: "Most recent paystub", type: "Pay stub" },
  { key: "id", name: "Photo ID", type: "Photo ID" },
];
function classifyDoc(key, variant) {
  if (key === "paystub") return { type: "Pay stub", status: "ready", fields: "Bayview Logistics · gross $1,260 · biweekly" };
  if (key === "id" && variant === "blurry") return { type: "Photo ID", status: "human_review_needed", fields: "Image too dark — name/DOB unreadable" };
  return { type: "Photo ID", status: "ready", fields: "Name match · DOB match" };
}
const DOC_STATUS = {
  needed: { c: "#8A93A0", label: "Awaiting upload" },
  classifying: { c: "#D4A017", label: "Classifying…" },
  ready: { c: "#34A56A", label: "Ready" },
  human_review_needed: { c: "#CC7A22", label: "Needs human review" },
  incomplete: { c: "#C8472E", label: "Incomplete" },
};
const GUARD_CHECKS = (text, optedOut, impersonate, leakPHI, template) => {
  const c = [];
  c.push({ label: "Consent on file", ok: !optedOut, note: optedOut ? "STOP on record — blocked" : "sms_opt_in = true" });
  const phi = leakPHI || /member id\s*\d/i.test(text);
  c.push({ label: "No PHI in plain text", ok: !phi, note: phi ? "Member ID detected" : "minimum necessary" });
  const imp = impersonate || /state of maryland|maryland medicaid|on behalf of the state/i.test(text);
  c.push({ label: "Not impersonating the State", ok: !imp, note: imp ? "Claims to be the State" : "identifies as the health center" });
  c.push({ label: "Approved template", ok: !!template, note: template ? template : "no template" });
  c.push({ label: "Content safe", ok: true, note: "Claude review — pass" });
  return c;
};

function IntakeView({ reduced, onComplete = () => {}, setView = () => {} }) {
  const [msgs, setMsgs] = useState([]);
  const [state, setState] = useState("START");
  const [records, setRecords] = useState([]);
  const [iaudit, setIAudit] = useState([]);
  const [wire, setWire] = useState(null);
  const [gate, setGate] = useState(null);
  const [docs, setDocs] = useState([]);
  const [pathway, setPathway] = useState("one_job");
  const [plang, setPlang] = useState("English");
  const [authRep, setAuthRep] = useState("granted");
  const [t, setT] = useState({ optedOut: false, impersonate: false, leakPHI: false });
  const sending = useRef(false);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, gate]);

  const log = (actor, action, detail) => setIAudit((a) => [{ id: uid("ia"), ts: nowClock(), actor, action, detail }, ...a].slice(0, 40));
  const addRecord = (table, summary) => setRecords((r) => [{ id: uid("rec"), table, summary }, ...r]);

  function gateRun(checks, ok) {
    if (reduced) { setGate({ checks: checks.map((c) => ({ ...c, lit: true })), ok, done: true }); return; }
    setGate({ checks: checks.map((c) => ({ ...c, lit: false })), ok, done: false });
    checks.forEach((_, i) => setTimeout(() => setGate((g) => g && { ...g, checks: g.checks.map((c, j) => j <= i ? { ...c, lit: true } : c) }), 80 * (i + 1)));
    setTimeout(() => setGate((g) => g && { ...g, done: true }), 80 * checks.length + 120);
  }

  function agentSay(text, template, contract) {
    const checks = GUARD_CHECKS(text, t.optedOut, t.impersonate, t.leakPHI, template);
    const ok = checks.every((c) => c.ok);
    gateRun(checks, ok);
    setWire(contract);
    if (!ok) {
      const reason = checks.filter((c) => !c.ok).map((c) => c.label).join(", ");
      log("compliance_guardrail", "outbound.blocked", reason);
      setMsgs((m) => [...m, { who: "system", text: `Held by Compliance Guardrail · ${reason}` }]);
      setT((x) => ({ ...x, impersonate: false, leakPHI: false }));
      sending.current = false;
      return;
    }
    log("compliance_guardrail", "outbound.approved", template);
    setMsgs((m) => [...m, { who: "agent", text, template }]);
    sending.current = false;
  }

  function patientSay(text) {
    if (sending.current) return;
    setMsgs((m) => [...m, { who: "patient", text }]);
    log("twilio_inbound", "message.received", text.slice(0, 40));
    sending.current = true;
    const esc = /help|person|agent|representative|stop|understand|lawyer/i.test(text);
    setTimeout(() => {
      if (esc) return escalate(/stop/i.test(text) ? "Patient opted out (STOP)" : "Patient asked for a person / help");
      advance(text);
    }, reduced ? 0 : 360);
  }

  function escalate(reason) {
    setState("ESCALATED");
    log("patient_eligibility_agent", "session.escalated", reason);
    log("case_routing_agent", "workqueue.created", "urgency=high · transcript attached");
    addRecord("workqueue_items", `Escalation — ${reason}`);
    if (/opted out/i.test(reason)) { setMsgs((m) => [...m, { who: "system", text: "Opt-out recorded. No further messages will be sent." }]); sending.current = false; return; }
    setTimeout(() => agentSay("Got it — I'll have a team member reach out to help. For urgent help, call the health center at (410) 555-0100.", "human_handoff", { next_question: "END", escalate_flag: true, escalate_reason: reason }), reduced ? 0 : 200);
  }

  function advance(text) {
    const C = (next, su) => ({ next_question: next, parsed_answer: text.slice(0, 28), session_updates: su, escalate_flag: false, escalate_reason: null });
    if (state === "START") {
      setState("CONSENT_CHECK"); addRecord("patient_responses", "Identity verified (DOB + ZIP)"); log("patient_eligibility_agent", "identity.verified", "low-risk");
      return setTimeout(() => agentSay("Thanks — you're verified. Is it okay to continue by text, and what language do you prefer?", "consent_check", C("CONSENT_CHECK", { state: "CONSENT_CHECK" })), reduced ? 0 : 200);
    }
    if (state === "CONSENT_CHECK") {
      const lang = /espa|sí|si/i.test(text) ? "es" : "en"; setPlang(lang === "es" ? "Spanish" : "English"); setState("AUTH_REP"); addRecord("patient_responses", `Consent confirmed · language=${lang}`); log("patient_eligibility_agent", "consent.confirmed", `language=${lang}`);
      return setTimeout(() => agentSay("Oklahoma's new rules let you name the health center as your authorized representative, so we can submit your paperwork and receive the State's notices for you. Want the health center to represent you? Reply 1 = yes, the health center can help; 2 = no, I'll do it myself.", "auth_rep", C("AUTH_REP", { state: "AUTH_REP", preferred_language: lang })), reduced ? 0 : 200);
    }
    if (state === "AUTH_REP") {
      const grant = !/\b(2|no|myself|self)\b/i.test(text); const status = grant ? "granted" : "declined"; setAuthRep(status); setState("EMPLOYMENT_INTAKE");
      addRecord("patient_responses", `Authorized representative: ${status}`); log("patient_eligibility_agent", "authorized_rep." + status, grant ? "the health center may submit + receive notices" : "patient self-submits");
      return setTimeout(() => agentSay(grant ? "Thanks — the health center is now your authorized rep. Are you currently working? Reply 1 = one job, 2 = more than one, 3 = self-employed, 4 = not working, 5 = retired / disabled / student." : "No problem — you'll submit yourself, and you can text us your confirmation number so we keep your file current. Are you currently working? Reply 1 = one job, 2 = more than one, 3 = self-employed, 4 = not working, 5 = retired / disabled / student.", "employment_intake", C("EMPLOYMENT_INTAKE", { state: "EMPLOYMENT_INTAKE", authorized_rep: status })), reduced ? 0 : 200);
    }
    if (state === "EMPLOYMENT_INTAKE") {
      const k = (text.match(/[1-5]/) || ["1"])[0]; const map = { "1": "one_job", "2": "multiple_jobs", "3": "self_employed", "4": "zero_income", "5": "non_employment" }; const pathway = map[k]; setPathway(pathway);
      addRecord("patient_responses", `Employment pathway = ${pathway}`); log("patient_eligibility_agent", "pathway.selected", pathway);
      if (pathway === "zero_income") { setState("HOUSEHOLD_COLLECTION"); return setTimeout(() => agentSay("No problem. How do you currently cover basic costs, and how many people are in your household?", "zero_income", C("HOUSEHOLD_COLLECTION", { state: "ZERO_INCOME", pathway })), reduced ? 0 : 200); }
      setState("INCOME_COLLECTION");
      return setTimeout(() => agentSay("Got it. What's your employer, and roughly your gross pay each period (with how often you're paid)?", "income_collection", C("INCOME_COLLECTION", { state: "INCOME_COLLECTION", pathway })), reduced ? 0 : 200);
    }
    if (state === "INCOME_COLLECTION") {
      setState("HOUSEHOLD_COLLECTION"); addRecord("income_sources", text || "Bayview Logistics · $1,260 biweekly"); log("patient_eligibility_agent", "income_source.write", "employer captured");
      return setTimeout(() => agentSay("Thanks. How many people are in your household, and any recent changes (new baby, someone moved out)?", "household_collection", C("HOUSEHOLD_COLLECTION", { state: "HOUSEHOLD_COLLECTION" })), reduced ? 0 : 200);
    }
    if (state === "HOUSEHOLD_COLLECTION") {
      setState("DOCUMENT_REQUEST"); addRecord("household_members", text || "3 people, no changes"); log("patient_eligibility_agent", "household.write", "size captured");
      setDocs(DOC_CHECKLIST.map((d) => ({ ...d, status: "needed", fields: "" })));
      log("patient_eligibility_agent", "documents.requested", "secure upload link sent");
      return setTimeout(() => agentSay("Last step — I've texted you a secure upload link. Please add two things: your most recent paystub and a photo ID. They upload straight into our secure system — don't text photos here.", "document_request", C("DOCUMENT_REQUEST", { state: "DOCUMENT_REQUEST" })), reduced ? 0 : 200);
    }
    if (state === "SUMMARY_CONFIRMATION") {
      if (/wrong|no|fix|incorrect/i.test(text)) return escalate("Patient says the summary is incorrect");
      setState("READY_FOR_REVIEW"); addRecord("workqueue_items", "Intake complete — ready for staff review"); log("patient_eligibility_agent", "session.ready_for_review", pathway); log("case_routing_agent", "workqueue.created", "type=eligibility_review");
      onComplete({ pathway, lang: plang, incomeKey: incomeDocKey(pathway), authRep });
      log("patient_eligibility_agent", "recert.synced", "→ recertification board · 2 docs received");
      return setTimeout(() => {
        agentSay("Thanks! Your information and documents are ready for our eligibility team to review. You don't need to do anything else right now.", "ready_for_review", C("END", { state: "READY_FOR_REVIEW", status: "ready_for_review" }));
        setMsgs((m) => [...m, { who: "system", text: "✓ Synced to the recertification board — paystub + ID received, remaining documents pending." }]);
      }, reduced ? 0 : 200);
    }
  }

  function uploadDoc(doc, variant) {
    if (sending.current) return;
    sending.current = true;
    setMsgs((m) => [...m, { who: "patient", text: `📎 Uploaded · ${doc.name}${variant === "blurry" ? " (dark photo)" : ""}` }]);
    log("secure_upload", "document.received", doc.name);
    setDocs((ds) => ds.map((d) => (d.key === doc.key ? { ...d, status: "classifying" } : d)));
    setTimeout(() => {
      const r = classifyDoc(doc.key, variant);
      setDocs((ds) => ds.map((d) => (d.key === doc.key ? { ...d, status: r.status, type: r.type, fields: r.fields } : d)));
      log("document_readiness_agent", "document.reviewed", `${r.type} · status=${r.status}`);
      addRecord("documents", `${r.type} → ${r.status}`);
      if (r.status === "human_review_needed") log("case_routing_agent", "workqueue.created", "document review · urgency=normal");
      const ack = r.status === "ready"
        ? `Got your ${r.type.toLowerCase()} — that one looks good.`
        : `Thanks. Your ${r.type.toLowerCase()} was hard to read, so a team member will verify it. Nothing else you need to do.`;
      agentSay(ack, "document_ack", { next_question: "DOCUMENT_REQUEST", doc_status: r.status, escalate_flag: false, escalate_reason: null });
    }, reduced ? 0 : 620);
  }

  function proceedDocs() {
    if (sending.current) return;
    sending.current = true;
    setState("DOCUMENT_REVIEW");
    log("document_readiness_agent", "review.complete", `${docs.length} documents processed`);
    setTimeout(() => {
      setState("SUMMARY_CONFIRMATION");
      const summary = "Here's what I have:\n• Income: as you described\n• Household: as you described\n• Documents: paystub + photo ID received\nDoes this look right?";
      agentSay(summary, "summary_confirmation", C2("SUMMARY_CONFIRMATION"));
    }, reduced ? 0 : 360);
  }
  const C2 = (next) => ({ next_question: next, parsed_answer: null, session_updates: { state: next }, escalate_flag: false, escalate_reason: null });

  function start() {
    setMsgs([]); setRecords([]); setIAudit([]); setWire(null); setGate(null); setDocs([]); setState("START"); sending.current = false;
    setTimeout(() => agentSay("This is your health center. We can help you prepare your Medicaid renewal — your answers stay private. To start, please confirm your date of birth and ZIP code.", "verify_identity", { next_question: "START", parsed_answer: null, session_updates: {}, escalate_flag: false, escalate_reason: null }), reduced ? 0 : 150);
  }
  useEffect(() => { start(); /* eslint-disable-next-line */ }, []);

  const docsAllIn = docs.length > 0 && docs.every((d) => d.status !== "needed" && d.status !== "classifying");
  const quick = (() => {
    if (state === "ESCALATED" || state === "READY_FOR_REVIEW") return [];
    if (state === "START") return ["DOB 03/14/1989 · ZIP 21217"];
    if (state === "CONSENT_CHECK") return ["Yes, English", "Sí, Español", "Stop"];
    if (state === "AUTH_REP") return ["1 — Yes, the health center can help", "2 — No, I'll do it myself"];
    if (state === "EMPLOYMENT_INTAKE") return ["1", "2", "3", "4", "5"];
    if (state === "INCOME_COLLECTION") return ["Bayview Logistics · $1,260 biweekly", "Talk to a person"];
    if (state === "HOUSEHOLD_COLLECTION") return ["3 people, no changes", "We had a new baby"];
    if (state === "SUMMARY_CONFIRMATION") return ["Looks right", "Something's wrong"];
    return [];
  })();
  const sIdx = I_STATES.indexOf(state);
  const done = state === "READY_FOR_REVIEW";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setView("command")} style={{ display: "flex", alignItems: "center", gap: 6, background: T.ink, color: "#fff", border: "none", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><ArrowLeft size={14} /> Command Center</button>
        <span style={{ fontSize: 11.5, color: T.textLo, marginLeft: 2 }}>Jump to:</span>
        {[["patients", "Patients"], ["queues", "Work Queues"], ["recert", "Recertification"], ["rx", "RxCoverage Guard"], ["agents", "Agents"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{ display: "flex", alignItems: "center", gap: 4, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l} <ChevronRight size={12} style={{ color: T.textLo }} /></button>
        ))}
      </div>
      <Card pad={12} style={{ background: T.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12.5, color: T.textMid }}><b>Try a guardrail block:</b> toggle one, then advance — the next send is held & logged.</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {[["optedOut", "Patient opted out"], ["impersonate", "Impersonate State"], ["leakPHI", "Leak PHI"]].map(([k, l]) => (
              <button key={k} onClick={() => setT((x) => ({ ...x, [k]: !x[k] }))} style={{ fontSize: 11.5, fontWeight: 700, border: `1px solid ${t[k] ? T.red : T.border}`, background: t[k] ? T.red + "12" : T.surface, color: t[k] ? T.red : T.textMid, borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{t[k] ? "● " : ""}{l}</button>
            ))}
            <button onClick={start} style={{ ...ghostBtn, padding: "5px 11px", fontSize: 11.5 }}>Restart</button>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexDirection: "row", flexWrap: "wrap" }}>
        {/* PHONE */}
        <div style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 380, background: "#FBFAF6", border: `1px solid ${T.borderHi}`, borderRadius: 20, padding: 12, display: "flex", flexDirection: "column", boxShadow: "0 6px 24px rgba(16,23,38,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px 10px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 99, background: T.teal, display: "grid", placeItems: "center", color: "#fff" }}><PhoneIcon size={15} /></span>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>Coverage Help</div><div style={{ fontSize: 10.5, color: T.green }}>● secure · SMS</div></div>
          </div>
          <div ref={scroller} style={{ flex: 1, overflowY: "auto", maxHeight: 360, minHeight: 280, display: "flex", flexDirection: "column", gap: 8, padding: 6 }}>
            {msgs.map((m, i) => <IBubble key={i} m={m} />)}
            {gate && !gate.done && <div style={{ alignSelf: "flex-start", fontSize: 11, color: T.textLo, padding: "4px 8px" }}>● ● ●</div>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8 }}>
            {(state === "DOCUMENT_REQUEST" || state === "DOCUMENT_REVIEW") ? (
              <>
                {docs.filter((d) => d.status === "needed").map((d) => (
                  <button key={d.key} onClick={() => uploadDoc(d, d.key === "id" ? "clear" : "clear")} style={{ fontSize: 11.5, fontWeight: 600, border: `1px solid ${T.teal}`, color: T.tealD, background: T.teal + "10", borderRadius: 999, padding: "6px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><FileText size={12} /> Upload {d.name.toLowerCase()}</button>
                ))}
                {docs.some((d) => d.key === "id" && d.status === "needed") && (
                  <button onClick={() => uploadDoc(docs.find((d) => d.key === "id"), "blurry")} style={{ fontSize: 11.5, fontWeight: 600, border: `1px dashed ${T.orange}`, color: T.orange, background: T.orange + "10", borderRadius: 999, padding: "6px 11px", cursor: "pointer" }}>Upload blurry ID (demo)</button>
                )}
                {docsAllIn && state === "DOCUMENT_REQUEST" && (
                  <button onClick={proceedDocs} style={{ fontSize: 11.5, fontWeight: 700, border: "none", color: "#fff", background: T.ink, borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>I'm done uploading →</button>
                )}
              </>
            ) : (
              quick.map((q) => <button key={q} onClick={() => patientSay(q)} style={{ fontSize: 11.5, fontWeight: 600, border: `1px solid ${T.teal}`, color: T.tealD, background: T.teal + "10", borderRadius: 999, padding: "6px 11px", cursor: "pointer" }}>{q}</button>)
            )}
            {done && <div style={{ fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, padding: "6px 4px" }}><CheckCircle2 size={14} /> Ready for staff review</div>}
            {state === "ESCALATED" && <div style={{ fontSize: 12, color: T.red, fontWeight: 700, padding: "6px 4px" }}>Routed to staff queue</div>}
          </div>
        </div>

        {/* LOGIC */}
        <div style={{ flex: "1 1 380px", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* state rail */}
          <div style={{ background: T.ink, borderRadius: 12, padding: "11px 13px" }}>
            <div style={{ fontSize: 10.5, color: T.textInvLo, fontWeight: 700, letterSpacing: .4, marginBottom: 8 }}>CONVERSATION STATE MACHINE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {I_STATES.map((s, i) => {
                const active = state === s; const passed = sIdx > i || done;
                return <span key={s} style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 600, padding: "3px 7px", borderRadius: 6, background: active ? T.teal : passed ? T.panel2 : "transparent", color: active ? "#04201F" : passed ? T.teal : T.textInvLo, border: `1px solid ${active ? T.teal : T.line}` }}>{s}</span>;
              })}
              <span style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 600, padding: "3px 7px", borderRadius: 6, background: state === "ESCALATED" ? T.red : "transparent", color: state === "ESCALATED" ? "#fff" : T.textInvLo, border: `1px solid ${state === "ESCALATED" ? T.red : T.line}` }}>ESCALATED</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* guardrail */}
            <div style={{ background: T.ink, borderRadius: 12, padding: 12, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}><ShieldCheck size={14} color={gate ? (gate.ok ? T.green : T.red) : T.textInvLo} /><span style={{ fontSize: 11, color: T.textInv, fontWeight: 700 }}>Compliance Guardrail</span><Badge c={T.indigo}>S3</Badge></div>
              {gate ? gate.checks.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", opacity: c.lit ? 1 : 0.3, transition: "opacity .15s" }}>
                  {c.lit ? (c.ok ? <CheckCircle2 size={13} color={T.green} /> : <X size={13} color={T.red} />) : <span style={{ width: 13, height: 13, borderRadius: 99, border: `1px solid ${T.line}` }} />}
                  <span style={{ fontSize: 10.5, color: c.lit && !c.ok ? T.red : T.textInvLo, flex: 1 }}>{c.label}</span>
                </div>
              )) : <div style={{ fontSize: 10.5, color: T.textInvLo }}>Awaiting next send…</div>}
            </div>
            {/* wire / contract */}
            <div style={{ background: T.ink, borderRadius: 12, padding: 12, minWidth: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}><Zap size={14} color={T.indigo} /><span style={{ fontSize: 11, color: T.textInv, fontWeight: 700 }}>Claude decision</span><Badge c={T.indigo}>S2</Badge></div>
              <pre style={{ fontFamily: T.mono, fontSize: 9.5, color: T.textInvLo, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.45 }}>{wire ? JSON.stringify(wire, null, 1) : "{ awaiting turn }"}</pre>
            </div>
          </div>

          {/* document readiness */}
          <Card title="Document readiness" sub="Secure uploads · classified by the Document Readiness Agent" pad={10} right={docs.length ? <Badge c={docs.every((d) => d.status === "ready") ? T.green : T.orange}>{docs.filter((d) => d.status === "ready").length}/{docs.length} ready</Badge> : null}>
            {docs.length === 0 ? (
              <div style={{ fontSize: 11.5, color: T.textLo }}>No documents requested yet. At the document step, the agent sends a secure upload link and tracks each file here.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {docs.map((d) => {
                  const st = DOC_STATUS[d.status] || DOC_STATUS.needed;
                  return (
                    <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", border: `1px solid ${T.border}`, borderRadius: 9, background: T.surface2 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: st.c + "1A", color: st.c, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                        {d.status === "ready" ? <CheckCircle2 size={15} /> : d.status === "classifying" ? <Activity size={14} className="cg-spin" /> : d.status === "human_review_needed" ? <AlertTriangle size={14} /> : <FileText size={14} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{d.type || d.name}</div>
                        <div style={{ fontSize: 10.5, color: T.textLo, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.fields || d.name}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: st.c, background: st.c + "16", border: `1px solid ${st.c}44`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{st.label}</span>
                    </div>
                  );
                })}
                {docs.some((d) => d.status === "human_review_needed") && <div style={{ fontSize: 10.5, color: T.orange, display: "flex", gap: 6, alignItems: "center" }}><AlertTriangle size={12} /> A document was routed to staff for human review — the intake still completes.</div>}
              </div>
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* records */}
            <Card title="Structured records" pad={10} style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                {records.length === 0 ? <div style={{ fontSize: 11.5, color: T.textLo }}>No writes yet.</div> : records.map((r) => (
                  <div key={r.id} style={{ fontSize: 11, borderLeft: `2px solid ${T.teal}`, paddingLeft: 8 }}>
                    <span style={{ fontFamily: T.mono, color: T.indigo }}>{r.table}</span>
                    <div style={{ color: T.textMid }}>{r.summary}</div>
                  </div>
                ))}
              </div>
            </Card>
            {/* audit */}
            <Card title="Audit events" pad={10} style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 150, overflowY: "auto" }}>
                {iaudit.length === 0 ? <div style={{ fontSize: 11.5, color: T.textLo }}>—</div> : iaudit.map((a) => (
                  <div key={a.id} style={{ fontSize: 10.5, lineHeight: 1.3 }}>
                    <span style={{ fontFamily: T.mono, color: T.indigo }}>{a.actor}</span> <span style={{ color: T.text, fontWeight: 600 }}>{a.action}</span>
                    <div style={{ color: T.textLo }}>{a.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
function IBubble({ m }) {
  if (m.who === "system") return <div style={{ alignSelf: "center", fontSize: 11, color: T.red, background: T.red + "12", border: `1px solid ${T.red}33`, borderRadius: 8, padding: "5px 9px", maxWidth: "92%", textAlign: "center" }}>{m.text}</div>;
  const me = m.who === "patient";
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "86%" }}>
      <div style={{ background: me ? T.teal : "#fff", color: me ? "#04201F" : T.text, border: me ? "none" : `1px solid ${T.border}`, borderRadius: 14, borderBottomRightRadius: me ? 4 : 14, borderBottomLeftRadius: me ? 14 : 4, padding: "8px 11px", fontSize: 12.5, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{m.text}</div>
      {m.template && !me && <div style={{ fontSize: 9.5, color: T.textLo, fontFamily: T.mono, marginTop: 2, marginLeft: 4 }}>template: {m.template}</div>}
    </div>
  );
}

/* ============================================================
   VIEW · Recertification document workflow
   Per-patient required-doc checklist + stage pipeline + assignment
   ============================================================ */
const REQUIRED_DOCS = [
  { key: "income", name: "Proof of income (paystubs / employer letter)" },
  { key: "id", name: "Photo ID" },
  { key: "residency", name: "Proof of Oklahoma residency" },
  { key: "household", name: "Household / dependents verification" },
  { key: "status", name: "Citizenship / immigration status" },
];
const RECERT_STAGES = [
  { key: "flagged", label: "Flagged", color: T.amber, icon: Flag, blurb: "Identified for recertification" },
  { key: "gathering", label: "Gathering documents", color: T.indigo, icon: FileText, blurb: "Collecting required documents" },
  { key: "complete", label: "Documents complete", color: T.teal, icon: CheckCircle2, blurb: "All documents received" },
  { key: "ready", label: "Ready to submit", color: "#34A56A", icon: ClipboardCheck, blurb: "Packet ready for the State" },
  { key: "submitted", label: "Submitted to State", color: "#C8A02E", icon: Send, blurb: "Awaiting determination · tracking # recorded" },
  { key: "recertified", label: "Recertified / closed", color: "#15663D", icon: ShieldCheck, blurb: "Final determination captured" },
];
const RECERT_STAFF = ["You", "Maria O.", "Andre B."];
const STAGE_ORDER = ["flagged", "gathering", "complete", "ready", "submitted", "recertified"];
const AUTHREP = {
  granted: { label: "Auth rep: clinic", c: "#34A56A" },
  requested: { label: "Auth rep: requested", c: "#D4A017" },
  declined: { label: "Patient self-submits", c: "#6B7A70" },
};
// Consent-to-represent status for a patient, derived from their recertification case (if any).
function arConsentStatus(cs) {
  if (!cs) return { key: "none", label: "Not on file", sub: "no case yet", c: "#8A958B" };
  const rec = cs.authRepRec;
  if (rec && rec.revokedDate) return { key: "revoked", label: "Revoked", sub: "self-submits", c: "#C8472E" };
  if (cs.authRep === "declined") return { key: "self", label: "Self-submits", sub: "patient handles it", c: "#6B7A70" };
  if (cs.authRep === "requested") return { key: "requested", label: "Requested", sub: "asked, not documented", c: "#D4A017" };
  if (cs.authRep === "granted" && rec) {
    if (rec.signaturePending) return { key: "pending", label: "Pending signature", sub: "verbal - follow-up set", c: "#CC7A22" };
    if (rec.signedForm) return { key: "signed", label: "Represents", sub: "signed form on file", c: "#34A56A" };
    return { key: "granted", label: "Represents", sub: "e-consent on file", c: "#34A56A" };
  }
  return { key: "none", label: "Not on file", sub: "", c: "#8A958B" };
}
const OUTCOME = {
  approved: { label: "Approved", c: "#34A56A" },
  pending: { label: "Pending clarification", c: "#D4A017" },
  denied_procedural: { label: "Denied — needs correction", c: "#CC7A22" },
  denied_ineligible: { label: "Ineligible", c: "#6B7A70" },
};
const SUBMIT_CHANNELS = ["MHC online portal", "MHC phone", "LDSS (Local Department of Social Services) (mail / in person)", "Patient self-reported"];
const AR_SCOPE = [
  { key: "submit", label: "Submit application, renewal & recertification" },
  { key: "notices", label: "Receive the State's notices on the patient's behalf" },
  { key: "comm", label: "Communicate with Oklahoma Health Care Authority / LDSS (Local Department of Social Services)" },
  { key: "workreq", label: "Report H.R. 1 activity hours / exemption" },
];
const AR_METHODS = ["Patient SMS reply (e-consent)", "Portal e-signature", "Recorded telephonic signature", "Verbal — staff attested", "Signed paper form (CG-AR-01)"];
// e-consent, portal e-signature, a recorded telephonic signature, and a signed paper form all satisfy the signature requirement in 42 CFR 435.923(f). "Verbal — staff attested" is NOT a signature on its own, so it is recorded as PROVISIONAL and carries a follow-up to obtain the signature.
const AR_NEEDS_SIGNATURE = (m) => /verbal/i.test(m || "");
const AR_FOLLOWUP_PLANS = ["Mail CG-AR-01 for signature", "Capture signature at next in-person visit", "Recorded telephonic signature"];
function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
function defaultAuthRec(status, method) {
  if (status !== "granted") return null;
  const t = "2026-06-12";
  const pend = AR_NEEDS_SIGNATURE(method);
  return { method: method || "Patient SMS reply (e-consent)", scope: { submit: true, notices: true, comm: true, workreq: true }, capturedDate: t, effectiveDate: t, reviewDate: "2026-12-12", signedForm: null, revokedDate: null, signaturePending: pend, followUp: pend ? { plan: AR_FOLLOWUP_PLANS[0], due: "2026-06-26", status: "open" } : null };
}

function buildRecerts(panel) {
  const rng = mulberry32(99);
  const pool = panel.filter((p) => p.renewalDays <= 80 || p.tier === "high" || p.tier === "critical").slice(0, 16);
  const seq = ["flagged", "gathering", "gathering", "complete", "ready", "submitted", "recertified", "flagged", "gathering", "submitted", "ready", "gathering", "recertified", "submitted", "flagged", "complete"];
  return pool.map((p, i) => {
    const stage = seq[i % seq.length];
    const pathway = RECERT_PATHWAYS[i % RECERT_PATHWAYS.length];
    const keys = [...requiredDocKeys(pathway), ...(p.wrSubject ? ["activity"] : [])];
    const docsDone = ["complete", "ready", "submitted", "recertified"].includes(stage);
    let received = stage === "flagged" ? 0 : stage === "gathering" ? 1 + Math.floor(rng() * (keys.length - 2)) : keys.length;
    const docs = keys.map((k, j) => ({ key: k, name: DOC_LIB[k], status: j < received ? "received" : "pending" }));
    const owners = { gather: stage === "flagged" ? null : pick(rng, RECERT_STAFF), review: docsDone ? pick(rng, RECERT_STAFF) : null };
    const authRep = pick(rng, ["granted", "granted", "granted", "requested"]);
    const submitted = stage === "submitted" || stage === "recertified";
    const submissions = submitted ? [{ channel: pick(rng, SUBMIT_CHANNELS), trackingNo: "MHC-" + (100000 + Math.floor(rng() * 899999)), date: "this cycle", by: authRep === "granted" ? "clinic rep" : "patient" }] : [];
    let outcome = null, closedAs = null, pendingItem = null;
    if (stage === "recertified") { const r = rng(); if (r < 0.7) { outcome = "approved"; closedAs = "renewed"; } else if (r < 0.85) { outcome = "pending"; pendingItem = "Proof of activity hours for prior month"; } else { outcome = "denied_ineligible"; closedAs = "ineligible"; } }
    return { id: `rc_${p.mrn}`, patient: `${p.first} ${p.last}`, first: p.first, last: p.last, mrn: p.mrn, tier: p.tier, lang: p.lang, renewalDays: p.renewalDays, renewalDate: p.renewalDate, stage, pathway, docs, owners, authRep, authRepRec: defaultAuthRec(authRep, i === 1 ? "Verbal — staff attested" : undefined), submissions, attempts: 1, outcome, closedAs, pendingItem, cureDeadline: null, resubmission: false };
  });
}
const recertProgress = (c) => { const r = c.docs.filter((d) => d.status === "received").length; return { r, total: c.docs.length, all: r === c.docs.length, pct: Math.round((r / c.docs.length) * 100) }; };
const isMineCase = (c) => c.owners.gather === "You" || c.owners.review === "You";

/* ── Activity & Employment Documentation Form (§ 435.552) ─────────────
   Staff- or intake-facing capture instrument. Produces a submission-support
   packet; it never determines compliance and never submits for the member. */
const DOC_AVAIL = ["Have it now", "Can obtain it", "Cannot obtain it", "Unsure"];
const PAY_FREQ = ["Weekly", "Biweekly", "Semi-monthly", "Monthly", "Irregular / cash"];
const EDU_STATUS = ["Not enrolled", "Less than half time", "At least half time", "Full time"];
const DOC_BARRIERS = ["Employer won't provide", "Paid in cash", "Lost / never received", "No printer or scanner", "Language", "Transportation", "Fear or distrust"];

function ActivityDocForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState("");
  const [hours, setHours] = useState({});
  const [income, setIncome] = useState("");
  const [freq, setFreq] = useState("Biweekly");
  const [seasonal, setSeasonal] = useState(false);
  const [edu, setEdu] = useState("Not enrolled");
  const [avail, setAvail] = useState("Have it now");
  const [docs, setDocs] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [prepared, setPrepared] = useState(false);

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const setHrs = (k, v) => setHours({ ...hours, [k]: v.replace(/[^0-9]/g, "") });

  const chosen = WR_ACTIVITIES.filter((a) => hours[a.key] !== undefined && hours[a.key] !== "");
  const totalHours = WR_ACTIVITIES.filter((a) => !a.noHours).reduce((t, a) => t + (parseInt(hours[a.key], 10) || 0), 0);
  const inc = parseInt(income, 10) || 0;
  const meetsHours = totalHours >= MHC.workReqHours;
  const meetsIncome = inc >= MHC.workReqIncome;
  const meetsEdu = edu === "At least half time" || edu === "Full time";
  const meets = meetsHours || meetsIncome || meetsEdu;

  const acceptable = Array.from(new Set(chosen.flatMap((a) => a.docs)));
  const availPts = avail === "Have it now" ? 20 : avail === "Can obtain it" ? 12 : 0;
  const readiness = Math.min(100, (meets ? 35 : 0) + (docs.length ? 35 : 0) + availPts + (name && mrn ? 10 : 0));
  const blocked = avail === "Cannot obtain it" || barriers.length > 0;
  const status = !meets ? { l: "Below the threshold — no qualifying path yet", c: T.red }
    : blocked ? { l: "Documentation barrier — route for assistance", c: T.gold }
    : readiness >= 80 ? { l: "Ready for staff review", c: T.green }
    : { l: "Incomplete — keep gathering", c: T.amber };

  const L = ({ children }) => <div style={{ fontSize: 10, fontWeight: 800, color: T.textLo, textTransform: "uppercase", letterSpacing: .3, marginBottom: 4 }}>{children}</div>;
  const inp = { border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 9px", fontSize: 12, outline: "none", width: "100%", background: T.surface };
  const Chip = ({ on, onClick, children, tone = T.teal }) => (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 999, padding: "4px 10px",
      border: `1px solid ${on ? tone : T.border}`, background: on ? tone : "transparent", color: on ? "#fff" : T.textMid,
    }}>{children}</button>
  );

  return (
    <Card
      title="Activity & employment documentation form"
      sub="§ 435.552 — capture what the member does and what proof exists. Ex parte data is checked first; this form is for what the State could not verify on its own."
      right={<button onClick={() => setOpen(!open)} style={{ fontSize: 11.5, fontWeight: 700, border: `1px solid ${T.border}`, background: "transparent", color: T.textMid, borderRadius: 8, padding: "5px 11px", cursor: "pointer" }}>{open ? "Hide form" : "Open form"}</button>}
    >
      {!open ? (
        <div style={{ fontSize: 11.5, color: T.textMid, lineHeight: 1.5 }}>
          Collects qualifying activity, hours, income, education status, and available documentation — then scores whether the packet is ready for staff review. Barriers are captured as a routable task rather than a dead end.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* form */}
          <div style={{ flex: "1 1 400px", minWidth: 330, display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><L>Member name</L><input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Last, First" /></div>
              <div style={{ flex: 1 }}><L>MRN</L><input style={inp} value={mrn} onChange={(e) => setMrn(e.target.value)} placeholder="MRN-000000" /></div>
            </div>

            <div>
              <L>Qualifying activities and hours per month</L>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {WR_ACTIVITIES.map((a) => (
                  <div key={a.key} style={{ display: "flex", gap: 8, alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 9px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{a.label}</div>
                      <div style={{ fontSize: 9.5, color: T.textLo, fontFamily: T.mono }}>{a.cite}</div>
                    </div>
                    {a.noHours
                      ? <span style={{ fontSize: 9.5, fontWeight: 800, color: T.indigo, background: T.indigo + "1A", padding: "2px 8px", borderRadius: 999 }}>no hour log</span>
                      : <input style={{ ...inp, width: 74, textAlign: "right" }} value={hours[a.key] || ""} onChange={(e) => setHrs(a.key, e.target.value)} placeholder="hrs" />}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 120px" }}><L>Gross monthly income</L><input style={inp} value={income} onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))} placeholder="580" /></div>
              <div style={{ flex: "1 1 130px" }}><L>Pay frequency</L>
                <select style={inp} value={freq} onChange={(e) => setFreq(e.target.value)}>{PAY_FREQ.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div style={{ flex: "1 1 150px" }}><L>Education enrollment</L>
                <select style={inp} value={edu} onChange={(e) => setEdu(e.target.value)}>{EDU_STATUS.map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>

            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 11.5, color: T.textMid, cursor: "pointer" }}>
              <input type="checkbox" checked={seasonal} onChange={(e) => setSeasonal(e.target.checked)} />
              Seasonal or variable work — average across a 6-month period
            </label>

            <div>
              <L>Documentation availability</L>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DOC_AVAIL.map((x) => <Chip key={x} on={avail === x} onClick={() => setAvail(x)} tone={x === "Cannot obtain it" ? T.red : T.teal}>{x}</Chip>)}
              </div>
            </div>

            <div>
              <L>Documents the member has {chosen.length > 0 && <span style={{ color: T.teal }}>· matched to the activities selected</span>}</L>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(acceptable.length ? acceptable : ["Select an activity above to see accepted proof"]).map((x) =>
                  acceptable.length
                    ? <Chip key={x} on={docs.includes(x)} onClick={() => toggle(docs, setDocs, x)}>{x}</Chip>
                    : <span key={x} style={{ fontSize: 11, color: T.textLo, fontStyle: "italic" }}>{x}</span>)}
              </div>
            </div>

            <div>
              <L>Barriers to documenting</L>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DOC_BARRIERS.map((x) => <Chip key={x} on={barriers.includes(x)} onClick={() => toggle(barriers, setBarriers, x)} tone={T.gold}>{x}</Chip>)}
              </div>
            </div>
          </div>

          {/* live summary */}
          <div style={{ flex: "1 1 280px", minWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ border: `2px solid ${status.c}`, background: status.c + "0C", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: status.c, textTransform: "uppercase", letterSpacing: .3 }}>Status</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: status.c, marginTop: 2 }}>{status.l}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px" }}>
                <div style={{ fontSize: 9.5, color: T.textLo, fontWeight: 800, textTransform: "uppercase" }}>Hours / month</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: meetsHours ? T.green : T.red }}>{totalHours}</div>
                <div style={{ fontSize: 10, color: T.textLo }}>threshold {MHC.workReqHours}</div>
              </div>
              <div style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px" }}>
                <div style={{ fontSize: 9.5, color: T.textLo, fontWeight: 800, textTransform: "uppercase" }}>Income / month</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: meetsIncome ? T.green : T.red }}>${inc}</div>
                <div style={{ fontSize: 10, color: T.textLo }}>threshold ${MHC.workReqIncome}</div>
              </div>
            </div>

            <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ fontSize: 9.5, color: T.textLo, fontWeight: 800, textTransform: "uppercase" }}>Qualifying path</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                {[["Hours ≥ " + MHC.workReqHours, meetsHours], ["Income ≥ $" + MHC.workReqIncome, meetsIncome], ["Education at least half time", meetsEdu]].map(([l, ok]) => (
                  <div key={l} style={{ fontSize: 11, color: ok ? T.green : T.textLo, fontWeight: ok ? 700 : 500 }}>{ok ? "✓" : "○"} {l}</div>
                ))}
              </div>
              {seasonal && <div style={{ fontSize: 10, color: T.textMid, marginTop: 5 }}>Seasonal — averaged over 6 months.</div>}
            </div>

            <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ fontSize: 9.5, color: T.textLo, fontWeight: 800, textTransform: "uppercase" }}>Packet readiness</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <div style={{ flex: 1, height: 8, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: readiness + "%", height: "100%", background: readiness >= 80 ? T.green : readiness >= 50 ? T.amber : T.red }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{readiness}%</div>
              </div>
            </div>

            {blocked && (
              <div style={{ border: `1.5px solid ${T.gold}55`, background: T.gold + "0E", borderRadius: 9, padding: "8px 11px", fontSize: 11, color: T.textMid, lineHeight: 1.5 }}>
                <b>Documentation not reasonably available.</b> Routed as an assistance task — employer outreach, records help, or an in-person capture at the next visit. A barrier is a task, never a dead end.
              </div>
            )}

            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPrepared(true)} disabled={readiness < 50}
                style={{ flex: 1, fontSize: 11.5, fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", background: readiness < 50 ? T.border : T.dgreen, cursor: readiness < 50 ? "not-allowed" : "pointer" }}>
                Prepare packet for staff review
              </button>
              <button onClick={() => { setHours({}); setIncome(""); setDocs([]); setBarriers([]); setAvail("Have it now"); setEdu("Not enrolled"); setSeasonal(false); setName(""); setMrn(""); setPrepared(false); }}
                style={{ fontSize: 11.5, fontWeight: 700, border: `1px solid ${T.border}`, background: "transparent", color: T.textMid, borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>Clear</button>
            </div>

            {prepared && (
              <div style={{ border: `1.5px solid ${T.green}55`, background: T.green + "0E", borderRadius: 9, padding: "8px 11px", fontSize: 11, color: T.textMid, lineHeight: 1.5 }}>
                <b>Packet prepared and queued for staff review.</b> A staff member verifies it and submits through the official channel. CoverageGuard does not submit on the member's behalf.
              </div>
            )}

            <div style={{ fontSize: 10, color: T.textLo, lineHeight: 1.5, borderTop: `1px solid ${T.border}`, paddingTop: 7 }}>
              This form records what the member reports and what proof exists. It is <b>not</b> a determination that the community-engagement requirement has been met or missed — the State decides. Outreach complements <b>{MHC.checkin}</b> and never impersonates it. Thresholds are configurable. The impairment and verification standards are under active legal challenge ({MHC.litigation}), so this form's logic is expected to change.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function RecertView({ recerts, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth, narrow }) {
  const [sel, setSel] = useState(null);
  const [mine, setMine] = useState(false);
  const [stageTab, setStageTab] = useState("flagged");
  const selCase = recerts.find((c) => c.id === sel) || null;
  const counts = {}; RECERT_STAGES.forEach((s) => (counts[s.key] = recerts.filter((c) => c.stage === s.key).length));
  const filt = (c) => !mine || isMineCase(c);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {RECERT_STAGES.map((s) => <Stat key={s.key} icon={s.icon} label={s.label} value={counts[s.key]} tone={s.color} foot={s.blurb} />)}
      </div>

      <ActivityDocForm />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: T.textMid, display: "flex", alignItems: "center", gap: 6 }}>
          <ClipboardCheck size={14} color={T.teal} /> Each patient carries a <b>pathway-specific</b> recert checklist (documents vary by reported income type). Assign the gather and review steps separately or together; cases advance as documents come in.
        </div>
        <button onClick={() => setMine((m) => !m)} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, border: `1px solid ${mine ? T.teal : T.border}`, background: mine ? T.teal + "12" : T.surface, color: mine ? T.tealD : T.textMid, borderRadius: 9, padding: "7px 12px", cursor: "pointer" }}><UserPlus size={14} /> {mine ? "Showing my assignments" : "My assignments"}</button>
      </div>

      {narrow ? (
        <div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {RECERT_STAGES.map((s) => (
              <button key={s.key} onClick={() => setStageTab(s.key)} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${stageTab === s.key ? s.color : T.border}`, background: stageTab === s.key ? s.color + "12" : T.surface, color: stageTab === s.key ? s.color : T.textMid, borderRadius: 10, padding: "7px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <s.icon size={14} /> {s.label} <span style={{ fontSize: 11, fontWeight: 800, background: stageTab === s.key ? s.color : T.border, color: stageTab === s.key ? "#fff" : T.textMid, borderRadius: 99, padding: "0 6px" }}>{recerts.filter((c) => c.stage === s.key && filt(c)).length}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recerts.filter((c) => c.stage === stageTab && filt(c)).map((c) => <RecertCard key={c.id} c={c} onClick={() => setSel(c.id)} />)}
            {recerts.filter((c) => c.stage === stageTab && filt(c)).length === 0 && <Empty>No patients in this stage{mine ? " assigned to you" : ""}.</Empty>}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))", gap: 12, alignItems: "start" }}>
          {RECERT_STAGES.map((s) => {
            const cards = recerts.filter((c) => c.stage === s.key && filt(c));
            return (
              <div key={s.key} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10, minHeight: 120 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, padding: "2px 2px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.text }}>{s.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: s.color, background: s.color + "18", borderRadius: 99, padding: "1px 8px" }}>{cards.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {cards.map((c) => <RecertCard key={c.id} c={c} onClick={() => setSel(c.id)} />)}
                  {cards.length === 0 && <div style={{ fontSize: 11.5, color: T.textLo, textAlign: "center", padding: "14px 0" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selCase && <RecertDrawer c={selCase} onClose={() => setSel(null)} recertSetDoc={recertSetDoc} recertAssign={recertAssign} recertAdvance={recertAdvance} recertSubmit={recertSubmit} recertOutcome={recertOutcome} recertResolvePending={recertResolvePending} recertSetAuthRep={recertSetAuthRep} recertAuth={recertAuth} />}
    </div>
  );
}

function RecertCard({ c, onClick }) {
  const pr = recertProgress(c);
  const ready = pr.all && c.stage === "gathering";
  return (
    <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 11, cursor: "pointer", boxShadow: "0 1px 2px rgba(16,23,38,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{c.first} {c.last}</span>
        <TierPill tier={c.tier} small />
      </div>
      <div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono, marginTop: 1 }}>{c.mrn} · renews {c.renewalDays}d</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
        <Badge c={T.indigo}>{PATHWAY_LABEL[c.pathway] || "—"}</Badge>
        {c.source === "intake" && <Badge c={T.teal} bg={T.teal + "1A"}>from intake</Badge>}
        {c.authRep && <Badge c={AUTHREP[c.authRep].c}>{AUTHREP[c.authRep].label}</Badge>}
        {c.attempts > 1 && <Badge c={T.orange}>Attempt {c.attempts}</Badge>}
      </div>
      {(c.stage === "flagged" || c.stage === "gathering" || c.stage === "complete") && (
        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}><MiniBar value={pr.pct} color={pr.all ? T.green : T.indigo} /></div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: pr.all ? T.green : T.textMid, fontVariantNumeric: "tabular-nums" }}>{pr.r}/{pr.total}</span>
        </div>
      )}
      {c.stage === "submitted" && c.submissions[0] && <div style={{ marginTop: 9, fontSize: 10.5, color: T.textMid, fontFamily: T.mono }}>#{c.submissions[0].trackingNo} · {c.submissions[0].channel}</div>}
      {c.stage === "recertified" && c.outcome && <div style={{ marginTop: 9 }}><span style={{ fontSize: 10.5, fontWeight: 700, color: OUTCOME[c.outcome].c, background: OUTCOME[c.outcome].c + "16", border: `1px solid ${OUTCOME[c.outcome].c}44`, borderRadius: 999, padding: "2px 8px" }}>{c.closedAs ? (c.closedAs === "renewed" ? "Closed — Renewed" : "Closed — Ineligible") : OUTCOME[c.outcome].label}</span></div>}
      {c.resubmission && <div style={{ marginTop: 8, fontSize: 10.5, color: T.orange, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={12} /> Resubmission — {c.cureDeadline}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: T.textLo }}>gather:</span>
        <Badge c={c.owners.gather ? (c.owners.gather === "You" ? T.teal : T.textMid) : T.textLo}>{c.owners.gather || "unassigned"}</Badge>
        {c.owners.review && <><span style={{ fontSize: 10, color: T.textLo }}>review:</span><Badge c={c.owners.review === "You" ? T.teal : T.textMid}>{c.owners.review}</Badge></>}
      </div>
      {ready && <div style={{ marginTop: 8, fontSize: 10.5, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={12} /> All documents received — ready to advance</div>}
    </div>
  );
}

function OwnerSelect({ label, value, onChange }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: T.textLo, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3, marginBottom: 4 }}>{label}</div>
      <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} style={{ width: "100%", fontSize: 12.5, fontWeight: 600, color: value ? T.text : T.textLo, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 9px", background: T.surface, cursor: "pointer" }}>
        <option value="">Unassigned</option>
        {RECERT_STAFF.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function AuthRepRecord({ c, recertAuth }) {
  const rec = c.authRepRec;
  const documented = c.authRep === "granted" && rec && !rec.revokedDate;
  const pending = documented && rec.signaturePending;
  const revoked = rec && rec.revokedDate;
  const [showCapture, setShowCapture] = useState(false);
  const [method, setMethod] = useState(AR_METHODS[0]);
  const [fplan, setFplan] = useState(AR_FOLLOWUP_PLANS[0]);
  const [scope, setScope] = useState({ submit: true, notices: true, comm: true, workreq: true });
  const [attest, setAttest] = useState(false);
  const st = AUTHREP[c.authRep] || AUTHREP.declined;
  const toggle = (k) => setScope((s) => ({ ...s, [k]: !s[k] }));
  return (
    <div style={{ border: `1px solid ${pending ? T.orange + "55" : documented ? "#34A56A44" : T.border}`, background: pending ? T.orange + "0A" : documented ? "#34A56A0A" : T.surface2, borderRadius: 12, padding: 13 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} color={T.teal} /> Authorized representative</span>
        <div style={{ display: "flex", gap: 6 }}><Badge c={st.c}>{st.label}</Badge>{pending && <Badge c={T.orange} bg={T.orange + "18"}>Signature pending</Badge>}</div>
      </div>

      {documented ? (
        <div>
          <div style={{ fontSize: 11.5, color: T.text, lineHeight: 1.6 }}>
            <div><b>How captured:</b> {rec.method}</div>
            <div><b>Effective:</b> {rec.effectiveDate} · <b>Review by:</b> {rec.reviewDate}</div>
            {rec.signedForm
              ? <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: T.tealD }}><FileText size={13} /> Signed form on file: <span style={{ fontFamily: T.mono }}>{rec.signedForm}</span></div>
              : pending
                ? <div style={{ marginTop: 3, color: T.orange, fontWeight: 600 }}>Verbal consent — signature pending</div>
                : <div style={{ marginTop: 3, color: T.textMid }}>Electronic attestation on file (no paper form uploaded)</div>}
          </div>
          <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textLo, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3, marginBottom: 5 }}>Scope authorized</div>
            {AR_SCOPE.map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: rec.scope[s.key] ? T.text : T.textLo, marginBottom: 3 }}>
                {rec.scope[s.key] ? <CheckCircle2 size={13} color={T.green} /> : <Circle size={13} color={T.textLo} />}{s.label}
              </div>
            ))}
          </div>
          {pending && rec.followUp && (
            <div style={{ marginTop: 10, padding: "9px 10px", background: T.orange + "12", border: `1px solid ${T.orange}44`, borderRadius: 9 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: T.orange, textTransform: "uppercase", letterSpacing: .3, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> Follow-up to obtain signature</div>
              <div style={{ fontSize: 11.5, color: T.text }}>{rec.followUp.plan} · due {rec.followUp.due}</div>
              <div style={{ fontSize: 10.5, color: T.textMid, marginTop: 3, lineHeight: 1.5 }}>Verbal attestation lets staff help and communicate now, but a signature — mail-back, next in-person visit, or a recorded telephonic signature — is required to complete the designation under 42 CFR 435.923(f).</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
            {pending && <button onClick={() => recertAuth(c.id, "signed", { method: /telephon/i.test((rec.followUp && rec.followUp.plan) || "") ? "Recorded telephonic signature" : rec.method }, c.patient)} style={{ ...primaryBtn, padding: "7px 11px" }}><CheckCircle2 size={13} /> Mark signature captured</button>}
            {!rec.signedForm && <button onClick={() => recertAuth(c.id, "upload", {}, c.patient)} style={{ ...ghostBtn, padding: "7px 11px" }}><Upload size={13} /> Upload signed form</button>}
            <button onClick={() => recertAuth(c.id, "revoke", {}, c.patient)} style={{ ...ghostBtn, padding: "7px 11px", color: T.red, borderColor: T.red + "55" }}><RotateCcw size={13} /> Revoke</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 11.5, color: T.textMid, lineHeight: 1.55, marginBottom: 10 }}>
            {revoked ? `Designation revoked ${rec.revokedDate}. The patient is self-submitting unless a new designation is captured.` : c.authRep === "requested" ? "Consent was requested at first outreach but is not yet documented. Capture it electronically, or upload a signed paper form." : "No authorized representative on file — the patient submits themselves. Capture a designation to let the health center submit and receive the State's notices."}
          </div>

          {!showCapture && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setShowCapture(true)} style={{ ...primaryBtn, padding: "8px 12px" }}><ShieldCheck size={14} /> Capture e-consent</button>
              <button onClick={() => recertAuth(c.id, "upload", {}, c.patient)} style={{ ...ghostBtn, padding: "8px 12px" }}><Upload size={14} /> Upload signed form</button>
            </div>
          )}

          {showCapture && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 11 }}>
              <div style={{ fontSize: 10, color: T.textLo, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3, marginBottom: 5 }}>How consent was given</div>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={drawerInput}>{AR_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              {AR_NEEDS_SIGNATURE(method) && (
                <div style={{ margin: "2px 0 6px", padding: "8px 9px", background: T.orange + "10", border: `1px solid ${T.orange}44`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: T.orange, fontWeight: 800, textTransform: "uppercase", letterSpacing: .3, marginBottom: 4 }}>Verbal is provisional — plan to obtain the signature</div>
                  <select value={fplan} onChange={(e) => setFplan(e.target.value)} style={drawerInput}>{AR_FOLLOWUP_PLANS.map((pl) => <option key={pl} value={pl}>{pl}</option>)}</select>
                  <div style={{ fontSize: 10, color: T.textMid, lineHeight: 1.45 }}>A follow-up task is set (due in 14 days). The patient can be helped now; the designation completes when the signature is captured.</div>
                </div>
              )}
              <div style={{ fontSize: 10, color: T.textLo, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3, margin: "4px 0 6px" }}>Scope the patient authorizes</div>
              {AR_SCOPE.map((s) => (
                <div key={s.key} onClick={() => toggle(s.key)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: T.text, marginBottom: 6, cursor: "pointer" }}>
                  {scope[s.key] ? <CheckCircle2 size={15} color={T.green} /> : <Circle size={15} color={T.textLo} />}{s.label}
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: T.textMid, margin: "8px 0", cursor: "pointer", lineHeight: 1.4 }}>
                <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} style={{ marginTop: 1 }} />
                {AR_NEEDS_SIGNATURE(method)
                  ? "I read the scope above to the patient and they verbally agreed to each item, and I verified their identity. I understand a signature is still required and a follow-up is set. Recorded to the audit trail."
                  : "I confirm the patient gave informed consent for the scope above (42 CFR 435.923). Recorded to the audit trail."}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={!attest} onClick={() => { recertAuth(c.id, "capture", { method, scope, followUp: AR_NEEDS_SIGNATURE(method) ? fplan : null }, c.patient); setShowCapture(false); }} style={{ ...primaryBtn, padding: "8px 12px", opacity: attest ? 1 : .5, cursor: attest ? "pointer" : "not-allowed" }}><CheckCircle2 size={14} /> {AR_NEEDS_SIGNATURE(method) ? "Record provisional consent" : "Record designation"}</button>
                <button onClick={() => setShowCapture(false)} style={{ ...ghostBtn, padding: "8px 12px" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 10, color: T.textLo, marginTop: 10, lineHeight: 1.5 }}>Voluntary, revocable designation under 42 CFR 435.923. Paper form: <b>CG-AR-01</b> (print, sign, upload). Every change is written to the case audit trail.</div>
    </div>
  );
}

function RecertDrawer({ c, onClose, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth }) {
  const pr = recertProgress(c);
  const stageIdx = STAGE_ORDER.indexOf(c.stage);
  const canAdvance = c.stage === "flagged" ? true : c.stage === "gathering" ? pr.all : c.stage === "complete" ? true : false;
  const advanceLabel = { flagged: "Start gathering documents", gathering: "Mark documents complete", complete: "Move to Ready to submit" }[c.stage];
  const advanceNote = c.stage === "gathering" && !pr.all ? `${pr.total - pr.r} document(s) still pending` : null;
  const [channel, setChannel] = useState(SUBMIT_CHANNELS[0]);
  const [trackingNo, setTrackingNo] = useState("");
  const [subBy, setSubBy] = useState(c.authRep === "granted" ? "clinic rep" : "patient");
  const [outc, setOutc] = useState("approved");
  const [detail, setDetail] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(14,23,38,.34)" }} />
      <div style={{ position: "relative", width: "min(480px, 96vw)", background: T.surface, height: "100%", overflowY: "auto", boxShadow: "-12px 0 40px rgba(0,0,0,.18)", animation: "cgSlide .22s ease" }}>
        <div style={{ position: "sticky", top: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{c.first} {c.last}</div>
            <div style={{ fontSize: 12, color: T.textLo, fontFamily: T.mono }}>{c.mrn} · {c.lang} · renews in {c.renewalDays}d</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <Badge c={T.indigo}>{PATHWAY_LABEL[c.pathway] || "—"} pathway</Badge>
              {c.source === "intake" && <Badge c={T.teal} bg={T.teal + "1A"}>synced from intake</Badge>}
              {c.authRep && <Badge c={AUTHREP[c.authRep].c}>{AUTHREP[c.authRep].label}</Badge>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: T.textMid }}><X size={16} /></button>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* stage stepper */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {RECERT_STAGES.map((s, i) => {
                const passed = i < stageIdx; const cur = i === stageIdx;
                const col = passed ? T.green : cur ? s.color : T.border;
                return (
                  <React.Fragment key={s.key}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto", width: 58 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 99, display: "grid", placeItems: "center", background: passed ? T.green : cur ? s.color : T.surface2, color: passed || cur ? "#fff" : T.textLo, border: `1px solid ${col}` }}>{passed ? <CheckCircle2 size={14} /> : <s.icon size={13} />}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: cur ? s.color : T.textLo, textAlign: "center", lineHeight: 1.15 }}>{s.label}</span>
                    </div>
                    {i < RECERT_STAGES.length - 1 && <span style={{ flex: 1, height: 2, background: i < stageIdx ? T.green : T.border, marginTop: -14 }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* document checklist */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3 }}>Required documents</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: pr.all ? T.green : T.textMid, fontVariantNumeric: "tabular-nums" }}>{pr.r}/{pr.total} received</span>
            </div>
            <div style={{ marginBottom: 10 }}><MiniBar value={pr.pct} color={pr.all ? T.green : T.indigo} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {c.docs.map((d) => {
                const got = d.status === "received";
                return (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: `1px solid ${got ? T.green + "44" : T.border}`, borderRadius: 9, background: got ? T.green + "0C" : T.surface2 }}>
                    <span style={{ color: got ? T.green : T.textLo, flex: "0 0 auto" }}>{got ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: got ? T.text : T.textMid }}>{d.name}</span>
                    <button onClick={() => recertSetDoc(c.id, d.key, got ? "pending" : "received", c.patient, d.name)} style={{ fontSize: 11, fontWeight: 700, border: `1px solid ${got ? T.border : T.green}`, background: got ? T.surface : T.green + "12", color: got ? T.textMid : T.green, borderRadius: 7, padding: "5px 9px", cursor: "pointer", whiteSpace: "nowrap" }}>{got ? "Mark pending" : "Mark received"}</button>
                  </div>
                );
              })}
            </div>
            {pr.all && <div style={{ marginTop: 10, fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 7, background: T.green + "12", border: `1px solid ${T.green}33`, borderRadius: 9, padding: "9px 11px" }}><CheckCircle2 size={15} /> All required documents received.</div>}
          </div>

          {/* assignment */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Assignment</div>
            <div style={{ display: "flex", gap: 10 }}>
              <OwnerSelect label="Gather step" value={c.owners.gather} onChange={(v) => recertAssign(c.id, "gather", v, c.patient)} />
              <OwnerSelect label="Review step" value={c.owners.review} onChange={(v) => recertAssign(c.id, "review", v, c.patient)} />
            </div>
            <button onClick={() => recertAssign(c.id, "all", "You", c.patient)} style={{ marginTop: 10, ...ghostBtn, width: "100%", justifyContent: "center" }}><UserPlus size={14} /> Assign the whole case to me</button>
          </div>

          {/* authorized representative record */}
          <AuthRepRecord c={c} recertAuth={recertAuth} />

          {/* stage action */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            {(c.stage === "flagged" || c.stage === "gathering" || c.stage === "complete") && (
              <>
                {c.resubmission && <div style={{ fontSize: 11.5, color: T.orange, background: T.orange + "12", border: `1px solid ${T.orange}44`, borderRadius: 9, padding: "9px 11px", marginBottom: 10, display: "flex", gap: 7 }}><AlertTriangle size={14} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>Resubmission · attempt {c.attempts}.</b> {c.outcome === "denied_procedural" ? "State returned a correctable denial." : ""} {c.cureDeadline}. Fix the flagged item and re-submit.</span></div>}
                <button disabled={!canAdvance} onClick={() => recertAdvance(c.id, c.patient)} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, background: canAdvance ? T.ink : T.border, color: canAdvance ? "#fff" : T.textLo, border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: canAdvance ? "pointer" : "not-allowed" }}>{advanceLabel} <ArrowRight size={15} /></button>
                {advanceNote && <div style={{ fontSize: 11.5, color: T.orange, textAlign: "center", marginTop: 7, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}><AlertTriangle size={12} /> {advanceNote}</div>}
              </>
            )}

            {c.stage === "ready" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3, marginBottom: 9 }}>Submit to State</div>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} style={drawerInput}>{SUBMIT_CHANNELS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                <select value={subBy} onChange={(e) => setSubBy(e.target.value)} style={drawerInput}><option value="clinic rep">Submitted by clinic rep</option><option value="patient">Patient submitted themselves</option></select>
                <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Confirmation / tracking number (e.g. MHC-204517)" style={drawerInput} />
                <button disabled={!trackingNo.trim()} onClick={() => recertSubmit(c.id, { channel, trackingNo: trackingNo.trim(), by: subBy, date: "today" })} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, background: trackingNo.trim() ? T.ink : T.border, color: trackingNo.trim() ? "#fff" : T.textLo, border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: trackingNo.trim() ? "pointer" : "not-allowed" }}><Send size={15} /> Record submission to State</button>
                <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 8, lineHeight: 1.5 }}>If the patient submitted via {MHC.checkin} themselves, record the number they texted or called in. The nightly Eligibility Sentinel sweep then re-verifies coverage to confirm.</div>
              </div>
            )}

            {c.stage === "submitted" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Submission on file</div>
                {c.submissions.map((s, i) => (
                  <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 11px", marginBottom: 10 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: T.mono }}>#{s.trackingNo}</div>
                    <div style={{ fontSize: 11, color: T.textMid }}>{s.channel} · by {s.by} · {s.date}</div>
                  </div>
                ))}
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: .3, marginBottom: 8 }}>Record determination</div>
                <select value={outc} onChange={(e) => setOutc(e.target.value)} style={drawerInput}>
                  <option value="approved">Approved — renewed</option>
                  <option value="pending">Pending — clarification needed</option>
                  <option value="denied_procedural">Denied — needs correction (resubmit)</option>
                  <option value="denied_ineligible">Denied — ineligible</option>
                </select>
                {outc !== "approved" && <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={outc === "denied_procedural" ? "Cure window / what to fix" : outc === "pending" ? "What the State is asking for" : "Reason"} style={drawerInput} />}
                <button onClick={() => recertOutcome(c.id, outc, detail)} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, background: T.ink, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><ShieldCheck size={15} /> Record determination</button>
              </div>
            )}

            {c.stage === "recertified" && (
              <div>
                {c.outcome === "approved" && <div style={{ fontSize: 12.5, color: T.green, background: T.green + "12", border: `1px solid ${T.green}33`, borderRadius: 10, padding: "12px", lineHeight: 1.5 }}><div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={16} /> Closed — Renewed</div>Coverage confirmed for the new term. The Eligibility Sentinel re-verifies active status on the nightly sweep.</div>}
                {c.outcome === "denied_ineligible" && <div style={{ fontSize: 12.5, color: T.textMid, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px", lineHeight: 1.5 }}><div style={{ fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 7 }}><X size={16} /> Closed — Ineligible</div>Not a procedural failure. Refer to Oklahoma Health Care Authority for Marketplace / Family Planning options.</div>}
                {c.outcome === "pending" && (
                  <div>
                    <div style={{ fontSize: 12.5, color: T.amber, background: T.amber + "12", border: `1px solid ${T.amber}44`, borderRadius: 10, padding: "12px", lineHeight: 1.5, marginBottom: 10 }}><div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><Clock size={15} /> Pending clarification</div>State requested: {c.pendingItem}</div>
                    <button onClick={() => recertResolvePending(c.id)} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, background: T.ink, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clarification provided — re-queue to submit <ArrowRight size={15} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Pathway-specific recert documents + FQHC financial model
   ============================================================ */
const DOC_LIB = {
  id: "Photo ID",
  residency: "Proof of Oklahoma residency",
  status: "Citizenship / immigration status",
  household: "Household / dependents verification",
  paystub: "Proof of income (recent paystubs)",
  selfemp: "Self-employment income (Schedule C / ledger)",
  zero: "Zero-income attestation",
  benefit: "Benefit award letter (SSI / SSA / pension)",
  activity: "Proof of 80-hr activity or exemption (H.R. 1)",
};
const PATHWAY_LABEL = { one_job: "One job", multiple_jobs: "Multiple jobs", self_employed: "Self-employed", zero_income: "Zero income", non_employment: "Retired / disabled / student" };
const RECERT_PATHWAYS = ["one_job", "one_job", "multiple_jobs", "self_employed", "zero_income", "non_employment", "one_job", "multiple_jobs", "self_employed", "one_job", "zero_income", "one_job", "non_employment", "multiple_jobs", "one_job", "self_employed"];
function incomeDocKey(pathway) {
  if (pathway === "self_employed") return "selfemp";
  if (pathway === "zero_income") return "zero";
  if (pathway === "non_employment") return "benefit";
  return "paystub";
}
function requiredDocKeys(pathway) { return ["id", "residency", "status", "household", incomeDocKey(pathway)]; }
function docsForPathway(pathway, receivedKeys = []) {
  const recv = new Set(receivedKeys);
  return requiredDocKeys(pathway).map((k) => ({ key: k, name: DOC_LIB[k], status: recv.has(k) ? "received" : "pending" }));
}

// FQHC economic model — every input configurable to your actuals.
// 2025 Medicare FQHC PPS base = $202.65/visit; Medicaid PPS is provider-specific (often at/above that).
const FIN_DEFAULT = { pps: 211, visits: 3.6, margin340B: 450, uncomp: 1150 };
// Season-to-date recertification outcomes (org-level synthetic; 69/31 procedural split mirrors national unwinding data).
const SEASON = { processed: 412, renewed: 326, procedural: 59, ineligible: 27, pipeline90: 138, prevented: 47 };
function deriveRecertFinance(a = FIN_DEFAULT) {
  const s = SEASON, lost = s.procedural + s.ineligible;
  const ppsValue = Math.round(a.pps * a.visits);          // PPS revenue / retained patient / yr
  const perPatient = ppsValue + a.margin340B;             // PPS + 340B / retained patient / yr
  const retained$ = s.renewed * ppsValue;
  const margin$ = s.renewed * a.margin340B;
  const uncomp$ = s.prevented * a.uncomp;                 // cost avoided on prevented procedural losses
  return {
    ...s, lost, value: ppsValue, perPatient,
    successRate: Math.round((s.renewed / s.processed) * 100),
    proceduralShare: Math.round((s.procedural / lost) * 100),
    retained$, margin$, uncomp$, total$: retained$ + margin$ + uncomp$,
    proceduralLost$: s.procedural * ppsValue, pipeline$: s.pipeline90 * ppsValue, prevented$: s.prevented * ppsValue,
  };
}

function RecertPerformance({ fin, assumptions = FIN_DEFAULT, onAssumptions }) {
  const seg = [
    { label: "Renewed", v: fin.renewed, c: T.green },
    { label: "Procedural loss", v: fin.procedural, c: T.orange },
    { label: "Ineligible", v: fin.ineligible, c: T.textLo },
  ];
  const editable = typeof onAssumptions === "function";
  const setA = (k, v) => editable && onAssumptions({ ...assumptions, [k]: v });
  return (
    <Card title="Recertification performance — season to date" sub={`${fmt(fin.processed)} renewals processed · what success and failure mean in dollars`}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)", gap: 18 }}>
        {/* success + outcome bar */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: T.green, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fin.successRate}%</span>
            <span style={{ fontSize: 12.5, color: T.textMid }}>recert success rate<br /><b>{fmt(fin.renewed)}</b> renewed / {fmt(fin.processed)} processed</span>
          </div>
          <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginTop: 14, border: `1px solid ${T.border}` }}>
            {seg.map((s) => <div key={s.label} style={{ width: `${(s.v / fin.processed) * 100}%`, background: s.c }} title={`${s.label}: ${s.v}`} />)}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {seg.map((s) => <span key={s.label} style={{ fontSize: 11.5, color: T.textMid, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: s.c }} />{s.label} <b style={{ fontVariantNumeric: "tabular-nums" }}>{s.v}</b></span>)}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: T.textMid, background: T.indigo + "0E", border: `1px solid ${T.indigo}33`, borderRadius: 9, padding: "8px 10px", display: "flex", gap: 7 }}>
            <Zap size={14} color={T.indigo} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span><b>{fin.proceduralShare}% of losses are procedural</b> — paperwork, not ineligibility. Outreach prevented an estimated <b>{fin.prevented}</b> procedural disenrollments this season.</span>
          </div>
        </div>
        {/* economic impact */}
        <div>
          <div style={{ background: `linear-gradient(120deg, ${T.ink}, ${T.panel2})`, borderRadius: 12, padding: "13px 15px", color: "#fff" }}>
            <div style={{ fontSize: 11, color: T.textInvLo, fontWeight: 700, letterSpacing: .3 }}>TOTAL RECERT-DRIVEN ECONOMIC IMPACT · SEASON TO DATE</div>
            <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{money(fin.total$)}</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
              <ImpactPart c={T.teal} label="PPS revenue retained" v={money(fin.retained$)} />
              <ImpactPart c={T.indigo} label="340B margin retained" v={money(fin.margin$)} />
              <ImpactPart c={T.green} label="Uncompensated care avoided" v={money(fin.uncomp$)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <FinTile icon={Clock} tone={T.amber} label="In pipeline · next 90d" value={money(fin.pipeline$)} note={`${fin.pipeline90} renewals · PPS only`} />
            <FinTile icon={AlertTriangle} tone={T.red} label="Lost to procedural" value={money(fin.proceduralLost$)} note="recoverable — the target" />
          </div>
        </div>
      </div>

      {/* assumptions */}
      <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <DollarSign size={13} color={T.teal} /><span style={{ fontSize: 11.5, fontWeight: 700, color: T.textMid }}>Value model — {editable ? "adjust to your actuals, totals recompute live" : "configurable to your actuals"}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AssumeInput label="Medicaid PPS / visit" prefix="$" value={assumptions.pps} onChange={(v) => setA("pps", v)} editable={editable} />
          <AssumeInput label="Visits / patient / yr" value={assumptions.visits} step={0.1} onChange={(v) => setA("visits", v)} editable={editable} />
          <AssumeInput label="340B margin / pt / yr" prefix="$" value={assumptions.margin340B} onChange={(v) => setA("margin340B", v)} editable={editable} />
          <AssumeInput label="Uncomp. care / prevented" prefix="$" value={assumptions.uncomp} onChange={(v) => setA("uncomp", v)} editable={editable} />
        </div>
        <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 10, lineHeight: 1.5 }}>
          Per retained patient/yr ≈ <b>{money(fin.value)}</b> PPS + <b>{money(assumptions.margin340B)}</b> 340B = <b>{money(fin.perPatient)}</b> preserved value. Each prevented procedural disenrollment also avoids ~<b>{money(assumptions.uncomp)}</b> in uncompensated care. 2025 Medicare FQHC base is $202.65; ~69% of Medicaid disenrollments nationally are procedural. Placeholder inputs — synthetic figures for demonstration.
        </div>
      </div>
    </Card>
  );
}
function ImpactPart({ c, label, v }) {
  return <span style={{ display: "inline-flex", flexDirection: "column" }}><span style={{ fontSize: 10, color: T.textInvLo, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: c }} />{label}</span><span style={{ fontSize: 13.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</span></span>;
}
function AssumeInput({ label, value, onChange, prefix, suffix, step = 1, editable, pct }) {
  const disp = pct ? Math.round(value * 100) : value;
  const handle = (e) => { const n = parseFloat(e.target.value); onChange(isNaN(n) ? 0 : pct ? n / 100 : n); };
  return (
    <div style={{ flex: "1 1 130px", minWidth: 120 }}>
      <div style={{ fontSize: 10, color: T.textLo, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 9px", background: editable ? T.surface : T.surface2 }}>
        {prefix && <span style={{ fontSize: 12.5, color: T.textLo, fontWeight: 700 }}>{prefix}</span>}
        <input type="number" value={disp} step={pct ? 1 : step} disabled={!editable} onChange={handle} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 13.5, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums", fontFamily: T.mono }} />
        {suffix && <span style={{ fontSize: 12.5, color: T.textLo, fontWeight: 700 }}>{suffix}</span>}
      </div>
    </div>
  );
}
function FinTile({ icon: Icon, tone, label, value, note }) {
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 11, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: tone }}><Icon size={15} /><span style={{ fontSize: 11, fontWeight: 700, color: T.textMid }}>{label}</span></div>
      <div style={{ fontSize: 21, fontWeight: 800, color: T.text, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 2 }}>{note}</div>
    </div>
  );
}

/* ============================================================
   H.R. 1 / Oklahoma work-requirement readiness
   ============================================================ */
function WrPill({ status, small }) {
  const s = WR_STATUS[status] || WR_STATUS.exempt;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: small ? 10.5 : 11.5, fontWeight: 700, color: s.c, background: s.c + "16", border: `1px solid ${s.c}44`, padding: small ? "1px 7px" : "2px 9px", borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: s.c }} />{s.label}</span>;
}
function deriveHR1(panel, fin) {
  const subj = panel.filter((p) => p.wrSubject);
  const compliant = subj.filter((p) => p.wrStatus === "compliant").length;
  const atRisk = subj.filter((p) => p.wrStatus === "at_risk").length;
  const unverified = subj.filter((p) => p.wrStatus === "unverified").length;
  const exposed = atRisk + unverified;
  const per = (fin && fin.perPatient) || 1210;
  const cands = subj.map((p) => p.probableExemption).filter(Boolean);
  const emrConfirmed = cands.filter((c) => c.clinician_confirmation_status === "clinician_confirmed").length;
  const emrPending = cands.filter((c) => c.clinician_confirmation_status === "candidate_detected" || c.clinician_confirmation_status === "clinician_review_pending").length;
  const emrDocs = cands.filter((c) => c.documentation_submitted).length;
  const emrPreserved = cands.filter((c) => c.coverage_preserved).length;
  return { total: panel.length, subject: subj.length, exempt: panel.length - subj.length, compliant, atRisk, unverified, exposed, exposed$: exposed * per, emrExempt: cands.length, emrConfirmed, emrPending, emrDocs, emrPreserved };
}
function HR1Readiness({ hr1 }) {
  const seg = [
    { label: "Compliant", v: hr1.compliant, c: T.green },
    { label: "Needs verification", v: hr1.unverified, c: T.amber },
    { label: "At risk", v: hr1.atRisk, c: T.red },
    { label: "Exempt (auto-screened)", v: hr1.exempt, c: T.textLo },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card title="H.R. 1 work-requirement readiness" sub="New Oklahoma Medicaid rules · 80 hrs/mo activity + 6-month renewals · effective Jan 1, 2027">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)", gap: 18 }}>
        <div>
          <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
            {seg.map((s) => <div key={s.label} style={{ width: `${(s.v / hr1.total) * 100}%`, background: s.c }} title={`${s.label}: ${s.v}`} />)}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            {seg.map((s) => <span key={s.label} style={{ fontSize: 11.5, color: T.textMid, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: s.c }} />{s.label} <b style={{ fontVariantNumeric: "tabular-nums" }}>{s.v}</b></span>)}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: T.textMid, background: T.amber + "10", border: `1px solid ${T.amber}44`, borderRadius: 9, padding: "9px 11px", lineHeight: 1.5 }}>
            <b>{hr1.exposed} subject members are exposed</b> — at risk or unverified on the 80-hr activity rule. These face the highest procedural-loss risk under H.R. 1, and renew <b>every 6 months</b>, doubling renewal touchpoints. EMR-derived exemption candidates: <b>{hr1.emrExempt}</b> ({hr1.emrPending} pending review · {hr1.emrConfirmed} clinician-confirmed · {hr1.emrDocs} documented · {hr1.emrPreserved} coverage preserved).
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FinTile icon={Users} tone={T.indigo} label="Subject to requirements" value={fmt(hr1.subject)} note="adults 19–64, not exempt" />
          <FinTile icon={ShieldCheck} tone={T.green} label="Specified excluded" value={fmt(hr1.exempt)} note="§ 435.554 — never subject to the rule" />
          <FinTile icon={AlertTriangle} tone={T.red} label="Exposed (at risk / unverified)" value={fmt(hr1.exposed)} note="need activity proof or exemption" />
          <FinTile icon={DollarSign} tone={T.amber} label="Coverage value exposed" value={money(hr1.exposed$)} note="PPS + 340B, annualized" />
          <FinTile icon={Stethoscope} tone={T.indigo} label="Probable exemption candidates" value={fmt(hr1.emrExempt)} note={`${hr1.emrPending} pending · ${hr1.emrConfirmed} confirmed (clinician)`} />
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 10, lineHeight: 1.5 }}>
        Source: <b>{MHC.citation}</b>. States must notify members by <b>{MHC.notifyDeadline}</b>; the requirement begins <b>{MHC.goLive}</b>. Outreach complements the State — it points members to the official check-in (<b>{MHC.checkin}</b>) and their notice, and never impersonates Oklahoma. <b>Under active challenge:</b> {MHC.litigation}. The impairment standard is the central dispute, so thresholds ({MHC.workReqHours} hrs/mo or ${MHC.workReqIncome}/mo) and every rule here remain configurable. Two operational details — a documentation requirement from {MHC.attestationSunset} and {MHC.frailtyReverifyMonths}-month frailty re-verification — are <b>{MHC.pendingNote}</b> and should be confirmed with counsel and OHCA before the pilot. Synthetic figures.
      </div>
      </Card>
      <Card title="Qualifying activities & documentation" sub="§ 435.552 — what counts toward 80 hrs/mo (≈20 hrs/wk), or $580/mo MAGI household income. Activities can be combined; ex parte data is checked before the member is asked.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
          {WR_ACTIVITIES.map((a) => (
            <div key={a.key} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 11px", background: T.surface2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.label}
                {a.noHours && <span style={{ fontSize: 9, fontWeight: 800, color: T.indigo, background: T.indigo + "1A", padding: "1px 6px", borderRadius: 999, marginLeft: 6 }}>no hour log</span>}</div>
              <div style={{ fontSize: 9.5, color: T.textLo, fontFamily: T.mono, marginTop: 2 }}>{a.cite}</div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 3 }}>Accepted proof: {a.docs.join(" · ")}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.textLo, marginTop: 10 }}>Members must show they met the rule in at least one month before applying, and re-verify at each <b>6-month</b> redetermination. The income proxy is understood to use <b>MAGI household</b> income with the <b>federal</b> minimum wage as the baseline — <b>{MHC.pendingNote}</b>, confirm against the rule text before relying on it.</div>
      </Card>
      <Card title="Specified excluded individuals — and who can verify each one" sub="§ 435.554 — never subject to the requirement, identified before anyone is reviewed for compliance. The honest constraint: only some are visible in health-center data.">
        <div style={{ fontSize: 10.5, color: T.textMid, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", marginBottom: 10, lineHeight: 1.5 }}>
          <b style={{ color: T.dgreen }}>Verified against primary sources:</b> the two-element medical-frailty test, the five statutory categories (including the SUD stable-recovery carve-out and the ADL/IADL distinction), the “specified excluded individuals” terminology, and the {MHC.citation} citation.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8, marginBottom: 10 }}>
          {Object.entries(WR_TIERS).map(([k, t]) => {
            const c = k === "A" ? T.green : k === "B" ? T.indigo : T.amber;
            return (
              <div key={k} style={{ border: `1px solid ${c}44`, background: c + "0E", borderRadius: 9, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: c, textTransform: "uppercase", letterSpacing: .3 }}>Tier {k} · {t.label}</div>
                <div style={{ fontSize: 10.5, color: T.textMid, marginTop: 3, lineHeight: 1.4 }}>{t.how}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {WR_EXEMPTIONS.map((e) => {
            const c = e.tier === "A" ? T.green : e.tier === "B" ? T.indigo : T.amber;
            return (
              <div key={e.label} style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${c}`, borderRadius: 9, padding: "8px 11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{e.label}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: T.textLo, fontFamily: T.mono }}>{e.cite}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: c, background: c + "1A", padding: "1px 7px", borderRadius: 999 }}>{WR_TIERS[e.tier].label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: T.textMid, marginTop: 3, lineHeight: 1.4 }}>{e.note}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: T.textLo, marginTop: 10, lineHeight: 1.5 }}>
          <b>Medical frailty is the opportunity.</b> The State cannot satisfy the impairment element from a diagnosis match — where data is unavailable it must seek documentation, and the clinician who can attest to functional impairment is ours. CoverageGuard surfaces the condition, prompts the functional assessment, and prepares the attestation.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 6, marginTop: 10 }}>
          {FRAILTY_CATEGORIES.map((f) => (
            <div key={f.key} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 9px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dgreen }}>{f.label}</div>
              <div style={{ fontSize: 10, color: T.textLo, marginTop: 2, lineHeight: 1.4 }}>{f.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   Predictive business case — H.R. 1 do-nothing vs CoverageGuard
   Grounded in Arkansas (2018): ~1 in 4 subject members lost
   coverage; >95% actually met the rule or qualified for exemption.
   ============================================================ */
// ── SYNTHETIC BUSINESS ASSUMPTIONS (demo/pitch, not a technical secret and not real actuals). Replace with the client's real figures only in a controlled, non-public context.
const IMPACT_DEFAULT = { subjectPop: 3800, baseLoss: 0.25, recoverable: 0.95, reduction: 0.65, platformCost: 180000 };
const IMPACT_SCENARIOS = [
  { name: "Conservative", baseLoss: 0.12, reduction: 0.50 },
  { name: "Expected", baseLoss: 0.25, reduction: 0.65 },
  { name: "Aggressive", baseLoss: 0.40, reduction: 0.75 },
];
function deriveImpact(im, fin, a) {
  const per = fin.perPatient, uncomp = a.uncomp;
  const doNothing = Math.round(im.subjectPop * im.baseLoss);
  const recoverable = Math.round(doNothing * im.recoverable);
  const prevented = Math.round(recoverable * im.reduction);
  const residual = doNothing - prevented;
  const revenueProtected = prevented * per;
  const uncompAvoided = prevented * uncomp;
  const benefit = revenueProtected + uncompAvoided;
  const net = benefit - im.platformCost;
  const roi = im.platformCost > 0 ? benefit / im.platformCost : 0;
  const payback = benefit > 0 ? im.platformCost / (benefit / 12) : 0;
  return { doNothing, recoverable, prevented, residual, doNothing$: doNothing * per, residual$: residual * per, revenueProtected, uncompAvoided, benefit, net, roi, payback };
}

function ImpactView({ impact, setImpact, assumptions }) {
  const fin = deriveRecertFinance(assumptions);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderRadius: 14, border: `1px solid ${T.indigo}33`, background: `linear-gradient(180deg, ${T.indigo}10, ${T.surface})`, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, color: T.indigo, textTransform: "uppercase" }}>Projected H.R. 1 Impact \u2014 the business case</div>
        <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5, maxWidth: 820 }}>What H.R. 1 work requirements mean financially \u2014 modeled coverage loss and recoverable revenue, doing nothing vs. running CoverageGuard, across the first 12 months. Adjust the assumptions to see the range.</div>
      </div>
      <ProjectedImpact impact={impact} onImpact={setImpact} fin={fin} assumptions={assumptions} />
    </div>
  );
}
function ProjectedImpact({ impact, onImpact, fin, assumptions }) {
  const d = deriveImpact(impact, fin, assumptions);
  const editable = typeof onImpact === "function";
  const setI = (k, v) => editable && onImpact({ ...impact, [k]: v });
  const maxBar = Math.max(d.doNothing$, 1);
  return (
    <Card title="Projected H.R. 1 impact — the business case" sub="What happens doing nothing vs. running CoverageGuard · first 12 months">
      {/* headline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 14 }}>
        <div style={{ background: T.red + "0E", border: `1px solid ${T.red}33`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.red, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> Cost of doing nothing</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{money(d.doNothing$)}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{fmt(d.doNothing)} subject members lost · {Math.round(impact.baseLoss * 100)}% procedural-loss rate</div>
        </div>
        <div style={{ background: T.green + "0E", border: `1px solid ${T.green}33`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Net first-year benefit</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{money(d.net)}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>after {money(impact.platformCost)} platform cost</div>
        </div>
        <div style={{ background: T.ink, borderRadius: 12, padding: 14, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} /> Return on investment</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{d.roi.toFixed(1)}×</div>
          <div style={{ fontSize: 11, color: T.textInvLo, marginTop: 2 }}>${d.roi.toFixed(2)} returned per $1 · payback {Math.max(1, Math.round(d.payback))} mo</div>
        </div>
      </div>

      {/* comparison bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 6 }}>
        <BarRow label="Do nothing" amount={d.doNothing$} max={maxBar} color={T.red} caption={`${fmt(d.doNothing)} members lost to red tape`} />
        <BarRow label="With CoverageGuard" amount={d.residual$} max={maxBar} color={T.green} caption={`${fmt(d.residual)} residual losses · ${fmt(d.prevented)} retained`} />
      </div>
      <div style={{ fontSize: 11.5, color: T.textMid, background: T.indigo + "0E", border: `1px solid ${T.indigo}33`, borderRadius: 9, padding: "9px 11px", marginTop: 8, lineHeight: 1.5 }}>
        <b>{fmt(d.recoverable)} of the {fmt(d.doNothing)} losses are recoverable</b> — members who actually meet the rule or qualify for exemption but get dropped for paperwork. CoverageGuard retains <b>{fmt(d.prevented)}</b> of them, protecting <b>{money(d.revenueProtected)}</b> in PPS + 340B and avoiding <b>{money(d.uncompAvoided)}</b> in uncompensated care.
      </div>

      {/* scenarios */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
        {IMPACT_SCENARIOS.map((s) => {
          const sd = deriveImpact({ ...impact, baseLoss: s.baseLoss, reduction: s.reduction }, fin, assumptions);
          const hot = s.name === "Expected";
          return (
            <div key={s.name} style={{ border: `1px solid ${hot ? T.teal : T.border}`, background: hot ? T.teal + "0C" : T.surface2, borderRadius: 11, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: hot ? T.tealD : T.textMid }}>{s.name}</div>
              <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 1 }}>{Math.round(s.baseLoss * 100)}% loss · {Math.round(s.reduction * 100)}% prevented</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6, fontVariantNumeric: "tabular-nums", color: sd.net >= 0 ? T.green : T.red }}>{money(sd.net)}</div>
              <div style={{ fontSize: 10.5, color: T.textLo }}>net · {sd.roi.toFixed(1)}× ROI</div>
            </div>
          );
        })}
      </div>

      {/* inputs */}
      <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <DollarSign size={13} color={T.teal} /><span style={{ fontSize: 11.5, fontWeight: 700, color: T.textMid }}>Business-case inputs — {editable ? "adjust to your numbers, everything recomputes live" : "configurable"}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AssumeInput label="Subject members" value={impact.subjectPop} onChange={(v) => setI("subjectPop", v)} editable={editable} />
          <AssumeInput label="Do-nothing loss rate" value={impact.baseLoss} pct suffix="%" onChange={(v) => setI("baseLoss", v)} editable={editable} />
          <AssumeInput label="CoverageGuard prevents" value={impact.reduction} pct suffix="%" onChange={(v) => setI("reduction", v)} editable={editable} />
          <AssumeInput label="Platform cost / yr" prefix="$" value={impact.platformCost} step={1000} onChange={(v) => setI("platformCost", v)} editable={editable} />
        </div>
        <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 10, lineHeight: 1.5 }}>
          Default 25% do-nothing loss reflects Arkansas (2018), where ~1 in 4 subject members lost coverage in 7 months and <b>more than 95% actually met the rule or qualified for exemption</b> — losses driven by confusion and reporting burden, not ineligibility. New Hampshire saw ~40%. Per-retained-patient value ({money(fin.perPatient)}) flows from the value model. 6-month renewals create two compliance events/year, raising exposure. Synthetic figures — set to your subject population and a measured baseline before quoting.
        </div>
      </div>
    </Card>
  );
}
function BarRow({ label, amount, max, color, caption }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color }}>{money(amount)}</span>
      </div>
      <div style={{ height: 22, background: T.surface2, borderRadius: 7, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <div style={{ width: `${(amount / max) * 100}%`, height: "100%", background: color, borderRadius: 7, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 10.5, color: T.textLo, marginTop: 3 }}>{caption}</div>
    </div>
  );
}
/* ── Security: Watermark overlay ─────────────────────────────────────── */
function Watermark() {
  var ts = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  var text = CFG.state.toUpperCase() + " \u00b7 CONFIDENTIAL \u00b7 PATENT PENDING \u00b7 U.S. 64/102,709 \u00b7 " + ts;
  var rows = Array.from({ length: 8 });
  return React.createElement("div", { style: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998, overflow: "hidden" } },
    rows.map(function(_, i) {
      return React.createElement("div", { key: i, style: {
        position: "absolute",
        top: (i * 14) + "%",
        left: "-10%", width: "120%",
        textAlign: "center",
        transform: "rotate(-22deg)",
        fontSize: "11px", fontWeight: "600",
        color: "rgba(75,60,150,.055)",
        letterSpacing: "1.5px",
        userSelect: "none",
        whiteSpace: "nowrap",
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
      } }, text + "     " + text + "     " + text);
    })
  );
}

export default function AppP2() {
  return (
    <>
      <style>{`
        @keyframes cgspin {
          to { transform: rotate(360deg); }
        }
        @keyframes cgSlide {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.18); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.32); }
        * { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.18) transparent; }
        @media print { body { display: none !important; } }
      `}</style>
      <Watermark />
      <Console />
    </>
  );
}
