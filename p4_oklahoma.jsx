// CoverageGuard IQ — Submission Gateway — Oklahoma
// Architect build — CC deploys only

import { useState, useEffect, useRef } from "react";
import {
  Shield, FileCheck, Files, Package, Route, Send,
  RefreshCw, History, ChevronRight, ChevronDown,
  CheckCircle, AlertCircle, Clock, ExternalLink,
  Lock, Info, Copy, Download, Eye, EyeOff,
  Building, MapPin, User, FileText, Briefcase,
  AlertTriangle, HelpCircle, ArrowRight, X
} from "lucide-react";

// ── Feature flags ─────────────────────────────────────
const FLAGS = {
  submission_gateway_enabled: true,
  oklahoma_submission_gateway_enabled: true,
};

const BUILD_VERSION = "CG Gateway Build v0.1 — Oklahoma";
const SYNTH_LABEL   = "Synthetic demo data — no real PHI";

// ── Design tokens ─────────────────────────────────────
const T = {
  navy:    "#0A2E38",
  primary: "#0F8CA8",
  mid:     "#5A4B96",
  light:   "#F0F9FA",
  canvas:  "#F0EFF8",
  white:   "#FFFFFF",
  charcoal:"#3C3C3C",
  silver:  "#E1E1E1",
  textlo:  "#5AABB8",
  green:   "#16A34A",
  amber:   "#D97706",
  red:     "#C8472E",
  teal:    "#0D9488",
  ink:     "#0A2E38",
  muted:   "#0A6B82",
  bgGreen: "#DCFCE7",
  bgAmber: "#FEF3C7",
  bgRed:   "#FEE2E2",
  bgBlue:  "#EFF6FF",
  bgGray:  "#F3F4F6",
  border:  "#E1E1E1",
};

// ── Layer states ──────────────────────────────────────
const LAYER_STATES = {
  COMPLETE: "complete",
  ACTION:   "action",
  PENDING:  "pending",
  BLOCKED:  "blocked",
};

// ── Synthetic Rosa Birdsong case ────────────────────
const ROSA_CASE = {
  id: "CASE-OK-2026-5601",
  patient: "Rosa Birdsong",
  mrn: "MRN560101",
  dob: "1968-07-22",
  program: "SoonerCare",
  programScope: "SoonerSelect — AI/AN exempt",
  state: "Oklahoma",
  zip: "74401",
  renewalDue: "2026-11-01",
  daysRemaining: 42,
  created: "2026-09-03T09:14:00",
  humanOwner: "Navigator — T. Redhorse",

  stateProfile: {
    name: "MySoonerCare / OHCA",
    version: "v2026.09",
    tier: "L2",
    tierLabel: "Navigator-assisted portal",
    portalUrl: "mysoonercare.com",
    portalFull: "https://www.mysoonercare.com",
    authRepMethod: "Electronic designation / form",
    ldssRouting: "ZIP 74401 → OHCA DHS county office — Muskogee",
    supportsOnlineRenewal: true,
    supportsDocUpload: true,
    supportsThirdParty: true,
    supportsPublicApi: false,
    cmsEmmyPartner: false,
    confidence: "Moderate",
    sourceUrl: "https://www.mysoonercare.com/",
    sourceChecked: "2026-09-03",
    kffSource: "OHCA official source + SoonerSelect enrollment data",
    automationPolicy: "Human-assisted only",
    notes: "Oklahoma navigator ecosystem. OHCA EVS is the state eligibility verification system — daily update. Consumer third-party account access confirmed. No public API. Institutional submission pathway requires state verification.",
  },

  authority: {
    status: "verified",
    type: "SoonerCare certified navigator",
    beneficiaryAuth: "On file — CG-CA-01",
    beneficiaryAuthDate: "2026-09-01",
    orgCredential: "Eastern Oklahoma FQHC — credentialed",
    submissionPermitted: true,
    blockingReason: null,
    evidence: "CG-CA-01_OKDHS_signed_20260901.pdf",
  },

  evidence: [
    { id: "ev1", label: "Medicaid renewal notice",            status: "verified",   source: "State notice",  file: "Renewal_notice_Birdsong.pdf",       required: true,  sensitive: false },
    { id: "ev2", label: "Identity — government-issued ID",   status: "present",    source: "EMR — eCW",     file: "ID_verified_EMR.pdf",               required: true,  sensitive: false },
    { id: "ev3", label: "Authorized rep consent — CG-CA-01", status: "verified",   source: "CG signed",     file: "CG-CA-01_consent_signed.pdf",       required: true,  sensitive: false },
    { id: "ev4", label: "Tribal income / AI∕AN verification",   status: "verified",   source: "Staff upload",  file: "Tribal_income_verification_Birdsong.pdf",          required: true,  sensitive: false },
    { id: "ev5", label: "Address verification",               status: "missing",    source: null,            file: null,                                required: true,  sensitive: false,
      missingNote: "Utility bill or signed lease needed. Navigator contacted patient 2026-09-02." },
  ],

  packageVersion: 2,
  packageItems: ["ev1","ev2","ev3","ev4"],

  route: {
    tier: "L2",
    label: "L2 — Navigator-assisted portal",
    why: "Navigator holds certified assister credential and beneficiary authorization is verified. No public API available for Oklahoma. Consumer portal handoff also available as fallback.",
    automationAllowed: false,
    humanRequired: true,
    fallback: "L1 — Consumer portal handoff",
    destination: "MySoonerCare / OHCA — assister account",
    ldssRouting: "ZIP 74401 → OHCA DHS county office — Muskogee",
    profileVersion: "v2026.09",
    credentialsRequired: ["Assister organization login", "Beneficiary case number"],
  },

  canonicalStatus: "READY_TO_SUBMIT",

  stateStatus: {
    raw: null,
    canonical: null,
    profileVersion: "v2026.09",
    illustrativeNote: "Oklahoma portal status strings not yet confirmed from official source. Raw state response will appear here once submission is made and state portal responds.",
  },

  coverageState: "PENDING_RECONCILIATION",

  auditEvents: [
    { time: "09:14", actor: "System",          type: "complete", label: "State profile resolved",               detail: "MySoonerCare / OHCA v2026.09 · confidence Moderate" },
    { time: "09:15", actor: "Navigator",        type: "complete", label: "Authority validated",                  detail: "Certified assister · CG-CA-01 on file · Eastern Oklahoma FQHC credentialed" },
    { time: "09:18", actor: "System",          type: "complete", label: "Evidence requirements determined",      detail: "5 items required · 4 resolved · 1 missing (address verification)" },
    { time: "09:22", actor: "Navigator",        type: "complete", label: "Evidence package built · v2 · 4 items",detail: "Package hash: a4f9c1b2 · rule profile v2026.09" },
    { time: "09:22", actor: "System",          type: "complete", label: "Route selected · L2 assister portal",  detail: "No public API · authority verified · LDSS ZIP 74401" },
    { time: "09:23", actor: "System",          type: "action",   label: "Submission handoff pending",            detail: "Awaiting navigator action in MySoonerCare / OHCA" },
  ],
};

