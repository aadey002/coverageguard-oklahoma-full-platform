import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, Inbox, MessageSquare, Boxes, LineChart as LineIcon,
  ShieldCheck, Play, Search, ChevronRight, X, Phone as PhoneIcon, AlertTriangle,
  CheckCircle2, Clock, Activity, Stethoscope, Pill, DollarSign, FileText, Send,
  Cpu, Radio, Lock, ArrowRight, Bell, Globe, Zap, ClipboardCheck, UserPlus, Circle, Flag,
  Download, Upload, RotateCcw, TrendingUp, ArrowLeft, Database, Info,
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
  text: "#16241C", textMid: "#586A5E", textLo: "#8A958B", textInv: "#FFFFFF", textInvLo: "#A8D4DC",
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
  checkin: "oklahoma.gov/ohca",
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
  brand: "CoverageGuard",
  state: "Oklahoma",
  product: "CertCore",
  startingTier: 1,
  startingView: "command",
};

/* ── Security: Session logger ───────────────────────────────────────── */
const SESSION_ID = CFG.state + "_" + CFG.product + "_" + Date.now();
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
];
const labelFor = (k) => (QUEUE_DEFS.find((d) => d.key === k) || {}).label || k;
const taxOf = (code) => CONFLICT_TAXONOMY.find((t) => t.code === code);
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
    // Dual eligible: Medicare + Medicaid both active — categorically exempt from work requirement
    const dualEligible = (age >= 19 && age < 65 && !disabled && !caregiver && rng() < 0.07);
    let wrStatus, wrReason, wrSubject, wrExemption = null, wrActivity = null;
    if (age < 19 || age >= 65) { wrStatus = "exempt"; wrExemption = "Under 19 or age 65+"; wrSubject = false; }
    else if (cflags.includes("Pregnancy")) { wrStatus = "exempt"; wrExemption = "Pregnant or postpartum"; wrSubject = false; }
    else if (caregiver) { wrStatus = "exempt"; wrExemption = "Primary caregiver — child ≤ 13 or a person with a disability"; wrSubject = false; }
    else if (disabled) { wrStatus = "exempt"; wrExemption = "Medically frail / serious health condition"; wrSubject = false; }
    else if (snapTanf) { wrStatus = "exempt"; wrExemption = "Meets SNAP or TANF work requirements"; wrSubject = false; }
    else if (fosterYouth) { wrStatus = "exempt"; wrExemption = "Former foster youth under 26"; wrSubject = false; }
    else if (veteran) { wrStatus = "exempt"; wrExemption = "Disabled veteran"; wrSubject = false; }
    else if (tribal) { wrStatus = "exempt"; wrExemption = "American Indian / Alaska Native"; wrSubject = false; }
    else if (dualEligible) { wrStatus = "exempt"; wrExemption = "Dual eligible — Medicare + Medicaid both active"; wrSubject = false; /* PART3_BRIDGE: dual_eligible flag surfaces as MCO coverage conflict signal in Coverage Intelligence when Full platform licensed */ }
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
      age, caregiver, disabled, activityHours, activityKnown, wrStatus, wrReason, wrSubject, wrExemption, wrActivity, cadence, dualEligible, probableExemption,
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
  // WR demo patient — Marcus Johnson, gig worker, 42 hrs/mo, at risk, needs employment doc form
  const wrDemoIdx = 20;
  if (list[wrDemoIdx]) {
    const wd = list[wrDemoIdx];
    wd.first = "Marcus"; wd.last = "Johnson";
    wd.mrn = "MRN560220"; wd.medicaidId = "••••7741";
    wd.lang = "English"; wd.lc = "en";
    wd.renewalDays = 22; wd.tier = "high";
    wd.coverage = "active"; wd.pharmacyReject = false; wd.denial = false;
    wd.age = 34;
    wd.wrSubject = true;
    wd.wrStatus = "at_risk";
    wd.activityHours = 42;
    wd.activityKnown = true;
    wd.wrActivity = WR_ACTIVITIES[0]; // work — paid
    wd.wrReason = "42 hrs/mo — below 80-hr requirement · gig / rideshare worker · wage records not found in BEACON ex parte check";
    wd.wrExemption = null;
    wd.probableExemption = null;
    wd.demo = true;
    wd.mco = "Wellpoint (Amerigroup)";
    wd.phone = "(410) 555-0220";
    wd.lineType = "mobile"; wd.phoneActive = true;
    wd.sdoh = wd.sdoh || {};
    wd.recon = makeRecon(wd, mulberry32(999));
    wd.crisp = null;
  }

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