// ── Patient 2 — Marcus Williams · Tulsa · OHCA online portal ──
const MARCUS_CASE = {
  id: "CASE-OK-2026-5602",
  patient: "Marcus Williams",
  mrn: "MRN560202",
  dob: "1985-04-11",
  program: "SoonerCare",
  programScope: "SoonerSelect Adult",
  state: "Oklahoma",
  zip: "74104",
  renewalDue: "2026-12-15",
  daysRemaining: 103,
  created: "2026-09-03T10:00:00",
  humanOwner: "Navigator — A. Chen",
  stateProfile: {
    name: "OHCA Online Portal",
    version: "v2026.09",
    tier: "L1",
    tierLabel: "Consumer portal — MySoonerCare",
    portalUrl: "mysoonercare.org",
    portalFull: "https://www.mysoonercare.org",
    authRepMethod: "Consumer self-service with navigator guidance",
    ldssRouting: "ZIP 74104 → Tulsa County DHS",
    supportsOnlineRenewal: true,
    supportsDocUpload: true,
    supportsThirdParty: true,
    supportsPublicApi: false,
    cmsEmmyPartner: false,
    confidence: "Moderate",
    sourceUrl: "https://www.mysoonercare.org/",
    sourceChecked: "2026-09-03",
    kffSource: "OHCA + official state source",
    automationPolicy: "Human-assisted only",
    notes: "Tulsa metro area. Consumer portal pathway via MySoonerCare. Navigator guides patient through self-service renewal.",
  },
  authority: { status: "verified", type: "Consumer self-service (navigator-guided)", beneficiaryAuth: "On file — CG-CA-01", beneficiaryAuthDate: "2026-08-15", orgCredential: "Tulsa FQHC — credentialed", submissionPermitted: true, blockingReason: null, evidence: "CG-CA-01_signed_20260815.pdf" },
  evidence: [
    { id: "ev1", label: "SoonerCare renewal notice",           status: "verified",  source: "State notice",  file: "Renewal_notice_Williams.pdf",   required: true, sensitive: false },
    { id: "ev2", label: "Identity — government-issued ID",   status: "verified",  source: "EMR — Epic",    file: "ID_verified_EMR.pdf",            required: true, sensitive: false },
    { id: "ev3", label: "Authorized rep consent — CG-CA-01", status: "verified",  source: "CG signed",     file: "CG-CA-01_consent_signed.pdf",    required: true, sensitive: false },
    { id: "ev4", label: "Community engagement — paystubs",   status: "verified",  source: "Staff upload",  file: "Paystub_Williams.pdf",           required: true, sensitive: false },
    { id: "ev5", label: "Address verification",               status: "verified",  source: "Staff upload",  file: "Utility_bill_Williams.pdf",      required: true, sensitive: false },
  ],
  packageVersion: 1, packageItems: ["ev1","ev2","ev3","ev4","ev5"],
  route: { tier: "L1", label: "L1 — Consumer portal handoff", why: "Patient has MySoonerCare account. Navigator guides through self-service renewal.", automationAllowed: false, humanRequired: true, fallback: "L2 — Assister account", destination: "MySoonerCare — consumer account", ldssRouting: "ZIP 74104 → Tulsa County DHS", profileVersion: "v2026.09", credentialsRequired: ["Patient MySoonerCare login", "Navigator present"] },
  canonicalStatus: "READY_TO_SUBMIT",
  stateStatus: { raw: null, canonical: null, profileVersion: "v2026.09", illustrativeNote: "Awaiting consumer portal submission." },
  coverageState: "PENDING_RECONCILIATION",
  auditEvents: [
    { time: "10:00", actor: "System",    type: "complete", label: "State profile resolved",          detail: "OHCA Online Portal v2026.09 · L1 consumer portal" },
    { time: "10:01", actor: "Navigator", type: "complete", label: "Authority validated",              detail: "Consumer self-service · CG-CA-01 on file" },
    { time: "10:05", actor: "System",    type: "complete", label: "Evidence — 5/5 resolved",          detail: "All items present" },
    { time: "10:06", actor: "System",    type: "action",   label: "Submission handoff pending",        detail: "Awaiting patient login to MySoonerCare" },
  ],
};

// ── Patient 3 — Priscilla Hawkins · Rural · Paper mail ──
const PRISCILLA_CASE = {
  id: "CASE-OK-2026-5603",
  patient: "Priscilla Hawkins",
  mrn: "MRN560303",
  dob: "1972-12-03",
  program: "SoonerCare",
  programScope: "SoonerSelect Adult",
  state: "Oklahoma",
  zip: "74820",
  renewalDue: "2026-10-10",
  daysRemaining: 36,
  created: "2026-09-03T10:30:00",
  humanOwner: "Navigator — D. Crow",
  stateProfile: {
    name: "Pontotoc County DHS",
    version: "v2026.09",
    tier: "L0",
    tierLabel: "Manual — paper mail to county DHS",
    portalUrl: "okdhs.org",
    portalFull: "https://www.okdhs.org",
    authRepMethod: "Form filed with county DHS",
    ldssRouting: "ZIP 74820 → Pontotoc County DHS",
    supportsOnlineRenewal: false, supportsDocUpload: false, supportsThirdParty: false, supportsPublicApi: false, cmsEmmyPartner: false,
    confidence: "Low",
    sourceUrl: "https://www.okdhs.org/",
    sourceChecked: "2026-09-03",
    kffSource: "OHCA + official state source",
    automationPolicy: "Manual only",
    notes: "Rural Oklahoma. No confirmed electronic portal for this county. Paper renewal packet required.",
  },
  authority: { status: "verified", type: "Certified assister / navigator", beneficiaryAuth: "On file — CG-CA-01", beneficiaryAuthDate: "2026-08-28", orgCredential: "Southeast OK FQHC — credentialed", submissionPermitted: true, blockingReason: null, evidence: "CG-CA-01_signed_20260828.pdf" },
  evidence: [
    { id: "ev1", label: "SoonerCare renewal notice",           status: "verified",  source: "State notice",  file: "Renewal_notice_Hawkins.pdf",    required: true, sensitive: false },
    { id: "ev2", label: "Identity — government-issued ID",   status: "verified",  source: "EMR — Epic",    file: "ID_verified_EMR.pdf",            required: true, sensitive: false },
    { id: "ev3", label: "Authorized rep consent — CG-CA-01", status: "verified",  source: "CG signed",     file: "CG-CA-01_consent_signed.pdf",    required: true, sensitive: false },
    { id: "ev4", label: "Community engagement — employer letter", status: "present", source: "Staff upload", file: "Employer_letter_Hawkins.pdf",   required: true, sensitive: false },
    { id: "ev5", label: "Address verification",               status: "missing",   source: null,            file: null,                             required: true, sensitive: false,
      missingNote: "Patient in transitional housing. Case worker documenting." },
  ],
  packageVersion: 1, packageItems: ["ev1","ev2","ev3","ev4"],
  route: { tier: "L0", label: "L0 — Paper mail to DHS", why: "Pontotoc County DHS has no confirmed electronic portal. Paper packet required.", automationAllowed: false, humanRequired: true, fallback: "None — paper only", destination: "Pontotoc County DHS — physical mail", ldssRouting: "ZIP 74820 → Pontotoc County DHS", profileVersion: "v2026.09", credentialsRequired: ["Staff attestation", "DHS receipt if provided"] },
  canonicalStatus: "READY_TO_SUBMIT",
  stateStatus: { raw: null, canonical: null, profileVersion: "v2026.09", illustrativeNote: "Paper submission — no electronic tracking." },
  coverageState: "PENDING_RECONCILIATION",
  auditEvents: [
    { time: "10:30", actor: "System",    type: "complete", label: "State profile resolved",          detail: "Pontotoc County DHS v2026.09 · L0 paper mail" },
    { time: "10:31", actor: "Navigator", type: "complete", label: "Authority validated",              detail: "Certified assister · CG-CA-01 on file" },
    { time: "10:35", actor: "System",    type: "complete", label: "Evidence — 4/5 resolved",          detail: "1 missing (address verification)" },
    { time: "10:36", actor: "System",    type: "action",   label: "Manual submission pending",        detail: "Navigator must mail packet to Pontotoc County DHS" },
  ],
};