export default function AppP1() {
  return (
    <>
      <style>{`
        @keyframes cgspin { to { transform: rotate(360deg); } }
        .cg-spin { animation: cgspin 1s linear infinite; }
        @keyframes cgSlide { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-thumb { background: rgba(120,130,145,.35); border-radius: 8px; }
        *::-webkit-scrollbar-track { background: transparent; }
        @media print { body { display: none !important; } }
      `}</style>
      <Watermark />
      <Console />
    </>
  );
}

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
function Stat({ icon: Icon, label, value, delta, tone = T.teal, foot, onClick, active }) {
  return (
    <div onClick={onClick} style={{ background: active?tone+"0C":T.surface, border: `1px solid ${active?tone:onClick?tone+"44":T.border}`, borderRadius: 14, padding: 14, minWidth: 0, boxShadow: "0 1px 2px rgba(16,23,38,.04)", cursor: onClick?"pointer":"default" }}>
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
  { key: "command",      label: "Command Center",          icon: LayoutDashboard, tier: 1 },
  { key: "patientqueue", label: "Patient Queue",           icon: Users,           tier: 1 },
  { key: "wrengagement", label: "Work engagement",      icon: Zap,             tier: 1 },
  { key: "clinexempt",   label: "Clinician Exemption Review", icon: Stethoscope,  tier: 1 },
  { key: "recert",       label: "Recertification",         icon: ClipboardCheck,  tier: 1 },
  { key: "kanban",       label: "Determination tracker",   icon: Boxes,           tier: 1 },
  { key: "rework",       label: "Rework queue",             icon: RotateCcw,       tier: 1 },
  { key: "followup",     label: "Post-denial follow-up",    icon: Bell,            tier: 1 },
  { key: "health",       label: "Data Source Health",      icon: Database,        tier: 1 },
  { key: "execintel",    label: "Executive Intel",         icon: TrendingUp,      tier: 1 },
];

function Console() {
  const [view, _setView] = useState(CFG.startingView || "command");
  const setView = function(v) { logEvent("nav", { view: v }); _setView(v); };
  const [productTier, setProductTier] = useState(CFG.startingTier || 1);
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
  const [pendingByMrn, setPendingByMrn] = useState({}); // { mrn: [{type, label, sentAt, channel, followUpHrs}] }
  const addPending = (mrn, entry) => {
    const now = new Date().toISOString();
    setPendingByMrn(prev => ({
      ...prev,
      [mrn]: [...(prev[mrn]||[]), { ...entry, sentAt: now, id: now+mrn+entry.type }]
    }));
  };
  const clearPending = (mrn, idOrType) => setPendingByMrn(prev => ({
    ...prev,
    [mrn]: idOrType ? (prev[mrn]||[]).filter(e=>e.id!==idOrType && e.type!==idOrType) : []
  }));
  const [extraCases, setExtraCases] = useState([]);
  const [assigned, setAssigned] = useState({});
  const [reviewState, setReviewState] = useState({}); // mrn -> { status, reviewedDate, checklist, note }
  const [recerts, setRecerts] = useState(() => buildRecerts(panel));
  const [assumptions, setAssumptions] = useState(FIN_DEFAULT);
  const [impact, setImpact] = useState(IMPACT_DEFAULT);
  const sweepingRef = useRef(false);

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

  function recertSetDoc(caseId, docKey, status, patient, docName, artifact) {
    setRecerts((rs) => rs.map((c) => c.id !== caseId ? c : {
      ...c, docs: c.docs.map((d) => d.key !== docKey ? d : {
        ...d, status,
        artifact: status === "received"
          ? (artifact || { filename:`${docKey}_${c.mrn}.pdf`, source:"manual", receivedDate:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) })
          : null,
      })
    }));
    pushAudit("recert_workflow", status === "received" ? "document.received" : "document.pending",
      `${patient} · ${docName}${artifact ? " · via " + artifact.source : ""}`);
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
  function recertOutcome(caseId, outcome, detail, cureDeadline, fixBy) {
    const c = recerts.find((x) => x.id === caseId);
    const patient = c ? c.patient : caseId;
    const patientFix = fixBy === "patient";
    setRecerts((rs) => rs.map((x) => {
      if (x.id !== caseId) return x;
      if (outcome === "approved")          return { ...x, stage:"recertified", outcome, closedAs:"renewed", pendingItem:null, cureDeadline:null };
      if (outcome === "denied_ineligible") return { ...x, stage:"recertified", outcome, closedAs:"ineligible", pendingItem:null, cureDeadline:null };
      if (outcome === "pending")           return { ...x, stage:"rfi", outcome, pendingItem:detail||"Additional information requested", cureDeadline:cureDeadline||null, closedAs:null };
      if (outcome === "denied_procedural") return { ...x, stage:"gathering", outcome,
        attempts:(x.attempts||1)+1, resubmission:true, fixBy:fixBy||"internal",
        cureDeadline:cureDeadline||null, pendingItem:detail||null, closedAs:null };
      return x;
    }));
    // Patient fix → push to Docs pending queue so navigator re-outreaches
    if (outcome === "denied_procedural" && patientFix && c) {
      const mrn = panel.find(p => `${p.first} ${p.last}` === c.patient)?.mrn;
      if (mrn) setPendingByMrn(prev => ({
        ...prev,
        [mrn]: [...(prev[mrn]||[]), {
          type:"pending_docs",
          label:`Resubmission · attempt ${(c.attempts||1)+1} · ${(detail||"correction needed").slice(0,50)}`,
          channel:"navigator",
          sentAt: new Date().toISOString(),
          followUpHrs:24,
          id: String(Date.now())+mrn,
        }]
      }));
    }
    pushAudit("recert_workflow", "determination.recorded", `${patient} · ${outcome}`);
    if (outcome === "approved")          pushAudit("recert_workflow", "case.closed", `${patient} · renewed`);
    if (outcome === "pending")           pushAudit("recert_workflow", "rfi.created", `${patient} · ${detail} · cure by ${cureDeadline}`);
    if (outcome === "denied_procedural") pushAudit("case_routing_agent", "resubmission.created",
      `${patient} · attempt ${(c?c.attempts||1:1)+1} · ${patientFix?"patient→docs pending":"internal→gathering"} · cure by ${cureDeadline}`);
    if (outcome === "denied_ineligible") pushAudit("recert_workflow", "case.closed", `${patient} · ineligible · Marketplace referral`);
  }
  function recertFollowUp(caseId, outcome, note) {
    setRecerts(rs => rs.map(x => x.id!==caseId ? x : {
      ...x,
      followupOutcome: outcome,
      followupNote: note||null,
      followupDate: todayStr(),
      followupClosed: ["commercial","new_app","marketplace","broker_340b","unresponsive"].includes(outcome),
    }));
    pushAudit("recert_workflow","followup.recorded",`${caseId} · ${outcome}`);
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
  // Called when a doc is marked received in the Docs pending queue
  // If all docs for this patient are now received, move them to Recert tab
  const onDocReceived = (mrn, docLabel) => {
    const today = todayStr();
    const pp = panel.find(x => x.mrn === mrn);
    if (!pp) return;
    const recertId = `rc_${mrn}`;
    setRecerts(rs => {
      const existing = rs.find(r => r.id === recertId);
      if (existing) {
        // Mark the specific doc received
        const updatedDocs = existing.docs.map(d =>
          d.name === docLabel || existing.docs.filter(x=>x.status!=="received").length === 1
            ? { ...d, status:"received", artifact:{ filename:`${d.key}_${mrn}_received.pdf`, source:"received", receivedDate:today } }
            : d
        );
        const allReceived = updatedDocs.every(d => d.status === "received");
        return rs.map(r => r.id === recertId ? {
          ...r,
          docs: updatedDocs,
          stage: allReceived ? "documents_complete" : r.stage,
        } : r);
      } else {
        // Create recert record in gathering stage
        const pathway = pp.wrSubject ? "work_req" : "standard";
        const keys = [...requiredDocKeys(pathway)];
        const newRec = {
          id: recertId, patient:`${pp.first} ${pp.last}`, first:pp.first, last:pp.last,
          mrn:pp.mrn, tier:pp.tier, lang:pp.lang,
          renewalDays:pp.renewalDays, renewalDate:pp.renewalDate || addDays(today, pp.renewalDays||30),
          stage:"gathering", pathway,
          docs: keys.map(k => ({ key:k, name:DOC_LIB[k]||k, status:"pending" })),
          owners:{ gather:null, review:null }, authRep:"requested", authRepRec:null,
          submissions:[], attempts:1, outcome:null, closedAs:null,
          pendingItem:null, cureDeadline:null, resubmission:false, source:"doc_received",
        };
        return [newRec, ...rs];
      }
    });
    pushAudit("recert_workflow", "document.received", `${mrn} · ${docLabel} · moved to Recert tab`);
  };

  const decideExemption = (mrn, decision, payload = {}) => {
    const today = todayStr();
    const pl = { ...payload, mrn };
    setPanel((ps) => ps.map((pp) => (pp.mrn === mrn && pp.probableExemption) ? { ...pp, probableExemption: applyExemptionDecision(pp.probableExemption, decision, pl, today) } : pp));
    setSelected((sel) => (sel && sel.mrn === mrn && sel.probableExemption) ? { ...sel, probableExemption: applyExemptionDecision(sel.probableExemption, decision, pl, today) } : sel);
    const evt = { confirm: "exemption.clinician_confirmed", assess: "exemption.assessment_requested", reject: "exemption.clinician_rejected" }[decision];
    const detail = decision === "confirm" ? `Element 2 impairment attested \u00b7 ${payload.evidence || "clinician exam"} \u00b7 re-verify ${payload.reverify || addDays(today, 365)}` : decision === "assess" ? "functional assessment visit requested" : `rejected \u00b7 ${payload.reason || "no impairment"}`;
    pushAudit("exemption_engine", evt, `${mrn} \u00b7 ${detail}`, true);
    // On confirm — ensure patient has a recert record so CG-FA-01 is visible in Recert tab
    if (decision === "confirm") {
      const recertId = `rc_${mrn}`;
      setRecerts(rs => {
        if (rs.some(r => r.id === recertId)) return rs; // already exists
        const pp = panel.find(x => x.mrn === mrn);
        if (!pp) return rs;
        const pathway = pp.wrSubject ? "work_req" : "standard";
        const keys = [...requiredDocKeys(pathway)];
        const newRec = {
          id: recertId, patient: `${pp.first} ${pp.last}`, first: pp.first, last: pp.last,
          mrn: pp.mrn, tier: pp.tier, lang: pp.lang,
          renewalDays: pp.renewalDays, renewalDate: pp.renewalDate || addDays(today, pp.renewalDays || 30),
          stage: "gathering", pathway,
          docs: keys.map(k => ({ key: k, name: DOC_LIB[k] || k, status: "pending" })),
          owners: { gather: null, review: null },
          authRep: "requested", authRepRec: null,
          submissions: [], attempts: 1, outcome: null, closedAs: null,
          pendingItem: null, cureDeadline: null, resubmission: false,
          source: "exemption_confirm",
        };
        return [newRec, ...rs];
      });
    }
  };
  const visibleNav = NAV.filter(n => n.tier <= productTier);
  const viewProps = { panel, kpis, tierDist, renewalBuckets, queues, audit, agents, setAgents, sweep, runSweep, setView, selected, setSelected, reduced, env, pushAudit, outreachSent, openCount, narrow, viewerRole, decideExemption, reviewCohort, setReview, recerts, consentByMrn, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth, assumptions, setAssumptions, impact, setImpact, productTier, setProductTier, pendingByMrn, addPending, clearPending, onDocReceived, recertFollowUp };

  return (
    <div style={{ fontFamily: T.sans, background: T.canvas, color: T.text, minHeight: "100vh", display: "flex", flexDirection: narrow ? "column" : "row" }}>
      <Sidebar view={view} setView={setView} narrow={narrow} visibleNav={visibleNav} badges={{
          command: panel.filter(p=>p.tier==="critical"||p.tier==="high").length||0,
          patientqueue: panel.filter(p=>p.renewalDays<=30||p.tier==="critical"||p.tier==="high").length||0,
          clinexempt: panel.filter(p=>p.probableExemption&&["candidate_detected","clinician_review_pending","documentation_needed"].includes(p.probableExemption.clinician_confirmation_status)).length||0,
          kanban: recerts.filter(c=>!c.closedAs).length||0,
          queues: openCount, recert: recertActive, rework: recerts.filter(c=>c.resubmission&&!c.closedAs).length||0,
          followup: recerts.filter(c=>c.closedAs==="ineligible"&&!c.followupClosed).length||0,
          wrengagement: panel.filter(p=>p.wrSubject&&p.wrStatus==="at_risk"&&p.probableExemption?.clinician_confirmation_status!=="clinician_confirmed").length||0, review: reviewCohort.filter((r) => r.status === "review_due").length }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", maxHeight: narrow ? "none" : "100vh" }}>
        <Topbar view={view} env={env} setEnv={setEnv} sweep={sweep} runSweep={runSweep} narrow={narrow} productTier={productTier} setProductTier={setProductTier} />
        <div style={{ flex: 1, overflowY: "auto", padding: narrow ? 12 : 20 }}>
          {view === "patientqueue" && <PatientQueue {...viewProps} />}
          {view === "execintel" && <ExecIntelP1 {...viewProps} />}
          {view === "clinexempt" && <ClinExemptionQueue {...viewProps} />}
          {view === "referralqueues" && <ReferralQueues {...viewProps} />}
          {view === "command" && <CommandCenter {...viewProps} />}
          {view === "conflicts" && <ConflictsView {...viewProps} />}
          {view === "patients" && <Patients {...viewProps} />}
          {view === "queues" && <Queues {...viewProps} />}
          {view === "roster" && <MCORosterView {...viewProps} />}
          {view === "caregap" && <CareGapView {...viewProps} />}
          {view === "threeb" && <Impact340BView {...viewProps} />}
          {view === "rx" && <RxCoverageView {...viewProps} onRoute={routeRecon} />}
          {view === "rrg" && <RevenueRecoveryView {...viewProps} onRoute={routeRecon} />}
          {view === "recert" && <RecertView {...viewProps} />}
          {view === "rework" && <ReworkQueue {...viewProps} />}
          {view === "kanban" && <DeterminationKanban {...viewProps} />}
          {view === "followup" && <FollowUpQueue {...viewProps} />}
          {view === "wrengagement" && <WREngagementQueue {...viewProps} />}
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
      {selected && <PatientDrawer p={selected} onClose={() => setSelected(null)} setView={setView} onRoute={routeRecon} viewerRole={viewerRole} consent={consentByMrn[selected.mrn]} addPending={addPending} clearPending={clearPending} pendingByMrn={pendingByMrn} />}
    </div>
  );
}

function Sidebar({ view, setView, narrow, badges = {}, visibleNav: navItems = NAV }) {
  const open = badges.queues || 0;
  if (narrow) {
    return (
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "10px 12px", background: T.ink, position: "sticky", top: 0, zIndex: 30 }}>
        {navItems.map((it) => (
          <button key={it.key} onClick={() => setView(it.key)} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6, background: view === it.key ? T.teal : "transparent", color: view === it.key ? "#04201F" : T.textInvLo, border: "none", borderRadius: 9, padding: "8px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <it.icon size={14} />{it.label.split(" ")[0]}
          </button>
        ))}
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
            <div style={{ fontSize: 10, color: T.textInv, letterSpacing: .4, marginTop: 1 }}>CERTCORE</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
        {navItems.map((it) => {
          const active = view === it.key;
          const badge = badges[it.key] || null;
          return (
            <button key={it.key} onClick={() => setView(it.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, background: active ? T.panel2 : "transparent", color: active ? "#fff" : T.textInv, border: "none", borderLeft: `3px solid ${active ? T.teal : "transparent"}`, borderRadius: active ? "0 9px 9px 0" : 9, padding: "10px 12px", fontSize: 13, fontWeight: active ? 700 : 600, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
              <it.icon size={16} style={{ color: active ? "#FFFFFF" : T.textInv }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {badge ? <span style={{ fontSize: 10.5, fontWeight: 800, background: T.red, color: "#fff", borderRadius: 99, padding: "1px 7px" }}>{badge}</span> : null}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.line}`, fontSize: 10.5, color: T.textInv, lineHeight: 1.5 }}>
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
          <div style={{ fontSize: 11, fontWeight: 800, background: T.teal+"22", color: T.teal, borderRadius: 8, padding: "4px 10px", marginRight: 6, border: `1px solid ${T.teal}44` }}>CertCore</div>
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
    ex.impairment_reason = payload.impairment_reason || "";
    ex.impairment_severity = payload.impairment_severity || "ongoing";
    ex.ifr_compliant = true;
    ex.evidence_basis_source = payload.evidence || "Clinician exam / attestation";
    ex.reverify_date = payload.reverify || addDays(today, 365);
    ex.documentation_note = "Clinician attestation on file";
    ex.documentation_submitted = true;
    ex.attestation_artifact = "CG-FA-01_" + (payload.mrn || "patient") + ".pdf";
    ex.confirmedDate = today;
    ex.signatureMethod = payload.signatureMethod || "type";
    ex.signatoryName = payload.signatoryName || "Attending clinician";
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
  } else if (decision === "schedule") {
    ex.clinician_confirmation_status = "assessment_scheduled";
    ex.impairment_status = "needs_visit";
    ex.assessment_date = payload.date || "";
    ex.assessment_clinician = payload.clinician || "";
    ex.assessment_type = payload.visitType || "In-person";
    ex.documentation_note = "Assessment visit scheduled by navigator";
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
    if (p.probableExemption && ["candidate_detected", "clinician_review_pending", "documentation_needed", "assessment_scheduled"].includes(p.probableExemption.clinician_confirmation_status)) {
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
   VIEW · Command Center
   ============================================================ */
function CommandCenter({ kpis, tierDist, renewalBuckets, queues, sweep, runSweep, setView, panel, recerts }) {
  const n = panel.length || 1;

  // Coverage integrity
  const inactive    = panel.filter(p => p.coverage !== "active").length;
  const atRisk      = panel.filter(p => p.tier === "critical" || p.tier === "high").length;
  const pharmacyRej = panel.filter(p => p.pharmacyReject).length;

  // H.R.1 population
  const subjects    = panel.filter(p => p.wrSubject);
  const compliant   = subjects.filter(p => p.wrStatus === "compliant").length;
  const unverified  = subjects.filter(p => p.wrStatus === "unverified").length;
  const atRiskWR    = subjects.filter(p => p.wrStatus === "at_risk").length;
  const exempt      = panel.filter(p => !p.wrSubject).length;
  const probExempt  = panel.filter(p => p.probableExemption && p.probableExemption.clinician_confirmation_status === "candidate_detected").length;
  const confirmedEx = panel.filter(p => p.probableExemption && p.probableExemption.clinician_confirmation_status === "clinician_confirmed").length;

  // Renewal pipeline
  const urgent    = panel.filter(p => p.renewalDays <= 14).length;
  const dueSoon   = panel.filter(p => p.renewalDays > 14 && p.renewalDays <= 30).length;
  const consentOn   = recerts ? recerts.filter(r => r.authRep === "granted").length : Math.round(n * 0.62);
  const consentPct  = Math.round(consentOn / n * 100);
  const consentPend = recerts ? recerts.filter(r => r.authRep === "granted" && r.authRepRec && r.authRepRec.signaturePending).length : Math.round(n * 0.14);

  // Deadline
  const daysLeft = Math.round((new Date("2026-12-31") - new Date("2026-08-22")) / (1000*60*60*24));

  const Section = ({label, children}) => (
    <div>
      <div style={{fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>{label}</div>
      {children}
    </div>
  );

  const KPI = ({label, value, sub, tone, warn, onClick}) => (
    <div onClick={onClick} style={{background:T.surface,border:`1px solid ${warn?tone+"44":T.border}`,borderRadius:12,padding:"13px 14px",cursor:onClick?"pointer":"default",transition:"border-color .15s"}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.borderColor=(warn?tone:T.teal)+"88";}}
      onMouseLeave={e=>{if(onClick)e.currentTarget.style.borderColor=warn?tone+"44":T.border;}}>
      <div style={{fontSize:11,color:T.textLo,fontWeight:700,marginBottom:4}}>{label}</div>
      <div style={{fontSize:28,fontWeight:800,color:warn?tone:T.text,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:11.5,color:tone||T.textMid,fontWeight:600,marginTop:4}}>{sub}</div>}
      {onClick && <div style={{fontSize:10,color:T.teal,marginTop:5,fontWeight:700}}>→ View queue</div>}
    </div>
  );

  const Bar = ({label, value, total, color, sub, onClick}) => {
    const pct = total ? Math.round((value/total)*100) : 0;
    return (
      <div onClick={onClick} style={{marginBottom:10, cursor:onClick?"pointer":"default", borderRadius:8, padding:"4px 2px"}}
        onMouseEnter={e=>{if(onClick)e.currentTarget.style.background=T.surface2;}}
        onMouseLeave={e=>{if(onClick)e.currentTarget.style.background="transparent";}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,fontWeight:700,color:T.text,marginBottom:4}}>
          <span>{label}</span>
          <span style={{color}}>{value} <span style={{fontWeight:500,color:T.textLo}}>/ {total}</span>{onClick&&<span style={{color:T.teal,marginLeft:6,fontSize:11}}>›</span>}</span>
        </div>
        <div style={{height:8,background:T.border,borderRadius:999,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:999}}/>
        </div>
        {sub && <div style={{fontSize:11,color:T.textLo,marginTop:3}}>{sub}</div>}
      </div>
    );
  };

  const Dot = ({label, value, color, sub, onClick}) => (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2,borderRadius:9,marginBottom:7,cursor:onClick?"pointer":"default",transition:"background .12s"}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.background=T.surface;}}
      onMouseLeave={e=>{if(onClick)e.currentTarget.style.background=T.surface2;}}>
      <div style={{width:10,height:10,borderRadius:999,background:color,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{label}</div>
        {sub && <div style={{fontSize:11,color:T.textLo}}>{sub}</div>}
      </div>
      <div style={{fontSize:20,fontWeight:800,color}}>{value}</div>
      {onClick&&<span style={{fontSize:12,color:T.teal}}>›</span>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── H.R.1 deadline banner ── */}
      <div style={{background:T.ink,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.textInvLo,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>H.R.1 — Big Beautiful Bill</div>
          <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>6-month redeterminations effective December 31, 2026</div>
          <div style={{fontSize:12.5,color:T.textInvLo,marginTop:3}}>Work requirements effective January 1, 2027 · <span style={{color:"#F5C842",fontWeight:700}}>{daysLeft} days to December 31</span></div>
        </div>
        <div style={{textAlign:"center",background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 18px"}}>
          <div style={{fontSize:44,fontWeight:800,color:"#F5C842",lineHeight:1}}>{daysLeft}</div>
          <div style={{fontSize:11,color:T.textInvLo,fontWeight:700,marginTop:2}}>days remaining</div>
        </div>
      </div>

      {/* ── Section 1: Panel snapshot ── */}
      <Section label="Panel snapshot · as of today">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
          <KPI label="Medicaid patients"     value={fmt(n)}          sub="active panel"                       onClick={()=>setView("patientqueue")} />
          <KPI label="Renewal due ≤ 30 days"  value={fmt(urgent+dueSoon)} sub={`${Math.round((urgent+dueSoon)/n*100)}% of panel`} tone={T.red}    warn={urgent>0}    onClick={()=>setView("patientqueue")} />
          <KPI label="Work-req subjects"       value={fmt(subjects.length)} sub="H.R.1 · active review window"    tone={T.amber}  warn={subjects.length>0} onClick={()=>setView("patientqueue")} />
          <KPI label="Consent gaps"            value={fmt(n - consentOn)}  sub="cannot submit without consent"    tone={consentPct<80?T.red:T.teal} warn={consentPct<80} onClick={()=>setView("patientqueue")} />
          <KPI label="Exemptions pending"      value={fmt(probExempt)}     sub="clinician confirmation needed"    tone={probExempt>0?T.indigo:T.teal} warn={probExempt>0} onClick={()=>setView("clinexempt")} />
        </div>
      </Section>

      {/* ── Section 2: H.R.1 readiness ── */}
      <Section label="H.R.1 readiness · work-requirement subject population">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:12}}>Activity status · {subjects.length} subject patients</div>
            <Bar label="Compliant — documented"    value={compliant}  total={subjects.length} color={T.green} sub="Hours or qualifying activity on file" onClick={()=>setView("patientqueue")}/>
            <Bar label="Unverified — no docs yet"  value={unverified} total={subjects.length} color={T.amber} sub="Navigator outreach needed"             onClick={()=>setView("patientqueue")}/>
            <Bar label="At risk — below 80 hrs/mo" value={atRiskWR}   total={subjects.length} color={T.red}   sub="Procedural loss risk"                  onClick={()=>setView("patientqueue")}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:12}}>Exemption status · {exempt} exempt patients</div>
            {/* Auto-exempt */}
            <div onClick={()=>setView("patientqueue")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2,borderRadius:9,marginBottom:7,cursor:"pointer",border:`1px solid ${T.green}33`}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=T.surface2}>
              <div style={{width:10,height:10,borderRadius:999,background:T.green,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:700,color:T.text}}>Auto-exempt</div><div style={{fontSize:11,color:T.textLo}}>Age, pregnancy, caregiver, SSI/SSDI — auto-screened</div></div>
              <div style={{fontSize:20,fontWeight:800,color:T.green}}>{exempt - probExempt - confirmedEx}</div>
              <span style={{fontSize:12,color:T.teal}}>›</span>
            </div>
            {/* Clinician confirmed */}
            <div onClick={()=>setView("clinexempt")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2,borderRadius:9,marginBottom:7,cursor:"pointer",border:`1px solid ${confirmedEx===0?T.amber:T.teal}33`}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=T.surface2}>
              <div style={{width:10,height:10,borderRadius:999,background:confirmedEx===0?T.amber:T.teal,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:700,color:T.text}}>Clinician confirmed</div><div style={{fontSize:11,color:T.textLo}}>{confirmedEx===0?"No confirmations yet — check queue":"CG-FA-01 signed · two elements met"}</div></div>
              <div style={{fontSize:20,fontWeight:800,color:confirmedEx===0?T.amber:T.teal}}>{confirmedEx}</div>
              <span style={{fontSize:12,color:T.teal}}>›</span>
            </div>
            {/* Probable — pending review with blocker breakdown */}
            <div style={{borderRadius:9,marginBottom:7,border:`1px solid ${probExempt>0?T.red:T.indigo}33`,overflow:"hidden"}}>
              <div onClick={()=>setView("clinexempt")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=T.surface2}>
                <div style={{width:10,height:10,borderRadius:999,background:probExempt>0?T.red:T.indigo,flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:700,color:T.text}}>Probable — pending review</div><div style={{fontSize:11,color:T.textLo}}>{probExempt>0?"Route to clinician today — blockers below":"None pending"}</div></div>
                <div style={{fontSize:20,fontWeight:800,color:probExempt>0?T.red:T.indigo}}>{probExempt}</div>
                <span style={{fontSize:12,color:T.teal}}>›</span>
              </div>
              {probExempt>0&&(
                <div style={{borderTop:`1px solid ${T.border}`,padding:"7px 11px 9px 31px",background:T.surface,display:"flex",flexDirection:"column",gap:4}}>
                  {(()=>{const items=[{label:"Appt not booked",n:0,color:T.red},{label:"No-show · reschedule",n:0,color:T.orange},{label:"Clinician not documented",n:0,color:T.amber}];for(let i=0;i<probExempt;i++)items[i%3].n++;return items.filter(b=>b.n>0).map(b=>(
                    <div key={b.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}>
                      <span style={{width:6,height:6,borderRadius:999,background:b.color,flexShrink:0}}/>
                      <span style={{color:T.textMid,flex:1}}>{b.label}</span>
                      <span style={{fontWeight:700,color:b.color}}>{b.n}</span>
                    </div>
                  ))})()}
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Renewal pipeline ── */}
      <Section label="Renewal pipeline">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:12}}>Upcoming renewal deadlines</div>
            <Dot label="Due in ≤ 14 days"   value={urgent}                   color={T.red}    sub="Act today — call immediately"    onClick={()=>setView("patientqueue")}/>
            <Dot label="Due in 15–30 days"  value={dueSoon}                  color={T.orange} sub="Outreach this week"                onClick={()=>setView("patientqueue")}/>
            <Dot label="Due in 31–60 days"  value={renewalBuckets[2]?.v||0}  color={T.amber}  sub="Schedule outreach now"             onClick={()=>setView("patientqueue")}/>
            <Dot label="Due in 61–120 days" value={renewalBuckets[3]?.v||0}  color={T.teal}   sub="Collect opportunistically"         onClick={()=>setView("patientqueue")}/>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:12}}>Consent to represent · 42 CFR 435.923</div>
            <Bar label="On file"             value={consentOn}        total={n} color={T.green}  sub="Health center can submit on their behalf" onClick={()=>setView("patientqueue")}/>
            <Bar label="Signature pending"   value={consentPend}      total={n} color={T.amber}  sub="Verbal captured · form not yet returned" onClick={()=>setView("patientqueue")}/>
            <Bar label="Not yet captured"    value={n - consentOn}    total={n} color={T.red}    sub="Must capture before submission"          onClick={()=>setView("patientqueue")}/>
          </div>

        </div>
      </Section>

      {/* ── Nightly sweep ── */}
      <SweepBar sweep={sweep} runSweep={runSweep} />

    </div>
  );
}


function SweepBar({ sweep, runSweep }) {
  const steps = ["Orchestrator", "Eligibility Sentinel", "Redetermination Predictor", "Patient Outreach", "Case Routing", "Executive Intel"];
  return (
    <Card pad={14} style={{ background: T.ink, border: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}><Cpu size={16} style={{ color: T.teal }} /> Nightly coverage sweep</div>
          <div style={{ fontSize: 11.5, color: T.textInvLo, marginTop: 2 }}>Command Orchestrator fans out across the agent layer{sweep.ts ? ` · last run ${sweep.ts}` : ""}</div>
        </div>
        {sweep.ran && !sweep.running && (
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: T.textInv }}>
            <span><b style={{ color: T.amber }}>{sweep.changed}</b> status changes</span>
            <span><b style={{ color: T.teal }}>{sweep.outreach}</b> outreach sent</span>
            <span><b style={{ color: T.red }}>{sweep.cases}</b> cases routed</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap" }}>
        {steps.map((s, i) => {
          const done = sweep.ran && (i < sweep.step || (!sweep.running && sweep.step >= 6));
          const active = sweep.running && i === sweep.step;
          const c = done ? T.green : active ? T.teal : T.line;
          return (
            <div key={i} style={{ flex: "1 1 130px", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 0 }}>
                  <span style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : (done || active ? c : T.line) }} />
                  <span style={{ width: 22, height: 22, borderRadius: 99, background: done ? T.green : active ? T.teal : T.panel, display: "grid", placeItems: "center", flex: "0 0 auto", border: `1px solid ${c}` }}>
                    {done ? <CheckCircle2 size={13} color="#fff" /> : active ? <Activity size={12} color="#fff" className="cg-spin" /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: T.textInvLo }} />}
                  </span>
                  <span style={{ flex: 1, height: 2, background: i === steps.length - 1 ? "transparent" : (done ? T.green : T.line) }} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? "#fff" : T.textInvLo, textAlign: "center", lineHeight: 1.2 }}>{s}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
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
   EXECUTIVE INTEL MVP — CertCore · compliance / medical director
   One question: what is my H.R.1 exposure and am I ahead of it?
   No revenue, no agents, no audit trail — those are Coverage Intelligence / Full Platform.
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   EXECUTIVE INTEL — CertCore · compliance / medical director
   One tab: org exposure + H.R.1 impact + consent status
   No revenue, no ROI, no platform cost — that is Coverage Intelligence / Full Platform
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   CLINICIAN EXEMPTION REVIEW — CertCore only
   Built for the clinician, not the navigator.
   Navigator routed the case here and stepped back.
   Clinician's job: confirm both elements or reject.
   Element 1 = qualifying condition (auto-detected by EMR)
   Element 2 = significantly impairs ability to work (clinician must attest)
══════════════════════════════════════════════════════════ */
function ClinExemptionQueue({ queues, panel, decideExemption, pushAudit, addPending }) {
  const [openMrn, setOpenMrn] = React.useState(null);
  const [filter, setFilter]     = React.useState("open");
  const [expandedAction, setExpandedAction] = React.useState(null); // {mrn, mode:"confirm"|"visit"|"reject"}
  const [inlineStmt, setInlineStmt]         = React.useState("");
  const [inlineEvid, setInlineEvid]         = React.useState("Clinician exam / attestation");
  const [inlineRev, setInlineRev]           = React.useState("");
  const [inlineSigText, setInlineSigText]   = React.useState("");
  const [inlineImpReason, setInlineImpReason] = React.useState("");
  const [inlineImpSeverity, setInlineImpSeverity] = React.useState("ongoing");
  const [inlineDone, setInlineDone]         = React.useState(false);
  const [rejectReason, setRejectReason]     = React.useState("No functional impairment established");
  const [rejectNote, setRejectNote]         = React.useState("");
  const FA01_EVIDENCE  = ["Clinician exam / attestation","State claims / encounter data","Both"];
  const IMPAIRMENT_LABELS = {
    physical_limitation: "Physical limitations prevent sustained activity",
    cognitive_limitation: "Cognitive or psychiatric symptoms impair consistent participation",
    treatment_burden: "Active treatment schedule occupies required hours",
    sud_treatment: "Active SUD treatment consumes required hours and impairs consistent participation",
    caregiver_obligation: "Caregiving obligations for a dependent with a disability prevent participation",
    functional_assessment: "Functional assessment documents inability to meet 80-hr standard",
    other: "Other — see clinical detail",
  };
  const REJECT_REASONS = ["No functional impairment established","Condition resolved / historical","Insufficient evidence — records needed"];
  const closeInline = () => { setExpandedAction(null); setInlineStmt(""); setInlineRev(""); setInlineSigText(""); setInlineDone(false); setRejectNote(""); setInlineImpReason(""); setInlineImpSeverity("ongoing"); };

  const q = queues.find(q => q.key === "exemption") || { items: [] };

  // Enrich queue items with full patient data
  const cases = React.useMemo(() => {
    return q.items.map(c => {
      const p = panel.find(x => x.mrn === c.mrn) || {};
      const ex = p.probableExemption || {};
      const imp = IMPAIRMENT[ex.impairment_status] || IMPAIRMENT.not_assessed;
      const st  = EXEMPTION_STATUS[ex.clinician_confirmation_status] || EXEMPTION_STATUS.candidate_detected;
      return { ...c, patient: p, ex, imp, st };
    });
  }, [q.items, panel]);

  const visible = filter === "open"
    ? cases.filter(c => !["clinician_confirmed","clinician_rejected"].includes(c.ex.clinician_confirmation_status))
    : filter === "sud"
    ? cases.filter(c => c.ex?.frailty_category === "sud")
    : cases;

  const confirmed = cases.filter(c => c.ex.clinician_confirmation_status === "clinician_confirmed").length;
  const pending   = cases.filter(c => ["candidate_detected","clinician_review_pending","documentation_needed"].includes(c.ex.clinician_confirmation_status)).length;
  // Dual eligible patients are auto-exempt — wrSubject=false means they never enter this queue
  // Show count as informational context for the clinician
  const dualEligCount = React.useMemo(() => panel.filter(p => p.dualEligible).length, [panel]);

  // Urgency bar colour
  const urgColor = u => ({high:T.red, normal:T.amber, low:T.teal}[u] || T.amber);

  const TabBtn = ({val,label,count}) => (
    <button onClick={()=>setFilter(val)}
      style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:`1px solid ${filter===val?T.indigo:T.border}`,background:filter===val?T.indigo+"10":T.surface,color:filter===val?T.indigo:T.textMid,borderRadius:10,fontSize:12.5,fontWeight:700,cursor:"pointer"}}>
      {label}
      <span style={{fontSize:11,fontWeight:800,background:filter===val?T.indigo:T.border,color:filter===val?"#fff":T.textMid,borderRadius:99,padding:"1px 7px"}}>{count}</span>
    </button>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:3}}>Clinician Exemption Review</div>
        <div style={{fontSize:12.5,color:T.textMid}}>Probable frailty / exemption candidates awaiting clinician confirmation (Element 2)</div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <TabBtn val="open"  label="Open"     count={pending} />
        <TabBtn val="sud"   label="SUD"      count={cases.filter(c=>c.ex?.frailty_category==="sud").length} />
        <TabBtn val="all"   label="All"      count={cases.length} />
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.textLo}}>
          <CheckCircle2 size={13} color={T.green}/> {confirmed} confirmed this session
        </div>
      </div>

      {/* ── Dual eligible auto-exempt notice ── */}
      {dualEligCount > 0 && (
        <div style={{marginBottom:14,padding:"10px 14px",background:T.teal+"10",border:`1px solid ${T.teal+"30"}`,borderRadius:10,fontSize:12.5,color:T.textMid,display:"flex",alignItems:"center",gap:8}}>
          <Info size={13} color={T.teal}/>
          <span><strong style={{color:T.teal,fontWeight:700}}>{dualEligCount} dual eligible</strong> patient{dualEligCount>1?"s":""} are auto-exempt from work requirement — Medicare + Medicaid both active · no clinician attestation required · categorically exempt by SoonerCare policy</span>
        </div>
      )}

      {/* ── Case rows ── */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        {visible.length === 0 && (
          <div style={{padding:"32px 20px",textAlign:"center",color:T.textLo,fontSize:13}}>
            {filter==="open"?"Queue is clear — no pending cases.":"No cases found."}
          </div>
        )}
        {visible.map((c,i) => {
          const isDone = ["clinician_confirmed","clinician_rejected"].includes(c.ex.clinician_confirmation_status);
          return (
            <div key={c.id}
              onClick={()=>setOpenMrn(openMrn===c.mrn?null:c.mrn)}
              style={{borderBottom:`1px solid ${T.surface2}`,cursor:"pointer"}}
              onMouseEnter={e=>!isDone&&(e.currentTarget.style.background=T.surface2)}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

              {/* ── Row ── */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px"}}>
                <span style={{width:5,height:48,borderRadius:99,background:isDone?(c.ex.clinician_confirmation_status==="clinician_confirmed"?T.green:T.red):urgColor(c.urgency),flexShrink:0}}/>

                {/* Patient info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:800,color:T.text}}>{c.patient.first} {c.patient.last}</span>
                    <span style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{c.mrn}</span>
                    <Badge c={c.tier==="high"?T.red:c.tier==="moderate"?T.amber:T.green}>{c.tier}</Badge>
                    {c.ex.sensitive && <Badge c={T.red} bg={T.red+"15"}>Sensitive</Badge>}
                    <Badge c={T.indigo} bg={T.indigo+"12"}>{c.ex.category || c.exemption?.category}</Badge>
                    <Badge c={c.st.c}>{c.st.label}</Badge>
                    {c.imp && c.ex.requires_impairment_element !== false && (
                      <Badge c={c.imp.c}>Element 2: {c.imp.label}</Badge>
                    )}
                    {c.ex?.clinician_confirmation_status==="assessment_scheduled" && (
                      <Badge c={T.amber} bg={T.amber+"15"}>{"Visit scheduled \u00b7 " + (c.ex.assessment_date||"TBD")}</Badge>
                    )}
                    {c.ex?.frailty_category==="sud" && (
                      <span style={{fontSize:10,fontWeight:700,color:T.indigo,background:T.indigo+"14",border:"1px solid "+T.indigo+"44",borderRadius:4,padding:"1px 6px"}}>{"SUD \u00b7 active treatment"}</span>
                    )}
                  </div>
                  <div style={{fontSize:12,color:T.textMid}}>
                    Probable exemption — {c.ex.category} · <span style={{fontFamily:T.mono,fontSize:11}}>{c.ex.rule_id}</span> · Element 1: condition ✓
                  </div>
                </div>

                {/* Age + actions */}
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{textAlign:"right",fontSize:11.5,color:T.textLo,minWidth:60}}>
                    <Clock size={11} style={{verticalAlign:-1,marginRight:3}}/>
                    {c.daysOut || 1}h old<br/>
                    <span style={{fontSize:10.5}}>confirm before renewal</span>
                  </div>
                  {!isDone ? (<>
                    <button onClick={e=>{e.stopPropagation();setOpenMrn(openMrn===c.mrn?null:c.mrn);}} style={{...ghostBtn,padding:"6px 11px",fontSize:12,display:"flex",alignItems:"center",gap:5,borderColor:openMrn===c.mrn?T.indigo:undefined,color:openMrn===c.mrn?T.indigo:undefined}}>
                      <Stethoscope size={13}/> Review
                    </button>
                  </>) : (
                    <span style={{fontSize:12,fontWeight:700,color:c.ex.clinician_confirmation_status==="clinician_confirmed"?T.green:T.red,background:(c.ex.clinician_confirmation_status==="clinician_confirmed"?T.green:T.red)+"12",borderRadius:999,padding:"5px 12px"}}>
                      {c.ex.clinician_confirmation_status==="clinician_confirmed"?"✓ Confirmed":"✗ Rejected"}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Expanded clinician drawer ── */}
              {openMrn === c.mrn && (
                <div onClick={e=>e.stopPropagation()} style={{padding:"0 16px 16px 21px",background:T.indigo+"05",borderTop:`1px dashed ${T.border}`}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,paddingTop:14}}>

                    {/* Element 1 */}
                    <div style={{border:`1px solid ${T.green}44`,background:T.green+"08",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10.5,fontWeight:800,color:T.green,textTransform:"uppercase",letterSpacing:.4,marginBottom:6}}>Element 1 · Qualifying condition ✓</div>
                      <div style={{fontSize:13.5,fontWeight:800,color:T.text,marginBottom:3}}>{c.ex.sensitive?"Sensitive — restricted":c.ex.category}</div>
                      <div style={{fontSize:11.5,color:T.textMid,fontFamily:T.mono,marginBottom:8}}>{c.ex.rule_id} · auto-detected from EMR</div>
                      <div style={{fontSize:12,color:T.textMid,lineHeight:1.5}}>Chart shows {c.ex.sensitive?"a sensitive qualifying condition":"this condition"} active on the problem list. Element 1 is met — no action needed from you on this element.</div>
                      <div style={{marginTop:8,fontSize:11,color:T.green,fontWeight:700}}>✓ Auto-confirmed · condition on active problem list</div>
                    </div>

                    {/* Element 2 */}
                    <div style={{border:`1px solid ${c.imp.c}44`,background:c.imp.c+"08",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10.5,fontWeight:800,color:c.imp.c,textTransform:"uppercase",letterSpacing:.4,marginBottom:6}}>Element 2 · Significantly impairs ability to work</div>
                      <div style={{fontSize:13.5,fontWeight:800,color:T.text,marginBottom:3}}>{c.imp.label}</div>
                      <div style={{fontSize:12,color:T.textMid,lineHeight:1.5,marginBottom:10}}>{c.imp.note}</div>
                      {c.ex.impairment_status === "assessed_impairs" ? (
                        <div style={{fontSize:12,color:T.green,fontWeight:700}}>✓ Both elements met — ready to confirm</div>
                      ) : c.ex.impairment_status === "needs_visit" ? (
                        <div style={{fontSize:12,color:T.amber,fontWeight:700}}>A functional assessment visit is needed before you can attest</div>
                      ) : (
                        <div style={{fontSize:12,color:T.textMid}}>Does this condition significantly impair the patient's ability to work 80+ hours per month?</div>
                      )}
                    </div>

                  </div>

                  {/* What the clinician needs to do */}
                  <div style={{marginTop:12,padding:"11px 14px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10}}>
                    <div style={{fontSize:11.5,fontWeight:800,color:T.text,marginBottom:6}}>What you need to do</div>
                    {c.ex.impairment_status === "assessed_impairs" ? (
                      <div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>Both elements are met. Click <b>Confirm</b> to sign the attestation — CoverageGuard will generate CG-FA-01 and notify the navigator. This patient will be exempted from the 80-hr work requirement.</div>
                    ) : c.ex.impairment_status === "needs_visit" ? (
                      <div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>A functional assessment is needed to complete Element 2. Click <b>Needs visit</b> to flag this — a visit will be scheduled and this case stays open. Do not confirm until the assessment is complete.</div>
                    ) : (
                      <div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>Review the chart. If the condition significantly impairs this patient's ability to work 80+ hours per month, click <b>Confirm</b>. If not, click <b>Reject</b>. If you need to see the patient first, click <b>Needs visit</b>.</div>
                    )}
                  </div>

                   {/* Action buttons */}
                   {!inlineDone && (
                   <div style={{display:"flex",gap:8,marginTop:12,alignItems:"center",flexWrap:"wrap"}}>
                     <button onClick={()=>{if(expandedAction?.mrn===c.mrn&&expandedAction.mode==="confirm"){closeInline();}else{closeInline();setExpandedAction({mrn:c.mrn,mode:"confirm"});setInlineEvid("Clinician exam / attestation");}}} style={{...primaryBtn,background:expandedAction?.mrn===c.mrn&&expandedAction.mode==="confirm"?T.tealD:T.teal,padding:"8px 16px"}}>
                       <CheckCircle2 size={14}/> Confirm — both elements met
                     </button>
                     <button onClick={()=>{if(expandedAction?.mrn===c.mrn&&expandedAction.mode==="visit"){closeInline();}else{closeInline();setExpandedAction({mrn:c.mrn,mode:"visit"});}}} style={{...ghostBtn,padding:"8px 14px"}}>
                       Needs visit
                     </button>
                     <button onClick={()=>{if(expandedAction?.mrn===c.mrn&&expandedAction.mode==="reject"){closeInline();}else{closeInline();setExpandedAction({mrn:c.mrn,mode:"reject"});setRejectReason(REJECT_REASONS[0]);}}} style={{...ghostBtn,padding:"8px 14px",color:T.red,borderColor:T.red+"55"}}>
                       Reject
                     </button>
                     <div style={{marginLeft:"auto",fontSize:11,color:T.textLo}}>42 CFR 440.315 · medically frail · two-element standard</div>
                   </div>
                   )}

                   {/* Inline confirm form */}
                   {expandedAction?.mrn===c.mrn && expandedAction.mode==="confirm" && !inlineDone && (
                     <div style={{marginTop:14,padding:"14px 16px",background:T.teal+"08",border:`1px solid ${T.teal}33`,borderRadius:10}}>
                       <div style={{fontSize:12.5,fontWeight:800,color:T.teal,marginBottom:10}}>CG-FA-01 · Clinician Attestation</div>
                       <div style={{marginBottom:10}}>
                         <div style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Element 2 — Functional Impairment · 42 CFR 440.315 · IFR June 2026</div>
                         <div style={{fontSize:12,color:T.textMid,marginBottom:8,lineHeight:1.5,background:T.surface2,borderRadius:8,padding:"8px 10px",border:`1px solid ${T.border}`}}>
                           {"The above condition significantly impairs "}<strong>{c.name||"this patient"}</strong>{"'s ability to complete 80 hours per month of community engagement because:"}
                         </div>
                         <select value={inlineImpReason} onChange={e=>setInlineImpReason(e.target.value)}
                           style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${inlineImpReason?T.green:T.border}`,borderRadius:8,fontSize:12,marginBottom:8,fontFamily:"inherit"}}>
                           <option value="">— Select primary reason —</option>
                           <option value="physical_limitation">Physical limitations prevent sustained activity (mobility, stamina, pain)</option>
                           <option value="cognitive_limitation">Cognitive or psychiatric symptoms impair consistent participation</option>
                           <option value="treatment_burden">Active treatment schedule (dialysis, chemotherapy, MAT) occupies required hours</option>
                           <option value="sud_treatment">Active SUD treatment (MAT, residential, outpatient) consumes required hours and impairs consistent participation</option>
                           <option value="caregiver_obligation">Caregiving obligations for a dependent with a disability prevent participation</option>
                           <option value="functional_assessment">Functional assessment documents inability to meet 80-hr standard</option>
                           <option value="other">Other — describe below</option>
                         </select>
                         <textarea value={inlineStmt} onChange={e=>setInlineStmt(e.target.value)}
                           placeholder="Additional clinical detail (optional — strengthens appeal)..."
                           style={{width:"100%",boxSizing:"border-box",minHeight:52,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface}}/>
                       </div>
                       <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                         <div>
                           <div style={{fontSize:11,fontWeight:700,color:T.textLo,marginBottom:4}}>Impairment severity</div>
                           <select value={inlineImpSeverity} onChange={e=>setInlineImpSeverity(e.target.value)}
                             style={{width:"100%",padding:"7px 9px",border:`1px solid ${T.border}`,borderRadius:7,fontSize:12,fontFamily:"inherit"}}>
                             <option value="ongoing">Ongoing — no end date anticipated</option>
                             <option value="temporary">Temporary — expected to resolve</option>
                             <option value="progressive">Progressive — expected to worsen</option>
                           </select>
                         </div>
                         <div>
                           <div style={{fontSize:11,fontWeight:700,color:T.textLo,marginBottom:4}}>Re-verify by</div>
                           <input type="date" value={inlineRev} onChange={e=>setInlineRev(e.target.value)} style={{width:"100%",padding:"7px 9px",border:`1px solid ${T.border}`,borderRadius:7,fontSize:12,fontFamily:"inherit",background:T.surface,color:T.text}}/>
                         </div>
                       </div>
                       <div style={{marginBottom:10}}>
                         <label style={{fontSize:11,color:T.textMid}}>Evidence source<br/>
                           <select value={inlineEvid} onChange={e=>setInlineEvid(e.target.value)} style={{marginTop:3,width:"100%",fontSize:11.5,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",background:T.surface,color:T.text}}>
                             {FA01_EVIDENCE.map(x=><option key={x}>{x}</option>)}
                           </select>
                         </label>
                       </div>
                       <div style={{marginBottom:12}}>
                         <div style={{fontSize:11,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:5}}>Clinician signature (required)</div>
                         <input value={inlineSigText} onChange={e=>setInlineSigText(e.target.value)}
                           placeholder="Dr. Jane Smith — constitutes legal signature"
                           style={{width:"100%",boxSizing:"border-box",fontSize:13,fontStyle:"italic",border:`1px solid ${inlineSigText.trim()?T.teal:T.border}`,borderRadius:7,padding:"8px 11px",background:T.surface,color:T.text,outline:"none"}}/>
                         {inlineSigText.trim()&&<div style={{fontSize:11,color:T.teal,marginTop:3}}>{"✓ Signature captured"}</div>}
                       </div>
                       <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                         <button onClick={closeInline} style={{...ghostBtn,padding:"7px 13px",fontSize:12}}>Cancel</button>
                         <button
                           disabled={!inlineImpReason||!inlineSigText.trim()}
                           onClick={()=>{decideExemption&&decideExemption(c.mrn,"confirm",{statement:("The above condition significantly impairs " + (c.name||"this patient") + "'s ability to complete 80 hours per month of community engagement because: " + (IMPAIRMENT_LABELS[inlineImpReason]||"") + ". " + inlineStmt).trim(),evidence:inlineEvid,reverify:inlineRev||undefined,signatureMethod:"type",impairment_reason:inlineImpReason,impairment_severity:inlineImpSeverity});setInlineDone(true);}}
                           style={{...primaryBtn,background:T.teal,padding:"8px 16px",opacity:(!inlineImpReason||!inlineSigText.trim())?0.45:1,cursor:(!inlineImpReason||!inlineSigText.trim())?"not-allowed":"pointer"}}>
                           <CheckCircle2 size={14}/> Attest and confirm exemption
                         </button>
                         <div style={{marginLeft:"auto",fontSize:10.5,color:T.textLo}}>{"Records clinician attestation \u00b7 prepares CG-FA-01 \u00b7 written to audit trail"}</div>
                       </div>
                     </div>
                   )}

                   {/* Confirm success */}
                   {expandedAction?.mrn===c.mrn && expandedAction.mode==="confirm" && inlineDone && (
                     <div style={{marginTop:12,padding:"12px 14px",background:T.green+"0C",border:`1px solid ${T.green}33`,borderRadius:10}}>
                       <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                         <CheckCircle2 size={16} color={T.green}/>
                         <span style={{fontSize:13,fontWeight:800,color:T.green}}>{"CG-FA-01 generated \u00b7 exemption confirmed"}</span>
                       </div>
                       <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>{"Form sent to Recertification tab \u00b7 patient drawer updated \u00b7 navigator notified \u00b7 written to audit trail."}</div>
                       <button style={{...ghostBtn,padding:"6px 12px",fontSize:11.5,marginTop:10}}><Download size={13}/> Download CG-FA-01</button>
                     </div>
                   )}

                   {/* Inline needs-visit form — clinician routes to navigator */}
                   {expandedAction?.mrn===c.mrn && expandedAction.mode==="visit" && (
                     <div style={{marginTop:14,padding:"14px 16px",background:T.amber+"08",border:`1px solid ${T.amber}33`,borderRadius:10}}>
                       <div style={{fontSize:12.5,fontWeight:800,color:T.amber,marginBottom:4}}>Route to navigator for scheduling</div>
                       <div style={{fontSize:11.5,color:T.textMid,marginBottom:10}}>The navigator will schedule the functional assessment visit. This case stays open — it returns here once the visit is complete.</div>
                       <div style={{marginBottom:12}}>
                         <div style={{fontSize:11,color:T.textMid,marginBottom:4}}>Note for navigator (optional)</div>
                         <textarea value={inlineStmt} onChange={e=>setInlineStmt(e.target.value)}
                           placeholder="Any clinical context the navigator should communicate when scheduling..."
                           style={{width:"100%",boxSizing:"border-box",minHeight:48,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:11.5,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
                       </div>
                       <div style={{display:"flex",gap:8,alignItems:"center"}}>
                         <button onClick={closeInline} style={{...ghostBtn,padding:"7px 13px",fontSize:12}}>Cancel</button>
                         <button onClick={()=>{
                           decideExemption&&decideExemption(c.mrn,"assess");
                           addPending&&addPending(c.mrn,{type:"assessment_needed",label:"Functional assessment visit needed \u00b7 schedule before exemption review can complete",channel:"navigator",note:inlineStmt.trim()||undefined,followUpHrs:72});
                           closeInline();
                         }} style={{...primaryBtn,background:T.amber,borderColor:T.amber,padding:"8px 16px"}}>
                           Route to navigator for scheduling
                         </button>
                       </div>
                     </div>
                   )}

                   {/* Assessment scheduled — returned from navigator */}
                   {c.ex?.clinician_confirmation_status==="assessment_scheduled" && (
                     <div style={{marginTop:10,padding:"9px 12px",background:T.amber+"10",border:`1px solid ${T.amber}44`,borderRadius:8,fontSize:12}}>
                       <div style={{fontWeight:700,color:T.amber,marginBottom:3,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={13} color={T.amber}/> {"Visit scheduled \u00b7 " + (c.ex.assessment_date||"date TBD") + " \u00b7 " + (c.ex.assessment_clinician||"clinician TBD")}</div>
                       <div style={{color:T.textMid}}>{"Awaiting visit completion \u00b7 case returns to your queue after the assessment is documented \u00b7 " + (c.ex.assessment_type||"In-person")}</div>
                     </div>
                   )}

                   {/* Inline reject form */}
                   {expandedAction?.mrn===c.mrn && expandedAction.mode==="reject" && (
                     <div style={{marginTop:14,padding:"14px 16px",background:T.red+"06",border:`1px solid ${T.red}33`,borderRadius:10}}>
                       <div style={{fontSize:12.5,fontWeight:800,color:T.red,marginBottom:6}}>Reject exemption</div>
                       <div style={{fontSize:11.5,color:T.textMid,marginBottom:10}}>A reason is required. Patient returns to work-requirement queue — not terminated.</div>
                       <div style={{marginBottom:10}}>
                         {REJECT_REASONS.map(r=>(
                           <button key={r} onClick={()=>setRejectReason(r)}
                             style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",border:`1px solid ${rejectReason===r?T.red:T.border}`,background:rejectReason===r?T.red+"0C":T.surface,borderRadius:8,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:5}}>
                             <div style={{width:14,height:14,borderRadius:999,border:`2px solid ${rejectReason===r?T.red:T.border}`,flexShrink:0,background:rejectReason===r?T.red:"transparent"}}/>
                             <span style={{fontSize:12.5,color:T.text}}>{r}</span>
                           </button>
                         ))}
                       </div>
                       <div style={{marginBottom:12}}>
                         <div style={{fontSize:11,color:T.textMid,marginBottom:4}}>Note (optional)</div>
                         <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                           placeholder="Additional context for the navigator..."
                           style={{width:"100%",boxSizing:"border-box",minHeight:48,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:11.5,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
                       </div>
                       <div style={{display:"flex",gap:8,alignItems:"center"}}>
                         <button onClick={closeInline} style={{...ghostBtn,padding:"7px 13px",fontSize:12}}>Cancel</button>
                         <button onClick={()=>{
                           decideExemption&&decideExemption(c.mrn,"reject",{reason:rejectReason,note:rejectNote});
                           addPending&&addPending(c.mrn,{type:"exemption_rejected",label:"Exemption rejected \u00b7 resume standard recert path \u00b7 reason: "+rejectReason,channel:"navigator",followUpHrs:24});
                           closeInline();
                         }} style={{...primaryBtn,background:T.red,borderColor:T.red,padding:"8px 14px"}}>
                           Confirm rejection
                         </button>
                       </div>
                       <div style={{fontSize:10.5,color:T.textLo,marginTop:8}}>{"Patient returns to activity-reporting path — not to termination. Written to audit trail."}</div>
                     </div>
                   )}
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{marginTop:8,fontSize:11.5,color:T.textLo,display:"flex",alignItems:"center",gap:6}}>
        <Zap size={12}/> Claiming a case sets you as owner, logs <code style={{fontSize:10.5,background:T.surface2,padding:"1px 5px",borderRadius:4}}>case.assigned</code> to the audit trail, and drops it out of the open queue.
      </div>


    </div>
  );
}

function ExecIntelP1({ panel, recerts, impact, assumptions }) {
  const n        = panel.length || 1;
  const [sc, setSc]   = React.useState({ subjectPop: null, baseLoss: 0.25, recoverable: 0.69, reduction: 0.65 });
  const [finA, setFinA] = React.useState(FIN_DEFAULT);
  const stripDefaultStart = React.useMemo(() => {
    if (!recerts || !recerts.length) return "2026-06-30";
    const dates = recerts.map(r => r.submittedDate || r.renewalDate).filter(Boolean).sort();
    return dates[0] || "2026-06-30";
  }, [recerts]);
  const [seasonStart, setSeasonStart] = React.useState("");
  const [seasonEnd, setSeasonEnd]     = React.useState("");
  const effectiveStart = seasonStart || stripDefaultStart;
  const effectiveEnd   = seasonEnd   || new Date().toISOString().slice(0,10);
  const daysLeft = Math.round((new Date("2026-12-31") - new Date("2026-08-22")) / (1000*60*60*24));

  // Population
  const subjects    = panel.filter(p => p.wrSubject);
  const subN        = subjects.length;
  const compliant   = subjects.filter(p => p.wrStatus === "compliant").length;
  const unverified  = subjects.filter(p => p.wrStatus === "unverified").length;
  const atRiskWR    = subjects.filter(p => p.wrStatus === "at_risk").length;
  const exempt      = n - subN;
  const probExempt  = panel.filter(p => p.probableExemption?.clinician_confirmation_status === "candidate_detected").length;
  const confirmedEx = panel.filter(p => p.probableExemption?.clinician_confirmation_status === "clinician_confirmed").length;
  const exposed     = unverified + atRiskWR;

  // Consent
  const consentOn   = recerts ? recerts.filter(r => r.authRep === "granted").length : Math.round(n * 0.62);
  const consentPct  = Math.round(consentOn / n * 100);
  const consentColor = consentPct >= 80 ? T.green : consentPct >= 60 ? T.amber : T.red;

  // Velocity
  const completed    = recerts ? recerts.filter(r => r.stage === "closed" || r.outcome === "approved").length : Math.round(n * 0.18);
  const reqPace      = (n / daysLeft).toFixed(2);
  const curPace      = (completed / 53).toFixed(2);
  const paceStatus   = curPace >= reqPace ? "on_track" : curPace >= reqPace * 0.7 ? "warning" : "behind";
  const paceColor    = {on_track:T.green, warning:T.amber, behind:T.red}[paceStatus];

  // H.R.1 scenario — procedural loss if nothing done
  const im = impact || { subjectPop: subN, baseLoss: 0.25, recoverable: 0.69, reduction: 0.65 };
  const doNothing    = Math.round(im.subjectPop * im.baseLoss);
  const recoverable  = Math.round(doNothing * (im.recoverable || 0.69));
  const prevented    = Math.round(recoverable * im.reduction);
  const residual     = doNothing - prevented;

  // Renewal buckets
  const urgent  = panel.filter(p => p.renewalDays <= 14).length;
  const soon    = panel.filter(p => p.renewalDays > 14 && p.renewalDays <= 30).length;
  const mid     = panel.filter(p => p.renewalDays > 30 && p.renewalDays <= 60).length;
  const far     = panel.filter(p => p.renewalDays > 60 && p.renewalDays <= 120).length;

  const Bar = ({label, value, total, color, sub}) => {
    const pct = total ? Math.round(value/total*100) : 0;
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,fontWeight:700,color:T.text,marginBottom:4}}>
          <span>{label}</span>
          <span style={{color}}>{value}<span style={{color:T.textLo,fontWeight:500}}> / {total} &nbsp;{pct}%</span></span>
        </div>
        <div style={{height:7,background:T.border,borderRadius:999,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:999}}/>
        </div>
        {sub && <div style={{fontSize:11,color:T.textLo,marginTop:2}}>{sub}</div>}
      </div>
    );
  };

  const Dot = ({label,value,color,sub}) => (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2,borderRadius:9,marginBottom:7}}>
      <div style={{width:10,height:10,borderRadius:999,background:color,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{label}</div>
        {sub && <div style={{fontSize:11,color:T.textLo}}>{sub}</div>}
      </div>
      <div style={{fontSize:20,fontWeight:800,color,minWidth:28,textAlign:"right"}}>{value}</div>
    </div>
  );

  const Tile = ({label,value,sub,tone,warn,size=34}) => (
    <div style={{background:T.surface,border:`1px solid ${warn?tone+"44":T.border}`,borderRadius:12,padding:"14px 16px"}}>
      <div style={{fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.4,marginBottom:5}}>{label}</div>
      <div style={{fontSize:size,fontWeight:800,color:warn?tone:T.text,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:12,color:tone||T.textMid,marginTop:5,lineHeight:1.4}}>{sub}</div>}
    </div>
  );

  const Card2 = ({title,sub,children}) => (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:13,padding:"16px 18px"}}>
      <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:2}}>{title}</div>
      {sub && <div style={{fontSize:11.5,color:T.textMid,marginBottom:12}}>{sub}</div>}
      {children}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── Deadline banner ── */}
      <div style={{background:T.ink,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Executive Intelligence · CertCore</div>
          <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Organizational H.R.1 exposure — {CFG.brand} · {CFG.state}</div>
          <div style={{fontSize:12.5,color:T.textInvLo,marginTop:3}}>As of August 22, 2026 · <span style={{color:"#F5C842",fontWeight:700}}>{daysLeft} days to December 31 deadline</span></div>
        </div>
        <div style={{background:"rgba(255,255,255,.07)",borderRadius:12,padding:"10px 20px",textAlign:"center"}}>
          <div style={{fontSize:44,fontWeight:800,color:"#F5C842",lineHeight:1}}>{daysLeft}</div>
          <div style={{fontSize:11,color:T.textInvLo,fontWeight:700,marginTop:2}}>days remaining</div>
        </div>
      </div>

      {/* ── Recertification performance — financial model ── */}
      {(()=>{
        const a = finA;
        const setA = setFinA;
        const fin = deriveRecertFinance(a);
        const seg = [
          {label:"Renewed",        v:fin.renewed,    c:T.green},
          {label:"Procedural loss",v:fin.procedural, c:T.orange},
          {label:"Ineligible",     v:fin.ineligible,  c:T.textLo},
        ];
        return (
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:13,padding:"16px 18px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:2}}>
              <div style={{fontSize:13,fontWeight:800,color:T.text,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span>Recertification performance — {CFG.brand} ·</span>
                <input type="date" value={effectiveStart} onChange={e=>setSeasonStart(e.target.value)}
                  style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6,padding:"2px 6px",fontSize:12,fontWeight:700,color:T.text,fontFamily:"inherit"}}/>
                <span style={{color:T.textLo}}>—</span>
                <input type="date" value={effectiveEnd} onChange={e=>setSeasonEnd(e.target.value)}
                  style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6,padding:"2px 6px",fontSize:12,fontWeight:700,color:T.text,fontFamily:"inherit"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,background:T.green+"15",color:T.green,border:`1px solid ${T.green}33`,borderRadius:999,padding:"2px 9px",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:999,background:T.green,display:"inline-block"}}></span>Live · eCW + MHC</span>
            </div>
            <div style={{fontSize:11.5,color:T.textMid,marginBottom:16}}>Actual outcomes from {CFG.brand} · eClinicalWorks + Oklahoma Health Care Authority · {effectiveStart} to {effectiveEnd} · {fmt(fin.processed)} renewals processed</div>
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.15fr)",gap:18}}>
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                  <span style={{fontSize:40,fontWeight:800,color:T.green,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{fin.successRate}%</span>
                  <span style={{fontSize:12.5,color:T.textMid}}>recert success rate<br/><b>{fmt(fin.renewed)}</b> renewed / {fmt(fin.processed)} processed</span>
                </div>
                <div style={{display:"flex",height:12,borderRadius:99,overflow:"hidden",marginTop:14,border:`1px solid ${T.border}`}}>
                  {seg.map(s=><div key={s.label} style={{width:`${s.v/fin.processed*100}%`,background:s.c}} title={`${s.label}: ${s.v}`}/>)}
                </div>
                <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap"}}>
                  {seg.map(s=><span key={s.label} style={{fontSize:11.5,color:T.textMid,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:99,background:s.c}}/>{s.label} <b style={{fontVariantNumeric:"tabular-nums"}}>{s.v}</b></span>)}
                </div>
                <div style={{marginTop:12,fontSize:11.5,color:T.textMid,background:T.indigo+"0E",border:`1px solid ${T.indigo}33`,borderRadius:9,padding:"8px 10px",display:"flex",gap:7}}>
                  <Zap size={14} color={T.indigo} style={{flex:"0 0 auto",marginTop:1}}/>
                  <span><b>{fin.proceduralShare}% of losses are procedural</b> — paperwork, not ineligibility. Outreach prevented an estimated <b>{fin.prevented}</b> procedural disenrollments this season.</span>
                </div>
              </div>
              <div>
                <div style={{background:`linear-gradient(120deg,${T.ink},${T.panel2})`,borderRadius:12,padding:"13px 15px",color:"#fff"}}>
                  <div style={{fontSize:11,color:T.textInvLo,fontWeight:700,letterSpacing:.3}}>TOTAL RECERT-DRIVEN ECONOMIC IMPACT · SEASON TO DATE</div>
                  <div style={{fontSize:34,fontWeight:800,fontVariantNumeric:"tabular-nums",marginTop:4}}>{money(fin.total$)}</div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8}}>
                    <ImpactPart c={T.teal}   label="PPS revenue retained"      v={money(fin.retained$)}/>
                    <ImpactPart c={T.indigo} label="340B margin retained"       v={money(fin.margin$)}/>
                    <ImpactPart c={T.green}  label="Uncompensated care avoided" v={money(fin.uncomp$)}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                  <FinTile icon={Clock}         tone={T.amber} label="In pipeline · next 90d" value={money(fin.pipeline$)} note={`${fin.pipeline90} renewals · PPS only`}/>
                  <FinTile icon={AlertTriangle} tone={T.red}   label="Lost to procedural"      value={money(fin.proceduralLost$)} note="recoverable — the target"/>
                </div>
              </div>
            </div>
            <div style={{marginTop:14,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
                <DollarSign size={13} color={T.teal}/>
                <span style={{fontSize:11.5,fontWeight:700,color:T.textMid}}>Value model — adjust to your actuals, totals recompute live</span>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <AssumeInput label="Medicaid PPS / visit"    prefix="$" value={a.pps}         onChange={v=>setA(x=>({...x,pps:v}))}         editable={true}/>
                <AssumeInput label="Visits / patient / yr"              value={a.visits}       onChange={v=>setA(x=>({...x,visits:v}))}       editable={true} step={0.1}/>
                <AssumeInput label="340B margin / pt / yr"  prefix="$" value={a.margin340B}   onChange={v=>setA(x=>({...x,margin340B:v}))}   editable={true}/>
                <AssumeInput label="Uncomp. care / prevented" prefix="$" value={a.uncomp}     onChange={v=>setA(x=>({...x,uncomp:v}))}       editable={true}/>
              </div>
              <div style={{fontSize:10.5,color:T.textLo,marginTop:10,lineHeight:1.5}}>
                Per retained patient/yr ≈ <b>{money(fin.value)}</b> PPS + <b>{money(a.margin340B)}</b> 340B = <b>{money(fin.perPatient)}</b> preserved value. Each prevented procedural disenrollment also avoids ~<b>{money(a.uncomp)}</b> in uncompensated care. 2025 Medicare FQHC base is $202.65; ~69% of Medicaid disenrollments nationally are procedural. Placeholder inputs — synthetic figures for demonstration.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── RECERTIFICATION PERFORMANCE ── unified 3-row KPI strip ── */}
      {(()=>{
        const allR = recerts || [];
        const filtered = allR.filter(r => {
          const d = r.submittedDate || r.renewalDate;
          if (!d) return true;
          return d >= effectiveStart && d <= effectiveEnd;
        });
        const total      = filtered.length;
        const approved   = filtered.filter(r=>r.outcome==="approved").length;
        const rfi        = filtered.filter(r=>r.stage==="rfi").length;
        const deniedProc = filtered.filter(r=>r.outcome==="denied_procedural"&&r.stage!=="recertified").length;
        const deniedInel = filtered.filter(r=>r.outcome==="denied_ineligible").length;
        const openRFIs   = filtered.filter(r=>r.stage==="rfi"&&r.cureDeadline);
        const resubSuccess = filtered.filter(r=>r.outcome==="approved"&&r.attempts>1).length;
        const brokerReferrals = filtered.filter(r=>r.followupOutcome==="broker_340b").length;
        const submitted  = filtered.filter(r=>["submitted","rfi","recertified"].includes(r.stage)||r.outcome).length;
        const approvalRate = submitted>0 ? Math.round(approved/submitted*100) : 0;
        const today = new Date();

        const KpiCell = ({label, value, sub, why, color, borderR}) => (
          <div style={{padding:"14px 16px",borderRight:borderR?`1px solid ${T.border}`:"none"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:4}}>{label}</div>
            <div style={{fontSize:28,fontWeight:800,color:typeof value==="number"?(value>0?color:T.textLo):color,lineHeight:1}}>{value}</div>
            {sub && <div style={{fontSize:11.5,color:T.textMid,marginTop:3}}>{sub}</div>}
            {why && <div style={{fontSize:10,color:T.textLo,marginTop:2}}>{why}</div>}
          </div>
        );

        return (
          <>
          <div style={{border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
            {/* Header */}
            <div style={{background:T.ink,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>Recertification performance</div>
                <div style={{fontSize:14,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span>CoverageGuard · {CFG.brand} ·</span>
                  <input type="date" value={effectiveStart} onChange={e=>setSeasonStart(e.target.value)}
                    style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:700,color:"#fff",fontFamily:"inherit"}}/>
                  <span style={{color:T.textInvLo}}>—</span>
                  <input type="date" value={effectiveEnd} onChange={e=>setSeasonEnd(e.target.value)}
                    style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:700,color:"#fff",fontFamily:"inherit"}}/>
                </div>
              </div>
              <div style={{fontSize:11.5,color:T.textInvLo}}>{submitted} cases in range</div>
            </div>

            {/* Row 1 — Determination outcomes */}
            <div style={{padding:"4px 16px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.4,padding:"10px 0 0"}}>Determination outcomes</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.border}`}}>
              <KpiCell label="Approved" value={approved} sub={approvalRate + "% of submitted"} why="Revenue preserved — no action needed" color={T.green} borderR/>
              <KpiCell label="RFI open" value={rfi} sub="cure items pending" why="Respond before deadline or coverage lapses" color={T.amber} borderR/>
              <KpiCell label="Denied — procedural" value={deniedProc} sub="resubmit eligible" why="Fixable — missing docs, not ineligibility" color={T.orange} borderR/>
              <KpiCell label="Denied — ineligible" value={deniedInel} sub="appeal rights attach" why="Review for categorical pathway or appeal" color={T.red}/>
            </div>

            {/* Open RFIs with cure deadlines */}
            {openRFIs.length>0&&(
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Open RFIs — cure deadlines</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {openRFIs.sort((a,b)=>new Date(a.cureDeadline)-new Date(b.cureDeadline)).map(r=>{
                    const dLeft = Math.ceil((new Date(r.cureDeadline)-today)/(1000*60*60*24));
                    const clr = dLeft<=2?T.red:dLeft<=5?T.orange:T.amber;
                    return (
                      <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:clr+"0C",border:`1px solid ${clr}33`,borderRadius:9}}>
                        <AlertTriangle size={13} color={clr}/>
                        <div style={{flex:1}}>
                          <span style={{fontSize:13,fontWeight:700,color:T.text}}>{r.patient}</span>
                          <span style={{fontSize:11.5,color:T.textMid,marginLeft:8}}>{r.pendingItem}</span>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:12,fontWeight:800,color:clr}}>{dLeft<=0?"PASSED":dLeft===1?"1 day":`${dLeft} days`}</div>
                          <div style={{fontSize:10.5,color:T.textLo}}>{r.cureDeadline}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 2 — Resubmission & pipeline */}
            <div style={{padding:"4px 16px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.4,padding:"10px 0 0"}}>Resubmission & pipeline</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.border}`}}>
              <KpiCell label="Total cases actioned" value={submitted} sub="submitted to State this season" why="Submitted to State this season" color={T.text} borderR/>
              <KpiCell label="Resubmission success" value={resubSuccess} sub="procedural denials recovered" why="Procedural denials recovered" color={T.green} borderR/>
              <KpiCell label="Pending determination" value={filtered.filter(r=>r.stage==="submitted").length} sub="awaiting State response" why="Awaiting State response" color={T.text} borderR/>
              <KpiCell label="340B referrals" value={brokerReferrals} sub="coverage partner pipeline" why="Revenue recovery via coverage partner" color={T.teal}/>
            </div>

            {/* Row 3 — Exposure & velocity */}
            <div style={{padding:"4px 16px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.4,padding:"10px 0 0"}}>Exposure & velocity</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
              <KpiCell label="Procedural loss exposure" value={exposed} sub={Math.round(exposed/n*100) + "% of panel"} why="Patients at risk from paperwork gaps — preventable" color={T.red} borderR/>
              <KpiCell label="Consent to represent" value={consentPct + "%"} sub={consentOn + " of " + n + " authorized"} why="Health center authorization to file on patient's behalf" color={consentPct>=80?T.green:T.red} borderR/>
              <KpiCell label="Renewal velocity" value={paceStatus==="on_track"?"On track":"Behind"} sub={curPace + "/day · need " + reqPace} why="Submission pace vs. deadline — falling behind means end-of-season crunch" color={paceColor} borderR/>
              <KpiCell label="If we do nothing — lost" value={doNothing} sub={recoverable + " procedural"} why="Projected coverage loss if no outreach this week" color={T.red}/>
            </div>

          </div>
          {/* Export action row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button onClick={()=>{
              const lines = [
                "COVERAGEGUARD IQ · DETERMINATION OUTCOMES REPORT",
                "Generated: " + todayStr,
                "",
                "DETERMINATION OUTCOMES",
                "Approved:               " + approved + " (" + approvalRate + "% of submitted)",
                "RFI open:               " + rfi,
                "Denied — procedural:    " + deniedProc,
                "Denied — ineligible:    " + deniedInel,
                "",
                "RESUBMISSION & PIPELINE",
                "Total cases actioned:   " + submitted,
                "Resubmission success:   " + resubSuccess,
                "Pending determination:  " + filtered.filter(r=>r.stage==="submitted").length,
                "",
                "EXPOSURE & VELOCITY",
                "Procedural loss exposure:" + exposed + " (" + Math.round(exposed/n*100) + "% of panel)",
                "Consent to represent:   " + consentPct + "% (" + consentOn + " of " + n + ")",
                "Renewal velocity:       " + (paceStatus==="on_track"?"On track":"Behind") + " (" + curPace + "/day, need " + reqPace + ")",
                "If we do nothing — lost:" + doNothing,
                "",
                "Confidential · Patent Pending · U.S. Prov. App. No. 64/102,709",
              ].join("\n");
              const blob = new Blob([lines],{type:"text/plain"});
              const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
              a.download="CoverageGuard_Recert_Performance_"+todayStr+".txt"; a.click();
            }} style={{fontSize:11,fontWeight:700,color:T.teal,background:T.teal+"10",border:`1px solid ${T.teal}44`,borderRadius:999,padding:"5px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              <Download size={13}/> Export determination report
            </button>
            <span style={{fontSize:10.5,color:T.textLo}}>Updated nightly · reflects submitted cases only</span>
          </div>
          </>
        );
      })()}

      {/* ── H.R.1 population + Exemption pipeline ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card2 title="H.R.1 subject population" sub={`${subN} of ${n} patients subject to 80-hr work requirement · ${exempt} exempt`}>
          <Bar label="Compliant — documented"    value={compliant}  total={subN} color={T.green} sub="Hours or qualifying activity on file"/>
          <Bar label="Unverified — no docs yet"  value={unverified} total={subN} color={T.amber} sub="Navigator outreach needed before deadline"/>
          <Bar label="At risk — below 80 hrs/mo" value={atRiskWR}   total={subN} color={T.red}   sub="Procedural loss if unresolved by Dec 31"/>
        </Card2>
        <Card2 title="Exemption pipeline" sub="Confirmed exemptions remove the 80-hr requirement — pending ones remain at risk">
          <Dot label="Auto-exempt"              value={exempt - probExempt - confirmedEx} color={T.green}  sub="Age · pregnancy · caregiver · SSI/SSDI"/>
          <Dot label="Clinician confirmed"       value={confirmedEx}                       color={T.teal}   sub="CG-FA-01 signed · two elements documented"/>
          <Dot label="Probable — pending review" value={probExempt}                        color={T.indigo} sub={probExempt>0?"Clinician has not yet confirmed · route today":"None pending"}/>
        </Card2>
      </div>

      {/* ── Consent breakdown ── */}
      <Card2 title="Consent to represent · 42 CFR 435.923" sub="Without consent the health center cannot submit on a patient's behalf">
        <Bar label="On file — can submit"  value={consentOn}      total={n} color={T.green} sub="Signed or e-consent captured"/>
        <Bar label="Signature pending"     value={Math.round(n*.14)} total={n} color={T.amber} sub="Verbal captured · form not yet returned"/>
        <Bar label="Not yet captured"      value={n - consentOn}  total={n} color={T.red}   sub="Must capture before submission"/>
        <div style={{marginTop:12,padding:"9px 11px",background:consentColor+"10",border:`1px solid ${consentColor}33`,borderRadius:9,fontSize:12,color:consentColor,fontWeight:700}}>
          {consentPct}% consent coverage · {consentPct>=80?"on track":consentPct>=60?"needs attention":"critical gap — escalate now"}
        </div>
      </Card2>

      {/* ── Renewal deadlines ── */}
      <Card2 title="Renewal deadlines" sub="Patients approaching their Medicaid renewal — six-month cycle under H.R.1 effective Dec 31">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
          {[
            {label:"≤ 14 days",   value:urgent, color:T.red,    sub:"Act today"},
            {label:"15–30 days",  value:soon,   color:T.orange, sub:"Outreach this week"},
            {label:"31–60 days",  value:mid,    color:T.amber,  sub:"Schedule now"},
            {label:"61–120 days", value:far,    color:T.teal,   sub:"Collect opportunistically"},
          ].map(b=>(
            <div key={b.label} style={{background:T.surface2,borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:11,color:T.textLo,fontWeight:700,marginBottom:4}}>{b.label}</div>
              <div style={{fontSize:28,fontWeight:800,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontSize:11,color:T.textMid,marginTop:4}}>{b.sub}</div>
            </div>
          ))}
        </div>
      </Card2>

      {/* ── H.R.1 editable scenario ── */}
      {(()=>{
        const pop  = sc.subjectPop != null ? sc.subjectPop : subN;
        const doN  = Math.round(pop * sc.baseLoss);
        const rec  = Math.round(doN * sc.recoverable);
        const prev = Math.round(rec * sc.reduction);
        const resid = doN - prev;
        const procPct = Math.round(sc.recoverable * 100);
        return (
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:13,padding:"16px 18px"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:2}}>H.R.1 scenario — what happens if we do nothing</div>
            <div style={{fontSize:11.5,color:T.textMid,marginBottom:16}}>Based on national {procPct}% procedural-loss split · first 12 months · adjust inputs below</div>

            {/* Three outcome tiles */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {label:"Lost to red tape", value:doN,   color:T.red},
                {label:"Recoverable",      value:rec,   color:T.orange},
                {label:"Retained w/ CG",  value:prev,  color:T.green},
              ].map(t=>(
                <div key={t.label} style={{textAlign:"center",padding:"14px 10px",background:T.surface2,borderRadius:10,border:`1px solid ${t.color}22`}}>
                  <div style={{fontSize:36,fontWeight:800,color:t.color,lineHeight:1}}>{t.value}</div>
                  <div style={{fontSize:11.5,color:T.textMid,marginTop:6,fontWeight:700}}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* Narrative */}
            <div style={{padding:"10px 12px",background:T.indigo+"0E",border:`1px solid ${T.indigo}33`,borderRadius:9,fontSize:12,color:T.textMid,lineHeight:1.6,marginBottom:14}}>
              <b style={{color:T.text}}>{procPct}% of projected losses are procedural</b> — patients who meet the rule or qualify for exemption but get dropped for missing paperwork. CoverageGuard retains an estimated <b>{prev}</b> of them leaving <b>{resid}</b> as true residual loss.
            </div>

            {/* Editable inputs */}
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
              <div style={{fontSize:11.5,fontWeight:700,color:T.textMid,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <Cpu size={12} color={T.teal}/> Adjust to your panel — totals recompute live
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[
                  {label:"Subject members",    key:"subjectPop", val:sc.subjectPop!=null?sc.subjectPop:subN, step:1,    pct:false},
                  {label:"Projected loss rate",key:"baseLoss",   val:Math.round(sc.baseLoss*100), step:1, pct:true},
                  {label:"% procedural",       key:"recoverable",val:Math.round(sc.recoverable*100), step:1, pct:true},
                  {label:"% CG retains",       key:"reduction",  val:Math.round(sc.reduction*100), step:1, pct:true},
                ].map(f=>(
                  <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:10.5,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{f.label}</label>
                    <div style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 9px",background:T.canvas,minWidth:90}}>
                      <input type="number" value={f.val} step={f.step} min={0}
                        onChange={e=>{
                          const v=parseFloat(e.target.value)||0;
                          setSc(s=>({...s,[f.key]:f.pct?v/100:v}));
                        }}
                        style={{border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,width:60,outline:"none"}}
                      />
                      {f.pct&&<span style={{fontSize:12,color:T.textLo}}>%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── KPI REPORTS ── */}
      {(()=>{
        const today = new Date();
        const todayStr = today.toISOString().slice(0,10);
        const season = `Jun 30 – Aug 22, 2026`;

        // ── Data helpers ──
        const approved    = recerts ? recerts.filter(r=>r.outcome==="approved") : [];
        const rfiOpen     = recerts ? recerts.filter(r=>r.stage==="rfi") : [];
        const deniedProc  = recerts ? recerts.filter(r=>r.outcome==="denied_procedural") : [];
        const deniedInel  = recerts ? recerts.filter(r=>r.outcome==="denied_ineligible") : [];
        const submitted   = recerts ? recerts.filter(r=>["submitted","rfi","recertified"].includes(r.stage)||r.outcome) : [];
        const subjects    = panel.filter(p=>p.wrSubject);
        const compliant   = subjects.filter(p=>p.wrStatus==="compliant");
        const atRisk      = subjects.filter(p=>p.wrStatus==="at_risk");
        const exempt      = panel.filter(p=>p.probableExemption?.clinician_confirmation_status==="clinician_confirmed");
        const consentOn   = recerts ? recerts.filter(r=>r.authRep==="granted") : [];

        // Report generators
        const REPORTS = [
          {
            id:"weekly_ops",
            icon:"📋",
            label:"Weekly navigator operations",
            audience:"Navigator supervisor · operations lead",
            desc:"Outreach activity, stage pipeline counts, intake velocity, escalations",
            color:T.teal,
            generate: () => {
              const lines = [
                `COVERAGUARD AI — WEEKLY NAVIGATOR OPERATIONS REPORT`,
                `${CFG.brand} · ${CFG.state} · Generated ${todayStr}`,
                `Season: ${season}`,
                ``,
                `── STAGE PIPELINE ──────────────────────────────`,
                `Flagged (needs action):       ${recerts?.filter(r=>r.stage==="flagged").length||0}`,
                `Gathering documents:          ${recerts?.filter(r=>r.stage==="gathering").length||0}`,
                `Documents complete:           ${recerts?.filter(r=>r.stage==="complete").length||0}`,
                `Ready to submit:              ${recerts?.filter(r=>r.stage==="ready").length||0}`,
                `Submitted to State:           ${recerts?.filter(r=>r.stage==="submitted").length||0}`,
                `RFI — cure pending:           ${rfiOpen.length}`,
                `Recertified / closed:         ${recerts?.filter(r=>r.stage==="recertified").length||0}`,
                ``,
                `── OUTREACH & INTAKE ───────────────────────────`,
                `Active panel:                 ${panel.length}`,
                `Consent on file:              ${consentOn.length} (${Math.round(consentOn.length/panel.length*100)}%)`,
                `Consent gap:                  ${panel.length - consentOn.length} patients cannot be submitted`,
                ``,
                `── OPEN RFIs (cure deadlines) ──────────────────`,
                ...( rfiOpen.length ? rfiOpen.map(r=>{
                  const d = Math.ceil((new Date(r.cureDeadline)-today)/(86400000));
                  return `${r.patient.padEnd(28)} ${r.pendingItem?.slice(0,30).padEnd(32)} Due: ${r.cureDeadline} (${d<=0?"PASSED":d+"d"})`;
                }) : ["No open RFIs"] ),
                ``,
                `── DENIAL PIPELINE ─────────────────────────────`,
                `Procedural denials (resubmit eligible): ${deniedProc.length}`,
                `Ineligible closures:          ${deniedInel.length}`,
                ``,
                `Confidential · Patent Pending · CoverageGuard IQ`,
              ];
              return lines.join("\n");
            }
          },
          {
            id:"monthly_outcomes",
            icon:"📊",
            label:"Monthly recertification outcomes",
            audience:"FQHC leadership · compliance officer",
            desc:"Season-to-date outcomes, approval rate, H.R.1 compliance, velocity vs pace",
            color:T.indigo,
            generate: () => {
              const total = submitted.length || 1;
              const appRate = Math.round(approved.length/total*100);
              const daysLeft = Math.round((new Date("2026-12-31")-today)/(86400000));
              const pace = (panel.length/daysLeft).toFixed(2);
              const lines = [
                `COVERAGUARD AI — MONTHLY RECERTIFICATION OUTCOMES`,
                `${CFG.brand} · ${CFG.state} · Generated ${todayStr}`,
                `Season: ${season}`,
                ``,
                `── SEASON-TO-DATE OUTCOMES ─────────────────────`,
                `Cases submitted to State:     ${total}`,
                `Approved (renewed):           ${approved.length} (${appRate}%)`,
                `RFI — cure pending:           ${rfiOpen.length}`,
                `Denied — procedural:          ${deniedProc.length}`,
                `Denied — ineligible:          ${deniedInel.length}`,
                `Resubmission successes:       ${recerts?.filter(r=>r.outcome==="approved"&&r.attempts>1).length||0}`,
                ``,
                `── H.R.1 WORK REQUIREMENT ──────────────────────`,
                `Subject population:           ${subjects.length} of ${panel.length} (${Math.round(subjects.length/panel.length*100)}%)`,
                `Compliant — documented:       ${compliant.length} (${Math.round(compliant.length/Math.max(subjects.length,1)*100)}%)`,
                `At risk — below 80 hrs/mo:   ${atRisk.length}`,
                `Clinician-confirmed exempt:   ${exempt.length}`,
                ``,
                `── RENEWAL VELOCITY ────────────────────────────`,
                `Days to December 31:          ${daysLeft}`,
                `Required pace:                ${pace} renewals/day`,
                `Consent coverage:             ${Math.round(consentOn.length/panel.length*100)}% (${consentOn.length} of ${panel.length})`,
                ``,
                `── OPEN RFI CURE ITEMS ─────────────────────────`,
                ...( rfiOpen.length ? rfiOpen.map(r=>{
                  const d = Math.ceil((new Date(r.cureDeadline)-today)/(86400000));
                  return `${r.patient.padEnd(28)} Due ${r.cureDeadline} (${d<=0?"PASSED":d+"d left"}) — ${r.pendingItem}`;
                }) : ["No open RFIs"] ),
                ``,
                `Confidential · Patent Pending · CoverageGuard IQ`,
              ];
              return lines.join("\n");
            }
          },
          {
            id:"hr1_audit",
            icon:"⚖️",
            label:"H.R.1 compliance audit",
            audience:"Compliance officer · legal",
            desc:"Work-req subject population, exemption documentation, attestation audit trail",
            color:T.amber,
            generate: () => {
              const lines = [
                `COVERAGUARD AI — H.R.1 COMPLIANCE AUDIT REPORT`,
                `${CFG.brand} · ${CFG.state} · Generated ${todayStr}`,
                `Work requirements effective January 1, 2027`,
                ``,
                `── SUBJECT POPULATION ──────────────────────────`,
                `Total active panel:           ${panel.length}`,
                `Subject to 80-hr requirement: ${subjects.length} (${Math.round(subjects.length/panel.length*100)}%)`,
                `Exempt:                       ${panel.length-subjects.length}`,
                ``,
                `── COMPLIANCE STATUS ───────────────────────────`,
                `Compliant — documented:       ${compliant.length}`,
                `Unverified — no docs:         ${subjects.filter(p=>p.wrStatus==="unverified").length}`,
                `At risk — below 80 hrs/mo:   ${atRisk.length}`,
                ``,
                `── EXEMPTION PIPELINE ──────────────────────────`,
                `Auto-exempt (age/SSI/etc):    ${panel.filter(p=>p.probableExemption?.clinician_confirmation_status==="candidate_detected").length}`,
                `Clinician confirmed:          ${exempt.length}`,
                `CG-FA-01 on file:             ${exempt.length}`,
                ``,
                `── PATIENT-LEVEL DETAIL ────────────────────────`,
                `${"-".repeat(72)}`,
                `${ "Patient".padEnd(24) }${ "MRN".padEnd(14) }${ "Status".padEnd(16) }${ "Hrs/mo".padEnd(10) }Exemption`,
                `${"-".repeat(72)}`,
                ...subjects.slice(0,20).map(p=>{
                  const ex = p.probableExemption?.clinician_confirmation_status==="clinician_confirmed" ? "Confirmed" :
                             p.probableExemption?.clinician_confirmation_status==="candidate_detected" ? "Probable" : "None";
                  return `${(p.first+" "+p.last).padEnd(24)}${p.mrn.padEnd(14)}${(p.wrStatus||"unknown").padEnd(16)}${String(p.wrHours||"—").padEnd(10)}${ex}`;
                }),
                subjects.length>20?`... and ${subjects.length-20} more`:"",
                ``,
                `Confidential · Patent Pending · CoverageGuard IQ`,
              ];
              return lines.join("\n");
            }
          },
          {
            id:"custom",
            icon:"🗂️",
            label:"MCO / payer reconciliation",
            audience:"Billing · revenue cycle",
            desc:"Patients renewed by MCO, authorization periods, 340B continuity, RCM impact",
            color:T.green,
            generate: () => {
              const byMCO = {};
              panel.forEach(p=>{ byMCO[p.mco]=(byMCO[p.mco]||0)+1; });
              const approvedByMCO = {};
              approved.forEach(r=>{
                const p = panel.find(x=>x.mrn===r.mrn||r.patient?.includes(x.last));
                const mco = p?.mco||"Unknown";
                approvedByMCO[mco]=(approvedByMCO[mco]||0)+1;
              });
              const lines = [
                `COVERAGUARD AI — MCO / PAYER RECONCILIATION`,
                `${CFG.brand} · ${CFG.state} · Generated ${todayStr}`,
                `Season: ${season}`,
                ``,
                `── PANEL BY MCO ────────────────────────────────`,
                ...Object.entries(byMCO).sort((a,b)=>b[1]-a[1]).map(([mco,n])=>`${mco.padEnd(36)} ${String(n).padStart(4)} patients`),
                ``,
                `── RENEWALS CONFIRMED BY MCO ───────────────────`,
                ...Object.entries(approvedByMCO).length ? Object.entries(approvedByMCO).map(([mco,n])=>`${mco.padEnd(36)} ${String(n).padStart(4)} renewed`) : ["No renewals recorded yet"],
                ``,
                `── 340B CONTINUITY ─────────────────────────────`,
                `Patients retained on Medicaid:  ${approved.length}`,
                `340B eligible continuity:       ${Math.round(approved.length*0.71)} (est. 71% 340B eligible)`,
                `Estimated 340B margin retained: $${(Math.round(approved.length*0.71)*450).toLocaleString()}/yr`,
                ``,
                `── RCM IMPACT ──────────────────────────────────`,
                `PPS revenue retained:           $${(approved.length*211*3.6).toLocaleString()} (est.)`,
                `Procedural loss exposure:       $${(deniedProc.length*211*3.6).toLocaleString()} (recoverable)`,
                ``,
                `Confidential · Patent Pending · CoverageGuard IQ`,
              ];
              return lines.join("\n");
            }
          },
          {
            id:"pipeline_velocity",
            icon:"⏱️",
            label:"Pipeline velocity & cycle time",
            audience:"Supervisor · operations lead · compliance",
            desc:"Time-in-stage, end-to-end cycle time, bottleneck identification, at-risk renewals",
            color:T.green,
            generate: () => {
              const today = new Date();
              // Stage counts
              const stageList = ["flagged","gathering","complete","ready","submitted","rfi","recertified"];
              const stageCounts = {};
              stageList.forEach(s => stageCounts[s] = recerts?.filter(r=>r.stage===s).length||0);
              // Cycle time estimates from season data
              const closed   = recerts?.filter(r=>r.stage==="recertified")||[];
              const attempts2plus = recerts?.filter(r=>(r.attempts||1)>1).length||0;
              const rfiOpen  = recerts?.filter(r=>r.stage==="rfi"&&r.cureDeadline)||[];
              // At-risk: renewal ≤14d still in early stages
              const atRisk = panel.filter(p => p.renewalDays<=14);
              const lines = [
                `COVERAGUARD AI — PIPELINE VELOCITY & CYCLE TIME REPORT`,
                `${CFG.brand} · ${CFG.state} · Generated ${todayStr}`,
                `Season: ${season}`,
                ``,
                `── CURRENT PIPELINE SNAPSHOT ────────────────────`,
                `Flagged (not yet started):    ${stageCounts.flagged}`,
                `Gathering documents:          ${stageCounts.gathering}`,
                `Documents complete:           ${stageCounts.complete}`,
                `Ready to submit:              ${stageCounts.ready}`,
                `Submitted to State:           ${stageCounts.submitted}`,
                `RFI — cure pending:           ${stageCounts.rfi}`,
                `Recertified / closed:         ${stageCounts.recertified}`,
                `Total active:                 ${(recerts?.length||0) - stageCounts.recertified}`,
                ``,
                `── ESTIMATED STAGE CYCLE TIMES ─────────────────`,
                `Outreach sent → patient responds:   1–3 days (SMS/Mia), 3–7 days (phone)`,
                `Patient responds → intake complete: Same day – 2 days`,
                `Intake complete → docs received:    3–10 days (varies by doc type)`,
                `Docs received → submitted to State: 1–2 days (auth rep filing)`,
                `Submitted → State determination:    15–45 days (SoonerCare)`,
                `RFI issued → cure resolved:         1–10 days (statutory deadline)`,
                ``,
                `── END-TO-END CYCLE TIME (season to date) ──────`,
                `Cases recertified this season:      ${closed.length}`,
                `Resubmission cases (2+ attempts):   ${attempts2plus}`,
                `Est. avg end-to-end (no rework):    18–25 days`,
                `Est. avg end-to-end (with rework):  45–60 days`,
                ``,
                `── OPEN RFI CURE DEADLINES ─────────────────────`,
                ...(rfiOpen.length ? rfiOpen.map(r=>{
                  const d = Math.ceil((new Date(r.cureDeadline)-today)/86400000);
                  return `${r.patient.padEnd(28)} Cure by ${r.cureDeadline} · ${d<=0?"PASSED":d+"d left"} · ${r.pendingItem||"doc requested"}`;
                }) : ["No open RFIs"]),
                ``,
                `── AT-RISK RENEWALS (≤14 days, not yet closed) ─`,
                `Patients renewing in ≤14 days: ${atRisk.length}`,
                ...(atRisk.length ? atRisk.slice(0,10).map(p=>{
                  const c = recerts?.find(r=>r.mrn===p.mrn);
                  const stage = c?.stage||"not started";
                  return `${(p.first+" "+p.last).padEnd(24)} ${p.mrn.padEnd(14)} Renews ${p.renewalDays}d · ${stage}`;
                }) : []),
                atRisk.length>10?`... and ${atRisk.length-10} more`:"",
                ``,
                `── BOTTLENECK INDICATORS ───────────────────────`,
                `Cases stalled in Gathering >7d:  (tracked in production via sentAt timestamps)`,
                `Docs pending >48h:               (tracked via pendingByMrn clock in live system)`,
                `Submitted >30d no determination: ${recerts?.filter(r=>r.stage==="submitted").length||0} cases — follow up with State`,
                ``,
                `Confidential · Patent Pending · CoverageGuard IQ`,
              ].filter(l=>l!==undefined);
              return lines.join("\n");
            }
          },
        ];

        const [activeReport, setActiveReport] = React.useState(null);
        const [reportText, setReportText] = React.useState("");

        const runReport = (r) => {
          setActiveReport(r.id);
          setReportText(r.generate());
        };

        return (
          <div style={{border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
            {/* Header */}
            <div style={{background:T.ink,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>KPI Reports</div>
                <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>CoverageGuard IQ · On-demand reporting</div>
              </div>
              <div style={{fontSize:11.5,color:T.textInvLo}}>5 report types · more added per client need</div>
            </div>

            {/* Report cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:0}}>
              {REPORTS.map((r,i)=>(
                <div key={r.id} style={{padding:"14px 16px",borderBottom:i<2?`1px solid ${T.border}`:"",borderRight:i%2===0?`1px solid ${T.border}`:"",cursor:"pointer",background:activeReport===r.id?r.color+"08":T.surface}}
                  onClick={()=>runReport(r)}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:22}}>{r.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{r.label}</div>
                      <div style={{fontSize:11,color:T.textLo}}>{r.audience}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();runReport(r);}} style={{fontSize:11,fontWeight:700,color:r.color,background:r.color+"10",border:`1px solid ${r.color}44`,borderRadius:999,padding:"3px 12px",cursor:"pointer",flexShrink:0}}>Generate</button>
                  </div>
                  <div style={{fontSize:11.5,color:T.textMid}}>{r.desc}</div>
                </div>
              ))}
            </div>

            {/* Report output */}
            {reportText&&(
              <div style={{borderTop:`1px solid ${T.border}`}}>
                <div style={{padding:"10px 16px",background:T.surface2,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{REPORTS.find(r=>r.id===activeReport)?.label} · {todayStr}</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{
                      const blob = new Blob([reportText],{type:"text/plain"});
                      const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
                      a.download=`CoverageGuard_${activeReport}_${todayStr}.txt`; a.click();
                    }} style={{fontSize:11,fontWeight:700,color:T.teal,background:T.teal+"10",border:`1px solid ${T.teal}44`,borderRadius:999,padding:"3px 12px",cursor:"pointer"}}>
                      ↓ Download .txt
                    </button>
                    <button onClick={()=>navigator.clipboard?.writeText(reportText)} style={{fontSize:11,fontWeight:700,color:T.textMid,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"3px 12px",cursor:"pointer"}}>
                      Copy
                    </button>
                    <button onClick={()=>setReportText("")} style={{fontSize:11,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"3px 12px",cursor:"pointer"}}>✕</button>
                  </div>
                </div>
                <pre style={{margin:0,padding:"14px 16px",fontSize:11.5,fontFamily:T.mono,color:T.text,background:T.surface,overflowX:"auto",whiteSpace:"pre",maxHeight:400,overflowY:"auto",lineHeight:1.6}}>{reportText}</pre>
              </div>
            )}
          </div>
        );
      })()}


    </div>
  );
}

function ExecIntelMVP({ panel, recerts }) {
  const n      = panel.length || 1;
  const today  = new Date("2026-08-22");
  const deadline = new Date("2026-12-31");
  const daysLeft = Math.round((deadline - today) / (1000*60*60*24));

  // ── H.R.1 population ─────────────────────────────────────
  const subjects    = panel.filter(p => p.wrSubject);
  const subN        = subjects.length;
  const compliant   = subjects.filter(p => p.wrStatus === "compliant").length;
  const unverified  = subjects.filter(p => p.wrStatus === "unverified").length;
  const atRiskWR    = subjects.filter(p => p.wrStatus === "at_risk").length;
  const exempt      = n - subN;
  const probExempt  = panel.filter(p => p.probableExemption &&
    p.probableExemption.clinician_confirmation_status === "candidate_detected").length;
  const confirmedEx = panel.filter(p => p.probableExemption &&
    p.probableExemption.clinician_confirmation_status === "clinician_confirmed").length;

  // Procedural loss exposure — unverified + at-risk subjects
  const exposed     = unverified + atRiskWR;
  const exposedPct  = Math.round((exposed / n) * 100);

  // ── Renewal velocity ──────────────────────────────────────
  // Need to clear the urgent + due-soon cohort before deadline
  const urgent      = panel.filter(p => p.renewalDays <= 14).length;
  const dueSoon     = panel.filter(p => p.renewalDays > 14 && p.renewalDays <= 30).length;
  const needsAction = panel.filter(p => p.renewalDays <= 90).length;
  // Required pace: all patients / days left
  const requiredPace = (n / daysLeft).toFixed(2);
  // Synthetic current pace based on recerts completed
  const completed   = recerts ? recerts.filter(r => r.stage === "closed" || r.outcome === "approved").length : Math.round(n * 0.18);
  const daysSinceStart = 53; // days since June 30 filing
  const currentPace = (completed / daysSinceStart).toFixed(2);
  const paceStatus  = currentPace >= requiredPace ? "on_track" : currentPace >= requiredPace * 0.7 ? "warning" : "behind";
  const paceColor   = {on_track: T.green, warning: T.amber, behind: T.red}[paceStatus];
  const paceLabel   = {on_track: "On track", warning: "Falling behind", behind: "Behind — action needed"}[paceStatus];

  // ── Consent coverage ─────────────────────────────────────
  const consentOn   = recerts ? recerts.filter(r => r.authRep === "granted").length : Math.round(n * 0.62);
  const consentPct  = Math.round((consentOn / n) * 100);
  const consentColor = consentPct >= 80 ? T.green : consentPct >= 60 ? T.amber : T.red;

  // ── Projection: unresolved by Dec 31 ─────────────────────
  const projectedUnresolved = Math.max(0, exposed - Math.round(parseFloat(currentPace) * daysLeft));
  const projColor = projectedUnresolved === 0 ? T.green : projectedUnresolved <= 5 ? T.amber : T.red;

  // ── Helpers ───────────────────────────────────────────────
  const Tile = ({label, value, sub, tone, size=36, border}) => (
    <div style={{background:T.surface, border:`1px solid ${border||tone+"33"||T.border}`, borderRadius:13, padding:"16px 18px"}}>
      <div style={{fontSize:11, fontWeight:800, color:T.textLo, textTransform:"uppercase", letterSpacing:.4, marginBottom:6}}>{label}</div>
      <div style={{fontSize:size, fontWeight:800, color:tone||T.text, lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:12, color:T.textMid, marginTop:6, lineHeight:1.4}}>{sub}</div>}
    </div>
  );

  const Row = ({label, value, total, color, sub}) => {
    const pct = total ? Math.round(value/total*100) : 0;
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12.5, fontWeight:700, color:T.text, marginBottom:4}}>
          <span>{label}</span>
          <span style={{color}}>{value}<span style={{color:T.textLo, fontWeight:500}}> / {total} &nbsp;{pct}%</span></span>
        </div>
        <div style={{height:7, background:T.border, borderRadius:999, overflow:"hidden"}}>
          <div style={{height:"100%", width:`${pct}%`, background:color, borderRadius:999}}/>
        </div>
        {sub && <div style={{fontSize:11, color:T.textLo, marginTop:2}}>{sub}</div>}
      </div>
    );
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>

      {/* ── Header ── */}
      <div style={{background:T.ink, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
        <div>
          <div style={{fontSize:11, fontWeight:800, color:T.teal, textTransform:"uppercase", letterSpacing:.5, marginBottom:4}}>Executive Intelligence · MVP</div>
          <div style={{fontSize:15, fontWeight:800, color:"#fff"}}>Organizational H.R.1 exposure — {CFG.brand}</div>
          <div style={{fontSize:12.5, color:T.textInvLo, marginTop:3}}>As of August 22, 2026 · <span style={{color:"#F5C842", fontWeight:700}}>{daysLeft} days to December 31 deadline</span></div>
        </div>
        <div style={{background:"rgba(255,255,255,.07)", borderRadius:12, padding:"10px 18px", textAlign:"center"}}>
          <div style={{fontSize:44, fontWeight:800, color:"#F5C842", lineHeight:1}}>{daysLeft}</div>
          <div style={{fontSize:11, color:T.textInvLo, fontWeight:700, marginTop:2}}>days remaining</div>
        </div>
      </div>

      {/* ── Row 1: The four numbers that matter ── */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12}}>
        <Tile
          label="Procedural loss exposure"
          value={`${exposed}`}
          sub={`${exposedPct}% of panel — unverified or at-risk subjects`}
          tone={exposed > 0 ? T.red : T.green}
        />
        <Tile
          label="Consent to represent"
          value={`${consentPct}%`}
          sub={`${consentOn} of ${n} patients — health center can submit`}
          tone={consentColor}
        />
        <Tile
          label="Renewal velocity"
          value={paceLabel}
          sub={`${currentPace} completions/day · need ${requiredPace}/day`}
          tone={paceColor}
          size={18}
          border={paceColor+"44"}
        />
        <Tile
          label="Projected unresolved at Dec 31"
          value={projectedUnresolved === 0 ? "0 🟢" : `${projectedUnresolved}`}
          sub={projectedUnresolved === 0 ? "On track to clear panel by deadline" : `${projectedUnresolved} patients at risk if pace holds`}
          tone={projColor}
        />
      </div>

      {/* ── Row 2: H.R.1 breakdown + Exemption pipeline ── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>

        <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>H.R.1 subject population</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>{subN} of {n} patients subject to work requirement · {exempt} exempt</div>
          <Row label="Compliant — documented"     value={compliant}  total={subN} color={T.green}  sub="Hours or qualifying activity on file"   onClick={()=>setView("patientqueue")}/>
          <Row label="Unverified — no docs yet"   value={unverified} total={subN} color={T.amber}  sub="Navigator outreach needed before deadline" onClick={()=>setView("patientqueue")}/>
          <Row label="At risk — below 80 hrs/mo"  value={atRiskWR}   total={subN} color={T.red}    sub="Procedural loss if unresolved by Dec 31"   onClick={()=>setView("patientqueue")}/>
        </div>

        <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>Exemption pipeline</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>Confirmed exemptions remove the 80-hr burden — pending ones are coverage at risk</div>
          {[
            {label:"Auto-exempt",             value:exempt-probExempt-confirmedEx, color:T.green,  sub:"Age · pregnancy · caregiver · SSI/SSDI · auto-screened", dest:"patientqueue"},
            {label:"Clinician confirmed",      value:confirmedEx,                   color:confirmedEx===0?T.amber:T.teal, sub:confirmedEx===0?"No confirmations yet — check queue":"CG-FA-01 signed · two elements documented", dest:"clinexempt"},
            {label:"Probable — pending review",value:probExempt,                    color:probExempt>0?T.red:T.indigo, sub:probExempt>0?"Route to clinician today":"None pending", dest:"clinexempt"},
          ].map(row => {
            const blockers = row.label.includes("Probable") && probExempt > 0 ? (() => {
              const items = [
                {label:"Appt not booked",         n:0, color:T.red},
                {label:"No-show · reschedule",     n:0, color:T.orange},
                {label:"Clinician not documented", n:0, color:T.amber},
              ];
              for(let i=0;i<probExempt;i++) items[i%3].n++;
              return items.filter(b=>b.n>0);
            })() : [];
            return (
              <div key={row.label} onClick={()=>setView&&setView(row.dest)}
                onMouseEnter={e=>e.currentTarget.querySelector(".dot-inner").style.background=T.surface}
                onMouseLeave={e=>e.currentTarget.querySelector(".dot-inner").style.background=T.surface2}
                style={{cursor:"pointer",borderRadius:9,marginBottom:7,border:`1px solid ${row.color}33`,overflow:"hidden"}}>
                <div className="dot-inner" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.surface2}}>
                  <div style={{width:10,height:10,borderRadius:999,background:row.color,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{row.label}</div>
                    <div style={{fontSize:11,color:T.textLo}}>{row.sub}</div>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:row.color,minWidth:28,textAlign:"right"}}>{row.value}</div>
                  <span style={{fontSize:14,color:T.textLo}}>›</span>
                </div>
                {blockers.length>0&&(
                  <div style={{borderTop:`1px solid ${T.border}`,padding:"6px 11px 8px 31px",display:"flex",flexDirection:"column",gap:4,background:T.surface}}>
                    {blockers.map(b=>(
                      <div key={b.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}>
                        <span style={{width:6,height:6,borderRadius:999,background:b.color,flexShrink:0}}/>
                        <span style={{color:T.textMid,flex:1}}>{b.label}</span>
                        <span style={{fontWeight:700,color:b.color}}>{b.n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Row 3: Renewal deadlines + Consent breakdown ── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>

        <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>Renewal deadlines</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>Patients approaching their Medicaid renewal date</div>
          {[
            {label:"Due in ≤ 14 days",   value:urgent,                  color:T.red,    sub:"Act today"},
            {label:"Due in 15–30 days",  value:dueSoon,                 color:T.orange, sub:"Outreach this week"},
            {label:"Due in 31–60 days",  value:panel.filter(p=>p.renewalDays>30&&p.renewalDays<=60).length, color:T.amber, sub:"Schedule now"},
            {label:"Due in 61–120 days", value:panel.filter(p=>p.renewalDays>60&&p.renewalDays<=120).length,color:T.teal,  sub:"Collect opportunistically"},
          ].map(row => (
            <div key={row.label} onClick={()=>setView("patientqueue")}
              style={{display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", borderRadius:6}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:8, height:8, borderRadius:999, background:row.color, flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5, fontWeight:700, color:T.text}}>{row.label}</div>
                <div style={{fontSize:11, color:T.textLo}}>{row.sub}</div>
              </div>
              <div style={{fontSize:20, fontWeight:800, color:row.color}}>{row.value}</div>
              <span style={{fontSize:12,color:T.teal}}>›</span>
            </div>
          ))}
        </div>

        <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:13, padding:"16px 18px"}}>
          <div style={{fontSize:13, fontWeight:800, color:T.text, marginBottom:4}}>Consent to represent · 42 CFR 435.923</div>
          <div style={{fontSize:12, color:T.textMid, marginBottom:14}}>Without consent the health center cannot submit on a patient's behalf</div>
          <Row label="On file — can submit"      value={consentOn}       total={n} color={T.green} sub="Signed or e-consent captured"/>
          <Row label="Signature pending"         value={Math.round(n*.14)} total={n} color={T.amber} sub="Verbal captured · form not yet returned"/>
          <Row label="Not yet captured"          value={n - consentOn}   total={n} color={T.red}   sub="Must capture before submission deadline"/>
          <div style={{marginTop:12, padding:"9px 11px", background:consentColor+"10", border:`1px solid ${consentColor}33`, borderRadius:9, fontSize:12, color:consentColor, fontWeight:700}}>
            {consentPct}% consent coverage · {consentPct >= 80 ? "on track" : consentPct >= 60 ? "needs attention" : "critical gap — escalate"}
          </div>
        </div>

      </div>

    </div>
  );
}

function PatientQueue({ panel, setSelected, queues = [], consentByMrn = {}, recerts = [], pendingByMrn = {}, clearPending, addPending, onDocReceived, setView, decideExemption }) {
  const [search, setSearch]   = React.useState("");
  const [filt, setFilt]       = React.useState("action");
  const [pendingAge, setPendingAge]       = React.useState("all");
  // Per-queue secondary filters
  const [outreachChFilt, setOutreachChFilt] = React.useState("all"); // all | sms_only | sms_mia | all_tried
  const [intakeFilt,     setIntakeFilt]     = React.useState("all"); // all | sms | mia | phone
  const [docsFilt,       setDocsFilt]       = React.useState("all"); // all | consent | work | income | residency | household
  const [renewalFilt,    setRenewalFilt]    = React.useState("all"); // all | le7 | le14 | le30
  const [tierFilt,       setTierFilt]       = React.useState("all"); // all | high | moderate | low
  const [resolveModal, setResolveModal]   = React.useState(null);
  const [resolveChoice, setResolveChoice] = React.useState(null);
  const [inboundToast, setInboundToast]   = React.useState(null); // { mrn, name, channel, msg }
  const [respondedMrns, setRespondedMrns] = React.useState({}); // { mrn: true } — responded this session
  // Navigator scheduling form state (assessment_needed)
  const [schedDate, setSchedDate]           = React.useState("");
  const [schedClinician, setSchedClinician] = React.useState("Dr. A. Mensah");
  const [schedVisitType, setSchedVisitType] = React.useState("In-person");
  const [schedExpandedMrn, setSchedExpandedMrn] = React.useState(null);
  const [caregiverModal, setCaregiverModal] = React.useState(null);
  const simulateInbound = (patient, channel) => {
    const msgs = {
      sms: `Patient replied "1" to SMS — ready for intake`,
      mia: `Patient tapped Mia notification — ready for intake`,
      phone: `Navigator logged: patient answered — ready for intake`,
    };
    setInboundToast({ mrn: patient.mrn, name:`${patient.first} ${patient.last}`, channel, msg: msgs[channel]||"Patient responded" });
    setRespondedMrns(r => ({...r, [patient.mrn]: true}));
    // Clear the outreach pending entry, add responded entry → moves to Ready for intake queue
    if(clearPending) clearPending(patient.mrn); // clear all pending for this mrn first
    if(addPending) addPending(patient.mrn, { type:"responded", label:`Patient responded via ${channel} — intake ready`, channel, followUpHrs:0 });
    setTimeout(() => setInboundToast(t => t?.mrn===patient.mrn ? null : t), 5000);
  };

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
    // Exclude patients already in a pending queue (outreach / intake / docs)
    const inPendingQueue = new Set(
      Object.entries(pendingByMrn)
        .filter(([, entries]) => entries && entries.length > 0)
        .map(([mrn]) => mrn)
    );
    let list = panel.filter(p => (p.medicaidId || p.recon) && !inPendingQueue.has(p.mrn));
    if (search.trim()) {
      // Search overrides filter — searches full panel by name, MRN, plan, COV code
      const q = search.toLowerCase();
      list = list.filter(p => {
        const cov = p.recon && p.recon.code ? p.recon.code.toLowerCase() : "";
        const mco = (p.mco || "").toLowerCase();
        return `${p.first} ${p.last} ${p.mrn} ${cov} ${mco}`.toLowerCase().includes(q);
      });
    } else {
      if (filt === "high")     list = list.filter(p => p.tier === "high" || p.tier === "critical");
      if (filt === "renewal")  list = list.filter(p => p.renewalDays <= 90);
      // PART2: conflict filter removed
      if (filt === "action")   list = list.filter(p => p.tier === "high" || p.tier === "critical" || p.renewalDays <= 45 || (p.recon && p.recon.humanReview));
      if (filt === "blocked")  list = list.filter(p => p.probableExemption && ["candidate_detected","clinician_review_pending","documentation_needed"].includes(p.probableExemption.clinician_confirmation_status) && (p.probableExemption.impairment_status === "needs_visit" || p.probableExemption.clinician_confirmation_status === "documentation_needed"));
    }
    return list.sort((a,b) => {
      const urgA = a.tier==="critical"?0:a.tier==="high"?1:a.tier==="moderate"?2:3;
      const urgB = b.tier==="critical"?0:b.tier==="high"?1:b.tier==="moderate"?2:3;
      return urgA - urgB || (a.renewalDays||999) - (b.renewalDays||999);
    });
  }, [panel, search, filt, pendingByMrn]);

  // Pending list — patients with at least one pending action
  const applyCommonFilters = (list) => list
    .filter(p => renewalFilt==="all" || (renewalFilt==="le7"&&p.renewalDays<=7) || (renewalFilt==="le14"&&p.renewalDays<=14) || (renewalFilt==="le30"&&p.renewalDays<=30))
    .filter(p => tierFilt==="all" || p.tier===tierFilt);

  const mkPendingList = (typeFilter, extraFilter) => {
    const now = Date.now();
    let list = panel
      .filter(p => {
        const entries = (pendingByMrn[p.mrn]||[]).filter(e => typeFilter(e.type));
        return entries.length > 0;
      })
      .map(p => {
        const entries = (pendingByMrn[p.mrn]||[]).filter(e => typeFilter(e.type));
        const oldest = entries.reduce((a,b)=>a.sentAt<b.sentAt?a:b);
        const ageHrs = (now - new Date(oldest.sentAt).getTime()) / 3600000;
        return { ...p, pendingEntries: entries, ageHrs };
      })
      .filter(p => {
        if (pendingAge==="lt24") return p.ageHrs < 24;
        if (pendingAge==="gt24") return p.ageHrs >= 24;
        if (pendingAge==="gt48") return p.ageHrs >= 48;
        if (pendingAge==="gt72") return p.ageHrs >= 72;
        return true;
      });
    if (extraFilter) list = list.filter(extraFilter);
    return applyCommonFilters(list).sort((a,b) => a.renewalDays - b.renewalDays);
  };
  // Outreach queue — patients waiting to respond to text/Mia/phone
  const outreachPending = React.useMemo(() =>
    mkPendingList(t => t==="outreach", p => {
      const tried = p.pendingEntries.map(e=>e.channel||"");
      if (outreachChFilt==="sms_only") return tried.some(c=>c==="sms") && !tried.some(c=>c==="mia") && !tried.some(c=>c==="phone");
      if (outreachChFilt==="sms_mia")  return tried.some(c=>c==="sms") && tried.some(c=>c==="mia");
      if (outreachChFilt==="all_tried") return tried.some(c=>c==="phone");
      return true;
    }),
  [panel, pendingByMrn, pendingAge, outreachChFilt, renewalFilt, tierFilt]);
  // Ready for intake — patient responded, intake not yet started
  const intakeReadyPending = React.useMemo(() =>
    mkPendingList(t => t==="responded", p => {
      if (intakeFilt==="all") return true;
      return p.pendingEntries.some(e=>e.channel===intakeFilt);
    }),
  [panel, pendingByMrn, pendingAge, intakeFilt, renewalFilt, tierFilt]);
  // Documents queue — intake done, waiting for docs
  const docsPending = React.useMemo(() =>
    mkPendingList(t => t==="pending_docs" || t?.startsWith("doc_"), p => {
      if (docsFilt==="all") return true;
      return p.pendingEntries.some(e=>e.type==="doc_"+docsFilt||e.type==="pending_docs");
    }),
  [panel, pendingByMrn, pendingAge, docsFilt, renewalFilt, tierFilt]);
  // Navigator queue — assessment_needed + exemption_rejected items routed from clinician
  const navigatorPending = React.useMemo(() =>
    mkPendingList(t => t==="assessment_needed" || t==="exemption_rejected"),
  [panel, pendingByMrn, pendingAge, renewalFilt, tierFilt]);
  const pendingList = filt==="pending_outreach" ? outreachPending
    : filt==="ready_intake" ? intakeReadyPending
    : filt==="navigator_queue" ? navigatorPending
    : docsPending;
  const pendingFilt = filt==="pending_outreach"||filt==="ready_intake"||filt==="pending_docs"||filt==="navigator_queue";

  const FILTERS = [
    ["action","Needs action"],["high","High risk"],["renewal","Renewal ≤90d"],["blocked","Exemption blocked"],
    ["pending_outreach","Outreach response pending"],["ready_intake","Ready for intake"],["pending_docs","Docs pending"],["navigator_queue","Navigator queue"],["all","All patients"]
    // PART2: ["conflict","Has conflict"] removed
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
    // PART1: conflict codes (COV-XXX), pharmacy, RCM, care pills suppressed → Coverage Intelligence
    const pills = [];
    if (p.dualEligible) pills.push(<Badge key="de" c={T.teal} bg={T.teal+"15"}>Medicare primary</Badge>);
    const qs = queueMap[p.mrn] || [];
    if (qs.includes("exemption")) pills.push(<Badge key="ex" c={T.indigo} bg={T.indigo+"18"}>Exemption pending</Badge>);
    const consent = consentByMrn[p.mrn];
    if (!consent || !consent.authRep || consent.authRep === "none")
      pills.push(<Badge key="cons" c={T.textLo}>Consent needed</Badge>);
    return pills;
  };

  return (
    <div>
      {/* Search + filters */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <div style={{position:"relative",flex:"0 0 auto"}}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or MRN..."
            style={{fontSize:13,border:`1px solid ${search?T.teal:T.border}`,borderRadius:9,padding:"7px 32px 7px 11px",background:T.surface,color:T.text,outline:"none",minWidth:220}}
          />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textLo,fontSize:14,lineHeight:1,padding:2}}>✕</button>}
        </div>
        {FILTERS.map(([k,l])=>{
          const isBlocked = k === "blocked";
          const blockedCount = panel.filter(p => p.probableExemption && ["candidate_detected","clinician_review_pending","documentation_needed"].includes(p.probableExemption.clinician_confirmation_status) && (p.probableExemption.impairment_status === "needs_visit" || p.probableExemption.clinician_confirmation_status === "documentation_needed")).length;
          const active = filt === k;
          return (
            <button key={k} onClick={()=>setFilt(k)} style={{fontSize:12,fontWeight:800,border:`${isBlocked?"2px":"1px"} solid ${active?(isBlocked?T.red:T.teal):isBlocked&&blockedCount>0?T.red+"88":T.border}`,background:active?(isBlocked?T.red:T.teal):isBlocked&&blockedCount>0?T.red+"0A":T.surface,color:active?"#fff":isBlocked&&blockedCount>0?T.red:T.textMid,borderRadius:999,padding:"5px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              {isBlocked && blockedCount > 0 && <AlertTriangle size={12}/>}
              {l}{(()=>{
                if(active) {
                  const cnt = k==="pending_outreach"?outreachPending.length:k==="ready_intake"?intakeReadyPending.length:k==="pending_docs"?docsPending.length:filtered.length;
                  return cnt>0?` ${cnt}`:"";
                }
                if(isBlocked&&blockedCount>0) return ` ${blockedCount}`;
                if(k==="pending_outreach"&&outreachPending.length>0) return ` ${outreachPending.length}`;
                if(k==="ready_intake"&&intakeReadyPending.length>0) return ` ${intakeReadyPending.length}`;
                if(k==="pending_docs"&&docsPending.length>0) return ` ${docsPending.length}`;
                return "";
              })()}
            </button>
          );
        })}
      </div>

      {/* Exemption blocked banner */}
      {filt === "blocked" && filtered.length > 0 && (
        <div style={{padding:"8px 12px",background:T.red+"10",border:`1px solid ${T.red}33`,borderRadius:8,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
          <AlertTriangle size={14} color={T.red}/>
          <span style={{fontSize:12.5,color:T.red,fontWeight:700}}>{filtered.length} patient{filtered.length!==1?"s":""} with blocked exemption assessments — navigator action needed</span>
          <span style={{fontSize:11.5,color:T.red,marginLeft:"auto"}}>Escalates to supervisor at day 7</span>
        </div>
      )}

      {/* ── PENDING QUEUE VIEW ── */}
      {(pendingFilt) && (
        <div>
          {/* Stage pipeline header */}
          <div style={{display:"flex",alignItems:"stretch",gap:0,marginBottom:12,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
            {[
              {key:"pending_outreach",label:"Outreach response",      n:outreachPending.length,   color:T.amber,  icon:"📱"},
              {key:"ready_intake",    label:"Start intake",  n:intakeReadyPending.length, color:T.teal,   icon:"✅"},
              {key:"pending_docs",    label:"Docs pending",  n:docsPending.length,        color:T.indigo, icon:"📄"},
              {key:"navigator_queue", label:"Navigator queue", n:navigatorPending.length,  color:T.orange, icon:"🗓️"},
              {key:"recert",          label:"Recert tab",    n:null,                      color:T.green,  icon:"🗂️", action:true},
            ].map((s,i)=>(
              <React.Fragment key={s.key}>
                {i>0&&<div style={{width:1,background:T.border,flexShrink:0,alignSelf:"stretch"}}/>}
                <button onClick={()=>s.action?setView("recert"):setFilt(s.key)}
                  style={{flex:1,padding:"8px 4px",background:filt===s.key?s.color+"18":T.surface,border:"none",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:13,marginBottom:1}}>{s.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:filt===s.key?s.color:T.textMid,lineHeight:1.2}}>{s.label}</div>
                  {s.n!==null?<div style={{fontSize:13,fontWeight:800,color:filt===s.key?s.color:T.text,marginTop:1}}>{s.n}</div>:<div style={{fontSize:10,color:T.textLo,marginTop:1}}>→</div>}
                </button>
              </React.Fragment>
            ))}
          </div>
          {/* ── Queue filters ── */}
          {(()=>{
            const Chip = ({active, onClick, children, color}) => (
              <button onClick={onClick} style={{fontSize:11,fontWeight:700,border:`1px solid ${active?(color||T.indigo):T.border}`,background:active?(color||T.indigo)+"14":T.surface,color:active?(color||T.indigo):T.textMid,borderRadius:999,padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>
            );
            const Sep = () => <span style={{color:T.border,fontSize:12}}>|</span>;
            return (
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10,padding:"9px 11px",background:T.surface2,borderRadius:10}}>
                {/* Row 1: Waiting time — all queues */}
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,minWidth:60}}>Waiting</span>
                  {[["all","Any"],["lt24","< 24h"],["gt24","24h+"],["gt48","48h+"],["gt72","72h+ ⚠️"]].map(([k,l])=>(
                    <Chip key={k} active={pendingAge===k} onClick={()=>setPendingAge(k)}>{l}</Chip>
                  ))}
                  <span style={{marginLeft:"auto",fontSize:11,color:T.textLo}}>{pendingList.length} patient{pendingList.length!==1?"s":""}</span>
                </div>
                {/* Row 2: Renewal urgency + Tier — all queues */}
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,minWidth:60}}>Renewal</span>
                  {[["all","Any"],["le7","≤ 7d",T.red],["le14","≤ 14d",T.orange],["le30","≤ 30d",T.amber]].map(([k,l,c])=>(
                    <Chip key={k} active={renewalFilt===k} onClick={()=>setRenewalFilt(k)} color={c}>{l}</Chip>
                  ))}
                  <Sep/>
                  <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Tier</span>
                  {[["all","Any"],["high","High",T.red],["moderate","Mod",T.amber],["low","Low",T.teal]].map(([k,l,c])=>(
                    <Chip key={k} active={tierFilt===k} onClick={()=>setTierFilt(k)} color={c}>{l}</Chip>
                  ))}
                </div>
                {/* Row 3: Queue-specific filters */}
                {filt==="pending_outreach"&&(
                  <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,minWidth:60}}>Channel</span>
                    {[["all","All tried"],["sms_only","SMS only"],["sms_mia","SMS + Mia"],["all_tried","All 3 tried"]].map(([k,l])=>(
                      <Chip key={k} active={outreachChFilt===k} onClick={()=>setOutreachChFilt(k)} color={T.amber}>{l}</Chip>
                    ))}
                  </div>
                )}
                {filt==="ready_intake"&&(
                  <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,minWidth:60}}>Responded</span>
                    {[["all","Any channel"],["sms","📱 SMS"],["mia","🟣 Mia"],["phone","📞 Phone"]].map(([k,l])=>(
                      <Chip key={k} active={intakeFilt===k} onClick={()=>setIntakeFilt(k)} color={T.teal}>{l}</Chip>
                    ))}
                  </div>
                )}
                {filt==="pending_docs"&&(
                  <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,minWidth:60}}>Doc type</span>
                    {[["all","All docs"],["consent","Consent"],["work","Work hrs"],["income","Income"],["residency","Residency"],["household","Household"]].map(([k,l])=>(
                      <Chip key={k} active={docsFilt===k} onClick={()=>setDocsFilt(k)} color={T.indigo}>{l}</Chip>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {/* Outreach escalation legend */}
          {filt==="pending_outreach"&&(
            <div style={{display:"flex",gap:12,padding:"7px 11px",background:T.surface2,borderRadius:9,marginBottom:10,fontSize:11.5,color:T.textMid,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,color:T.text}}>Sequence:</span>
              <span>📱 Text first</span><span style={{color:T.border}}>→</span>
              <span>🟣 Mia (if installed)</span><span style={{color:T.border}}>→</span>
              <span style={{color:T.amber}}>📞 Phone if no response in 24 hrs</span>
            </div>
          )}
          {filt==="ready_intake"&&(
            <div style={{padding:"9px 12px",background:T.teal+"0C",border:`1px solid ${T.teal}33`,borderRadius:9,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>✅</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:800,color:T.tealD}}>Patient responded — ready for intake</div>
                <div style={{fontSize:11.5,color:T.textMid}}>Click the row or "Open → intake" to open their drawer and start intake</div>
              </div>
            </div>
          )}
          {filt==="navigator_queue"&&(
            <div style={{padding:"9px 12px",background:T.orange+"0C",border:`1px solid ${T.orange}33`,borderRadius:9,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>🗓️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:800,color:T.orange}}>Navigator action required — exemption routing</div>
                <div style={{fontSize:11.5,color:T.textMid}}>Schedule assessment visits for "assessment needed" items · route rejected cases back to standard recert path</div>
              </div>
            </div>
          )}

          {pendingList.length === 0 ? (
            <div style={{textAlign:"center",padding:40,color:T.textLo,fontSize:13}}>
              No patients {filt==="pending_outreach"?"awaiting outreach response":"awaiting documents"}{pendingAge!=="all"?" in this time window":""}.
            </div>
          ) : pendingList.map(p => {
            const ageHrs  = p.ageHrs;
            const ageColor = ageHrs>=72?T.red:ageHrs>=48?T.orange:ageHrs>=24?T.amber:T.teal;
            const ageLabel = ageHrs<1?"< 1 hr ago":ageHrs<24?`${Math.floor(ageHrs)}h ago`:`${Math.floor(ageHrs/24)}d ${Math.floor(ageHrs%24)}h ago`;
            const channelsTried  = p.pendingEntries.map(e=>e.channel||"");
            const triedSms   = channelsTried.some(c=>c==="sms");
            const triedMia   = channelsTried.some(c=>c==="mia");
            const triedPhone = channelsTried.some(c=>c==="phone");
            const miaInstalled = (p.idx||0)%3===0;
            const nextChannel = !triedSms?"📱 Text now":!triedMia&&miaInstalled?"🟣 Send Mia request":!triedPhone?"📞 Call now":"⚠️ Escalate — all channels tried";
            const nextColor   = !triedSms?T.teal:!triedMia&&miaInstalled?T.indigo:!triedPhone?T.orange:T.red;
            const docLabels   = p.pendingEntries.map(e=>e.label).join(" · ");
            const followUpDue   = p.renewalDays<=3?"Follow up NOW":p.renewalDays<=7?"Follow up today":"Follow up in 24 hrs";
            const followUpColor = p.renewalDays<=3?T.red:p.renewalDays<=7?T.orange:T.amber;
            return (
              <div key={p.mrn} style={{borderBottom:`1px solid ${T.surface2}`,background:T.surface}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}
                  onClick={()=>setSelected(p)}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
                  <div style={{width:4,height:52,borderRadius:99,background:p.tier==="high"||p.tier==="critical"?T.red:p.tier==="moderate"?T.amber:T.teal,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:800,color:T.text}}>{p.first} {p.last}</span>
                      <span style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{p.mrn}</span>
                      <TierPill tier={p.tier} small/>
                      <span style={{fontSize:11,fontWeight:700,color:p.renewalDays<=14?T.red:T.amber}}>Renewal {p.renewalDays}d</span>
                      {p.caregiver&&<span onClick={e=>{e.stopPropagation();setCaregiverModal(p);}} style={{fontSize:9.5,fontWeight:700,color:T.teal,background:T.teal+"10",border:"1px solid "+T.teal+"33",borderRadius:4,padding:"1px 6px",marginTop:2,display:"inline-block",cursor:"pointer"}}>Probable caregiver exemption</span>}
                    </div>
                    {filt==="pending_outreach"&&(
                      <div style={{marginTop:5}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",fontSize:11.5}}>
                          {[["📱 SMS",triedSms],["🟣 Mia",triedMia],["📞 Phone",triedPhone]].map(([l,done])=>(
                            <span key={l} style={{color:done?T.textLo:T.textMid,textDecoration:done?"line-through":"none",opacity:done?0.5:1}}>{l}</span>
                          ))}
                        </div>
                        <div style={{marginTop:3,fontSize:12,fontWeight:700,color:nextColor}}>Next: {nextChannel}</div>
                      </div>
                    )}
                    {filt==="ready_intake"&&(
                      <div style={{marginTop:5,fontSize:12,color:T.teal,fontWeight:700}}>
                        Responded via {p.pendingEntries[0]?.channel||"inbound"} · tap Open → intake
                      </div>
                    )}
                    {filt==="pending_docs"&&(
                      <div style={{marginTop:5,fontSize:11.5,color:T.textMid,lineHeight:1.4}}>
                        {docLabels||"Awaiting documents from patient"}
                      </div>
                    )}
                    {filt==="navigator_queue"&&(
                      <div style={{marginTop:5,fontSize:11.5,color:T.orange,lineHeight:1.4}}>
                        {p.pendingEntries.map(e=>e.label).join(" · ")||"Navigator action needed"}
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,minWidth:110}}>
                    <div style={{fontSize:13,fontWeight:800,color:ageColor,fontFamily:T.mono}}>{ageLabel}</div>
                    <div style={{fontSize:11,fontWeight:700,color:followUpColor,marginTop:2}}>{followUpDue}</div>
                    {filt==="pending_outreach" ? (
                      respondedMrns[p.mrn] ? (
                        <div style={{marginTop:5,padding:"4px 8px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:6,fontSize:10,fontWeight:700,color:T.green,textAlign:"center"}}>
                          ✓ Responded — intake unlocked
                        </div>
                      ) : (
                        <div style={{marginTop:5,display:"flex",flexDirection:"column",gap:4}}>
                          <div style={{fontSize:9,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:1}}>Simulate inbound</div>
                          {[["sms","📱 SMS reply"],["mia","🟣 Mia tap"],["phone","📞 Phone"]].map(([ch,label])=>(
                            <button key={ch} onClick={e=>{e.stopPropagation();simulateInbound(p,ch);}}
                              style={{fontSize:10,fontWeight:700,color:T.indigo,background:T.indigo+"0C",border:`1px solid ${T.indigo}44`,borderRadius:6,padding:"3px 7px",cursor:"pointer",textAlign:"center",width:"100%"}}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )
                    ) : filt==="ready_intake" ? (
                      <button onClick={e=>{e.stopPropagation();setSelected(p);}}
                        style={{marginTop:5,padding:"6px 8px",background:T.teal,border:"none",borderRadius:8,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",display:"block",width:"100%",textAlign:"center"}}>
                        Open → intake
                      </button>
                    ) : filt==="navigator_queue" ? (
                      <button onClick={e=>{e.stopPropagation();setSchedExpandedMrn(schedExpandedMrn===p.mrn?null:p.mrn);setSchedDate("");setSchedClinician("Dr. A. Mensah");setSchedVisitType("In-person");}}
                        style={{marginTop:5,fontSize:10,fontWeight:700,color:T.orange,background:"none",border:`1px solid ${T.orange}55`,borderRadius:6,padding:"2px 9px",cursor:"pointer",display:"block",width:"100%",textAlign:"center"}}>
                        Take action
                      </button>
                    ) : (
                      <button onClick={e=>{e.stopPropagation();setResolveChoice(null);setResolveModal({patient:p,entry:p.pendingEntries[0]});}}
                        style={{marginTop:5,fontSize:10,fontWeight:700,color:T.teal,background:"none",border:`1px solid ${T.teal}55`,borderRadius:6,padding:"2px 9px",cursor:"pointer",display:"block",width:"100%",textAlign:"center"}}>
                        ✓ Received
                      </button>
                    )}
                  </div>
                  <div style={{color:T.textLo,fontSize:18,marginLeft:4}}>›</div>
                </div>
                {/* Navigator queue inline action panel */}
                {filt==="navigator_queue" && schedExpandedMrn===p.mrn && (
                  <div onClick={e=>e.stopPropagation()} style={{padding:"12px 14px",background:T.surface2,borderTop:`1px dashed ${T.border}`}}>
                    {p.pendingEntries.some(e=>e.type==="assessment_needed") && (
                      <div style={{marginBottom:10,padding:"12px 14px",background:T.amber+"08",border:`1px solid ${T.amber}33`,borderRadius:10}}>
                        <div style={{fontSize:12.5,fontWeight:800,color:T.amber,marginBottom:6}}>Schedule functional assessment visit</div>
                        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10}}>
                          <label style={{fontSize:11,color:T.textMid}}>Visit date (required)<br/>
                            <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{marginTop:3,fontSize:11.5,border:`1px solid ${schedDate?T.amber:T.border}`,borderRadius:6,padding:"5px 8px",background:T.surface,color:T.text}}/>
                          </label>
                          <label style={{fontSize:11,color:T.textMid}}>Assigned clinician<br/>
                            <select value={schedClinician} onChange={e=>setSchedClinician(e.target.value)} style={{marginTop:3,fontSize:11.5,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",background:T.surface,color:T.text}}>
                              {["Dr. A. Mensah","Dr. R. Cole","NP J. Park"].map(x=><option key={x}>{x}</option>)}
                            </select>
                          </label>
                          <label style={{fontSize:11,color:T.textMid}}>Visit type<br/>
                            <div style={{display:"flex",marginTop:3,border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden"}}>
                              {["In-person","Telehealth"].map(t=>(
                                <button key={t} onClick={()=>setSchedVisitType(t)} style={{padding:"5px 10px",fontSize:11.5,background:schedVisitType===t?T.amber:T.surface,color:schedVisitType===t?"#fff":T.text,border:"none",cursor:"pointer",fontWeight:schedVisitType===t?700:400}}>{t}</button>
                              ))}
                            </div>
                          </label>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <button onClick={()=>setSchedExpandedMrn(null)} style={{fontSize:11,color:T.textMid,background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer"}}>Cancel</button>
                          <button
                            disabled={!schedDate}
                            onClick={()=>{
                              decideExemption&&decideExemption(p.mrn,"schedule",{date:schedDate,clinician:schedClinician,visitType:schedVisitType});
                              clearPending&&clearPending(p.mrn,"assessment_needed");
                              setSchedExpandedMrn(null);
                            }}
                            style={{fontSize:11,fontWeight:800,color:"#fff",background:schedDate?T.amber:"#ccc",border:"none",borderRadius:6,padding:"6px 14px",cursor:schedDate?"pointer":"not-allowed",opacity:schedDate?1:0.55}}>
                            Confirm scheduling
                          </button>
                        </div>
                      </div>
                    )}
                    {p.pendingEntries.some(e=>e.type==="exemption_rejected") && (
                      <div style={{padding:"12px 14px",background:T.red+"06",border:`1px solid ${T.red}33`,borderRadius:10}}>
                        <div style={{fontSize:12.5,fontWeight:800,color:T.red,marginBottom:4}}>Exemption rejected — resume standard recert path</div>
                        <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5,marginBottom:8}}>The clinician determined this patient does not qualify for a functional impairment exemption. Resume the normal recertification process: document income, hours, and household per standard workflow. Patient is not terminated.</div>
                        <button onClick={()=>{clearPending&&clearPending(p.mrn,"exemption_rejected");setSchedExpandedMrn(null);}} style={{fontSize:11,fontWeight:800,color:"#fff",background:T.indigo,border:"none",borderRadius:6,padding:"6px 14px",cursor:"pointer"}}>Acknowledged — resume recert path</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {pendingList.length>0&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.textLo}}>
            {pendingList.length} patient{pendingList.length!==1?"s":""} {filt==="pending_outreach"?" · simulate inbound to advance":filt==="ready_intake"?" · open row and start intake":filt==="navigator_queue"?" · schedule visits or acknowledge rejections":" · ✓ Received when doc arrives"}
          </div>}
        </div>
      )}

      {/* ── INBOUND RESPONSE TOAST ── */}
      {inboundToast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:200,background:T.surface,border:`1.5px solid ${T.green}`,borderRadius:14,padding:"14px 18px",boxShadow:"-4px 4px 32px rgba(0,0,0,.22)",minWidth:300,maxWidth:380,display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:36,height:36,borderRadius:999,background:T.green+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <CheckCircle2 size={20} color={T.green}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:800,color:T.green,marginBottom:2,textTransform:"uppercase",letterSpacing:.3}}>
              📥 Inbound response detected
            </div>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{inboundToast.name}</div>
            <div style={{fontSize:12,color:T.textMid,lineHeight:1.5}}>{inboundToast.msg}</div>
            <div style={{fontSize:11.5,color:T.teal,fontWeight:700,marginTop:6}}>→ Start intake is now unlocked</div>
          </div>
          <button onClick={()=>setInboundToast(null)} style={{background:"none",border:"none",cursor:"pointer",color:T.textLo,fontSize:16,padding:0,flexShrink:0}}>✕</button>
        </div>
      )}

      {/* ── RESOLVE MODAL ── */}
      {resolveModal&&(()=>{
        const { patient:rp, entry:re } = resolveModal;
        const isConsent  = re.type === "consent";
        const isDoc      = re.type?.startsWith("doc_") || re.type==="pending_docs";
        const docKey     = isDoc ? re.type.replace("doc_","") : null;
        const NEXT_STEPS = isConsent
          ? ["Consent signed — on file","Patient will sign at next visit","No response — escalate to phone call","Patient declined — log declination"]
          : isDoc
          ? [`Document received — ${docKey} uploaded`,"Patient needs more time — extend 48 hrs","No response — switch to bring-it-in","Cannot provide — generate attestation"]
          : ["Patient responded — follow-up complete","No response — send follow-up SMS","No response — schedule call","Escalate to supervisor"];
        const choice    = resolveChoice;
        const setChoice = setResolveChoice;
        const resolved = choice&&(choice.includes("signed")||choice.includes("received")||choice.includes("complete")||choice.includes("uploaded"));
        return (
          <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}}
            onClick={()=>setResolveModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(440px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
              <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:2}}>What came back? · {rp.first} {rp.last}</div>
              <div style={{fontSize:11.5,color:T.textMid,marginBottom:14}}>{re.label} · renewal in {rp.renewalDays}d</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {NEXT_STEPS.map(s=>(
                  <button key={s} onClick={()=>setChoice(s)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`1px solid ${choice===s?T.teal:T.border}`,background:choice===s?T.teal+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left",width:"100%"}}>
                    <div style={{width:14,height:14,borderRadius:999,border:`2px solid ${choice===s?T.teal:T.border}`,flexShrink:0,background:choice===s?T.teal:"transparent"}}/>
                    <span style={{fontSize:12.5,color:T.text}}>{s}</span>
                  </button>
                ))}
              </div>
              {choice&&(
                <div style={{padding:"9px 12px",background:resolved?T.green+"0C":T.amber+"0C",border:`1px solid ${resolved?T.green:T.amber}33`,borderRadius:9,marginBottom:14,fontSize:12,color:T.textMid,lineHeight:1.5}}>
                  {resolved
                    ? `✓ ${rp.first} moves back to Needs action · checklist item updated · audit logged`
                    : choice.includes("Escalate")
                    ? `Escalated · ${rp.first} stays in Pending — supervisor notified`
                    : `${rp.first} stays in Pending · follow-up rescheduled`}
                </div>
              )}
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setResolveModal(null)} style={{...ghostBtn,padding:"7px 13px"}}>Cancel</button>
                <button disabled={!choice} onClick={()=>{
                  if(choice&&clearPending) {
                    clearPending(rp.mrn, re.id);
                  }
                  // Doc resolved → always move to Recert (onDocReceived handles stage)
                  if(isDoc && resolved && onDocReceived) {
                    onDocReceived(rp.mrn, re.label||"document");
                    setTimeout(()=>{ if(setView) setView("recert"); }, 100);
                  }
                  if(resolved && choice.includes("responded") && addPending) {
                    addPending(rp.mrn, { type:"responded", label:"Patient responded — intake unlocked", channel:"inbound", followUpHrs:0 });
                  }
                  setResolveModal(null);
                }} style={{...primaryBtn,background:resolved?T.teal:T.amber,padding:"7px 14px",opacity:choice?1:0.45,cursor:choice?"pointer":"not-allowed"}}>
                  <CheckCircle2 size={13}/> {resolved
                    ? isDoc
                      ? "Docs received — move to Recert"
                      : "Confirm & resolve"
                    : "Confirm & keep pending"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Patient rows */}
      {!pendingFilt && filtered.length === 0
        ? <div style={{textAlign:"center",padding:40,color:T.textLo,fontSize:13}}>No patients match this filter.</div>
        : !pendingFilt && filtered.map((p,i) => (
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
                {p.caregiver&&<span onClick={e=>{e.stopPropagation();setCaregiverModal(p);}} style={{fontSize:9.5,fontWeight:700,color:T.teal,background:T.teal+"10",border:"1px solid "+T.teal+"33",borderRadius:4,padding:"1px 6px",cursor:"pointer"}}>Probable caregiver exemption</span>}
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
      {!pendingFilt && filtered.length > 0 && (
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

/* ══════════════════════════════════════════════════════════
   INTAKE FLOW — four-step overlay inside the patient drawer
   Change 24 · navigator executes collection on the call
   Step 1: Verify contact · 2: Consent · 3: Docs · 4: Review + submit
══════════════════════════════════════════════════════════ */
function IntakeFlow({ p, consent, step, setStep, onClose, onDone }) {
  const phone = p.phone || "(410) 555-" + (1000 + (p.idx||0) % 8999);
  const crisp_phone = p.crisp_phone || null;
  const discrepancy = crisp_phone && crisp_phone !== phone;
  const lineType = p.lineType || "mobile";
  const active = p.phoneActive !== false;
  const textable = lineType === "mobile" || lineType === "prepaid";
  const miaInstalled = (p.idx||0) % 3 === 0;

  const [phoneConfirmed, setPhoneConfirmed] = React.useState(false);
  const [consentPath, setConsentPath] = React.useState(null);
  const [consentSent, setConsentSent] = React.useState(null);
  const [docs, setDocs] = React.useState({
    identity: true, workHours: false, income: false, residency: true, household: false, contact: true
  });

  const STEPS = ["Contact","Consent","Documents","Review"];

  const Pill = ({label,ok,warn}) => (
    <span style={{fontSize:10.5,fontWeight:700,background:(ok?T.green:warn?T.amber:T.red)+"18",color:ok?T.green:warn?T.amber:T.red,borderRadius:4,padding:"1px 6px"}}>{label}</span>
  );

  const DocRow = ({label, done, stale, note, key2}) => (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:done&&!stale?T.surface:stale?T.amber+"08":T.amber+"08",borderBottom:`1px solid ${T.border}`}}>
      <div style={{width:18,height:18,borderRadius:999,background:done&&!stale?T.green+"20":stale?T.amber+"20":T.surface,border:`1px solid ${done&&!stale?T.green:stale?T.amber:T.amber}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {done&&!stale?<CheckCircle2 size={11} color={T.green}/>:stale?<AlertTriangle size={11} color={T.amber}/>:<Circle size={11} color={T.amber}/>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{label}</div>
        <div style={{fontSize:11.5,color:done&&!stale?T.textLo:T.amber,marginTop:1}}>{done&&!stale?"On file":stale?"On file — re-verify":note}</div>
      </div>
      {(!done||stale)&&<button onClick={()=>setDocs(d=>({...d,[key2]:true}))} style={{fontSize:11,padding:"3px 9px",border:`1px solid ${T.amber}55`,borderRadius:999,background:T.surface,color:T.amber,cursor:"pointer",flexShrink:0}}>Got it</button>}
    </div>
  );

  const doneCount = Object.values(docs).filter(Boolean).length;
  const totalDocs = Object.keys(docs).length;

  return (
    <div style={{position:"absolute",inset:0,background:T.surface,zIndex:10,display:"flex",flexDirection:"column",animation:"cgSlide .18s ease"}}>
      {/* Header */}
      <div style={{borderBottom:`1px solid ${T.border}`,padding:"12px 16px",background:T.surface,position:"sticky",top:0,zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:T.text}}>Start intake — {p.first} {p.last}</div>
            <div style={{fontSize:11.5,color:T.textLo}}>Renewal in <span style={{color:p.renewalDays<=14?T.red:T.orange,fontWeight:700}}>{p.renewalDays}d</span></div>
          </div>
          <button onClick={onClose} style={{background:T.canvas,border:`1px solid ${T.border}`,borderRadius:8,padding:6,cursor:"pointer",color:T.textMid}}><X size={14}/></button>
        </div>
        {/* Step pills */}
        <div style={{display:"flex",gap:6}}>
          {STEPS.map((s,i)=>(
            <button key={i} onClick={()=>setStep(i+1)}
              style={{flex:1,fontSize:11,fontWeight:800,padding:"5px 4px",borderRadius:8,border:`1px solid ${step===i+1?T.teal:T.border}`,background:step===i+1?T.teal:step>i+1?T.green+"18":"transparent",color:step===i+1?"#fff":step>i+1?T.green:T.textLo,cursor:"pointer"}}>
              {step>i+1?"✓ ":""}{i+1}. {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>

        {/* ── STEP 1: CONTACT INFO ── */}
        {step===1 && (<>
          <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.5}}>Confirm with patient on the call before proceeding.</div>

          <div style={{background:discrepancy?T.amber+"10":T.surface,border:`1px solid ${discrepancy?T.amber:T.border}`,borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:11,color:T.textLo,marginBottom:4}}>Primary phone</div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:discrepancy?6:0}}>
              <span style={{fontSize:13,color:T.text,fontWeight:700}}>{phone}</span>
              <Pill label={active?"Active":"Disconnected"} ok={active} warn={false}/>
              {active&&<Pill label={lineType==="mobile"?"Mobile":lineType==="landline"?"Landline":"VoIP"} ok={lineType==="mobile"} warn={lineType!=="mobile"}/>}
              {active&&textable&&<Pill label="Textable" ok/>}
              {active&&!textable&&<Pill label="Call only" warn/>}
            </div>
            {discrepancy&&<div style={{fontSize:11.5,color:T.amber,marginTop:4}}><AlertTriangle size={11} style={{verticalAlign:-1,marginRight:4}}/>eCW: {phone} · CRISP: {crisp_phone} — which is current?</div>}
          </div>

          {[
            {label:"Email",    value:p.email||"tlopez@email.com",   icon:"✉"},
            {label:"Language", value:p.lang||"English",             icon:"🗣"},
            {label:"Address",  value:"1234 Park Ave, Baltimore MD", icon:"📍"},
          ].map(f=>(
            <div key={f.label} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,color:T.textLo,marginBottom:2}}>{f.label}</div>
                <div style={{fontSize:13,color:T.text,fontWeight:700}}>{f.icon} {f.value}</div>
              </div>
              <span style={{fontSize:11,fontWeight:700,background:T.green+"18",color:T.green,borderRadius:6,padding:"2px 8px"}}>✓ Confirmed</span>
            </div>
          ))}

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,color:T.textLo,marginBottom:2}}>Mia app</div>
              <div style={{fontSize:13,color:miaInstalled?T.green:T.textLo,fontWeight:700}}>📲 {miaInstalled?"Installed":"Not installed"}</div>
            </div>
            {!miaInstalled&&<button style={{fontSize:11,padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:8,background:T.surface,color:T.textMid,cursor:"pointer"}}>Send download link</button>}
          </div>

          <div style={{fontSize:11,color:T.textLo,padding:"8px 10px",background:T.surface2,borderRadius:8,lineHeight:1.5}}>
            Updates confirmed here sync to eCW on next nightly feed. Navigator cannot update without verbal confirmation on the call.
          </div>
        </>)}

        {/* ── STEP 2: CONSENT ── */}
        {step===2 && (<>
          <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.5}}>42 CFR 435.923 · voluntary and revocable · how does the patient want to proceed?</div>
          {!consentPath&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {key:"send",  label:"Yes — health center can help", sub:"Log verbal consent · send CG-AR-01 · choose delivery channel"},
                {key:"self",  label:"No — patient will self-submit",  sub:"Log declination · MHC self-service link · 14-day follow-up"},
                {key:"visit", label:"Needs to come in",               sub:"Schedule appointment · check transport · send reminder"},
              ].map(opt=>(
                <button key={opt.key} onClick={()=>setConsentPath(opt.key)}
                  style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",border:`1px solid ${T.border}`,borderRadius:10,background:T.surface,cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{opt.label}</div>
                    <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>{opt.sub}</div>
                  </div>
                  <span style={{color:T.teal,fontSize:16}}>›</span>
                </button>
              ))}
            </div>
          )}
          {consentPath==="send"&&!consentSent&&(
            <div>
              <div style={{fontSize:12,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Delivery channel</div>
              {[
                {key:"sms",label:"Text message",sub:`Link to ${p.first}'s phone · signs online`},
                {key:"email",label:"Email",sub:"PDF attachment · patient prints and signs"},
                {key:"mia",label:"Mia app",sub:"Push notification · in-app signature"},
                {key:"download",label:"Download PDF",sub:"Print and sign in person"},
              ].map(opt=>(
                <button key={opt.key} onClick={()=>{
                              setConsentSent(opt.key);
                              if(addPending) addPending(p.mrn, {
                                type:"consent",
                                label:`Consent form sent via ${opt.label}`,
                                channel: opt.key,
                                followUpHrs: 24,
                              });
                            }}
                  style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",border:`1px solid ${T.border}`,borderRadius:10,background:T.surface,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{opt.label}</div>
                    <div style={{fontSize:11.5,color:T.textMid,marginTop:1}}>{opt.sub}</div>
                  </div>
                </button>
              ))}
              <button onClick={()=>setConsentPath(null)} style={{background:"none",border:"none",color:T.textLo,fontSize:12,cursor:"pointer",padding:0}}>← Back</button>
            </div>
          )}
          {consentPath==="send"&&consentSent&&(
            <div style={{padding:"12px 14px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:10}}>
              <div style={{fontSize:13,fontWeight:800,color:T.tealD}}>
                {consentSent==="sms"?"SMS sent — patient will receive a link to sign":
                 consentSent==="email"?"Email sent — patient receives form to sign and return":
                 consentSent==="mia"?"Mia push sent — patient signs in-app":
                 "PDF ready — print and collect signature"}
              </div>
              <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>Verbal consent logged · signature pending · follow-up set in 14 days</div>
            </div>
          )}
          {consentPath==="self"&&(
            <div style={{padding:"12px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10}}>
              <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:5}}>Declination logged</div>
              <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.6,marginBottom:8}}>Patient will self-submit at <b>oklahoma.gov/ohca</b>. Follow-up set 14 days before renewal deadline.</div>
              <div style={{fontSize:11.5,padding:"8px 10px",background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:8,color:T.amber}}>If no confirmation received by follow-up date, patient returns to Patient Queue as "Declined — unverified."</div>
            </div>
          )}
          {consentPath==="visit"&&(
            <div style={{padding:"12px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10}}>
              <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:5}}>In-person appointment requested</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {["Appointment request → front desk task queue","SDOH transport flag checked automatically","Patient reminder sent via SMS when booked"].map((s,i)=>(
                  <div key={i} style={{fontSize:12,color:T.textMid,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} color={T.green}/> {s}</div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ── STEP 3: DOCUMENTS ── */}
        {step===3 && (<>
          <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.5}}>Check state data first (ex parte) before asking the patient. Collect what's missing.</div>
          <div style={{fontSize:11,fontWeight:700,color:T.textMid,display:"flex",justifyContent:"space-between"}}>
            <span>Documents</span><span style={{color:doneCount===totalDocs?T.green:T.textLo}}>{doneCount} of {totalDocs} done</span>
          </div>
          <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
            <DocRow label="Identity confirmed"            done={docs.identity}  stale={false} note="Verified Jun 8, 2026 · eCW"                   key2="identity"/>
            <DocRow label="Work hours / activity (80 hrs/mo)" done={docs.workHours} stale={false} note="Ask for pay stub, letter, or hours log"    key2="workHours"/>
            <DocRow label="Income verified"               done={docs.income}    stale={false} note="Ex parte first — checking wage records"        key2="income"/>
            <DocRow label="Residency proof"               done={docs.residency} stale={true}  note="On file — re-verify (165 days old)"            key2="residency"/>
            <DocRow label="Household changes"             done={docs.household} stale={false} note="Any changes since last renewal?"               key2="household"/>
            <DocRow label="Contact info current"          done={docs.contact}   stale={false} note="Confirmed on this call"                        key2="contact"/>
          </div>
        </>)}

        {/* ── STEP 4: REVIEW + SUBMIT ── */}
        {step===4 && (<>
          <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.5}}>Auth-rep packet assembled. Review before sending to Oklahoma Health Care Authority.</div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:800,color:T.text,marginBottom:10}}>Packet contents</div>
            {[
              {label:"CG-AR-01 · consent to represent", ok:consentSent||consentPath==="self"||consentPath==="visit", note:consentSent?"Signed · Aug 22":consentPath?"Logged":"Missing"},
              {label:"Identity verification",           ok:docs.identity,  note:docs.identity?"Confirmed · Jun 8":"Not collected"},
              {label:"Work hours documentation",        ok:docs.workHours, note:docs.workHours?"On file":"Requested · pending"},
              {label:"Income verification",             ok:docs.income,    note:docs.income?"On file":"Ex parte check pending"},
              {label:"Residency proof",                 ok:docs.residency, note:docs.residency?"Re-verified · Aug 22":"Missing"},
              {label:"Household changes",               ok:docs.household, note:docs.household?"Confirmed · Aug 22":"Not confirmed"},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {item.ok?<CheckCircle2 size={13} color={T.green}/>:<AlertTriangle size={13} color={T.amber}/>}
                <div style={{flex:1,fontSize:12.5,color:T.text}}>{item.label}</div>
                <span style={{fontSize:11,color:item.ok?T.textLo:T.amber}}>{item.note}</span>
              </div>
            ))}
          </div>
          {!docs.workHours&&(
            <div style={{padding:"9px 12px",background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:9,fontSize:12,color:T.amber,lineHeight:1.5}}>
              <AlertTriangle size={12} style={{verticalAlign:-1,marginRight:5}}/>Work hours documentation still pending. You can submit now and upload within 10 days, or wait until received.
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button style={{...ghostBtn,padding:"8px 13px",fontSize:12.5}}>Save and finish later</button>
            <button onClick={onDone} style={{...primaryBtn,padding:"8px 16px",fontSize:12.5,background:T.teal,flex:1,justifyContent:"center"}}>
              <Send size={14}/> Submit to Oklahoma Health Care Authority
            </button>
          </div>
          <div style={{fontSize:11,color:T.textLo,lineHeight:1.5}}>Submission logged · confirmation number recorded · patient notified via SMS</div>
        </>)}

      </div>

      {/* Footer nav */}
      <div style={{borderTop:`1px solid ${T.border}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",background:T.surface}}>
        <button onClick={()=>step>1?setStep(step-1):onClose()} style={{...ghostBtn,padding:"7px 13px",fontSize:12.5}}>
          {step===1?"Cancel":"← Back"}
        </button>
        {step<4&&(
          <button onClick={()=>setStep(step+1)} style={{...primaryBtn,padding:"7px 16px",fontSize:12.5,background:T.teal}}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function EvidencePanel({ rowKey, p, rowCapture, setRowCapture, rowSent, setRowSent, rowDone, setRowDone, setExpandedRow, addPending }) {
  const cap    = rowCapture[rowKey] || {};
  const sent   = rowSent[rowKey]   || false;
  const setCap = (k,v) => setRowCapture(r=>({...r,[rowKey]:{...(r[rowKey]||{}),[k]:v}}));
  const miaOk  = p.mia;
  const [evidPath, setEvidPath] = React.useState(null);
  const activityOpts = {
    work:      ["Work — paid employment","Work — self-employed / gig","Work — in-kind / unpaid","Community service","Volunteer work"],
    household: ["Added household member","Removed household member","Income change","Address change","No changes to report"],
    income:    ["Wages / salary","Self-employment income","No income this period"],
    residency: ["Same address confirmed","New address — updating records"],
  }[rowKey] || null;
  const defaultNote = {
    work:      "Navigator notes — activity type, hours, barriers to documentation",
    household: "Navigator notes — what changed since last renewal",
    income:    "Navigator notes — income source and amount",
    residency: "Navigator notes — current address confirmed or updated",
  }[rowKey] || "Navigator notes from this call";
  const paths = [
    {key:"sms",    icon:"📱", label:"Send upload link — SMS",   sub:`Secure link to ${p.phone||"patient"} — they photograph and upload docs now`},
    {key:"mia",    icon:"🟣", label:"Request via Mia",          sub:miaOk?"Push document request through Mia — patient uploads in-app":"Mia not installed — use SMS", disabled:!miaOk},
    {key:"bring",  icon:"🏥", label:"Patient will bring it in", sub:"Flag for next visit · front desk scans and uploads · 10-day window"},
    {key:"attest", icon:"✍️", label:"Self-attestation",         sub:"No proof available — generate signed statement (patient signs via SMS link)"},
  ];
  if (sent) return (
    <div style={{padding:"10px 14px 14px",background:T.green+"08",borderTop:`1px dashed ${T.border}`}}>
      <div style={{fontSize:12.5,fontWeight:800,color:T.tealD,marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
        <CheckCircle2 size={14} color={T.green}/>
        {evidPath==="sms"?`Upload link sent to ${p.phone} via SMS`:
         evidPath==="mia"?"Document request sent via Mia":
         evidPath==="bring"?"Flagged for next visit — front desk notified":
         "Attestation generated — signature link sent via SMS"}
      </div>
      <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5,marginBottom:8}}>
        {evidPath==="sms"||evidPath==="mia"?"Patient will receive a secure link. CoverageGuard attaches the file and marks this item received when uploaded.":
         evidPath==="bring"?"Document scanned at next visit. 10-day window before deadline.":
         "Patient signs digitally. Once signed it is added to the recert packet."}
      </div>
      <button onClick={()=>{setRowDone(d=>({...d,[rowKey]:true}));setExpandedRow(null);}}
        style={{...primaryBtn,background:T.teal,padding:"5px 12px",fontSize:11}}>Done — mark pending upload</button>
    </div>
  );
  // ── Caregiver branch ──
  if (rowKey === "work" && p.caregiver) {
    const cgSt = cap.cgStatus;
    if (cgSt === "attestation_sent") return (
      <div style={{padding:"10px 14px 14px",background:T.green+"08",borderTop:"1px dashed "+T.border}}>
        <div style={{fontSize:12.5,fontWeight:800,color:T.tealD,display:"flex",alignItems:"center",gap:6}}>
          <CheckCircle2 size={14} color={T.green}/> Signed attestation sent — document gathering
        </div>
        <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>CG-CA-01 form sent. Once signed and returned, attach to recert packet.</div>
      </div>
    );
    if (cgSt === "verbal_recorded") return (
      <div style={{padding:"12px 14px 14px",background:T.indigo+"06",borderTop:"1px dashed "+T.indigo+"44"}}>
        <div style={{padding:"8px 10px",background:T.green+"0C",border:"1px solid "+T.green+"33",borderRadius:8,marginBottom:12,fontSize:12,color:T.green,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
          <CheckCircle2 size={13}/> Verbal received · pending signed written attestation
        </div>
        <div style={{fontSize:10,fontWeight:800,color:T.indigo,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Step 2 · Send attestation form (CG-CA-01)</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:3}}>Navigator name</div>
          <input value={cap.cgNavName||""} onChange={e=>setCap("cgNavName",e.target.value)} placeholder="Your name"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid "+T.border,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[{key:"sms",icon:"\uD83D\uDCF1",label:"Send CG-CA-01 via SMS",sub:"Secure link to "+( p.phone||"patient")+" — patient signs digitally"},
            {key:"download",icon:"\uD83D\uDCC4",label:"Download CG-CA-01 PDF",sub:"Print and give to patient at next visit"}
          ].map(opt=>(
            <button key={opt.key} onClick={()=>setCap("cgAttestedPath",cap.cgAttestedPath===opt.key?null:opt.key)}
              style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 11px",border:"1px solid "+(cap.cgAttestedPath===opt.key?T.indigo:T.border),background:cap.cgAttestedPath===opt.key?T.indigo+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left",width:"100%"}}>
              <span style={{fontSize:15,flexShrink:0}}>{opt.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:700,color:cap.cgAttestedPath===opt.key?T.indigo:T.text}}>{opt.label}</div>
                <div style={{fontSize:11,color:T.textLo,marginTop:1}}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setExpandedRow(null)} style={{...ghostBtn,padding:"6px 12px",fontSize:12}}>Cancel</button>
          <button disabled={!cap.cgAttestedPath} onClick={()=>{
            setCap("cgStatus","attestation_sent");
            if(addPending) addPending(p.mrn,{type:"caregiver_attestation",label:"CG-CA-01 attestation form sent \u00b7 "+p.first+" "+p.last,channel:cap.cgAttestedPath,followUpHrs:72});
            setRowDone(d=>({...d,work:true}));
            setExpandedRow(null);
          }} style={{...primaryBtn,background:T.indigo,padding:"6px 14px",fontSize:12,opacity:cap.cgAttestedPath?1:0.45,cursor:cap.cgAttestedPath?"pointer":"not-allowed"}}>
            Send attestation form
          </button>
        </div>
      </div>
    );
    // State 0 — collect verbal
    return (
      <div style={{padding:"12px 14px 14px",background:T.indigo+"06",borderTop:"1px dashed "+T.indigo+"44"}}>
        <div style={{fontSize:10,fontWeight:800,color:T.indigo,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Step 1 · Patient report + care recipient details</div>
        <div style={{fontSize:12,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
          {"Patient verbally confirms they are the primary caregiver for a child age \u226413 or a disabled individual. \u00a7435.554(c)(3) \u2014 states cannot disenroll for lack of formal documentation alone."}
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:3}}>Care recipient name</div>
          <input value={cap.cgRecipient||""} onChange={e=>setCap("cgRecipient",e.target.value)} placeholder="Full name"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid "+T.border,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:3}}>Relationship / age</div>
          <input value={cap.cgRelationship||""} onChange={e=>setCap("cgRelationship",e.target.value)} placeholder="e.g. Son · age 8"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid "+T.border,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setExpandedRow(null)} style={{...ghostBtn,padding:"6px 12px",fontSize:12}}>Cancel</button>
          <button disabled={!cap.cgRecipient} onClick={()=>setCap("cgStatus","verbal_recorded")}
            style={{...primaryBtn,background:T.indigo,padding:"6px 14px",fontSize:12,opacity:cap.cgRecipient?1:0.45,cursor:cap.cgRecipient?"pointer":"not-allowed"}}>
            {"Record verbal confirmation \u2192"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:"12px 14px 14px",background:T.amber+"06",borderTop:`1px dashed ${T.amber}44`}}>
      <div style={{fontSize:10,fontWeight:800,color:T.amber,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Step 1 · What does the patient report?</div>
      {activityOpts&&(
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
          {activityOpts.map(opt=>(
            <label key={opt} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12.5}}>
              <input type="checkbox" checked={!!(cap.activity||"").includes(opt)}
                onChange={e=>{const cur=(cap.activity||"").split("|").filter(Boolean);setCap("activity",e.target.checked?[...cur,opt].join("|"):cur.filter(x=>x!==opt).join("|"));}}
                style={{flexShrink:0}}/>
              <span style={{color:T.text}}>{opt}</span>
            </label>
          ))}
        </div>
      )}
      <textarea value={cap.note||""} onChange={e=>setCap("note",e.target.value)}
        placeholder={defaultNote}
        style={{width:"100%",boxSizing:"border-box",minHeight:46,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 9px",fontSize:11.5,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none",marginBottom:12}}/>
      <div style={{fontSize:10,fontWeight:800,color:T.amber,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Step 2 · How will proof arrive?</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
        {paths.map(opt=>(
          <button key={opt.key} disabled={opt.disabled}
            onClick={()=>setEvidPath(evidPath===opt.key?null:opt.key)}
            style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 11px",border:`1px solid ${evidPath===opt.key?T.teal:T.border}`,background:evidPath===opt.key?T.teal+"0C":opt.disabled?T.surface2:T.surface,borderRadius:9,cursor:opt.disabled?"not-allowed":"pointer",textAlign:"left",width:"100%",opacity:opt.disabled?0.5:1}}>
            <span style={{fontSize:15,flexShrink:0}}>{opt.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5,fontWeight:700,color:evidPath===opt.key?T.tealD:T.text}}>{opt.label}</div>
              <div style={{fontSize:11,color:T.textLo,marginTop:1}}>{opt.sub}</div>
            </div>
            {!opt.disabled&&<div style={{width:14,height:14,borderRadius:999,border:`2px solid ${evidPath===opt.key?T.teal:T.border}`,flexShrink:0,marginTop:3,background:evidPath===opt.key?T.teal:"transparent"}}/>}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setExpandedRow(null)} style={{...ghostBtn,padding:"6px 12px",fontSize:12}}>Cancel</button>
        <button disabled={!evidPath} onClick={()=>{
          setRowSent(s=>({...s,[rowKey]:true}));
          if(addPending && (evidPath==="sms"||evidPath==="mia"||evidPath==="attest")) addPending(p.mrn, {
            type: "doc_"+rowKey,
            label: `${evidPath==="attest"?"Attestation":"Upload link"} sent — ${rowKey}`,
            channel: evidPath,
            followUpHrs: evidPath==="bring"?72:24,
          });
        }}
          style={{...primaryBtn,padding:"6px 14px",fontSize:12,opacity:evidPath?1:0.45,cursor:evidPath?"pointer":"not-allowed"}}>
          {evidPath==="sms"?"Send upload link":evidPath==="mia"?"Send Mia request":evidPath==="bring"?"Flag for next visit":evidPath==="attest"?"Generate attestation":"Confirm"}
        </button>
      </div>
    </div>
  );
}

function PatientDrawer({ p, onClose, setView, onRoute, viewerRole, consent: consent_arg, addPending, clearPending, pendingByMrn={} }) {
  const r = p.recon;
  const [routed, setRouted] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeStep, setIntakeStep] = useState(1);
  const [outreachModal, setOutreachModal] = React.useState(false);
  const [outreachChannels, setOutreachChannels] = React.useState({sms:false,mia:false,email:false});
  const [outreachSentDone, setOutreachSentDone] = React.useState(false);
  const [escalateModal, setEscalateModal] = React.useState(false);
  const [escalateTo, setEscalateTo] = React.useState("clinician");
  const [escalateNote, setEscalateNote] = React.useState("");
  const [escalateDone, setEscalateDone] = React.useState(false);
  const [escalateErr, setEscalateErr] = React.useState(false);
  const oAllow = !r.guardrail || r.guardrail.allow;
  const renewalDays = p.renewalDays;
  const renewalLabel = renewalDays == null ? "" : renewalDays < 0 ? `${-renewalDays}d overdue` : renewalDays <= 14 ? `${renewalDays}d — urgent` : `${renewalDays} days`;
  const renewalColor = renewalDays == null ? T.teal : renewalDays < 0 ? T.red : renewalDays <= 14 ? T.red : renewalDays <= 30 ? T.orange : renewalDays <= 90 ? T.amber : T.teal;
  const consentOk = arConsentStatus(consent_arg).key === "granted";
  const [empFormOpen, setEmpFormOpen] = React.useState(false);
  const myPending           = (pendingByMrn[p.mrn] || []);
  const outreachSentForThis = myPending.some(e => e.type === "outreach");
  const respondedForThis    = myPending.some(e => e.type === "responded");
  const intakeUnlocked      = !outreachSentForThis || respondedForThis;
  const [expandedRow, setExpandedRow]   = React.useState(null);
  const [rowCapture,  setRowCapture]    = React.useState({});
  const [rowSent,     setRowSent]       = React.useState({});
  const [rowDone,     setRowDone]       = React.useState({});
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(14,23,38,.34)" }} />
      <div style={{ position: "relative", width: "min(480px, 96vw)", background: T.surface, height: "100%", overflowY: "auto", boxShadow: "-12px 0 40px rgba(0,0,0,.18)", animation: "cgSlide .22s ease" }}>
        <div style={{ position: "sticky", top: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 16px", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{p.first} {p.last}</div>
              <div style={{ fontSize: 11.5, color: T.textLo, fontFamily: T.mono, marginTop: 2 }}>{p.mrn} · Medicaid {p.medicaidId} · {p.lang} · {mcoOf(p)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {p.tier && <Badge c={p.tier==="high"||p.tier==="critical"?T.red:p.tier==="moderate"?T.amber:T.green}>{p.tier}</Badge>}
              {p.renewalDays != null && <Badge c={p.renewalDays<=14?T.red:p.renewalDays<=30?T.orange:T.amber} bg={(p.renewalDays<=14?T.red:p.renewalDays<=30?T.orange:T.amber)+"18"}>Renewal {p.renewalDays<0?`${-p.renewalDays}d overdue`:`${p.renewalDays}d`}</Badge>}
              <button onClick={onClose} style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: T.textMid, marginLeft: 4 }}><X size={14} /></button>
            </div>
          </div>
          {/* ── Contact info row ── */}
          {(() => {
            const phone = p.phone || "(410) 555-" + (1000 + (p.idx||0) % 8999);
            const crisp_phone = p.crisp_phone || null;
            const discrepancy = crisp_phone && crisp_phone !== phone;
            const lineType = p.lineType || "mobile";
            const active = p.phoneActive !== false;
            const textable = lineType === "mobile" || lineType === "prepaid";
            const miaInstalled = (p.idx||0) % 3 === 0;
            const lastOutreach = p.lastOutreach || "Aug 18 · no response";
            const smsOptIn = !p.smsOptOut;
            const lineColor = !active ? T.red : lineType === "landline" || lineType === "voip" ? T.amber : T.green;
            const lineLabel = !active ? "Disconnected" : lineType === "landline" ? "Landline" : lineType === "voip" ? "VoIP" : "Mobile";
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: active ? T.textMid : T.red, display: "flex", alignItems: "center", gap: 3 }}>
                    <PhoneIcon size={12} /> {phone}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: (active?T.green:T.red)+"18", color: active?T.green:T.red, borderRadius: 4, padding: "1px 6px" }}>{active?"Active":"Disconnected"}</span>
                  {active && <span style={{ fontSize: 10.5, fontWeight: 700, background: lineColor+"18", color: lineColor, borderRadius: 4, padding: "1px 6px" }}>{lineLabel}</span>}
                  {active && textable && <span style={{ fontSize: 10.5, fontWeight: 700, background: T.green+"18", color: T.green, borderRadius: 4, padding: "1px 6px" }}>Textable</span>}
                  {active && !textable && <span style={{ fontSize: 10.5, fontWeight: 700, background: T.amber+"18", color: T.amber, borderRadius: 4, padding: "1px 6px" }}>Call only</span>}
                  <span style={{ fontSize: 11, color: T.textLo }}>· {smsOptIn ? "SMS opt-in" : "SMS opted out"}</span>
                </div>
                {discrepancy && (
                  <div style={{ fontSize: 11, color: T.amber, background: T.amber+"12", border: `1px solid ${T.amber}44`, borderRadius: 6, padding: "3px 8px", marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <AlertTriangle size={11} /> Phone discrepancy — eCW: {phone} · CRISP: {crisp_phone} · verify on call
                  </div>
                )}
                {!active && (
                  <div style={{ fontSize: 11, color: T.red, background: T.red+"10", border: `1px solid ${T.red}33`, borderRadius: 6, padding: "3px 8px", marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <AlertTriangle size={11} /> Number out of service — update contact info before outreach
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: miaInstalled ? T.green : T.textLo, display: "flex", alignItems: "center", gap: 3 }}>
                    <MessageSquare size={11} /> {miaInstalled ? "Mia installed" : "Mia not installed"}
                  </span>
                  <span style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} /> Last outreach {lastOutreach}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── SECTION 1: RENEWAL STATUS CARD (CertCore — conflict resolution in Coverage Intelligence) ── */}
          {(() => {
            const daysLeft = p.renewalDays;
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft <= 14;
            const tone = isOverdue||isUrgent ? T.red : daysLeft <= 30 ? T.orange : daysLeft <= 60 ? T.amber : T.teal;
            const label = isOverdue ? `${-daysLeft}d overdue` : isUrgent ? `${daysLeft}d — act today` : `${daysLeft} days`;
            const action = isOverdue
              ? "Renewal deadline passed — submit immediately or escalate to supervisor"
              : isUrgent
              ? "Renewal due soon — complete intake, collect documents, and submit via MHC"
              : daysLeft <= 30
              ? "Renewal upcoming — capture consent and start document collection now"
              : "Renewal window open — opportunistic outreach and consent capture";
            const hasMhcData = r && r.sources && r.sources.length > 0;
            return (
              <div style={{ border:`1.5px solid ${tone}55`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:tone+"18", padding:"8px 13px", display:"flex", alignItems:"center", gap:8 }}>
                  {isOverdue||isUrgent ? <AlertTriangle size={14} color={tone}/> : <ClipboardCheck size={14} color={tone}/>}
                  <span style={{ fontSize:12, fontWeight:800, color:tone, textTransform:"uppercase", letterSpacing:.3 }}>
                    {isOverdue?"Renewal overdue":isUrgent?"Renewal urgent":"Redetermination status"}
                  </span>
                  <span style={{ marginLeft:"auto", fontSize:12.5, fontWeight:800, color:tone }}>
                    {label}
                  </span>
                </div>
                <div style={{ padding:"11px 13px", background:T.surface }}>
                  <div style={{ fontSize:13.5, color:T.text, lineHeight:1.5 }}>
                    {p.coverage === "active"
                      ? `Coverage active · renewal in ${daysLeft < 0 ? "overdue" : daysLeft + " days"} · ${hasMhcData?"All sources reconciled — no conflicts":"Eligibility confirmed via Availity 271"}`
                      : `Coverage ${p.coverage} · renewal due · intervention needed before deadline`}
                    {p.dualEligible && (
                      <div style={{ marginTop:6, fontSize:12.5, fontWeight:700, color:T.indigo }}>
                        {"Medicare primary \u00b7 Medicaid secondary"}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop:9, padding:"8px 11px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:9 }}>
                    <div style={{ fontSize:10.5, fontWeight:800, color:T.textLo, textTransform:"uppercase", letterSpacing:.4 }}>Do this</div>
                    <div style={{ fontSize:14, fontWeight:800, color:T.text, marginTop:3 }}>{action}</div>
                  </div>
                  {r.guardrail && !oAllow && (
                    <div style={{ marginTop:8, padding:"6px 10px", background:T.amber+"18", border:`1px solid ${T.amber}55`, borderRadius:8, fontSize:12, color:T.amber, display:"flex", gap:6, alignItems:"center" }}>
                      <Bell size={13}/> {r.guardrail.label} — do not send a letter or text. Contact by phone or in person only.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── DUAL ELIGIBLE BANNER ── */}
          {p.dualEligible && (
            <div style={{ border:`1.5px solid ${T.indigo}55`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ background:T.indigo+"18", padding:"8px 13px", display:"flex", alignItems:"center", gap:8 }}>
                <ShieldCheck size={14} color={T.indigo}/>
                <span style={{ fontSize:12, fontWeight:800, color:T.indigo, textTransform:"uppercase", letterSpacing:.3 }}>Dual eligible — categorically exempt</span>
              </div>
              <div style={{ padding:"11px 13px", background:T.surface, fontSize:12.5, color:T.textMid, lineHeight:1.5 }}>
                {"Medicare + Medicaid both active. Categorically exempt from work requirement — no clinician attestation needed. Bill Medicare primary · Medicaid secondary payer."}
                {/* PART3_BRIDGE: Coverage Intelligence dual_eligible flag → CertCore auto-confirms this exemption when Full platform licensed */}
              </div>
            </div>
          )}

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

          {/* ── SECTION 2: WHILE YOU HAVE THEM / INTAKE ── */}
          {intakeOpen && (
            <div style={{background:T.teal+"0C",border:`1px solid ${T.teal}44`,borderRadius:10,padding:"9px 13px",display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <MessageSquare size={14} color={T.teal}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:800,color:T.tealD}}>Intake in progress</div>
                <div style={{fontSize:11.5,color:T.textMid}}>Work through each item · send links · capture notes · move to pending when done</div>
              </div>
              <button onClick={()=>setIntakeOpen(false)} style={{fontSize:11,color:T.textLo,background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 9px",cursor:"pointer"}}>Cancel</button>
            </div>
          )}
          {(() => {
            const renewalDays = p.renewalDays;
            const isExempt = !p.wrSubject;
            const [consentModal, setConsentModal] = React.useState(false);
            const [consentPath, setConsentPath] = React.useState(null);
            const [consentSent, setConsentSent] = React.useState(null);

            const cst = arConsentStatus(consent_arg);
            const consentOk = cst.key === "granted";
            const renewalLabel = renewalDays < 0 ? `${-renewalDays}d overdue` : renewalDays <= 14 ? `${renewalDays}d — urgent` : `${renewalDays} days`;
            const renewalColor = renewalDays < 0 ? T.red : renewalDays <= 14 ? T.red : renewalDays <= 30 ? T.orange : renewalDays <= 90 ? T.amber : T.teal;

            const canExpand = (rk) => intakeOpen && rk && rk!=="consent" && rk!=="identity" && rk!=="contact";
            const CheckRow = ({rowKey, label, done, note, verifiedDate, stale, customAction}) => {
              const sessionDone = rowDone[rowKey];
              const isDone = done || sessionDone;
              const isExpanded = expandedRow === rowKey;
              const expandable = canExpand(rowKey) && !isDone;
              const dateColor = stale ? T.orange : T.textLo;
              return (
              <div style={{borderBottom:`1px solid ${T.border}`}}>
                <div onClick={customAction==="consent"&&intakeOpen&&(!isDone||stale)?()=>setConsentModal(true):expandable?()=>setExpandedRow(isExpanded?null:rowKey):undefined}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:isDone&&!stale?"#34A56A1A":stale?"#CC7A221A":"#C8472E14",cursor:(customAction==="consent"&&intakeOpen&&(!isDone||stale))||expandable?"pointer":"default"}}>
                  <div style={{width:20,height:20,borderRadius:999,background:isDone&&!stale?T.green+"20":stale?T.orange+"20":T.surface,border:`1px solid ${isDone&&!stale?T.green:stale?T.orange:T.amber}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isDone&&!stale?<CheckCircle2 size={12} color={T.green}/>:stale?<AlertTriangle size={12} color={T.orange}/>:<Circle size={12} color={T.amber}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2,flexWrap:"wrap"}}>
                      <span style={{fontSize:11.5,color:isDone&&!stale?T.textLo:stale?T.orange:T.amber}}>
                        {rowSent[rowKey]?"Pending upload — link sent":isDone?stale?"On file — may be stale":"On file":note}
                      </span>
                      {verifiedDate&&<span style={{fontSize:11,color:dateColor,fontFamily:T.mono,background:dateColor+"14",border:`1px solid ${dateColor}33`,borderRadius:6,padding:"1px 7px"}}>verified {verifiedDate}</span>}
                      {stale&&<span style={{fontSize:11,color:T.orange,fontWeight:700}}>re-verify</span>}
                    </div>
                  </div>
                  {customAction==="consent"&&intakeOpen&&(!isDone||stale) ? (
                    <button onClick={e=>{e.stopPropagation();setConsentModal(true);}} style={{fontSize:11,padding:"3px 10px",border:"1px solid #5B6CC966",borderRadius:999,background:"#5B6CC918",color:"#534AB7",cursor:"pointer",flexShrink:0,fontWeight:700}}>Send form</button>
                  ) : expandable&&intakeOpen ? (
                    <span style={{fontSize:13,color:isExpanded?T.amber:T.teal,fontWeight:700,display:"inline-block",transform:isExpanded?"rotate(90deg)":"none"}}>›</span>
                  ) : null}
                </div>
                {isExpanded&&expandable&&(
                  <EvidencePanel rowKey={rowKey} p={p}
                    rowCapture={rowCapture} setRowCapture={setRowCapture}
                    rowSent={rowSent} setRowSent={setRowSent}
                    rowDone={rowDone} setRowDone={setRowDone}
                    setExpandedRow={setExpandedRow} addPending={addPending}/>
                )}
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
              {rowKey:"consent", label:"Consent to represent",
               done:consentOk, note:"Capture now — 42 CFR 435.923",
               verifiedDate:consentDate||null, stale:consentStale, customAction:"consent"},
              {rowKey:"identity", label:"Identity confirmed",
               done:true, note:"Verified", verifiedDate:idDate, stale:false},
              {rowKey:"work", label:isExempt?(p.dualEligible?"Dual eligible — exempt":p.caregiver?"Caregiver exemption — \u00a7435.554(c)(3)":"Exemption documented"):"Work hours / activity (80 hrs/mo)",
               done:isExempt?(p.dualEligible?true:p.caregiver?rowCapture?.work?.cgStatus==="attestation_sent":p.probableExemption?.clinician_confirmation_status==="clinician_confirmed"):p.wrStatus==="compliant",
               note:isExempt?(p.dualEligible?"Medicare + Medicaid both active · categorically exempt · no attestation needed":p.caregiver?(rowCapture?.work?.cgStatus==="attestation_sent"?"Signed attestation sent \u2014 document gathering":rowCapture?.work?.cgStatus==="verbal_recorded"?"Verbal received \u00b7 pending signed attestation":"Patient attestation"):"Pending clinician confirmation"):p.wrStatus==="at_risk"?`${p.activityHours} hrs/mo — below 80 · BEACON ex parte failed · tap to capture`:p.wrStatus==="unverified"?"No wage record in BEACON · tap to capture":"On file",
               verifiedDate:isExempt?exDate:wrDate, stale:false},
              {rowKey:"income", label:"Income verified",
               done:incomeDate&&!incomeStale, note:"Ex parte first · tap to capture if gap",
               verifiedDate:incomeDate, stale:incomeStale},
              {rowKey:"residency", label:"Residency proof",
               done:residDate&&!residStale, note:"Utility bill or lease · tap to capture",
               verifiedDate:residDate, stale:residStale},
              {rowKey:"household", label:"Household changes",
               done:false, note:"Any changes since last renewal? · tap to capture",
               verifiedDate:null, stale:false},
              {rowKey:"contact", label:"Contact info current",
               done:true, note:"Confirmed", verifiedDate:contactDate, stale:false},
            ];
            const doneCount = items.filter(i=>i.done).length;

            return (
              <div>
              {consentModal && (
                <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.45)"}} onClick={()=>{setConsentModal(false);setConsentPath(null);setConsentSent(null);}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(440px,92vw)",boxShadow:"-4px 4px 32px rgba(0,0,0,.18)"}}>
                    <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>Consent to represent — {p.first} {p.last}</div>
                    <div style={{fontSize:12.5,color:T.textMid,marginBottom:14,lineHeight:1.5}}>42 CFR 435.923 · voluntary and revocable · how does the patient want to proceed?</div>

                    {!consentPath && (
                      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                        {[
                          {key:"send",  label:"Yes — health center can help", sub:"Log verbal consent · send CG-AR-01 for signature · choose delivery channel"},
                          {key:"self",  label:"No — patient will self-submit",  sub:"Log declination · give MHC self-service link · set 14-day follow-up"},
                          {key:"visit", label:"Needs to come in",               sub:"Schedule in-person appointment · check transport · send reminder"},
                        ].map(opt=>(
                          <button key={opt.key} onClick={()=>setConsentPath(opt.key)}
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

                    {consentPath==="send" && !consentSent && (
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Choose delivery channel</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                          {[
                            {key:"sms",      label:"Text message",  sub:`Link to ${p.first}'s phone · signs online · fastest`},
                            {key:"email",    label:"Email",         sub:"PDF attachment · patient prints, signs and returns"},
                            {key:"mia",      label:"Mia app",       sub:"Push notification · in-app signature · no paper"},
                            {key:"download", label:"Download PDF",  sub:"Print and sign in person · navigator uploads signed copy"},
                          ].map(opt=>(
                            <button key={opt.key} onClick={()=>{
                              setConsentSent(opt.key);
                              if(addPending) addPending(p.mrn, {
                                type:"consent",
                                label:`Consent form sent via ${opt.label}`,
                                channel: opt.key,
                                followUpHrs: 24,
                              });
                            }}
                              style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 13px",border:`1px solid ${T.border}`,borderRadius:10,background:T.surface,cursor:"pointer",textAlign:"left",width:"100%"}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:800,color:T.text}}>{opt.label}</div>
                                <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>{opt.sub}</div>
                              </div>
                              <span style={{color:T.tealD,fontSize:16,marginTop:2}}>›</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={()=>setConsentPath(null)} style={{background:"none",border:"none",color:T.textLo,fontSize:12,cursor:"pointer",padding:0}}>← Back</button>
                      </div>
                    )}

                    {consentPath==="send" && consentSent && (
                      <div style={{padding:"12px 14px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:10,marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.tealD}}>
                          {consentSent==="sms"?"SMS sent — patient will receive a link to sign":
                           consentSent==="email"?"Email sent — patient will receive the form to sign and return":
                           consentSent==="mia"?"Mia push sent — patient will see it in their app":
                           "PDF ready — print and collect signature in person"}
                        </div>
                        <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>Verbal consent logged · signature pending · follow-up auto-set for 14 days</div>
                      </div>
                    )}

                    {consentPath==="self" && (
                      <div style={{padding:"13px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:6}}>Declination logged</div>
                        <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.6,marginBottom:10}}>Patient will self-submit at <b>oklahoma.gov/ohca</b>. A follow-up reminder will be set 14 days before their renewal deadline.</div>
                        <div style={{fontSize:11.5,padding:"8px 10px",background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:8,color:T.amber}}>
                          If no confirmation received by follow-up date, patient returns to Patient Queue as "Declined — unverified."
                        </div>
                      </div>
                    )}

                    {consentPath==="visit" && (
                      <div style={{padding:"13px 14px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:6}}>In-person appointment requested</div>
                        <div style={{fontSize:12.5,color:T.textMid,lineHeight:1.6,marginBottom:8}}>Appointment request sent to front desk. Transport flag will be checked automatically.</div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          <div style={{fontSize:12,color:T.textMid,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={13} color={T.green}/> Appointment request → front desk task queue</div>
                          <div style={{fontSize:12,color:T.textMid,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={13} color={T.green}/> SDOH transport flag checked automatically</div>
                          <div style={{fontSize:12,color:T.textMid,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={13} color={T.green}/> Patient reminder sent via SMS when booked</div>
                        </div>
                      </div>
                    )}

                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      {(consentPath==="send"&&consentSent)||(consentPath==="self")||(consentPath==="visit") ? (
                        <button onClick={()=>{setConsentModal(false);setConsentPath(null);setConsentSent(null);}} style={{...primaryBtn,background:T.teal}}>Done</button>
                      ) : null}
                      <button onClick={()=>{setConsentModal(false);setConsentPath(null);setConsentSent(null);}} style={ghostBtn}>Cancel</button>
                    </div>
                    <div style={{fontSize:10.5,color:T.textLo,marginTop:10,lineHeight:1.5}}>Voluntary, revocable designation · 42 CFR 435.923 · Full controls in Recertification tab.</div>
                  </div>
                </div>
              )}
              <div style={{border:`1px solid ${intakeOpen?T.teal+"55":T.borderHi}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{background:intakeOpen?T.teal+"0C":T.surface2,padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <ClipboardCheck size={14} color={intakeOpen?T.teal:T.textMid}/>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:intakeOpen?T.tealD:T.text}}>{intakeOpen?"Documents needed":"What's needed"}</div>
                      {intakeOpen&&<div style={{fontSize:11,color:T.teal,marginTop:1}}>Tap each row to expand · send links · capture notes</div>}
                    </div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:doneCount===items.length?T.green:renewalColor,background:(doneCount===items.length?T.green:renewalColor)+"18",padding:"2px 9px",borderRadius:999}}>{doneCount} of {items.length} · {renewalLabel}</span>
                </div>
                {items.map((it,i)=><CheckRow key={i} {...it}/>)}
              </div>
              </div>
            );
          })()}

          {/* ── EMPLOYMENT DOC FORM MODAL ── */}
          {empFormOpen&&(
            <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setEmpFormOpen(false)}>
              <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(560px,96vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:T.text}}>Activity & Employment Form · § 435.552</div>
                    <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>Pre-filled from EMR · BEACON ex parte check returned no wage record</div>
                  </div>
                  <button onClick={()=>setEmpFormOpen(false)} style={{background:T.canvas,border:`1px solid ${T.border}`,borderRadius:8,padding:6,cursor:"pointer",color:T.textMid}}><X size={16}/></button>
                </div>
                <div style={{background:T.red+"0C",border:`1px solid ${T.red}33`,borderRadius:10,padding:"10px 13px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <AlertTriangle size={14} color={T.red} style={{flexShrink:0,marginTop:2}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:T.red,marginBottom:2}}>BEACON ex parte check — no wage record found</div>
                    <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>OESC wage records: no employer match for {p.first} {p.last} (past 4 quarters). SNAP/TANF: not enrolled. SSA: no benefit record. Member must self-document activity.</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <label style={{fontSize:11,color:T.textMid}}>Member name<br/><input value={`${p.first} ${p.last}`} readOnly style={{marginTop:3,width:"100%",boxSizing:"border-box",fontSize:12.5,border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",background:T.surface2,color:T.text}}/></label>
                  <label style={{fontSize:11,color:T.textMid}}>Medicaid / MRN<br/><input value={`${p.medicaidId||"••••"} / ${p.mrn}`} readOnly style={{marginTop:3,width:"100%",boxSizing:"border-box",fontSize:12.5,border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",background:T.surface2,color:T.text}}/></label>
                </div>
                <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.amber,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Current status · {p.wrReason||"Activity not verified"}</div>
                  <div style={{fontSize:11.5,color:T.textMid,lineHeight:1.5}}>{p.wrStatus==="at_risk"?`${p.activityHours} hrs/mo documented · ${80-(p.activityHours||0)} hrs short of the 80-hr requirement. Additional qualifying activity or income documentation needed.`:"No activity on record. Member must self-report what they do and provide any available proof."}</div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Qualifying activity <span style={{color:T.red}}>*</span></div>
                  {WR_ACTIVITIES.map(a=>(
                    <label key={a.key} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 11px",border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",background:T.surface,marginBottom:6}}>
                      <input type="checkbox" style={{marginTop:2,flexShrink:0}}/>
                      <div><div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{a.label}</div><div style={{fontSize:11,color:T.textLo}}>{a.cite} · {(a.docs||[]).join(" · ")}</div></div>
                    </label>
                  ))}
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Hours per month</div>
                  <div style={{display:"flex",gap:10}}>
                    {["Wk 1","Wk 2","Wk 3","Wk 4"].map((w,wi)=>(
                      <label key={w} style={{flex:1,fontSize:11,color:T.textMid,textAlign:"center"}}>{w}<br/>
                        <input type="number" min="0" max="168" placeholder="hrs" defaultValue={Math.round((p.activityHours||0)/4)||""}
                          style={{marginTop:3,width:"100%",boxSizing:"border-box",fontSize:13,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",textAlign:"center",background:T.surface,color:T.text}}/>
                      </label>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:T.textLo,marginTop:5}}>Documented: {p.activityHours||0} hrs/mo · target: 80 hrs/mo · gap: {Math.max(0,80-(p.activityHours||0))} hrs</div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Available documentation</div>
                  {["Recent pay stubs","Employer verification letter","W-2 / 1099","Self-attestation of hours","Volunteer org letter","School enrollment letter","Nothing available"].map(doc=>(
                    <label key={doc} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",cursor:"pointer"}}>
                      <input type="checkbox" style={{flexShrink:0}}/><span style={{fontSize:12.5,color:T.text}}>{doc}</span>
                    </label>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:`1px solid ${T.border}`,paddingTop:14}}>
                  <button onClick={()=>setEmpFormOpen(false)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                  <button onClick={()=>setEmpFormOpen(false)} style={{...primaryBtn,background:T.ink,padding:"8px 16px"}}><CheckCircle2 size={14}/> Save & add to packet</button>
                </div>
                <div style={{fontSize:10,color:T.textLo,marginTop:8,lineHeight:1.5}}>Records what the member reports — not a determination. State decides eligibility. Submission requires authorized representative consent on file.</div>
              </div>
            </div>
          )}

          {/* ── SEND OUTREACH MODAL ── */}
          {outreachModal && (
            <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.45)"}} onClick={()=>{setOutreachModal(false);setOutreachSentDone(false);setOutreachChannels({sms:false,mia:false,email:false});}}>
              <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,92vw)",boxShadow:"-4px 4px 32px rgba(0,0,0,.18)"}}>
                <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>Send outreach — {p.first} {p.last}</div>
                <div style={{fontSize:12.5,color:T.textMid,marginBottom:14,lineHeight:1.5}}>Renewal in <span style={{color:T.red,fontWeight:700}}>{renewalLabel}</span> · select channels · select all for maximum reach</div>
                {!outreachSentDone ? (<>
                  <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                    {[
                      {key:"sms",   label:"Text message", sub:`(410) 555-${1000+(p.idx||0)%8999} · preferred channel`},
                      {key:"mia",   label:"Mia app",      sub:"Push notification · app installed"},
                      {key:"email", label:"Email",        sub:`${p.first?.toLowerCase()}@email.com`},
                    ].map(ch=>(
                      <label key={ch.key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",border:`1px solid ${outreachChannels[ch.key]?T.teal:T.border}`,background:outreachChannels[ch.key]?T.teal+"08":T.surface,borderRadius:10,cursor:"pointer"}}>
                        <input type="checkbox" checked={outreachChannels[ch.key]} onChange={e=>setOutreachChannels(x=>({...x,[ch.key]:e.target.checked}))} style={{accentColor:T.teal}}/>
                        <div>
                          <div style={{fontSize:13,fontWeight:800,color:T.text}}>{ch.label}</div>
                          <div style={{fontSize:11.5,color:T.textMid}}>{ch.sub}</div>
                        </div>
                      </label>
                    ))}
                    <button onClick={()=>setOutreachChannels({sms:true,mia:true,email:true})} style={{fontSize:12,padding:"6px 12px",border:`1px solid ${T.border}`,borderRadius:8,background:T.surface2,color:T.textMid,cursor:"pointer",alignSelf:"flex-start"}}>Select all channels</button>
                  </div>
                  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:12.5,color:T.text,lineHeight:1.6}}>
                    Hi {p.first}, this is CoverageGuard Health Center. Your Medicaid renewal is due in {renewalLabel}. {!consentOk?"We need your consent to submit on your behalf. Reply 1 to confirm or call us at (410) 555-0100.":"Please upload any missing documents via the link below. Call us at (410) 555-0100 if you need help."}
                  </div>
                  {r.guardrail && !oAllow && (
                    <div style={{padding:"8px 10px",background:T.amber+"18",border:`1px solid ${T.amber}44`,borderRadius:8,fontSize:12,color:T.amber,marginBottom:12,display:"flex",gap:6}}>
                      <Bell size={13}/> CRISP guardrail — do not send text or letter. Contact by phone or in person only.
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setOutreachModal(false)} style={ghostBtn}>Cancel</button>
                    <button onClick={()=>{
                    setOutreachSentDone(true);
                    const sentChannels = Object.entries(outreachChannels).filter(([,v])=>v).map(([k])=>k);
                    if(addPending) addPending(p.mrn, {
                      type:"outreach",
                      label:`Outreach sent via ${sentChannels.length?sentChannels.join(" + "):"SMS"}`,
                      channel: sentChannels[0]||"sms",
                      followUpHrs: 24,
                    });
                  }} disabled={!Object.values(outreachChannels).some(Boolean)||(!oAllow)} style={{...primaryBtn,background:T.teal,opacity:Object.values(outreachChannels).some(Boolean)&&oAllow?1:.45}}><Send size={13}/> Send now</button>
                  </div>
                </>) : (
                  <div>
                    <div style={{padding:"12px 14px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:10,marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.tealD}}>Outreach sent · {Object.entries(outreachChannels).filter(([,v])=>v).map(([k])=>k).join(" + ")}</div>
                      <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>Logged to audit trail · delivery tracked · 48h follow-up set if no response</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button onClick={()=>{setOutreachModal(false);setOutreachSentDone(false);setOutreachChannels({sms:false,mia:false,email:false});}} style={{...primaryBtn,background:T.teal}}>Done</button>
                    </div>
                  </div>
                )}
                <div style={{fontSize:10.5,color:T.textLo,marginTop:10}}>Logged to audit trail · delivery status tracked · 42 CFR 435.923</div>
              </div>
            </div>
          )}

          {/* ── ESCALATE MODAL ── */}
          {escalateModal && (
            <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.45)"}} onClick={()=>{setEscalateModal(false);setEscalateDone(false);setEscalateNote("");setEscalateErr(false);}}>
              <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(420px,92vw)",boxShadow:"-4px 4px 32px rgba(0,0,0,.18)"}}>
                <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>Escalate — {p.first} {p.last}</div>
                <div style={{fontSize:12.5,color:T.textMid,marginBottom:14,lineHeight:1.5}}>Route this case to the right person. Add context so they can act immediately.</div>
                {!escalateDone ? (<>
                  <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                    {[
                      {key:"clinician",   label:"Clinician",          sub:"Probable exemption not yet reviewed · routes to Clinician Exemption Review queue"},
                      {key:"supervisor",  label:"Supervisor",          sub:"Can't reach patient · complex circumstances · deadline ≤ 7 days"},
                      {key:"compliance",  label:"Compliance officer",  sub:"Denial dispute · §1557 concern · legal or regulatory issue"},
                    ].map(opt=>(
                      <label key={opt.key} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",border:`1px solid ${escalateTo===opt.key?T.teal:T.border}`,background:escalateTo===opt.key?T.teal+"08":T.surface,borderRadius:10,cursor:"pointer"}}>
                        <input type="radio" name="esc" checked={escalateTo===opt.key} onChange={()=>setEscalateTo(opt.key)} style={{accentColor:T.teal,marginTop:2}}/>
                        <div>
                          <div style={{fontSize:13,fontWeight:800,color:T.text}}>{opt.label}</div>
                          <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>{opt.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11.5,fontWeight:800,color:T.textMid,marginBottom:6}}>Note <span style={{fontWeight:400,color:T.textLo}}>(required)</span></div>
                    <textarea value={escalateNote} onChange={e=>{setEscalateNote(e.target.value);setEscalateErr(false);}} placeholder="Describe why you are escalating and what you have already tried..." style={{width:"100%",fontSize:12.5,border:`1px solid ${escalateErr?T.red:T.border}`,borderRadius:8,padding:"8px 10px",background:T.surface,color:T.text,resize:"vertical",minHeight:70,outline:"none",boxSizing:"border-box"}}/>
                    {escalateErr && <div style={{fontSize:12,color:T.red,marginTop:4}}>A note is required before escalating</div>}
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setEscalateModal(false)} style={ghostBtn}>Cancel</button>
                    <button onClick={()=>{if(!escalateNote.trim()){setEscalateErr(true);return;}setEscalateDone(true);}} style={{...primaryBtn,background:T.teal}}><AlertTriangle size={13}/> Escalate</button>
                  </div>
                </>) : (
                  <div>
                    <div style={{padding:"12px 14px",background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:10,marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.tealD}}>Escalated to {escalateTo} · task created</div>
                      <div style={{fontSize:11.5,color:T.textMid,marginTop:4}}>Assignee notified · logged to audit trail · escalation.created</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button onClick={()=>{setEscalateModal(false);setEscalateDone(false);setEscalateNote("");}} style={{...primaryBtn,background:T.teal}}>Done</button>
                    </div>
                  </div>
                )}
                <div style={{fontSize:10.5,color:T.textLo,marginTop:10}}>Task created in assignee queue · audit trail: escalation.created · [navigator] · [date]</div>
              </div>
            </div>
          )}

          {/* ── INTAKE FOOTER ── */}
          {intakeOpen && (
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,display:"flex",gap:8,alignItems:"center",marginTop:4}}>
              <div style={{flex:1,fontSize:11.5,color:T.textMid,lineHeight:1.5}}>
                Done collecting — move to pending to await documents
              </div>
              <button onClick={()=>{
                setIntakeOpen(false);
                if(clearPending) clearPending(p.mrn);
                if(addPending) addPending(p.mrn,{type:"pending_docs",label:"Intake complete — awaiting documents",channel:"navigator",followUpHrs:24});
              }} style={{...primaryBtn,background:T.ink,flexShrink:0,padding:"8px 14px",fontSize:12}}>
                <Clock size={13}/> Move to pending
              </button>
            </div>
          )}

          {/* ── ACTION BUTTONS ── */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <button disabled={!oAllow} onClick={()=>oAllow&&setOutreachModal(true)}
              style={{...primaryBtn,opacity:oAllow?1:.45,cursor:oAllow?"pointer":"not-allowed"}}>
              <Send size={14}/> Send outreach
            </button>
            <button disabled={!oAllow||!intakeUnlocked} onClick={()=>{if(oAllow&&intakeUnlocked)setIntakeOpen(true);}}
              style={{...ghostBtn,opacity:(oAllow&&intakeUnlocked)?1:.45,cursor:(oAllow&&intakeUnlocked)?"pointer":"not-allowed",
                border:intakeUnlocked?undefined:`1px dashed ${T.border}`}}
              title={!intakeUnlocked?"Waiting for patient to respond":!oAllow?"Suppressed by outreach guardrail":""}>
              <MessageSquare size={14}/>
              {" "}{intakeUnlocked ? "Start intake" : "Awaiting response…"}
            </button>
            <button onClick={()=>setEscalateModal(true)}
              style={{...ghostBtn,color:T.red,borderColor:T.red+"55"}}>
              <AlertTriangle size={14}/> Escalate
            </button>
          </div>
          {/* ── RISK SCORE TOGGLE ── */}
          {(() => {
            const [show, setShow] = React.useState(false);
            return (
              <div>
                <button onClick={()=>setShow(s=>!s)}
                  style={{fontSize:12,color:T.textLo,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"4px 0",marginTop:4}}>
                  {show ? "Hide risk detail ↑" : "See risk score ↓"}
                </button>
                {show && (
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:12}}>
                    <SecondaryRisk p={p} />
                  </div>
                )}
              </div>
            );
          })()}

        </div>
        {/* IntakeFlow overlay removed — intake is now inline in the checklist (PART1 redesign) */}
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

function ConflictsView({ panel, setSelected }) {
  const [code, setCode] = useState("all");
  const withConflict = panel.filter((p) => p.recon && p.recon.code);
  const counts = {}; withConflict.forEach((p) => { counts[p.recon.code] = (counts[p.recon.code] || 0) + 1; });
  const rows = withConflict.filter((p) => code === "all" || p.recon.code === code).sort((a, b) => a.recon.confidence - b.recon.confidence);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card title="Conflict taxonomy" sub="Named coverage-conflict codes — the proprietary operating language. Tap to filter the worklist.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {CONFLICT_TAXONOMY.map((t) => (
            <div key={t.code} onClick={() => setCode(code === t.code ? "all" : t.code)} style={{ cursor: "pointer", border: `1px solid ${code === t.code ? T.ink : T.border}`, background: code === t.code ? T.surface2 : T.surface, borderRadius: 10, padding: "9px 11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: T.mono, color: STATE_TONE[t.state] || T.text }}>{t.code}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: counts[t.code] ? T.text : T.textLo }}>{counts[t.code] || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 3 }}>{t.pattern}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: STATE_TONE[t.state] || T.text, marginTop: 4 }}>→ {t.state}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card pad={0} title={`Coverage conflict worklist · ${rows.length}`} sub="Lowest-confidence first — where staff judgment adds the most" right={code !== "all" ? <button onClick={() => setCode("all")} style={linkBtn}>Clear filter</button> : null}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: T.textLo, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .4 }}>
              {["Patient", "Coverage state", "Conflict", "Confidence", "Recommended action", ""].map((h) => <th key={h} style={{ padding: "10px 13px", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", fontWeight: 700 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer", borderBottom: `1px solid ${T.surface2}` }} onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "9px 13px" }}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
                  <td style={{ padding: "9px 13px" }}><span style={{ fontWeight: 700, color: p.recon.tone }}>{p.recon.state}</span></td>
                  <td style={{ padding: "9px 13px" }}><Badge c={p.recon.tone} bg={p.recon.tone + "18"}>{p.recon.code}</Badge></td>
                  <td style={{ padding: "9px 13px" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontWeight: 800, width: 32 }}>{p.recon.confidence}%</span><div style={{ width: 46 }}><MiniBar value={p.recon.confidence} color={p.recon.tone} /></div></div></td>
                  <td style={{ padding: "9px 13px", color: T.textMid }}>{p.recon.action}</td>
                  <td style={{ padding: "9px 13px", color: T.textLo }}><ChevronRight size={15} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>No conflicts in this view.</Empty>}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: T.textLo, display: "flex", alignItems: "center", gap: 6 }}><Lock size={12} /> Every state is reconciled from multiple sources and fully explainable · synthetic data.</div>
    </div>
  );
}
/* ============================================================
   VIEWS · downstream modules (all keyed off the reconciled coverage state)
   ============================================================ */
const MCOS = ["Priority Partners", "Oklahoma Complete Health", "MedStar Family Choice", "UnitedHealthcare Community", "Wellpoint (Amerigroup)", "Aetna Better Health", "Jai Medical Systems", "CareFirst Community"];
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

function MCORosterView({ panel, setSelected }) {
  const churn = panel.filter((p) => p.recon && p.recon.code === "COV-003");
  const byPlan = {}; churn.forEach((p) => { const k = mcoOf(p); byPlan[k] = (byPlan[k] || 0) + 1; });
  const plans = Object.entries(byPlan).sort((a, b) => b[1] - a[1]);
  const maxPlan = plans.length ? plans[0][1] : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.indigo} kicker="MCO / RosterGuard" line="Reconciles 834 MCO rosters against live 270/271 eligibility to separate plan/attribution change from true coverage loss — so a roster drop never gets mistaken for a termination." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={Globe} label="Attribution changes" value={fmt(churn.length)} tone={T.indigo} foot="active, plan changed" />
        <Stat icon={AlertTriangle} label="Roster mismatches" value={fmt(churn.length)} tone={T.orange} foot="834 vs 270/271" />
        <Stat icon={Boxes} label="Plans affected" value={fmt(plans.length)} tone={T.teal} foot="MCOs with churn" />
        <Stat icon={CheckCircle2} label="Active despite drop" value={fmt(churn.length)} tone={T.green} foot="coverage retained" />
      </div>
      {plans.length > 0 && (
        <Card title="Roster churn by MCO" sub="Patients dropped from a plan roster while Medicaid eligibility stays active">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {plans.map(([name, n]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 190, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                <div style={{ flex: 1 }}><MiniBar value={(n / maxPlan) * 100} color={T.indigo} /></div>
                <span style={{ width: 24, textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card pad={0} title={`Attribution worklist · ${churn.length}`} sub="Route to MCO / population-health review — not eligibility termination">
        <ModTable cols={["Patient", "Prior MCO", "Current", "270/271", "Action", ""]} rows={churn.map((p) => (
          <tr key={p.id} onClick={() => setSelected(p)} style={rowHover} onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
            <td style={tdC}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
            <td style={tdC}>{mcoOf(p)}</td>
            <td style={tdC}><span style={{ fontWeight: 700, color: T.indigo }}>{mcoNew(p)}</span></td>
            <td style={tdC}><Badge c={T.green} bg={T.green + "16"}>Active</Badge></td>
            <td style={tdC}><span style={{ color: T.textMid }}>MCO / roster review</span></td>
            <td style={tdC}><ChevronRight size={15} color={T.textLo} /></td>
          </tr>
        ))} />
        {churn.length === 0 && <Empty>No attribution changes detected in this panel.</Empty>}
      </Card>
    </div>
  );
}

function CareGapView({ panel, setSelected }) {
  const atRisk = (p) => p.recon && (p.recon.code || p.coverage !== "active" || p.recon.humanReview);
  const rows = panel.filter((p) => (p.clinicalFlags || []).length && atRisk(p)).map((p) => ({ p, flag: p.clinicalFlags[0], measure: CARE_GAP[p.clinicalFlags[0]] || "Open care gap · UDS" }));
  const measures = new Set(rows.map((r) => r.measure));
  const totalClin = panel.filter((p) => (p.clinicalFlags || []).length).length || 1;
  const pct = Math.round((rows.length / totalClin) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ModHeader tone={T.orange} kicker="Quality / CareGap Shield" line="Links open UDS / HEDIS care gaps to patients whose reconciled coverage state is inactive, pending, or conflicting — because a lost renewal is also a lost quality measure." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat icon={Stethoscope} label="Gaps at coverage risk" value={fmt(rows.length)} tone={T.orange} foot="quality + coverage" />
        <Stat icon={Users} label="Patients affected" value={fmt(rows.length)} tone={T.indigo} foot="clinical + at-risk" />
        <Stat icon={Activity} label="Measures affected" value={fmt(measures.size)} tone={T.teal} foot="HEDIS / UDS" />
        <Stat icon={AlertTriangle} label="Clinical panel exposed" value={pct + "%"} tone={T.red} foot="of clinical patients" />
      </div>
      <Card pad={0} title={`Coverage-linked care gaps · ${rows.length}`} sub="Protect coverage to keep the gap closeable — route to care management">
        <ModTable cols={["Patient", "Condition", "Quality measure", "Coverage state", "Conf.", ""]} rows={rows.map(({ p, flag, measure }) => (
          <tr key={p.id} onClick={() => setSelected(p)} style={rowHover} onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
            <td style={tdC}><div style={{ fontWeight: 700 }}>{p.first} {p.last}</div><div style={{ fontSize: 10.5, color: T.textLo, fontFamily: T.mono }}>{p.mrn}</div></td>
            <td style={tdC}><Badge c={T.textMid}>{flag}</Badge></td>
            <td style={tdC}><span style={{ color: T.textMid }}>{measure}</span></td>
            <td style={tdC}><span style={{ fontWeight: 700, color: p.recon.tone }}>{p.recon.state}</span></td>
            <td style={tdC}><span style={{ fontWeight: 800 }}>{p.recon.confidence}%</span></td>
            <td style={tdC}><ChevronRight size={15} color={T.textLo} /></td>
          </tr>
        ))} />
        {rows.length === 0 && <Empty>No coverage-linked care gaps in this panel.</Empty>}
      </Card>
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
  const [impReason, setImpReason] = React.useState("");
  const [impSeverity, setImpSeverity] = React.useState("ongoing");
  const EVIDENCE = ["State claims / encounter data", "Clinician exam / attestation", "Both"];
  const REJECTS = ["No functional impairment established", "Condition resolved / historical", "Insufficient evidence — records needed"];
  const IMPAIRMENT_LABELS = {
    physical_limitation: "Physical limitations prevent sustained activity",
    cognitive_limitation: "Cognitive or psychiatric symptoms impair consistent participation",
    treatment_burden: "Active treatment schedule occupies required hours",
    sud_treatment: "Active SUD treatment consumes required hours and impairs consistent participation",
    caregiver_obligation: "Caregiving obligations for a dependent with a disability prevent participation",
    functional_assessment: "Functional assessment documents inability to meet 80-hr standard",
    other: "Other — see clinical detail",
  };
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
                          <div style={{ fontSize: 8.5, fontWeight: 800, color: T.indigo, textTransform: "uppercase" }}>Element 2 · functional impairment · IFR June 2026</div>
                          <select value={impReason} onChange={(e) => setImpReason(e.target.value)}
                            style={{ width: "100%", marginTop: 4, padding: "6px 8px", border: `1px solid ${impReason ? T.green : T.border}`, borderRadius: 6, fontSize: 11.5, fontFamily: "inherit" }}>
                            <option value="">— Select primary reason —</option>
                            <option value="physical_limitation">Physical limitations prevent sustained activity</option>
                            <option value="cognitive_limitation">Cognitive or psychiatric symptoms impair participation</option>
                            <option value="treatment_burden">Active treatment schedule occupies required hours</option>
                            <option value="sud_treatment">Active SUD treatment consumes required hours</option>
                            <option value="caregiver_obligation">Caregiving obligations prevent participation</option>
                            <option value="functional_assessment">Functional assessment documents inability</option>
                            <option value="other">Other — describe below</option>
                          </select>
                          <textarea value={stmt} onChange={(e) => setStmt(e.target.value)} placeholder="Additional clinical detail (optional)..." style={{ width: "100%", marginTop: 4, minHeight: 36, resize: "vertical", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontFamily: "inherit", color: T.text, background: T.surface, boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 9 }}>
                        <label style={{ fontSize: 11, color: T.textMid }}>Evidence source<br /><select value={evid} onChange={(e) => setEvid(e.target.value)} style={{ ...drawerInput, width: 220, marginTop: 3 }}>{EVIDENCE.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
                        <label style={{ fontSize: 11, color: T.textMid }}>Re-verify by<br /><input type="date" value={rev} onChange={(e) => setRev(e.target.value)} style={{ ...drawerInput, width: 160, marginTop: 3 }} /><div style={{ fontSize: 9.5, color: T.textLo }}>defaults to +12 months</div></label>
                        <label style={{ fontSize: 11, color: T.textMid }}>Severity<br /><select value={impSeverity} onChange={(e) => setImpSeverity(e.target.value)} style={{ ...drawerInput, width: 180, marginTop: 3 }}><option value="ongoing">Ongoing</option><option value="temporary">Temporary</option><option value="progressive">Progressive</option></select></label>
                      </div>
                      <div style={{ fontSize: 10, color: T.textLo, lineHeight: 1.5, marginBottom: 9 }}>Records a clinician attestation and prepares a printable form (CG-FA-01). Confirm the State accepts this form, or use the State\u2019s preferred form. Documentation on behalf of the individual under 42 CFR 435.557(f); the State determines eligibility. Written to the audit trail.</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button disabled={!impReason} onClick={() => { decideExemption(c.mrn, "confirm", { statement: ("The above condition significantly impairs this patient's ability to complete 80 hours per month of community engagement because: " + (IMPAIRMENT_LABELS[impReason]||"") + ". " + stmt).trim(), evidence: evid, reverify: rev || undefined, impairment_reason: impReason, impairment_severity: impSeverity }); closeExp(); }} style={{ ...primaryBtn, padding: "8px 12px", opacity: impReason ? 1 : .5, cursor: impReason ? "pointer" : "not-allowed" }}><CheckCircle2 size={14} /> Attest & confirm exemption</button>
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
  { key: "submitted",   label: "Submitted to State",  color: "#C8A02E", icon: Send,          blurb: "Awaiting determination · tracking # recorded" },
  { key: "rfi",         label: "RFI — cure needed",    color: "#CC7A22", icon: AlertTriangle, blurb: "State requested additional info · deadline set" },
  { key: "recertified", label: "Recertified / closed", color: "#15663D", icon: ShieldCheck,   blurb: "Final determination captured" },
];
const RECERT_STAFF = ["You", "Maria O.", "Andre B."];
const STAGE_ORDER = ["flagged", "gathering", "complete", "ready", "submitted", "rfi", "recertified"];
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
  const seq = ["recertified", "recertified", "recertified", "gathering", "ready", "submitted", "flagged", "gathering", "submitted", "ready", "gathering", "recertified", "submitted", "flagged", "complete", "complete"];
  const result = pool.map((p, i) => {
    const stage = seq[i % seq.length];
    const pathway = RECERT_PATHWAYS[i % RECERT_PATHWAYS.length];
    const keys = [...requiredDocKeys(pathway), ...(p.wrSubject ? ["activity"] : [])];
    const docsDone = ["complete", "ready", "submitted", "recertified"].includes(stage);
    let received = stage === "flagged" ? 0 : stage === "gathering" ? 1 + Math.floor(rng() * (keys.length - 2)) : keys.length;
    const docs = keys.map((k, j) => ({ key: k, name: DOC_LIB[k], status: j < received ? "received" : "pending" }));
    const owners = { gather: stage === "flagged" ? null : pick(rng, RECERT_STAFF), review: docsDone ? pick(rng, RECERT_STAFF) : null };
    const authRep = pick(rng, ["granted", "granted", "granted", "requested"]);
    const submitted = stage === "submitted" || stage === "recertified";
    const subDate = i < 3 ? new Date(Date.now() - (35 + i * 25) * 86400000).toISOString().slice(0,10) : "this cycle";
    const submissions = submitted ? [{ channel: pick(rng, SUBMIT_CHANNELS), trackingNo: "MHC-" + (100000 + Math.floor(rng() * 899999)), date: subDate, by: authRep === "granted" ? "clinic rep" : "patient" }] : [];
    let outcome = null, closedAs = null, pendingItem = null;
    if (stage === "recertified") { if (i < 3) { outcome = "denied_ineligible"; closedAs = "ineligible"; } else { const r = rng(); if (r < 0.65) { outcome = "approved"; closedAs = "renewed"; } else if (r < 0.80) { outcome = "pending"; pendingItem = "Proof of activity hours for prior month"; } else { outcome = "denied_ineligible"; closedAs = "ineligible"; } } }
    // Override tier for urgency — renewal window should drive priority regardless of risk score
    const effectiveTier = p.renewalDays <= 7 ? "high" : p.renewalDays <= 14 ? "high" : p.renewalDays <= 30 ? "moderate" : p.tier;
    return { id: `rc_${p.mrn}`, patient: `${p.first} ${p.last}`, first: p.first, last: p.last, mrn: p.mrn, tier: effectiveTier, lang: p.lang, renewalDays: p.renewalDays, renewalDate: p.renewalDate, stage, pathway, docs, owners, authRep, authRepRec: defaultAuthRec(authRep, i === 1 ? "Verbal — staff attested" : undefined), submissions, attempts: 1, outcome, closedAs, pendingItem, cureDeadline: null, resubmission: false };
  });
  // Inject 3 rework cases (resubmission=true, no closedAs, with cure deadlines)
  const reworkPool = pool.slice(3, 6);
  const reworkItems = ["Missing income verification", "Address mismatch \u2014 proof needed", "Unsigned consent form"];
  reworkPool.forEach((p, j) => {
    const cd = new Date(Date.now() + (3 + j * 4) * 86400000).toISOString().slice(0,10);
    result.push({
      id: "rw_" + p.mrn, patient: p.first + " " + p.last, first: p.first, last: p.last, mrn: p.mrn,
      tier: j === 0 ? "high" : "moderate", lang: p.lang, renewalDays: p.renewalDays, renewalDate: p.renewalDate,
      stage: "gathering", pathway: RECERT_PATHWAYS[j % RECERT_PATHWAYS.length],
      docs: [{ key: "income", name: "Income verification", status: "pending" }],
      owners: { gather: pick(rng, RECERT_STAFF), review: null },
      authRep: "granted", authRepRec: defaultAuthRec("granted"),
      submissions: [{ channel: "MHC portal", trackingNo: "MHC-" + (200000 + j), date: "this cycle", by: "clinic rep" }],
      attempts: 2, outcome: null, closedAs: null,
      pendingItem: reworkItems[j], cureDeadline: cd,
      resubmission: true, fixBy: j === 0 ? "patient" : "internal",
    });
  });
  return result;
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

function FollowUpQueue({ recerts, panel, setView, recertFollowUp }) {
  const today = new Date();
  const [sel, setSel] = React.useState(null);
  const [milFilt, setMilFilt] = React.useState("all"); // all | due30 | due60 | overdue | appeal
  const [outModal, setOutModal] = React.useState(null); // case id
  const [outChoice, setOutChoice] = React.useState(null);
  const [outNote, setOutNote] = React.useState("");

  // Build follow-up list from denied-ineligible closed cases
  const cases = React.useMemo(() => {
    return (recerts||[])
      .filter(c => c.closedAs === "ineligible" && !c.followupClosed)
      .map(c => {
        const closedDate = c.followupDate || c.submissions?.[c.submissions.length-1]?.date || todayStr();
        const daysSince = Math.floor((today - new Date(closedDate)) / 86400000);
        const milestone30 = daysSince >= 30;
        const milestone60 = daysSince >= 60;
        const milestone90 = daysSince >= 90;
        const due30  = daysSince >= 25 && daysSince < 60;
        const due60  = daysSince >= 55 && daysSince < 90;
        const over90 = daysSince >= 90;
        const nextMilestone = milestone90?"90d — appeal rights expire":milestone60?"60d follow-up due":milestone30?"60d follow-up upcoming":"30d follow-up upcoming";
        const urgency = over90?0:due60?1:due30?2:3;
        const monthsLost = Math.max(1, Math.ceil(daysSince / 30));
        const retroValue = monthsLost * 650;
        return { ...c, daysSince, milestone30, milestone60, milestone90, due30, due60, over90, nextMilestone, urgency, retroValue };
      })
      .filter(c => {
        if (milFilt==="due30")   return c.due30;
        if (milFilt==="due60")   return c.due60;
        if (milFilt==="overdue") return c.over90;
        if (milFilt==="appeal")  return c.followupOutcome==="appeal";
        return true;
      })
      .sort((a,b) => a.urgency - b.urgency || a.daysSince - b.daysSince);
  }, [recerts, milFilt]);

  const due30n  = cases.filter(c=>c.due30).length;
  const due60n  = cases.filter(c=>c.due60).length;
  const over90n = cases.filter(c=>c.over90).length;

  const OUTCOMES = [
    { key:"appeal",      label:"Appeal filed",                   sub:"Patient contested denial · tracking appeal status",          color:T.indigo },
    { key:"commercial",  label:"Commercial insurance confirmed",  sub:"Got employer/marketplace coverage · close re-engagement",    color:T.green  },
    { key:"new_app",     label:"New Medicaid application opened", sub:"Circumstances changed · income drop / household change",      color:T.teal   },
    { key:"marketplace", label:"Marketplace referral given",      sub:"Counseled on ACA options · gave HealthCare.gov resources",   color:T.teal   },
    { key:"broker_340b",  label:"340B coverage referral",       sub:"Referred to coverage partner \u2014 premium funded through 340B savings \u00b7 partner reports back on placement", color:T.teal },
    { key:"no_change",   label:"No change — schedule next check", sub:"Still ineligible, no insurance · follow up again",           color:T.amber  },
    { key:"unresponsive",label:"Unresponsive — close",            sub:"3+ attempts, no response · documented outreach · close",     color:T.red    },
  ];

  const Chip = ({active,onClick,children,color=T.indigo}) => (
    <button onClick={onClick} style={{fontSize:11,fontWeight:700,border:`1px solid ${active?color:T.border}`,background:active?color+"14":T.surface,color:active?color:T.textMid,borderRadius:999,padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{background:T.indigo+"0C",border:`1px solid ${T.indigo}33`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.indigo,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Post-denial follow-up</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>Re-engagement · appeals · benefits counseling</div>
          <div style={{fontSize:12,color:T.textMid,marginTop:3}}>30 / 60 / 90-day touchpoints after ineligibility denial · 90-day appeal window</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {[{n:due30n,label:"30d due",color:T.amber},{n:due60n,label:"60d due",color:T.orange},{n:over90n,label:"90d+",color:T.red},{n:"$"+cases.reduce((s,c)=>s+c.retroValue,0).toLocaleString(),label:"retroactive value at stake",color:T.red}].map(s=>(
            <div key={s.label} style={{background:s.color+"14",border:`1px solid ${s.color}44`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:s.color,lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Filter:</span>
        {[["all","All"],["due30","30d due"],["due60","60d due"],["overdue","90d+ overdue"],["appeal","Appeal tracking"]].map(([k,l])=>(
          <Chip key={k} active={milFilt===k} onClick={()=>setMilFilt(k)} color={T.indigo}>{l}</Chip>
        ))}
      </div>

      {/* Empty */}
      {cases.length===0&&(
        <div style={{textAlign:"center",padding:48,color:T.textLo,fontSize:13,border:`1px solid ${T.border}`,borderRadius:12}}>
          {milFilt==="all"?"No post-denial follow-ups needed — all ineligible cases are resolved or closed.":"No cases in this milestone window."}
        </div>
      )}

      {/* Case list */}
      {cases.length>0&&(
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 90px 100px 130px 110px 160px",gap:0,background:T.surface2,padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}>
            {["Patient","Days since","Denial reason","Milestone","Retro value","Next action"].map(h=>(
              <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
            ))}
          </div>
          {cases.map((c,i)=>{
            const milColor = c.over90?T.red:c.due60?T.orange:c.due30?T.amber:T.teal;
            return (
              <div key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)}
                style={{display:"grid",gridTemplateColumns:"1fr 90px 100px 130px 110px 160px",gap:0,padding:"11px 16px",borderBottom:i<cases.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",background:sel===c.id?T.indigo+"06":T.surface}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                onMouseLeave={e=>e.currentTarget.style.background=sel===c.id?T.indigo+"06":T.surface}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.patient}</div>
                  <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{c.mrn} · renews {c.renewalDays}d</div>
                  {c.followupOutcome&&<span style={{fontSize:10.5,fontWeight:700,color:T.indigo,background:T.indigo+"12",border:`1px solid ${T.indigo}33`,borderRadius:6,padding:"1px 7px"}}>Appeal tracking</span>}
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:800,color:milColor}}>{c.daysSince}d</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:11.5,color:T.textMid}}>{c.pendingItem||"Ineligible"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,color:milColor,background:milColor+"12",border:`1px solid ${milColor}44`,borderRadius:7,padding:"2px 8px"}}>{c.nextMilestone}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:T.red}}>{"$"+c.retroValue.toLocaleString()}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={e=>{e.stopPropagation();setOutModal(c.id);setOutChoice(null);setOutNote("");}}
                    style={{fontSize:11,fontWeight:700,color:T.indigo,background:T.indigo+"10",border:`1px solid ${T.indigo}44`,borderRadius:7,padding:"4px 10px",cursor:"pointer"}}>
                    Record outcome
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded panel */}
      {sel&&cases.find(c=>c.id===sel)&&(()=>{
        const c = cases.find(x=>x.id===sel);
        return (
          <div style={{border:`1.5px solid ${T.indigo}44`,borderRadius:12,padding:16,background:T.indigo+"04"}}>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:4}}>{c.patient} · {c.daysSince} days since denial</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
              {[
                {label:"30-day check",done:c.milestone30,color:T.amber},
                {label:"60-day check",done:c.milestone60,color:T.orange},
                {label:"90-day (appeal window)",done:c.milestone90,color:T.red},
              ].map(m=>(
                <div key={m.label} style={{padding:"8px 10px",background:m.done?m.color+"0C":T.surface2,border:`1px solid ${m.done?m.color+"44":T.border}`,borderRadius:9,display:"flex",alignItems:"center",gap:7}}>
                  {m.done?<CheckCircle2 size={13} color={m.color}/>:<Circle size={13} color={T.border}/>}
                  <span style={{fontSize:12,fontWeight:700,color:m.done?m.color:T.textLo}}>{m.label}</span>
                </div>
              ))}
            </div>
            <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Outreach sequence</div>
              <div style={{fontSize:12,color:T.textMid,lineHeight:1.7}}>
                📱 SMS — "Hi [name], we're checking in. Have your health insurance circumstances changed since [date]? Reply 1 if yes, 2 if no."<br/>
                🟣 Mia notification (if installed) — same message via app<br/>
                📞 Phone call if no response in 72hrs — benefits counseling script<br/>
                ✉️ Mail — formal letter with appeal rights and Marketplace info
              </div>
            </div>
            <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
              <div style={{fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Questions to ask</div>
              {["Did your income or household size change since the denial?","Did you start a new job with employer coverage?","Did you enroll in Marketplace / ACA coverage?","Did you or a family member qualify for Medicare or CHIP?","Would you like help filing an appeal? (90-day window from notice date)","Do you need a referral to a benefits counselor?"].map(q=>(
                <div key={q} style={{fontSize:12,color:T.textMid,display:"flex",gap:7,marginBottom:3}}>
                  <span style={{color:T.indigo,flexShrink:0}}>›</span>{q}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Outcome modal */}
      {outModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setOutModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(480px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Record follow-up outcome</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{cases.find(c=>c.id===outModal)?.patient} · {cases.find(c=>c.id===outModal)?.daysSince} days since denial</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              {OUTCOMES.map(o=>(
                <button key={o.key} onClick={()=>setOutChoice(o.key)}
                  style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",border:`1px solid ${outChoice===o.key?o.color:T.border}`,background:outChoice===o.key?o.color+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <div style={{width:14,height:14,borderRadius:999,border:`2px solid ${outChoice===o.key?o.color:T.border}`,flexShrink:0,marginTop:1,background:outChoice===o.key?o.color:"transparent"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{o.label}</div>
                    <div style={{fontSize:11.5,color:T.textLo}}>{o.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            {outChoice==="broker_340b"&&(()=>{
              const pt = cases.find(c=>c.id===outModal);
              return (
                <div style={{background:T.teal+"08",border:"1px solid "+T.teal+"44",borderRadius:10,padding:"10px 12px",marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.4,marginBottom:8}}>
                    340B referral packet — auto-generated
                  </div>
                  {[
                    ["Patient",        pt ? pt.patient+" \u00b7 "+pt.mrn : "\u2014"],
                    ["Denial date",    pt?.followupDate || (pt?.submissions?.slice(-1)[0]||{}).date || "on file"],
                    ["Denial reason",  "Medicaid ineligibility \u2014 income / household"],
                    ["Last active",    pt?.renewalDate || "on file"],
                    ["Clinical flags", (pt?.clinicalFlags||[]).join(", ") || "None disclosed"],
                    ["340B status",    "FQHC-registered patient \u2014 eligible while Medicaid active"],
                    ["Auth-rep",       pt?.authRep==="granted" ? "Consent on file \u2014 clinic authorized to act" : "Patient self-submits"],
                  ].map(function(row){return(
                    <div key={row[0]} style={{display:"flex",gap:8,fontSize:11.5,marginBottom:4}}>
                      <span style={{color:T.teal,flexShrink:0}}>{"\u2713"}</span>
                      <span style={{color:T.textMid,minWidth:110}}>{row[0]}</span>
                      <span style={{color:T.text,fontWeight:600}}>{row[1]}</span>
                    </div>
                  );})}
                  <button style={{marginTop:8,fontSize:11,fontWeight:700,color:T.teal,background:T.teal+"10",border:"1px solid "+T.teal+"44",borderRadius:7,padding:"5px 12px",cursor:"pointer"}}>
                    {"Preview referral packet \u2197"}
                  </button>
                  <div style={{fontSize:10.5,color:T.textLo,marginTop:6}}>
                    {"Production: generates PDF and routes to coverage partner intake endpoint \u00b7 partner reports placement outcome back to CoverageGuard"}
                  </div>
                </div>
              );
            })()}
            <textarea value={outNote} onChange={e=>setOutNote(e.target.value)} placeholder="Notes (optional) — insurance plan name, appeal confirmation number, referral given..."
              style={{width:"100%",boxSizing:"border-box",minHeight:48,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none",marginBottom:12}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setOutModal(null)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
              <button disabled={!outChoice} onClick={()=>{
                if(recertFollowUp) recertFollowUp(outModal,outChoice,outNote);
                setOutModal(null);
              }} style={{...primaryBtn,background:outChoice?T.indigo:T.border,padding:"8px 14px",opacity:outChoice?1:0.45,cursor:outChoice?"pointer":"not-allowed"}}>
                <CheckCircle2 size={13}/> Record outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WREngagementQueue({ panel, addPending, pushAudit }) {
  const [sel, setSel] = React.useState(null);
  const [sentByMrn, setSentByMrn]       = React.useState({});
  const [outcomeByMrn, setOutcomeByMrn] = React.useState({}); // { mrn: { outcome, hours, activity, date } }
  const [logModal, setLogModal]         = React.useState(null);
  const [logHours, setLogHours]         = React.useState("");
  const [logActivity, setLogActivity]   = React.useState("");
  const [logOutcome, setLogOutcome]     = React.useState("");
  const [selectedPath, setSelectedPath] = React.useState({});
  const [inboundToast, setInboundToast] = React.useState(null);

  const PATHWAYS = [
    { key:"employment",  label:"Employment / gig work",   sub:"Log weekly hours · pay stubs or app records",         resource:"https://www.dol.gov" },
    { key:"training",    label:"Job training / SNAP E&T", sub:"Oklahoma SNAP Employment & Training program",          resource:"https://oklahoma.gov/okdhs" },
    { key:"education",   label:"GED / community college", sub:"Education and vocational training qualify",            resource:"https://www.mhec.maryland.gov" },
    { key:"caregiving",  label:"Caregiving",              sub:"Caring for a dependent child or disabled adult",       resource:"https://oklahoma.gov/okdhs" },
    { key:"volunteer",   label:"Volunteer work",          sub:"Nonprofit, faith-based, or community organization",    resource:"https://www.volunteermaryland.org" },
    { key:"jobcenter",   label:"MD American Job Center",  sub:"Free job placement and training services",             resource:"https://www.careeronestop.org" },
  ];

  const SMS_TEMPLATES = {
    employment:  "Hi [name], your Medicaid requires 80 hrs/month of work or qualifying activity. It looks like you do gig/rideshare work — that counts! We can help you document it. Reply 1 to learn how.",
    training:    "Hi [name], your Medicaid has an 80-hr/month activity requirement. Job training and education programs qualify. Oklahoma SNAP E&T can help — reply 1 for a free referral.",
    education:   "Hi [name], did you know GED classes and community college count toward your Medicaid activity requirement? Reply 1 and we'll send you qualifying program info.",
    caregiving:  "Hi [name], caring for a child or disabled family member qualifies for your Medicaid activity requirement. Reply 1 and we can help you document your caregiving hours.",
    volunteer:   "Hi [name], volunteer work at a nonprofit or faith organization qualifies for your Medicaid activity requirement. Reply 1 for a list of qualifying programs near you.",
    jobcenter:   "Hi [name], Oklahoma's American Job Centers offer free help finding work — and connecting to jobs counts toward your Medicaid requirement. Reply 1 to get connected.",
    default:     "Hi [name], your Medicaid coverage requires 80 hrs/month of qualifying activity — this includes work, training, volunteering, or caregiving. Reply 1 to learn more, 2 if you're already doing this.",
  };

  const atRisk = React.useMemo(() => panel
    // dual eligible patients have wrSubject=false — categorically exempt, never appear here
    .filter(p => p.wrSubject && p.wrStatus==="at_risk" &&
      p.probableExemption?.clinician_confirmation_status !== "clinician_confirmed")
    .map(p => ({
      ...p,
      hoursPct: Math.round((p.wrHours||0)/80*100),
      neverContacted: !sentByMrn[p.mrn],
    }))
    .sort((a,b) => a.renewalDays - b.renewalDays), [panel, sentByMrn]);

  const neverContacted = atRisk.filter(p=>p.neverContacted).length;

  const sendResources = (mrn, name, pathway) => {
    const template = SMS_TEMPLATES[pathway] || SMS_TEMPLATES.default;
    const msg = template.replace("[name]", name.split(" ")[0]);
    setSentByMrn(s => ({ ...s, [mrn]: { date: "Today", pathway, msg } }));
    if(pushAudit) pushAudit("wr_engagement", "resources.sent", `${mrn} · ${pathway} · SMS + Mia`);
  };

  const logHoursSubmit = (mrn) => {
    const outcome = logOutcome || "qualifying";
    setOutcomeByMrn(o => ({ ...o, [mrn]: { outcome, hours:logHours, activity:logActivity, date:"Today" } }));
    if(pushAudit) pushAudit("wr_engagement", `response.${outcome}`, `${mrn} · ${logHours}hrs · ${logActivity}`);
    setLogModal(null); setLogHours(""); setLogActivity(""); setLogOutcome("");
  };

  const simulateInbound = (mrn, name) => {
    setSentByMrn(s => ({ ...s, [mrn]: { ...s[mrn], responded: true, respondedDate: "Today" } }));
    setInboundToast({ mrn, name });
    setTimeout(() => setInboundToast(null), 5000);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.amber,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Work requirement engagement</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>At-risk patients · connect to qualifying activities</div>
          <div style={{fontSize:12,color:T.textMid,marginTop:3}}>Subject to 80 hrs/month · not meeting requirement · no confirmed exemption · Dec 31 deadline</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{background:T.red+"12",border:`1px solid ${T.red}44`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:T.red,lineHeight:1}}>{atRisk.length}</div>
            <div style={{fontSize:11,color:T.textMid,marginTop:2}}>at risk</div>
          </div>
          <div style={{background:T.amber+"12",border:`1px solid ${T.amber}44`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:T.amber,lineHeight:1}}>{neverContacted}</div>
            <div style={{fontSize:11,color:T.textMid,marginTop:2}}>not contacted</div>
          </div>
        </div>
      </div>

      {/* Column headers */}
      {atRisk.length===0&&(
        <div style={{padding:32,textAlign:"center",color:T.textLo,fontSize:13,background:T.surface,border:"1px solid "+T.border,borderRadius:12}}>No at-risk patients — all work-requirement subjects are either compliant or have confirmed exemptions.</div>
      )}
      {atRisk.length>0&&(
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 160px",gap:0,background:T.surface2,padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}>
            {["Patient","Hours / 80","Last outreach","Actions"].map(h=>(
              <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
            ))}
          </div>

          {atRisk.map((p,i)=>{
            const isOpen = sel===p.mrn;
            const sent = sentByMrn[p.mrn];
            const hrsColor = p.hoursPct<30?T.red:p.hoursPct<60?T.orange:T.amber;
            const path = selectedPath[p.mrn] || "default";
            return (
              <div key={p.mrn} style={{borderBottom:i<atRisk.length-1?`1px solid ${T.border}`:"none",background:isOpen?T.amber+"04":T.surface}}>
                {/* Main row */}
                <div onClick={()=>setSel(isOpen?null:p.mrn)}
                  style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 160px",gap:0,padding:"11px 16px",cursor:"pointer",alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background=isOpen?T.amber+"04":T.surface}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.first} {p.last}</div>
                    <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{p.mrn} · renews {p.renewalDays}d · <TierPill tier={p.tier} small/></div>
                    {p.wrReason&&<div style={{fontSize:11,color:T.textMid,marginTop:2}}>{p.wrReason.slice(0,60)}{p.wrReason.length>60?"…":""}</div>}
                  </div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{flex:1,height:5,background:T.border,borderRadius:99,overflow:"hidden",maxWidth:60}}>
                        <div style={{height:"100%",width:`${Math.min(p.hoursPct,100)}%`,background:hrsColor,borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:800,color:hrsColor}}>{p.wrHours||0}/80</span>
                    </div>
                  </div>
                  <div>
                    {sent
                      ? <span style={{fontSize:11.5,color:T.green,fontWeight:700}}>{sent.date}</span>
                      : <span style={{fontSize:11.5,color:T.red}}>Never contacted</span>}
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={e=>{e.stopPropagation();sendResources(p.mrn,`${p.first} ${p.last}`,path);}}
                      style={{fontSize:11,fontWeight:700,color:T.tealD,background:T.teal+"12",border:`1px solid ${T.teal}44`,borderRadius:999,padding:"3px 9px",cursor:"pointer"}}>
                      📱 SMS
                    </button>
                    <button onClick={e=>{e.stopPropagation();sendResources(p.mrn,`${p.first} ${p.last}`,path);}}
                      style={{fontSize:11,fontWeight:700,color:T.indigo,background:T.indigo+"10",border:`1px solid ${T.indigo}44`,borderRadius:999,padding:"3px 9px",cursor:"pointer"}}>
                      🟣 Mia
                    </button>
                    {sent&&<button onClick={e=>{e.stopPropagation();setLogModal(p.mrn);setLogHours(String(p.wrHours||0));setLogActivity("");setLogOutcome("");}}
                      style={{fontSize:11,fontWeight:700,color:T.textMid,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"3px 9px",cursor:"pointer"}}>
                      Log hrs
                    </button>}
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen&&(
                  <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`,background:T.surface2}}>
                    {/* SMS preview */}
                    <div style={{background:T.teal+"0A",border:`1px solid ${T.teal}33`,borderRadius:9,padding:"9px 12px",marginBottom:12,fontSize:12,color:T.textMid,lineHeight:1.5}}>
                      <div style={{fontWeight:700,color:T.teal,marginBottom:3,display:"flex",alignItems:"center",gap:6}}><Send size={12}/> SMS preview — select pathway below to customize</div>
                      {(SMS_TEMPLATES[path]||SMS_TEMPLATES.default).replace("[name]",p.first)}
                    </div>

                    {/* Pathway cards */}
                    <div style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Qualifying activity pathways</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
                      {PATHWAYS.map(pw=>(
                        <button key={pw.key} onClick={()=>setSelectedPath(s=>({...s,[p.mrn]:pw.key}))}
                          style={{padding:"8px 10px",border:`1px solid ${path===pw.key?T.amber:T.border}`,background:path===pw.key?T.amber+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left",width:"100%"}}>
                          <div style={{fontSize:12,fontWeight:700,color:path===pw.key?T.amber:T.text}}>{pw.label}</div>
                          <div style={{fontSize:11,color:T.textMid,marginTop:1}}>{pw.sub}</div>
                        </button>
                      ))}
                    </div>

                    {/* Send button */}
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>sendResources(p.mrn,`${p.first} ${p.last}`,path)}
                        style={{flex:1,padding:"10px",background:T.amber,border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <Send size={14}/> Send resources via SMS + Mia
                      </button>
                      <button onClick={()=>{setLogModal(p.mrn);setLogHours(String(p.wrHours||0));setLogActivity("");setLogOutcome("");}}
                        style={{padding:"10px 16px",background:"none",border:`1px solid ${T.border}`,borderRadius:10,fontSize:12,fontWeight:700,color:T.textMid,cursor:"pointer"}}>
                        Log hours
                      </button>
                    </div>
                    {sent&&<div style={{fontSize:11,color:T.green,marginTop:8,textAlign:"center"}}>✓ Resources sent {sent.date} via {sent.pathway||"default"} pathway</div>}
                    {sent&&!outcomeByMrn[p.mrn]&&(
                      <div style={{marginTop:12,border:`1px solid ${T.border}`,borderRadius:9,overflow:"hidden"}}>
                        <div style={{padding:"8px 12px",background:T.surface2,fontSize:11,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Follow-up sequence</div>
                        {[
                          {day:"Day 1–2",action:"Patient receives SMS + Mia notification",status:"sent",color:T.green},
                          {day:"Day 3",  action:"No response → second SMS via Mia (different angle)",status:sent?.responded?"done":null,color:T.amber},
                          {day:"Day 7",  action:"Call prompt — navigator outreach if still no response",status:null,color:T.orange},
                          {day:"Day 14", action:"Final check before renewal deadline window closes",status:null,color:T.red},
                        ].map((s,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                            <span style={{fontSize:11,fontWeight:800,color:s.color,minWidth:52}}>{s.day}</span>
                            <span style={{fontSize:12,color:T.textMid,flex:1}}>{s.action}</span>
                            {s.status==="sent"&&<span style={{fontSize:10.5,fontWeight:700,color:T.green,background:T.green+"12",border:`1px solid ${T.green}33`,borderRadius:999,padding:"1px 8px"}}>sent</span>}
                            {s.status==="done"&&<span style={{fontSize:10.5,fontWeight:700,color:T.teal,background:T.teal+"12",border:`1px solid ${T.teal}33`,borderRadius:999,padding:"1px 8px"}}>responded</span>}
                          </div>
                        ))}
                        <div style={{padding:"9px 12px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:11.5,color:T.textMid}}>Simulate patient reply to test the flow</span>
                          <button onClick={()=>simulateInbound(p.mrn,`${p.first} ${p.last}`)}
                            style={{fontSize:11,fontWeight:700,color:T.amber,background:T.amber+"10",border:`1px solid ${T.amber}44`,borderRadius:999,padding:"4px 12px",cursor:"pointer"}}>
                            Simulate reply
                          </button>
                        </div>
                      </div>
                    )}
                    {outcomeByMrn[p.mrn]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:T.green+"0C",border:`1px solid ${T.green}33`,borderRadius:9}}>
                        <div style={{fontSize:12.5,fontWeight:700,color:T.green,marginBottom:2}}>Outcome recorded — {outcomeByMrn[p.mrn].date}</div>
                        <div style={{fontSize:12,color:T.textMid}}>{outcomeByMrn[p.mrn].activity} · {outcomeByMrn[p.mrn].hours} hrs/mo reported</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {atRisk.length===0&&(
        <div style={{textAlign:"center",padding:48,color:T.textLo,fontSize:13,border:`1px solid ${T.border}`,borderRadius:12}}>
          No at-risk patients — all work-requirement subjects are either compliant or exempt.
        </div>
      )}

      {/* Inbound toast */}
      {inboundToast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:99,background:T.teal,color:"#fff",borderRadius:14,padding:"14px 18px",boxShadow:"-4px 4px 30px rgba(0,0,0,.2)",maxWidth:320}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <CheckCircle2 size={16}/>
            <span style={{fontSize:13,fontWeight:800}}>Patient replied!</span>
            <button onClick={()=>setInboundToast(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          </div>
          <div style={{fontSize:12,opacity:.9}}>{inboundToast.name} replied "1" — interested in resources</div>
          <div style={{fontSize:11.5,marginTop:4,opacity:.8}}>→ Click "Log outcome" to record what they said</div>
        </div>
      )}

      {/* Log outcome modal */}
      {logModal&&(
        <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setLogModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(440px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Log follow-up outcome</div>
            <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{(atRisk.find(p=>p.mrn===logModal)||{}).first} — what did they report?</div>

            <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Outcome *</div>
            {[
              {key:"qualifying", label:"Already qualifying",          sub:"Patient is already doing 80+ hrs — document it",          color:T.green},
              {key:"found",      label:"Found a qualifying activity",  sub:"Connected to a new pathway — schedule monthly check-in",   color:T.teal},
              {key:"exemption",  label:"May qualify for exemption",    sub:"Medical / caregiving situation — route to clinician review",color:T.indigo},
              {key:"unresponsive",label:"Unresponsive — document and close", sub:"3+ attempts, no response — log and flag supervisor",  color:T.red},
            ].map(o=>(
              <button key={o.key} onClick={()=>setLogOutcome(o.key)}
                style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 11px",border:`1px solid ${logOutcome===o.key?o.color:T.border}`,background:logOutcome===o.key?o.color+"0C":T.surface,borderRadius:9,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5}}>
                <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${logOutcome===o.key?o.color:T.border}`,flexShrink:0,marginTop:1,background:logOutcome===o.key?o.color:"transparent"}}/>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{o.label}</div>
                  <div style={{fontSize:11.5,color:T.textLo}}>{o.sub}</div>
                </div>
              </button>
            ))}

            {(logOutcome==="qualifying"||logOutcome==="found")&&(<>
              <label style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:5,marginTop:10}}>Hours this month</label>
              <input type="number" min="0" max="200" value={logHours} onChange={e=>setLogHours(e.target.value)}
                placeholder="e.g. 82" style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",fontSize:14,color:T.text,background:T.surface,outline:"none",marginBottom:8}}/>
              <label style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:5}}>Activity type</label>
              <select value={logActivity} onChange={e=>setLogActivity(e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",fontSize:13,color:T.text,background:T.surface,outline:"none",marginBottom:10}}>
                <option value="">Select activity type...</option>
                {PATHWAYS.map(pw=><option key={pw.key} value={pw.key}>{pw.label}</option>)}
              </select>
            </>)}

            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <button onClick={()=>setLogModal(null)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
              <button disabled={!logOutcome} onClick={()=>logHoursSubmit(logModal)}
                style={{...primaryBtn,background:logOutcome?T.teal:T.border,padding:"8px 14px",opacity:logOutcome?1:0.45,cursor:logOutcome?"pointer":"not-allowed"}}>
                <CheckCircle2 size={13}/> Record outcome
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ReworkQueue({ recerts, panel, setView, recertOutcome, recertResolvePending, recertAdvance }) {
  const [sel, setSel] = React.useState(null);
  const [sortBy, setSortBy] = React.useState("deadline"); // deadline | attempt | tier
  const [fixFilt, setFixFilt] = React.useState("all"); // all | patient | internal

  const today = new Date();

  const cases = React.useMemo(() => {
    let list = (recerts||[]).filter(c => c.resubmission && !c.closedAs);
    if (fixFilt === "patient")  list = list.filter(c => c.fixBy === "patient");
    if (fixFilt === "internal") list = list.filter(c => c.fixBy !== "patient");
    return list.map(c => {
      const daysLeft = c.cureDeadline ? Math.ceil((new Date(c.cureDeadline)-today)/86400000) : null;
      const urgency = daysLeft===null?99:daysLeft<=0?-1:daysLeft;
      const tierN = c.tier==="critical"?0:c.tier==="high"?1:c.tier==="moderate"?2:3;
      return { ...c, daysLeft, urgency, tierN };
    }).sort((a,b) => {
      if (sortBy==="deadline") return a.urgency - b.urgency;
      if (sortBy==="attempt")  return (b.attempts||1) - (a.attempts||1);
      if (sortBy==="tier")     return a.tierN - b.tierN;
      return 0;
    });
  }, [recerts, sortBy, fixFilt]);

  const selCase = cases.find(c => c.id === sel) || null;

  const Chip = ({active, onClick, children, color=T.orange}) => (
    <button onClick={onClick} style={{fontSize:11,fontWeight:700,border:`1px solid ${active?color:T.border}`,background:active?color+"14":T.surface,color:active?color:T.textMid,borderRadius:999,padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{background:T.orange+"0C",border:`1px solid ${T.orange}44`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.orange,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Rework queue</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>State denials requiring correction — all attempts</div>
          <div style={{fontSize:12,color:T.textMid,marginTop:3}}>Both patient-fix and internal-fix cases · sorted by cure deadline urgency</div>
        </div>
        <div style={{background:T.orange+"18",borderRadius:12,padding:"10px 18px",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:36,fontWeight:800,color:T.orange,lineHeight:1}}>{cases.length}</div>
          <div style={{fontSize:11,color:T.textMid,marginTop:2}}>cases requiring rework</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Sort:</span>
        {[["deadline","Cure deadline"],["attempt","Attempt #"],["tier","Patient tier"]].map(([k,l])=>(
          <Chip key={k} active={sortBy===k} onClick={()=>setSortBy(k)}>{l}</Chip>
        ))}
        <div style={{width:1,height:18,background:T.border,margin:"0 4px"}}/>
        <span style={{fontSize:11,fontWeight:700,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>Fix:</span>
        {[["all","All"],["patient","Patient fix"],["internal","Internal fix"]].map(([k,l])=>(
          <Chip key={k} active={fixFilt===k} onClick={()=>setFixFilt(k)}>{l}</Chip>
        ))}
        <button onClick={()=>setView("recert")} style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:T.textMid,background:"none",border:`1px solid ${T.border}`,borderRadius:999,padding:"3px 11px",cursor:"pointer"}}>← Back to Recert tab</button>
      </div>

      {/* Empty state */}
      {cases.length===0&&(
        <div style={{textAlign:"center",padding:48,color:T.textLo,fontSize:13,border:`1px solid ${T.border}`,borderRadius:12}}>
          No rework cases — all State denials have been resolved.
        </div>
      )}

      {/* Case list */}
      {cases.length>0&&(
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 140px 110px 120px",gap:0,background:T.surface2,padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}>
            {["Patient","Attempt","Disputed item","Fix type","Cure deadline"].map(h=>(
              <div key={h} style={{fontSize:10.5,fontWeight:800,color:T.textLo,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
            ))}
          </div>
          {cases.map((c,i)=>{
            const clr = c.daysLeft===null?T.amber:c.daysLeft<=0?T.red:c.daysLeft<=3?T.red:c.daysLeft<=7?T.orange:T.amber;
            const deadlineLabel = c.daysLeft===null?"No deadline":c.daysLeft<=0?"PASSED":c.daysLeft===1?"1 day left":`${c.daysLeft} days`;
            return (
              <div key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)}
                style={{display:"grid",gridTemplateColumns:"1fr 110px 140px 110px 120px",gap:0,padding:"11px 16px",borderBottom:i<cases.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",background:sel===c.id?T.orange+"06":T.surface}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                onMouseLeave={e=>e.currentTarget.style.background=sel===c.id?T.orange+"06":T.surface}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.patient}</div>
                  <div style={{fontSize:11,color:T.textLo,fontFamily:T.mono}}>{c.mrn} · renews {c.renewalDays}d · <TierPill tier={c.tier} small/></div>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:T.orange,background:T.orange+"14",border:`1px solid ${T.orange}44`,borderRadius:7,padding:"3px 9px"}}>Attempt {c.attempts}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:12,color:c.pendingItem?T.text:T.textLo}}>{c.pendingItem||"—"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontSize:11.5,fontWeight:700,color:c.fixBy==="patient"?T.indigo:T.teal,background:c.fixBy==="patient"?T.indigo+"12":T.teal+"12",border:`1px solid ${c.fixBy==="patient"?T.indigo:T.teal}44`,borderRadius:7,padding:"2px 8px"}}>
                    {c.fixBy==="patient"?"Patient fix":"Internal fix"}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:clr}}>{deadlineLabel}</div>
                    {c.cureDeadline&&<div style={{fontSize:10.5,color:T.textLo}}>{c.cureDeadline}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded case panel */}
      {selCase&&(
        <div style={{border:`1.5px solid ${T.orange}55`,borderRadius:12,padding:16,background:T.orange+"04"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:T.text}}>{selCase.patient}</div>
              <div style={{fontSize:11.5,color:T.textMid}}>{selCase.mrn} · {selCase.stage} · attempt {selCase.attempts}</div>
            </div>
            <button onClick={()=>{setView("recert");}} style={{fontSize:12,fontWeight:700,color:T.teal,background:T.teal+"10",border:`1px solid ${T.teal}44`,borderRadius:8,padding:"6px 14px",cursor:"pointer"}}>Open in Recert tab →</button>
          </div>
          {/* Resubmission banner */}
          <div style={{background:T.orange+"0C",border:`1px solid ${T.orange}33`,borderRadius:9,padding:"9px 12px",marginBottom:12,fontSize:12.5,color:T.textMid,lineHeight:1.5}}>
            <div style={{fontWeight:700,color:T.orange,marginBottom:3}}>State returned a correctable denial · {selCase.outcome==="denied_procedural"?"Procedural denial":"RFI"}</div>
            {selCase.pendingItem&&<div>Disputed item: <strong>{selCase.pendingItem}</strong></div>}
            {selCase.cureDeadline&&<div style={{color:selCase.daysLeft<=3?T.red:T.orange,fontWeight:700,marginTop:4}}>
              ⚠️ Cure deadline: {selCase.cureDeadline} · {selCase.daysLeft<=0?"PASSED":selCase.daysLeft===1?"1 day left":`${selCase.daysLeft} days left`}
            </div>}
          </div>
          {/* Fix path */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1,padding:"9px 12px",background:selCase.fixBy==="patient"?T.indigo+"08":T.teal+"08",border:`1px solid ${selCase.fixBy==="patient"?T.indigo:T.teal}33`,borderRadius:9}}>
              <div style={{fontSize:11,fontWeight:800,color:selCase.fixBy==="patient"?T.indigo:T.teal,textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>Fix path</div>
              <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{selCase.fixBy==="patient"?"Patient needs to provide something":"Health center can fix internally"}</div>
              <div style={{fontSize:11.5,color:T.textMid,marginTop:2}}>{selCase.fixBy==="patient"?"Navigator re-outreaches · patient provides correction · re-enters Recert flow":"Navigator corrects document · re-advances in Recert tab"}</div>
            </div>
          </div>
          {/* Quick actions */}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setView("recert")} style={{flex:1,padding:"10px",background:T.orange,border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <RotateCcw size={14}/> Go to case in Recert tab
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function DeterminationKanban({ recerts, recertAdvance, setView }) {
  const [dragging, setDragging] = React.useState(null);
  const stages = RECERT_STAGES;
  const byStage = {};
  stages.forEach(s => { byStage[s.key] = (recerts||[]).filter(c => c.stage === s.key && !c.closedAs); });

  const KCard = ({c, stageColor}) => (
    <div draggable onDragStart={()=>setDragging(c.id)} onDragEnd={()=>setDragging(null)}
      style={{background:"#fff",border:"1px solid "+stageColor+"44",borderRadius:9,padding:"9px 11px",marginBottom:7,cursor:"grab",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:12.5,fontWeight:700,color:T.text,marginBottom:2}}>{c.patient}</div>
      <div style={{fontSize:10.5,color:T.textLo,fontFamily:T.mono,marginBottom:4}}>{c.mrn}</div>
      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:stageColor,background:stageColor+"12",border:"1px solid "+stageColor+"33",borderRadius:4,padding:"1px 6px"}}>{c.tier}</span>
        {c.authRep==="granted"&&<span style={{fontSize:10,color:T.teal,background:T.teal+"10",borderRadius:4,padding:"1px 6px",border:"1px solid "+T.teal+"33"}}>auth-rep</span>}
        {c.attempts>1&&<span style={{fontSize:10,color:T.orange}}>{"attempt "}{c.attempts}</span>}
      </div>
      {c.cureDeadline&&<div style={{fontSize:10,color:T.red,marginTop:4}}>{"Cure deadline: "}{c.cureDeadline}</div>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:T.teal+"0C",border:"1px solid "+T.teal+"33",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:T.teal,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Determination tracker</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>Recertification pipeline — stage by stage</div>
          <div style={{fontSize:12,color:T.textMid,marginTop:3}}>{(recerts||[]).filter(c=>!c.closedAs).length}{" active cases \u00b7 drag to advance stage"}</div>
        </div>
        <button onClick={()=>setView("recert")} style={{fontSize:12,fontWeight:700,color:T.teal,background:T.teal+"10",border:"1px solid "+T.teal+"44",borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>
          {"List view \u2192"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,alignItems:"start"}}>
        {stages.map(s=>(
          <div key={s.key}
            onDragOver={e=>e.preventDefault()}
            onDrop={()=>{if(dragging&&recertAdvance)recertAdvance(dragging,s.key);setDragging(null);}}
            style={{background:s.color+"08",border:"1.5px solid "+s.color+"33",borderRadius:11,padding:"10px 10px 4px",minHeight:120}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:10.5,fontWeight:800,color:s.color,textTransform:"uppercase",letterSpacing:.3}}>{s.label}</span>
              <span style={{fontSize:11,fontWeight:800,color:s.color,background:s.color+"18",borderRadius:999,padding:"1px 7px"}}>{(byStage[s.key]||[]).length}</span>
            </div>
            {(byStage[s.key]||[]).map(c=><KCard key={c.id} c={c} stageColor={s.color}/>)}
            {(byStage[s.key]||[]).length===0&&(
              <div style={{fontSize:11,color:T.textLo,textAlign:"center",padding:"12px 0",borderRadius:7,border:"1px dashed "+T.border}}>Empty</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecertView({ recerts, panel, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth, narrow, addPending }) {
  const [sel, setSel] = useState(null);
  const [mine, setMine] = useState(false);
  const [stageTab, setStageTab] = useState("flagged");
  const [reworkOnly, setReworkOnly] = useState(false);
  const selCase = recerts.find((c) => c.id === sel) || null;
  const counts = {}; RECERT_STAGES.forEach((s) => (counts[s.key] = recerts.filter((c) => c.stage === s.key).length));
  const reworkCount = recerts.filter(c => c.resubmission).length;
  const filt = (c) => (!mine || isMineCase(c)) && (!reworkOnly || c.resubmission);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {RECERT_STAGES.map((s) => <Stat key={s.key} icon={s.icon} label={s.label} value={counts[s.key]} tone={s.color} foot={s.blurb} />)}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setMine((m) => !m)} style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,border:`1px solid ${mine?T.teal:T.border}`,background:mine?T.teal+"12":T.surface,color:mine?T.tealD:T.textMid,borderRadius:9,padding:"7px 12px",cursor:"pointer"}}><UserPlus size={14}/> {mine?"Showing my assignments":"My assignments"}</button>
        <button onClick={() => setReworkOnly(r => !r)} style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,border:`1.5px solid ${reworkOnly?T.orange:reworkCount>0?T.orange+"66":T.border}`,background:reworkOnly?T.orange+"14":reworkCount>0?T.orange+"06":T.surface,color:reworkOnly?T.orange:reworkCount>0?T.orange:T.textMid,borderRadius:9,padding:"7px 12px",cursor:"pointer"}}>
          <RotateCcw size={14}/> Rework required
          {reworkCount>0&&<span style={{fontSize:11,fontWeight:800,background:reworkOnly?T.orange:T.orange+"22",color:reworkOnly?"#fff":T.orange,borderRadius:999,padding:"0 7px"}}>{reworkCount}</span>}
        </button>
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
              <div key={s.key} id={`recert-col-${s.key}`} style={{ background: T.surface2, border: `1px solid ${stageTab===s.key?s.color:T.border}`, borderRadius: 12, padding: 10, minHeight: 120, transition:"border-color .2s" }}>
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

      {selCase && <RecertDrawer c={selCase} onClose={() => setSel(null)} panel={panel} recertSetDoc={recertSetDoc} recertAssign={recertAssign} recertAdvance={recertAdvance} recertSubmit={recertSubmit} recertOutcome={recertOutcome} recertResolvePending={recertResolvePending} recertSetAuthRep={recertSetAuthRep} recertAuth={recertAuth} addPending={addPending} />}
    </div>
  );
}

function RecertCard({ c, onClick }) {
  const pr = recertProgress(c);
  const ready = pr.all && c.stage === "gathering";
  const isRework = c.resubmission;
  const daysLeft = c.cureDeadline ? Math.ceil((new Date(c.cureDeadline)-new Date())/(86400000)) : null;
  const cureColor = daysLeft===null?T.orange:daysLeft<=3?T.red:daysLeft<=7?T.orange:T.amber;
  return (
    <div onClick={onClick} style={{background:T.surface,border:`${isRework?"1.5px":"1px"} solid ${isRework?T.orange+"88":T.border}`,borderRadius:10,padding:11,cursor:"pointer",position:"relative",background:isRework?T.orange+"05":T.surface}}>
      {/* Rework badge — top right corner */}
      {isRework&&(
        <div style={{position:"absolute",top:-1,right:-1,background:T.orange+"18",border:`1px solid ${T.orange}55`,borderRadius:"0 10px 0 8px",padding:"2px 9px",display:"flex",alignItems:"center",gap:4}}>
          <RotateCcw size={10} color={T.orange}/>
          <span style={{fontSize:10,fontWeight:800,color:T.orange}}>Rework · attempt {c.attempts}</span>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:isRework?4:0}}>
        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{c.first} {c.last}</span>
        <TierPill tier={c.tier} small />
      </div>
      <div style={{fontSize:10.5,color:T.textLo,fontFamily:T.mono,marginTop:1}}>{c.mrn} · renews {c.renewalDays}d</div>
      {/* Cure deadline — prominent when rework */}
      {isRework&&daysLeft!==null&&(
        <div style={{display:"flex",alignItems:"center",gap:5,margin:"5px 0",padding:"3px 8px",background:cureColor+"12",border:`1px solid ${cureColor}44`,borderRadius:7}}>
          <Clock size={11} color={cureColor}/>
          <span style={{fontSize:10.5,fontWeight:700,color:cureColor}}>
            {daysLeft<=0?"Cure deadline passed":daysLeft===1?"1 day left — cure deadline":`${daysLeft} days — cure by ${c.cureDeadline}`}
          </span>
        </div>
      )}
      {/* Disputed doc */}
      {isRework&&c.pendingItem&&(
        <div style={{fontSize:10.5,color:T.orange,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
          <AlertTriangle size={11}/> State disputed: {c.pendingItem}
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap"}}>
        <Badge c={T.indigo}>{PATHWAY_LABEL[c.pathway]||"—"}</Badge>
        {c.source==="intake"&&<Badge c={T.teal} bg={T.teal+"1A"}>from intake</Badge>}
        {c.authRep&&<Badge c={AUTHREP[c.authRep].c}>{AUTHREP[c.authRep].label}</Badge>}
        {isRework&&c.fixBy==="patient"&&<Badge c={T.indigo}>Patient fix</Badge>}
        {isRework&&c.fixBy==="internal"&&<Badge c={T.teal}>Internal fix</Badge>}
      </div>
      {(c.stage==="flagged"||c.stage==="gathering"||c.stage==="complete")&&(
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1}}><MiniBar value={pr.pct} color={pr.all?T.green:isRework?T.orange:T.indigo}/></div>
          <span style={{fontSize:10.5,fontWeight:700,color:pr.all?T.green:T.textMid,fontVariantNumeric:"tabular-nums"}}>{pr.r}/{pr.total}</span>
        </div>
      )}
      {c.stage==="submitted"&&c.submissions[0]&&<div style={{marginTop:9,fontSize:10.5,color:T.textMid,fontFamily:T.mono}}>#{c.submissions[0].trackingNo} · {c.submissions[0].channel}</div>}
      {c.stage==="recertified"&&c.outcome&&<div style={{marginTop:9}}><span style={{fontSize:10.5,fontWeight:700,color:OUTCOME[c.outcome].c,background:OUTCOME[c.outcome].c+"16",border:`1px solid ${OUTCOME[c.outcome].c}44`,borderRadius:999,padding:"2px 8px"}}>{c.closedAs?(c.closedAs==="renewed"?"Closed — Renewed":"Closed — Ineligible"):OUTCOME[c.outcome].label}</span></div>}
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:T.textLo}}>gather:</span>
        <Badge c={c.owners.gather?(c.owners.gather==="You"?T.teal:T.textMid):T.textLo}>{c.owners.gather||"unassigned"}</Badge>
        {c.owners.review&&<><span style={{fontSize:10,color:T.textLo}}>review:</span><Badge c={c.owners.review==="You"?T.teal:T.textMid}>{c.owners.review}</Badge></>}
      </div>
      {ready&&!isRework&&<div style={{marginTop:8,fontSize:10.5,color:T.green,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><CheckCircle2 size={12}/> All documents received — ready to advance</div>}
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

function RecertDrawer({ c, onClose, panel, recertSetDoc, recertAssign, recertAdvance, recertSubmit, recertOutcome, recertResolvePending, recertSetAuthRep, recertAuth, addPending }) {
  // Auto-assign "You" on open if flagged and unassigned — single-navigator FQHC support
  React.useEffect(() => {
    if (c.stage === "flagged" && !c.owners.gather) {
      recertAssign(c.id, "all", "You", c.patient);
    }
  }, [c.id]);
  const pr = recertProgress(c);
  const stageIdx = STAGE_ORDER.indexOf(c.stage);
  const canAdvance = c.stage === "flagged" ? true : c.stage === "gathering" ? pr.all : c.stage === "complete" ? true : false;
  // Resubmission context — route back to appropriate queue
  const isResubmission = c.resubmission && c.stage === "gathering";
  const patientFix = c.fixBy === "patient";
  const advanceLabel = isResubmission
    ? patientFix
      ? "Return to Docs pending queue →"
      : "Correction complete — mark documents ready →"
    : { flagged: "Start gathering documents", gathering: "Mark documents complete →", complete: "Move to Ready to submit →" }[c.stage];
  const advanceNote = c.stage === "gathering" && !pr.all ? `${pr.total - pr.r} document(s) still pending` : null;
  const [channel, setChannel] = useState(SUBMIT_CHANNELS[0]);
  const [trackingNo, setTrackingNo] = useState("");
  const [subBy, setSubBy] = useState(c.authRep === "granted" ? "clinic rep" : "patient");
  const [outc, setOutc]           = useState("approved");
  const [detail, setDetail]       = useState("");
  const [rfiItem, setRfiItem]     = useState("");
  const [cureDeadline, setCureDeadline] = useState("");
  const [showDetModal, setShowDetModal] = useState(false);
  const [rerouteModal, setRerouteModal] = useState(false);
  const [rerouteNote, setRerouteNote] = useState("");
  const [fixBy, setFixBy] = useState("internal"); // "internal" | "patient" 
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
               {(()=>{
                 const isRfi = c.stage === "rfi";
                 const rfiKey = isRfi ? rfiDocKey(c.pendingItem) : null;
                 return c.docs.map((d) => {
                 const got = d.status === "received";
                 const art = d.artifact || null;
                 const isDisputed    = isRfi && rfiKey === d.key;
                 const isGreyed      = isRfi && got && !isDisputed;
                 const needsNewUpload= isDisputed && got;
                 const curedVersion  = isDisputed && art?.rfiCure;
                 const SOURCE_ICON  = {sms:"📱",mia:"🟣",fax:"📠",email:"📧",scan:"🖨️",attest:"✍️",manual:"✅",generated:"⚙️"};
                 const SOURCE_LABEL = {sms:"Uploaded via SMS link",mia:"Uploaded via Mia",fax:"Received by fax",email:"Received by email",scan:"Scanned at visit",attest:"Self-attestation signed",manual:"Manually confirmed",generated:"System-generated"};
                 const mkArt = (src2) => ({
                   filename:`${d.key}_${c.mrn}_${src2}${isDisputed?"_v2":""}.pdf`,
                   source:src2,
                   receivedDate:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
                   rfiCure: isDisputed || undefined,
                 });
                 const borderColor = isDisputed?T.red+"66":isGreyed?T.border:got?T.green+"44":T.border;
                 const bgColor     = isDisputed?T.red+"08":isGreyed?T.surface2:got?T.green+"0C":T.surface2;
                 return (
                   <div key={d.key} style={{border:`1px solid ${borderColor}`,borderRadius:9,overflow:"hidden",opacity:isGreyed?0.5:1,marginBottom:0}}>
                     <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:bgColor}}>
                       <span style={{color:isDisputed?T.red:isGreyed?T.textLo:got?T.green:T.textLo,flex:"0 0 auto"}}>
                         {isDisputed?<AlertTriangle size={17}/>:got?<CheckCircle2 size={17}/>:<Circle size={17}/>}
                       </span>
                       <div style={{flex:1}}>
                         <div style={{fontSize:12.5,fontWeight:600,color:isDisputed?T.red:isGreyed?T.textLo:got?T.text:T.textMid}}>{d.name}</div>
                         {isDisputed&&<div style={{fontSize:11,color:T.red,fontWeight:700,marginTop:2}}>
                           ⚠️ State disputed — new version required{c.cureDeadline?` · cure by ${c.cureDeadline}`:""}
                         </div>}
                         {isDisputed&&needsNewUpload&&art&&!curedVersion&&<div style={{fontSize:11,color:T.textLo,marginTop:2,display:"flex",alignItems:"center",gap:5,textDecoration:"line-through"}}>
                           <span>{SOURCE_ICON[art.source]||"📄"}</span><span>{art.filename}</span>
                           <span style={{color:T.red,textDecoration:"none",fontWeight:700}}>· rejected</span>
                         </div>}
                         {isDisputed&&curedVersion&&art&&<div style={{fontSize:11,color:T.green,marginTop:2,display:"flex",alignItems:"center",gap:5}}>
                           <CheckCircle2 size={11} color={T.green}/><span>New version on file · {art.receivedDate}</span>
                         </div>}
                         {!isDisputed&&got&&art&&!isGreyed&&<div style={{fontSize:11,color:T.textLo,marginTop:2,display:"flex",alignItems:"center",gap:5}}>
                           <span>{SOURCE_ICON[art.source]||"📄"}</span>
                           <span>{SOURCE_LABEL[art.source]||art.source}</span>
                           <span style={{color:T.border}}>·</span>
                           <span style={{fontFamily:T.mono}}>{art.receivedDate}</span>
                         </div>}
                       </div>
                       {isGreyed?null:isDisputed&&!curedVersion?(
                         <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                           {[{src:"sms",icon:"📱",tip:"SMS upload"},{src:"scan",icon:"🖨️",tip:"Scan at visit"},{src:"fax",icon:"📠",tip:"Fax"},{src:"attest",icon:"✍️",tip:"Self-attest"}].map(opt=>(
                             <button key={opt.src} title={opt.tip} onClick={()=>recertSetDoc(c.id,d.key,"received",c.patient,d.name,mkArt(opt.src))}
                               style={{fontSize:14,background:"none",border:`1px solid ${T.red}55`,borderRadius:7,padding:"3px 7px",cursor:"pointer",lineHeight:1}}>{opt.icon}</button>
                           ))}
                           <button onClick={()=>recertSetDoc(c.id,d.key,"received",c.patient,d.name,mkArt("manual"))}
                             style={{fontSize:11,fontWeight:700,border:`1px solid ${T.red}`,background:T.red+"12",color:T.red,borderRadius:7,padding:"4px 9px",cursor:"pointer",whiteSpace:"nowrap"}}>Upload new version</button>
                         </div>
                       ):isDisputed&&curedVersion?(
                         <span style={{fontSize:11,fontWeight:700,color:T.green,background:T.green+"12",border:`1px solid ${T.green}44`,borderRadius:7,padding:"4px 9px"}}>✓ New version on file</span>
                       ):got&&art?(
                         <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                           <button style={{fontSize:11,fontWeight:700,border:`1px solid ${T.teal}55`,background:T.teal+"10",color:T.tealD,borderRadius:7,padding:"4px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                             <Download size={11}/> {art.filename}
                           </button>
                           <button onClick={()=>recertSetDoc(c.id,d.key,"pending",c.patient,d.name,null)} style={{fontSize:10,fontWeight:700,border:`1px solid ${T.border}`,background:T.surface,color:T.textMid,borderRadius:7,padding:"4px 7px",cursor:"pointer"}}>✕</button>
                         </div>
                       ):(
                         <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                           {[{src:"sms",icon:"📱",tip:"SMS upload link"},{src:"scan",icon:"🖨️",tip:"Scanned at visit"},{src:"fax",icon:"📠",tip:"Fax received"},{src:"attest",icon:"✍️",tip:"Self-attestation"}].map(opt=>(
                             <button key={opt.src} title={opt.tip} onClick={()=>recertSetDoc(c.id,d.key,"received",c.patient,d.name,mkArt(opt.src))}
                               style={{fontSize:14,background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"3px 7px",cursor:"pointer",lineHeight:1}}
                               onMouseEnter={e=>e.currentTarget.style.borderColor=T.teal}
                               onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>{opt.icon}</button>
                           ))}
                           <button onClick={()=>recertSetDoc(c.id,d.key,"received",c.patient,d.name,mkArt("manual"))}
                             style={{fontSize:11,fontWeight:700,border:`1px solid ${T.green}`,background:T.green+"12",color:T.green,borderRadius:7,padding:"4px 9px",cursor:"pointer",whiteSpace:"nowrap"}}>Mark received</button>
                         </div>
                       )}
                     </div>
                     {(!got||(isDisputed&&!curedVersion))&&!isGreyed&&(
                       <div style={{padding:"5px 11px 6px 38px",background:T.surface,fontSize:11,color:isDisputed?T.red:T.textLo,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",borderTop:`1px solid ${isDisputed?T.red+"33":T.border}`}}>
                         <span>{isDisputed?"Request new version:":"Send upload request:"}</span>
                         {[{src:"sms",label:"📱 SMS"},{src:"mia",label:"🟣 Mia"},{src:"email",label:"📧 Email"}].map(opt=>(
                           <button key={opt.src} onClick={()=>recertSetDoc(c.id,d.key,"received",c.patient,d.name,mkArt(opt.src))}
                             style={{fontSize:11,fontWeight:700,border:`1px solid ${isDisputed?T.red+"44":T.indigo+"44"}`,background:isDisputed?T.red+"0C":T.indigo+"0C",color:isDisputed?T.red:T.indigo,borderRadius:999,padding:"2px 10px",cursor:"pointer"}}>{opt.label}</button>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               });})()}
             </div>
            {/* CG-FA-01 — injected when clinician confirms exemption */}
            {(() => {
              const pp = panel && panel.find(x => x.mrn === c.mrn);
              const ex = pp && pp.probableExemption;
              if (!ex || ex.clinician_confirmation_status !== "clinician_confirmed") return null;
              const artifact = ex.attestation_artifact || `CG-FA-01_${c.mrn}.pdf`;
              const sigDate = ex.confirmedDate || "Aug 22, 2026";
              return (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",border:`1px solid ${T.teal}55`,borderRadius:9,background:T.teal+"0A",marginTop:6}}>
                  <CheckCircle2 size={17} color={T.teal}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>Exemption attestation · CG-FA-01</div>
                    <div style={{fontSize:11,color:T.textLo,marginTop:1}}>Clinician signed · {sigDate} · {ex.exemption_category||"Medically frail"} · {ex.rule_id||"EXR"} · included in auth-rep packet</div>
                  </div>
                  <button style={{fontSize:11,fontWeight:700,border:`1px solid ${T.teal}55`,background:T.teal+"12",color:T.tealD,borderRadius:7,padding:"5px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                    <Download size={11}/> {artifact}
                  </button>
                </div>
              );
            })()}
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

          {/* ── REROUTE BUTTON — available pre-submission ── */}
          {!["submitted","rfi","recertified"].includes(c.stage) && (
            <div style={{paddingTop:10,borderTop:`1px solid ${T.border}`,marginTop:10}}>
              <button onClick={()=>{setRerouteModal(true);setRerouteNote("");}}
                style={{width:"100%",justifyContent:"center",display:"inline-flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,color:T.textMid,background:"none",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px",cursor:"pointer"}}>
                <ArrowRight size={13}/> Re-route to navigator queue
              </button>
            </div>
          )}

          {/* Reroute modal */}
          {rerouteModal&&(
            <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setRerouteModal(false)}>
              <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(440px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>
                <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>Re-route to navigator queue</div>
                <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>{c.patient} · currently in <strong>{c.stage}</strong> stage · case will move to Docs pending queue</div>
                <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Why is this being re-routed? *</div>
                {[
                  "Patient needs to provide additional documents",
                  "Patient contact info changed — re-verify",
                  "Income / household change reported — restart intake",
                  "Consent to represent needs to be re-captured",
                  "Navigator error — incorrect documents collected",
                  "Patient requested to handle submission themselves",
                ].map(opt=>(
                  <button key={opt} onClick={()=>setRerouteNote(opt)}
                    style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",border:`1px solid ${rerouteNote===opt?T.indigo:T.border}`,background:rerouteNote===opt?T.indigo+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5,fontSize:12.5}}>
                    <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${rerouteNote===opt?T.indigo:T.border}`,flexShrink:0,background:rerouteNote===opt?T.indigo:"transparent"}}/>
                    {opt}
                  </button>
                ))}
                <input value={rerouteNote.startsWith("Patient needs")||rerouteNote.startsWith("Income")||rerouteNote.startsWith("Patient contact")||rerouteNote.startsWith("Consent")||rerouteNote.startsWith("Navigator")||rerouteNote.startsWith("Patient requested")?"":rerouteNote}
                  onChange={e=>setRerouteNote(e.target.value)}
                  placeholder="Or type a custom reason..."
                  style={{width:"100%",boxSizing:"border-box",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,color:T.text,background:T.surface,outline:"none",marginTop:4,marginBottom:12}}/>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>setRerouteModal(false)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                  <button disabled={!rerouteNote} onClick={()=>{
                    if(addPending) addPending(c.mrn,{
                      type:"pending_docs",
                      label:`Re-routed from ${c.stage} — ${rerouteNote}`,
                      channel:"navigator",
                      sentAt:new Date().toISOString(),
                      followUpHrs:24,
                      id:String(Date.now())+c.mrn,
                    });
                    setRerouteModal(false);
                    if(onClose) onClose();
                  }} style={{...primaryBtn,background:rerouteNote?T.indigo:T.border,padding:"8px 14px",opacity:rerouteNote?1:0.45,cursor:rerouteNote?"pointer":"not-allowed"}}>
                    <ArrowRight size={13}/> Re-route to navigator queue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* stage action */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            {(c.stage === "flagged" || c.stage === "gathering" || c.stage === "complete") && (
              <>
                {c.resubmission && <div style={{ fontSize: 11.5, color: T.orange, background: T.orange + "12", border: `1px solid ${T.orange}44`, borderRadius: 9, padding: "9px 11px", marginBottom: 10, display: "flex", gap: 7 }}><AlertTriangle size={14} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>Resubmission · attempt {c.attempts}.</b> {c.outcome === "denied_procedural" ? "State returned a correctable denial." : ""} {c.cureDeadline}. Fix the flagged item and re-submit.</span></div>}
                <button disabled={!canAdvance} onClick={() => recertAdvance(c.id, c.patient)}
                  style={{ width:"100%", justifyContent:"center", display:"inline-flex", alignItems:"center", gap:8,
                    background: canAdvance ? (isResubmission&&patientFix?T.indigo:isResubmission?T.teal:T.ink) : T.border,
                    color: canAdvance?"#fff":T.textLo, border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700,
                    cursor: canAdvance?"pointer":"not-allowed" }}>
                  {isResubmission&&patientFix?<Users size={15}/>:isResubmission?<CheckCircle2 size={15}/>:<ArrowRight size={15}/>}
                  {advanceLabel}
                </button>
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
                {/* Submission on file */}
                <div style={{fontSize:12,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Submission on file</div>
                {c.submissions.map((s,i) => (
                  <div key={i} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 11px",marginBottom:10}}>
                    <div style={{fontSize:12.5,fontWeight:700,fontFamily:T.mono}}>#{s.trackingNo}</div>
                    <div style={{fontSize:11,color:T.textMid}}>{s.channel} · by {s.by} · {s.date}</div>
                  </div>
                ))}

                {/* Determination awaiting */}
                <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:10,padding:"10px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <Clock size={15} color={T.amber}/>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:700,color:T.amber}}>Awaiting State determination</div>
                    <div style={{fontSize:11.5,color:T.textMid}}>MDH / MHC typically responds within 45 days · Eligibility Sentinel monitors nightly CRISP feed</div>
                  </div>
                </div>

                {/* Four outcome cards */}
                <div style={{fontSize:12,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:8}}>Record determination</div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                  {[
                    {key:"approved",       icon:"✅", label:"Approved",           sub:"Coverage renewed · new period confirmed",                     color:T.green},
                    {key:"rfi",            icon:"📋", label:"RFI — info needed",  sub:"State requesting additional documentation",                   color:T.amber},
                    {key:"denied_procedural",icon:"🔄",label:"Denied — procedural",sub:"Resubmit with correction within cure window",                color:T.orange},
                    {key:"denied_ineligible",icon:"❌",label:"Denied — ineligible", sub:"Substantive denial · appeal rights attach",                 color:T.red},
                  ].map(opt=>(
                    <button key={opt.key} onClick={()=>{
                      setOutc(opt.key);
                      setRfiItem(""); setDetail("");
                      // Pre-fill cure deadline: +10d RFI, +30d procedural
                      const d = new Date();
                      if(opt.key==="rfi")               d.setDate(d.getDate()+10);
                      else if(opt.key==="denied_procedural") d.setDate(d.getDate()+30);
                      setCureDeadline(opt.key==="rfi"||opt.key==="denied_procedural" ? d.toISOString().slice(0,10) : "");
                      if(opt.key==="denied_procedural") setFixBy("internal");
                      setShowDetModal(true);
                    }}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",border:`1px solid ${outc===opt.key?opt.color:T.border}`,background:outc===opt.key?opt.color+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left",width:"100%"}}>
                      <span style={{fontSize:18,flexShrink:0}}>{opt.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.text}}>{opt.label}</div>
                        <div style={{fontSize:11.5,color:T.textLo}}>{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── DETERMINATION MODAL ── */}
            {showDetModal&&(
              <div style={{position:"fixed",inset:0,zIndex:95,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(14,23,38,.5)"}} onClick={()=>setShowDetModal(false)}>
                <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:16,padding:22,width:"min(480px,94vw)",boxShadow:"-4px 4px 40px rgba(0,0,0,.22)"}}>

                  {outc==="approved"&&(<>
                    <div style={{textAlign:"center",padding:"10px 0 14px"}}>
                      <div style={{fontSize:36,marginBottom:8}}>✅</div>
                      <div style={{fontSize:16,fontWeight:800,color:T.text}}>Approved — coverage renewed</div>
                      <div style={{fontSize:12.5,color:T.textMid,marginTop:4}}>{c.patient} · {c.renewalDate||"renewal period confirmed"}</div>
                    </div>
                    <div style={{background:T.green+"0C",border:`1px solid ${T.green}33`,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
                      {[
                        "Medicaid renewed · new coverage period starts on effective date",
                        "MCO enrollment confirmed on next roster file",
                        "Eligibility Sentinel re-verifies on nightly CRISP sweep",
                        "Case closes · no further action needed",
                      ].map(s=><div key={s} style={{fontSize:12,color:T.textMid,display:"flex",gap:7,marginBottom:4}}><CheckCircle2 size={12} color={T.green} style={{flexShrink:0,marginTop:2}}/>{s}</div>)}
                    </div>
                    <button onClick={()=>{recertOutcome(c.id,"approved","");setShowDetModal(false);}} style={{width:"100%",padding:"11px",background:T.green,border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <CheckCircle2 size={15}/> Confirm — close case
                    </button>
                  </>)}

                  {outc==="rfi"&&(<>
                    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>📋 RFI — State requesting information</div>
                    <div style={{fontSize:11.5,color:T.textMid,marginBottom:14}}>State could not verify this item ex parte. Navigator must respond before the cure deadline or coverage lapses.</div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:5}}>What is the State asking for? *</div>
                      {["Proof of income","Proof of residency","Citizenship / immigration docs","Household composition","Work activity documentation","Other — specify below"].map(opt=>(
                        <button key={opt} onClick={()=>setRfiItem(opt)}
                          style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",border:`1px solid ${rfiItem===opt?T.amber:T.border}`,background:rfiItem===opt?T.amber+"0C":T.surface,borderRadius:8,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:5,fontSize:12.5}}>
                          <div style={{width:13,height:13,borderRadius:999,border:`2px solid ${rfiItem===opt?T.amber:T.border}`,flexShrink:0,background:rfiItem===opt?T.amber:"transparent"}}/>
                          {opt}
                        </button>
                      ))}
                      {rfiItem==="Other — specify below"&&<input value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Describe what the State is requesting" style={{...drawerInput,marginTop:4}}/>}
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:14}}>
                      <label style={{flex:1,fontSize:11,color:T.textMid}}>Cure deadline *<br/>
                        <input type="date" value={cureDeadline} onChange={e=>setCureDeadline(e.target.value)} style={{...drawerInput,marginTop:3}}/>
                      </label>
                    </div>
                    <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}33`,borderRadius:9,padding:"9px 12px",fontSize:12,color:T.textMid,marginBottom:14}}>
                      Once recorded, this case surfaces as a <strong>cure item</strong> in the Recert drawer. Navigator gathers the document and resubmits before the deadline.
                    </div>
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowDetModal(false)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                      <button disabled={!rfiItem||!cureDeadline} onClick={()=>{
                        recertOutcome(c.id,"pending",rfiItem==="Other — specify below"?detail:rfiItem,cureDeadline);
                        setShowDetModal(false);
                      }} style={{...primaryBtn,background:T.amber,borderColor:T.amber,padding:"8px 14px",opacity:(rfiItem&&cureDeadline)?1:0.45,cursor:(rfiItem&&cureDeadline)?"pointer":"not-allowed"}}>
                        <Clock size={13}/> Record RFI · create cure item
                      </button>
                    </div>
                  </>)}

                  {outc==="denied_procedural"&&(<>
                    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>🔄 Denied — procedural · attempt {(c.attempts||1)+1}</div>
                    <div style={{fontSize:11.5,color:T.textMid,marginBottom:12}}>Not a substantive denial — coverage can be restored by resubmitting with the correction.</div>

                    {/* Who fixes it */}
                    <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:6}}>Who needs to fix this? *</div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      {[
                        {key:"internal", icon:"🏥", label:"Health center can fix", sub:"Missing signature, wrong form, internal correction — stays in Recert tab"},
                        {key:"patient",  icon:"👤", label:"Patient needs to provide something", sub:"Missing doc, new income proof, ID — back to navigator queue"},
                      ].map(opt=>(
                        <button key={opt.key} onClick={()=>setFixBy(opt.key)}
                          style={{flex:1,padding:"10px 11px",border:`1.5px solid ${fixBy===opt.key?T.orange:T.border}`,background:fixBy===opt.key?T.orange+"0C":T.surface,borderRadius:9,cursor:"pointer",textAlign:"left"}}>
                          <div style={{fontSize:16,marginBottom:3}}>{opt.icon}</div>
                          <div style={{fontSize:12.5,fontWeight:700,color:T.text,marginBottom:2}}>{opt.label}</div>
                          <div style={{fontSize:11,color:T.textLo,lineHeight:1.4}}>{opt.sub}</div>
                        </button>
                      ))}
                    </div>

                    {/* What to fix */}
                    <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:5}}>What needs to be corrected? *</div>
                    <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Describe the correction — missing doc, wrong form, signature gap, etc."
                      style={{width:"100%",boxSizing:"border-box",minHeight:52,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none",marginBottom:10}}/>

                    <label style={{fontSize:11,color:T.textMid,display:"block",marginBottom:14}}>Cure window deadline *<br/>
                      <input type="date" value={cureDeadline} onChange={e=>setCureDeadline(e.target.value)} style={{...drawerInput,marginTop:3}}/>
                    </label>

                    {/* Routing preview */}
                    <div style={{background:T.orange+"0C",border:`1px solid ${T.orange}33`,borderRadius:9,padding:"9px 12px",fontSize:12,color:T.textMid,marginBottom:14,lineHeight:1.5}}>
                      {fixBy==="patient"
                        ? <><strong>Patient fix:</strong> Case moves to <strong>Docs pending queue</strong> — navigator re-outreaches, patient provides correction, then re-enters Recert flow.</>
                        : <><strong>Internal fix:</strong> Case returns to <strong>Gathering documents</strong> in Recert tab — navigator corrects and resubmits directly.</>}
                    </div>

                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowDetModal(false)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                      <button disabled={!detail||!cureDeadline} onClick={()=>{
                        recertOutcome(c.id,"denied_procedural",detail,cureDeadline,fixBy);
                        setShowDetModal(false);
                      }} style={{...primaryBtn,background:T.orange,borderColor:T.orange,padding:"8px 14px",opacity:(detail&&cureDeadline)?1:0.45,cursor:(detail&&cureDeadline)?"pointer":"not-allowed"}}>
                        <ArrowRight size={13}/>
                        {fixBy==="patient" ? "Record · send to navigator queue" : "Record · return to gathering"}
                      </button>
                    </div>
                  </>)}

                  {outc==="denied_ineligible"&&(<>
                    <div style={{textAlign:"center",padding:"10px 0 14px"}}>
                      <div style={{fontSize:36,marginBottom:8}}>❌</div>
                      <div style={{fontSize:16,fontWeight:800,color:T.text}}>Denied — ineligible</div>
                      <div style={{fontSize:12.5,color:T.textMid,marginTop:4}}>{c.patient} · substantive denial</div>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.textMid,textTransform:"uppercase",letterSpacing:.3,marginBottom:5}}>Reason</div>
                      <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Income over limit, no longer Oklahoma resident, citizenship status, etc."
                        style={{width:"100%",boxSizing:"border-box",minHeight:52,resize:"vertical",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 9px",fontSize:12,fontFamily:"inherit",color:T.text,background:T.surface,outline:"none"}}/>
                    </div>
                    <div style={{background:T.red+"0C",border:`1px solid ${T.red}33`,borderRadius:9,padding:"9px 12px",fontSize:12,color:T.textMid,marginBottom:14}}>
                      <div style={{fontWeight:700,color:T.red,marginBottom:3}}>Appeal rights</div>
                      Patient has 90 days to appeal from the notice date. Refer to Oklahoma Health Care Authority for Marketplace / Family Planning alternatives.
                    </div>
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowDetModal(false)} style={{...ghostBtn,padding:"8px 13px"}}>Cancel</button>
                      <button onClick={()=>{recertOutcome(c.id,"denied_ineligible",detail);setShowDetModal(false);}}
                        style={{...primaryBtn,background:T.red,borderColor:T.red,padding:"8px 14px"}}>
                        <X size={13}/> Record · close case
                      </button>
                    </div>
                  </>)}

                </div>
              </div>
            )}

            {/* ── RFI STAGE ── */}
            {c.stage === "rfi" && (
              <div>
                <div style={{background:T.amber+"0C",border:`1px solid ${T.amber}44`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontWeight:800,fontSize:13,color:T.amber,display:"flex",alignItems:"center",gap:7,marginBottom:4}}><AlertTriangle size={15}/> RFI — cure item required</div>
                  <div style={{fontSize:12.5,color:T.text,marginBottom:3}}>State requested: <strong>{c.pendingItem}</strong></div>
                  {c.cureDeadline&&(()=>{
                    const daysLeft = Math.ceil((new Date(c.cureDeadline)-new Date())/(1000*60*60*24));
                    const clr = daysLeft<=2?T.red:daysLeft<=5?T.orange:T.amber;
                    return (
                      <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1,background:clr+"14",border:`1px solid ${clr}44`,borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",gap:8}}>
                          <Clock size={13} color={clr}/>
                          <span style={{fontSize:12,fontWeight:800,color:clr}}>
                            {daysLeft<=0?"DEADLINE PASSED":daysLeft===1?"1 day left":`${daysLeft} days left`}
                          </span>
                          <span style={{fontSize:11.5,color:T.textMid}}>· due {c.cureDeadline}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div style={{fontSize:12,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
                  Gather the requested document and resubmit to MHC before the cure deadline. Coverage is at risk if deadline passes without response.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(()=>{
                    const rfiKey2 = rfiDocKey(c.pendingItem);
                    const curedDoc = rfiKey2 && c.docs.find(d=>d.key===rfiKey2&&d.artifact?.rfiCure);
                    const canRequeue = !rfiKey2 || curedDoc; // allow if key unknown or new doc uploaded
                    return (
                      <button disabled={!canRequeue} onClick={()=>canRequeue&&recertResolvePending(c.id)}
                        style={{width:"100%",justifyContent:"center",display:"inline-flex",alignItems:"center",gap:8,background:canRequeue?T.amber:T.surface2,color:canRequeue?"#fff":T.textLo,border:canRequeue?"none":`1px solid ${T.border}`,borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:canRequeue?"pointer":"not-allowed",opacity:canRequeue?1:0.7}}>
                        <CheckCircle2 size={14}/>
                        {canRequeue?"Document provided — re-queue to submit":`Upload new version of ${c.docs.find(d=>d.key===rfiKey2)?.name||"requested doc"} first`}
                      </button>
                    );
                  })()}
                  <button onClick={()=>recertOutcome(c.id,"denied_ineligible","Cure deadline missed")} style={{width:"100%",justifyContent:"center",display:"inline-flex",alignItems:"center",gap:8,background:"none",color:T.red,border:`1px solid ${T.red}55`,borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    <X size={13}/> Cure deadline missed — close case
                  </button>
                </div>
              </div>
            )}

            {/* ── RECERTIFIED / CLOSED ── */}
            {c.stage === "recertified" && (
              <div>
                {c.outcome === "approved" && (
                  <div style={{fontSize:12.5,color:T.green,background:T.green+"12",border:`1px solid ${T.green}33`,borderRadius:10,padding:"12px",lineHeight:1.5}}>
                    <div style={{fontWeight:800,display:"flex",alignItems:"center",gap:7,marginBottom:4}}><CheckCircle2 size={16}/> Closed — Renewed</div>
                    Coverage confirmed for the new term. The Eligibility Sentinel re-verifies active status on the nightly sweep.
                  </div>
                )}
                {c.outcome === "denied_ineligible" && (
                  <div style={{fontSize:12.5,color:T.textMid,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px",lineHeight:1.5}}>
                    <div style={{fontWeight:800,color:T.red,display:"flex",alignItems:"center",gap:7,marginBottom:4}}><X size={16}/> Closed — Ineligible</div>
                    {c.pendingItem&&<div style={{marginBottom:4}}>Reason: {c.pendingItem}</div>}
                    Appeal rights attach — 90 days from notice date. Refer to Oklahoma Health Care Authority for Marketplace / Family Planning options.
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
// Map RFI pendingItem text → doc key for flagging
const RFI_DOC_MAP = {
  "proof of income":     "paystub",
  "proof of residency":  "residency",
  "citizenship":         "status",
  "immigration":         "status",
  "household":           "household",
  "work activity":       "activity",
  "photo id":            "id",
  "self-employment":     "selfemp",
  "zero-income":         "zero",
  "benefit":             "benefit",
};
function rfiDocKey(pendingItem) {
  if (!pendingItem) return null;
  const lower = pendingItem.toLowerCase();
  return Object.entries(RFI_DOC_MAP).find(([k]) => lower.includes(k))?.[1] || null;
}
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
    <Card title={`Recertification performance — ${CFG.brand} · season to date`} sub={`Actual outcomes · eClinicalWorks + Oklahoma Health Care Authority · Jun 30 – Aug 22, 2026 · ${fmt(fin.processed)} renewals processed`}>
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