const ALL_OK_CASES = [
  { ...ROSA_CASE,      label: "Rosa Birdsong",     tag: "Muskogee · MRN560101",  tagColor: "#0F4C5C" },
  { ...MARCUS_CASE,    label: "Marcus Williams",   tag: "Tulsa · MRN560202",     tagColor: "#4B3C96" },
  { ...PRISCILLA_CASE, label: "Priscilla Hawkins", tag: "Pontotoc · MRN560303",  tagColor: "#D97706" },
];

// ── Helpers ───────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", ...style }}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, badge, badgeColor = T.primary, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: T.canvas }}>
    {Icon && <Icon size={15} color={badgeColor} />}
    <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: T.navy }}>{title}</div>
    {badge && <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, background: badgeColor + "15", border: `1px solid ${badgeColor}33`, borderRadius: 999, padding: "2px 8px" }}>{badge}</span>}
    {right}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    complete: { bg: T.bgGreen, color: T.green,   label: "Complete",         icon: "✓" },
    action:   { bg: T.bgAmber, color: T.amber,   label: "Action required",  icon: "!" },
    pending:  { bg: T.bgBlue,  color: T.primary, label: "Pending",          icon: "·" },
    blocked:  { bg: T.bgRed,   color: T.red,     label: "Blocked",          icon: "✗" },
  }[status] || { bg: T.bgGray, color: T.charcoal, label: status, icon: "·" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 999, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const FieldRow = ({ label, value, accent }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 6, padding: "5px 0", borderBottom: `1px solid ${T.silver}30`, alignItems: "start" }}>
    <div style={{ fontSize: 11.5, color: T.muted }}>{label}</div>
    <div style={{ fontSize: 12, color: accent ? T.primary : T.charcoal, fontWeight: accent ? 600 : 400 }}>{value}</div>
  </div>
);

const EvidenceRow = ({ ev }) => {
  const statusCfg = {
    verified:  { color: T.green,   bg: T.bgGreen,  label: "Verified",         icon: <CheckCircle size={13}/> },
    present:   { color: T.primary, bg: T.light,    label: "Present — EMR",    icon: <CheckCircle size={13}/> },
    missing:   { color: T.amber,   bg: T.bgAmber,  label: "Missing",          icon: <AlertCircle size={13}/> },
    conflicting:{ color: T.red,    bg: T.bgRed,    label: "Conflicting",      icon: <AlertTriangle size={13}/> },
  }[ev.status] || {};

  return (
    <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{ color: statusCfg.color, marginTop: 1, flexShrink: 0 }}>{statusCfg.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: T.charcoal, fontWeight: 500 }}>{ev.label}</div>
        {ev.source && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Source: {ev.source}{ev.file ? ` · ${ev.file}` : ""}</div>}
        {ev.missingNote && <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>{ev.missingNote}</div>}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}30`, borderRadius: 999, padding: "2px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
        {statusCfg.label}
      </span>
    </div>
  );
};

const AuditRow = ({ ev }) => {
  const dot = { complete: T.green, action: T.amber, pending: T.primary }[ev.type] || T.muted;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 14px", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 5 }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: T.charcoal, fontWeight: 500 }}>{ev.label}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{ev.detail}</div>
      </div>
      <div style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>{ev.time}</div>
    </div>
  );
};

// ── Layer components ──────────────────────────────────

function Layer0StateProfile({ c }) {
  const p = c.stateProfile;
  return (
    <Card>
      <CardHeader icon={MapPin} title="Layer 0 — State profile resolved" badge={"Active · " + p.version} badgeColor={T.green} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ background: T.light, border: `1.5px solid ${T.primary}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 12, display: "flex", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: T.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building size={18} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{p.name} — {p.tier}: {p.tierLabel}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>
              Online renewal ✓ · Document upload ✓ · Third-party access ✓ · Public API ✗ · CMS Emmy partner: No · Confidence: {p.confidence}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <FieldRow label="Portal" value={p.portalUrl} accent />
          <FieldRow label="Auth rep method" value={p.authRepMethod} />
          <FieldRow label="LDSS routing" value={p.ldssRouting} />
          <FieldRow label="Automation policy" value={p.automationPolicy} />
          <FieldRow label="Source verified" value={p.sourceChecked + " · " + p.kffSource} />
          <FieldRow label="Profile version" value={p.version} />
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: T.muted, background: T.bgGray, borderRadius: 7, padding: "6px 10px", lineHeight: 1.5 }}>
          ℹ️ {p.notes}
        </div>
      </div>
    </Card>
  );
}

function Layer1Authority({ c }) {
  const a = c.authority;
  return (
    <Card>
      <CardHeader icon={Shield} title="Layer 1 — Authority validated" badge="Verified" badgeColor={T.green} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginBottom: 10 }}>
          <FieldRow label="Authority type" value={a.type} />
          <FieldRow label="Beneficiary auth" value={a.beneficiaryAuth} accent />
          <FieldRow label="Auth date" value={a.beneficiaryAuthDate} />
          <FieldRow label="Org credential" value={a.orgCredential} />
          <FieldRow label="Submission permitted" value="Yes — assister-supported portal" accent />
          <FieldRow label="Evidence" value={a.evidence} />
        </div>
        <div style={{ background: T.bgGreen, border: `1px solid ${T.green}33`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.green, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
          <span>Authority verified. Navigator may proceed as authorized assister on behalf of Rosa Birdsong through MySoonerCare / OHCA. Credential sharing is not permitted — assister must log in with their own organization account.</span>
        </div>
      </div>
    </Card>
  );
}

function Layer2Evidence({ c }) {
  const total = c.evidence.length;
  const resolved = c.evidence.filter(e => e.status !== "missing" && e.status !== "conflicting").length;
  const pct = Math.round(resolved / total * 100);

  return (
    <Card>
      <CardHeader icon={Files} title="Layer 2 — Evidence requirements" badge={`${resolved} of ${total} resolved`} badgeColor={pct === 100 ? T.green : T.amber} />
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.muted, marginBottom: 4 }}>
          <span>Package readiness</span><span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: T.silver, borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? T.green : T.amber, borderRadius: 999, transition: "width .4s" }}/>
        </div>
        <div style={{ background: T.bgAmber, border: `1px solid ${T.amber}33`, borderRadius: 8, padding: "7px 11px", fontSize: 12, color: T.amber, marginBottom: 4, display: "flex", gap: 6 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
          <span>Address verification outstanding. Case may proceed to handoff with 4 of 5 items — navigator must note the gap in the submission.</span>
        </div>
      </div>
      {c.evidence.map(ev => <EvidenceRow key={ev.id} ev={ev}/>)}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
        <button style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: T.charcoal, cursor: "pointer" }}>Request evidence</button>
        <button style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.primary, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Proceed with 4 of 5</button>
      </div>
    </Card>
  );
}

function Layer3Package({ c }) {
  const items = c.evidence.filter(e => c.packageItems.includes(e.id));
  return (
    <Card>
      <CardHeader icon={Package} title="Layer 3 — Evidence package" badge={`v${c.packageVersion} · ${items.length} items`} badgeColor={T.primary} />
      <div style={{ padding: "10px 14px 0" }}>
        {items.map(ev => (
          <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <FileText size={14} color={T.muted}/>
            <div style={{ flex: 1, fontSize: 12, color: T.charcoal }}>{ev.file}</div>
            <span style={{ fontSize: 11, color: T.muted }}>{ev.source}</span>
          </div>
        ))}
        <div style={{ padding: "8px 0", fontSize: 11, color: T.muted }}>
          Package manifest version {c.packageVersion} · Rule profile {c.stateProfile.version} · Hash: a4f9c1b2
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
        <button style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: T.charcoal, cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}><Eye size={13}/>Preview</button>
        <button style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: T.charcoal, cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}><Download size={13}/>Download</button>
        <button style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.primary, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", marginLeft: "auto" }}>Approve for handoff</button>
      </div>
    </Card>
  );
}

function Layer4Route({ c }) {
  const r = c.route;
  return (
    <Card>
      <CardHeader icon={Route} title="Layer 4 — Submission route selected" badge={r.tier + " · Assister portal"} badgeColor={T.primary} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginBottom: 10 }}>
          <FieldRow label="Route" value={r.label} accent />
          <FieldRow label="Automation" value="Not permitted — human required" />
          <FieldRow label="LDSS routing" value={r.ldssRouting} />
          <FieldRow label="Fallback" value={r.fallback} />
          <FieldRow label="Destination" value={r.destination} />
          <FieldRow label="Profile version" value={r.profileVersion} />
        </div>
        <div style={{ background: T.light, border: `1px solid ${T.primary}22`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
          <strong style={{ color: T.navy }}>Why this route:</strong> {r.why}
        </div>
      </div>
    </Card>
  );
}

function Layer5Submission({ c, receipt, setReceipt, submitted, setSubmitted }) {
  return (
    <Card style={{ border: `2px solid ${T.primary}` }}>
      <CardHeader icon={Send} title="Layer 5 — Guided submission handoff" badge="Action required" badgeColor={T.amber} />
      <div style={{ padding: "14px" }}>
        <div style={{ background: T.bgAmber, border: `1px solid ${T.amber}40`, borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: T.amber, display: "flex", gap: 7, alignItems: "flex-start" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
          <span>Do not share Rosa Birdsong' credentials. Log in to MySoonerCare / OHCA using your own certified assister organization account. CoverageGuard does not and cannot access the portal on your behalf.</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3 }}>What CoverageGuard does</div>
            <div style={{ fontSize: 12, color: T.charcoal, lineHeight: 1.6 }}>
              Prepares evidence package · provides checklist · records proof · tracks state status · reconciles coverage
            </div>
          </div>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3 }}>What you must do</div>
            <div style={{ fontSize: 12, color: T.charcoal, lineHeight: 1.6 }}>
              Log in as assister · navigate to patient's case · upload 4 documents · capture the confirmation number
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Submission checklist</div>
          {["Log in to MHC with assister credentials", "Navigate to member case — ID: MRN560101", "Upload: Renewal notice + ID + Consent + Paystub", "Note address verification gap in submission comments", "Capture confirmation number"].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 12, color: T.charcoal }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${T.silver}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}/>
              {s}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <a href="https://www.mysoonercare.com" target="_blank" rel="noopener noreferrer" style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: T.primary, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", gap: 5, alignItems: "center", textDecoration: "none" }}>
            <ExternalLink size={13}/> Open MySoonerCare / OHCA
          </a>
          <input
            value={receipt}
            onChange={e => setReceipt(e.target.value)}
            placeholder="Paste confirmation number from MHC portal…"
            style={{ flex: 1, minWidth: 220, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.canvas, fontSize: 12, color: T.charcoal, outline: "none" }}
          />
          <button
            onClick={() => { if (receipt.trim()) setSubmitted(true); }}
            style={{ padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: submitted ? T.green : "transparent", fontSize: 12, fontWeight: 700, color: submitted ? "#fff" : T.charcoal, cursor: "pointer" }}
          >
            {submitted ? "✓ Receipt captured" : "Capture receipt"}
          </button>
        </div>

        {submitted && (
          <div style={{ marginTop: 10, background: T.bgGreen, border: `1px solid ${T.green}40`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.green, display: "flex", gap: 6 }}>
            <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
            <span>Receipt {receipt} captured. Case status advancing to SUBMITTED. Audit record created.</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function Layer6Status({ c, submitted }) {
  const [expanded, setExpanded] = useState(false);
  const ss = c.stateStatus;

  return (
    <Card>
      <CardHeader icon={RefreshCw} title="Layers 6–7 — Status + coverage reconciliation" />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4, fontWeight: 700 }}>CoverageGuard status</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.primary }}>{submitted ? "SUBMITTED" : c.canonicalStatus}</div>
          </div>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4, fontWeight: 700 }}>Oklahoma state status</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>{submitted ? "Awaiting response…" : "Not yet received"}</div>
          </div>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4, fontWeight: 700 }}>Coverage state</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>Pending reconciliation</div>
          </div>
          <div style={{ background: T.canvas, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4, fontWeight: 700 }}>Next action</div>
            <div style={{ fontSize: 12, color: T.charcoal }}>Poll MHC for status update · est. 2–5 business days</div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
        >
          {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          How CoverageGuard interprets state status
        </button>

        {expanded && (
          <div style={{ marginTop: 10, background: T.light, border: `1px solid ${T.primary}22`, borderRadius: 9, padding: "11px 13px", fontSize: 12, color: T.charcoal, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>Status normalization — MySoonerCare / OHCA</div>
            <div style={{ marginBottom: 4 }}>Raw state status: <span style={{ color: T.muted }}>No response yet</span></div>
            <div style={{ marginBottom: 4 }}>CoverageGuard canonical: <span style={{ fontWeight: 700, color: T.primary }}>{submitted ? "SUBMITTED" : "READY_TO_SUBMIT"}</span></div>
            <div style={{ marginBottom: 4 }}>Mapped using: Oklahoma State Profile {c.stateProfile.version}</div>
            <div style={{ marginTop: 8, padding: "7px 10px", background: T.bgAmber, borderRadius: 7, color: T.amber, fontSize: 11.5, lineHeight: 1.5 }}>
              ⚠ Illustrative note: MySoonerCare / OHCA portal status strings (e.g. "Pending Review", "Document Not Accepted") have not yet been confirmed from an official state source. Status mapping will be populated once Oklahoma returns a documented response. CoverageGuard will never infer acceptance from silence.
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>Once Oklahoma responds, this panel will show: raw status → canonical status → mapping rule used → profile version → timestamp.</div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Layer7Audit({ c, submitted }) {
  const events = submitted
    ? [...c.auditEvents, { time: "Now", actor: "Navigator", type: "complete", label: "Receipt captured — status → SUBMITTED", detail: "Confirmation number recorded · audit hash written · coverage reconciliation queued" }]
    : c.auditEvents;

  return (
    <Card>
      <CardHeader icon={History} title="Layer 8 — Evidence ledger + audit" badge={`${events.length} events`} badgeColor={T.muted} />
      {events.map((ev, i) => <AuditRow key={i} ev={ev}/>)}
      <div style={{ padding: "8px 14px", fontSize: 11, color: T.muted, borderTop: `1px solid ${T.border}` }}>
        Audit log is append-only. Every material event records actor, timestamp, rule version, and evidence reference. Full ledger view in Audit &amp; Explainability.
      </div>
    </Card>
  );
}

// ── Progress rail ─────────────────────────────────────
const LAYERS = [
  { id: 0, label: "State profile",  short: "L0", state: LAYER_STATES.COMPLETE },
  { id: 1, label: "Authority",      short: "L1", state: LAYER_STATES.COMPLETE },
  { id: 2, label: "Evidence",       short: "L2", state: LAYER_STATES.ACTION   },
  { id: 3, label: "Package",        short: "L3", state: LAYER_STATES.COMPLETE },
  { id: 4, label: "Route",          short: "L4", state: LAYER_STATES.COMPLETE },
  { id: 5, label: "Submission",     short: "L5", state: LAYER_STATES.ACTION   },
  { id: 6, label: "Status",         short: "L6", state: LAYER_STATES.PENDING  },
  { id: 7, label: "Coverage",       short: "L7", state: LAYER_STATES.PENDING  },
  { id: 8, label: "Audit",          short: "L8", state: LAYER_STATES.PENDING  },
];

function ProgressRail({ activeLayer, setActiveLayer, submitted }) {
  const dot = (state, isSubmitted) => {
    if (state === LAYER_STATES.COMPLETE || isSubmitted) return T.green;
    if (state === LAYER_STATES.ACTION) return T.amber;
    if (state === LAYER_STATES.PENDING) return T.primary + "60";
    return T.red;
  };

  return (
    <div style={{ width: 140, flexShrink: 0, background: T.ink, padding: "16px 0", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "0 14px 16px", borderBottom: `1px solid rgba(255,255,255,.08)`, marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: .5, textTransform: "uppercase", marginBottom: 2 }}>Gateway layers</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{SYNTH_LABEL}</div>
      </div>
      {LAYERS.map(l => {
        const isActive = activeLayer === l.id;
        const isSubmitted = submitted && l.id >= 5;
        return (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: isActive ? "rgba(75,60,150,.4)" : "transparent", border: "none", cursor: "pointer", borderLeft: isActive ? `3px solid ${T.primary}` : "3px solid transparent", textAlign: "left", width: "100%" }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot(l.state, isSubmitted), flexShrink: 0 }}/>
            <div>
              <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? "#fff" : "rgba(255,255,255,.55)" }}>{l.label}</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.25)" }}>{l.short}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────
function Sidebar() {
  const items = [
    { icon: "👥", label: "Patient queue",       badge: "12", color: T.amber },
    { icon: "⚡", label: "Coverage intel",      badge: null  },
    { icon: "📋", label: "Recertification",     badge: "8",  color: T.amber },
    { icon: "📤", label: "Submission cases",    badge: "3",  color: T.red, active: true },
    { icon: "📦", label: "Evidence packages",   badge: null  },
    { icon: "🔄", label: "Remediation",         badge: "2",  color: T.red },
    { icon: "🛡️", label: "Authority",           badge: null  },
    { icon: "📊", label: "Gateway dashboard",   badge: null  },
    { icon: "🗺️", label: "State profiles",      badge: null  },
    { icon: "🕐", label: "Audit ledger",        badge: null  },
  ];

  return (
    <div style={{ width: 180, background: T.navy, flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid rgba(255,255,255,.08)` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>CoverageGuard <span style={{ color: "#9B92C8" }}>IQ</span></div>
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.3)", marginTop: 2, textTransform: "uppercase", letterSpacing: .5 }}>OKLAHOMA · SUBMISSION GATEWAY</div>
      </div>
      <div style={{ padding: "8px 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)", textTransform: "uppercase", letterSpacing: .5, paddingLeft: 14, paddingTop: 12 }}>Patient work</div>
      {items.slice(0,3).map((it,i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer" }}>
          <span style={{ fontSize: 13 }}>{it.icon}</span>{it.label}
          {it.badge && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: it.color, background: it.color + "20", borderRadius: 999, padding: "1px 6px" }}>{it.badge}</span>}
        </div>
      ))}
      <div style={{ padding: "8px 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)", textTransform: "uppercase", letterSpacing: .5, paddingLeft: 14, paddingTop: 12 }}>Gateway</div>
      {items.slice(3,7).map((it,i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", color: it.active ? "#fff" : "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", background: it.active ? "rgba(75,60,150,.4)" : "transparent", borderLeft: it.active ? `3px solid ${T.primary}` : "3px solid transparent" }}>
          <span style={{ fontSize: 13 }}>{it.icon}</span>{it.label}
          {it.badge && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: it.color, background: it.color + "20", borderRadius: 999, padding: "1px 6px" }}>{it.badge}</span>}
        </div>
      ))}
      <div style={{ padding: "8px 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)", textTransform: "uppercase", letterSpacing: .5, paddingLeft: 14, paddingTop: 12 }}>Operations</div>
      {items.slice(7).map((it,i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer" }}>
          <span style={{ fontSize: 13 }}>{it.icon}</span>{it.label}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: `1px solid rgba(255,255,255,.08)`, fontSize: 10, color: "rgba(255,255,255,.25)" }}>
        {BUILD_VERSION}<br/>{SYNTH_LABEL}
      </div>
    </div>
  );
}

// ── Watermark + security ──────────────────────────────
function Watermark() {
  const text = `OKLAHOMA · CONFIDENTIAL · PATENT PENDING · U.S. 64/102,709 · ${new Date().toLocaleDateString()}`;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999, overflow: "hidden", userSelect: "none" }}>
      {Array.from({length: 8}).map((_, row) =>
        Array.from({length: 4}).map((_, col) => (
          <div key={`${row}-${col}`} style={{
            position: "absolute", top: row * 160, left: col * 280 - 50,
            transform: "rotate(-30deg)", fontSize: 9.5, fontWeight: 700,
            color: "rgba(75,60,150,.06)", letterSpacing: .5, whiteSpace: "nowrap"
          }}>{text}</div>
        ))
      )}
    </div>
  );
}

// ── Main app ──────────────────────────────────────────
export default function GatewayApp() {
  const [receipt, setReceipt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const layerRefs = useRef([]);

  const scrollToLayer = (idx) => {
    setActiveLayer(idx);
    if (layerRefs.current[idx]) {
      layerRefs.current[idx].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = Number(e.target.dataset.layer);
            setActiveLayer(idx);
          }
        });
      },
      { threshold: 0.3 }
    );
    layerRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  if (!FLAGS.submission_gateway_enabled || !FLAGS.oklahoma_submission_gateway_enabled) {
    return <div style={{ padding: 40, color: T.charcoal }}>Submission Gateway is disabled.</div>;
  }

  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const c = ALL_OK_CASES[selectedCaseIdx];
  const layers = [
    <Layer0StateProfile c={c} />,
    <Layer1Authority c={c} />,
    <Layer2Evidence c={c} />,
    <Layer3Package c={c} />,
    <Layer4Route c={c} />,
    <Layer5Submission c={c} receipt={receipt} setReceipt={setReceipt} submitted={submitted} setSubmitted={setSubmitted} />,
    <Layer6Status c={c} submitted={submitted} />,
    null, // layer 7 coverage — folded into Layer6Status component above
    <Layer7Audit c={c} submitted={submitted} />,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <Watermark/>
      <Sidebar/>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "column" }}>
        {/* Case selector */}
        <div style={{ background: T.ink, borderBottom: "1px solid rgba(255,255,255,.1)", padding: "8px 12px", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: .5, marginRight: 4 }}>Patient</span>
          {ALL_OK_CASES.map((cs, i) => (
            <button key={cs.mrn} onClick={() => { setSelectedCaseIdx(i); setReceipt(""); setSubmitted(false); }}
              style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid " + (selectedCaseIdx===i ? cs.tagColor : "rgba(255,255,255,.15)"), background: selectedCaseIdx===i ? cs.tagColor+"22" : "transparent", color: selectedCaseIdx===i ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer" }}>
              {cs.label} <span style={{ fontSize: 10, opacity: .7 }}>{cs.tag}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Progress rail */}
        <ProgressRail activeLayer={activeLayer} setActiveLayer={scrollToLayer} submitted={submitted}/>

        {/* Main scroll area */}
        <div style={{ flex: 1, overflow: "auto", background: T.canvas }}>
          {/* Topbar */}
          <div style={{ position: "sticky", top: 0, zIndex: 100, background: T.white, borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{c.patient} — Submission gateway</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{c.mrn} · {c.program} · {c.programScope} · Renewal due {c.renewalDue}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, background: T.bgAmber, border: `1px solid ${T.amber}33`, borderRadius: 999, padding: "3px 10px" }}>⏱ {c.daysRemaining} days remaining</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.light, border: `1px solid ${T.primary}33`, borderRadius: 999, padding: "3px 10px" }}>MySoonerCare / OHCA</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: submitted ? T.green : T.muted, background: submitted ? T.bgGreen : T.bgGray, border: `1px solid ${submitted ? T.green : T.silver}44`, borderRadius: 999, padding: "3px 10px" }}>
              {submitted ? "✓ Submitted" : c.canonicalStatus}
            </span>
          </div>

          {/* Layers */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {layers.map((layer, i) => (
              <div key={i} data-layer={i} ref={el => layerRefs.current[i] = el}>
                {layer}
              </div>
            ))}
            <div style={{ textAlign: "center", padding: "10px 0 20px", fontSize: 11, color: T.muted }}>
              {BUILD_VERSION} · {SYNTH_LABEL} · U.S. Prov. App. No. 64/102,709 · Quantum 5D Consulting LLC
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
