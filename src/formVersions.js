/*
 * Source questionnaires and how a version change ripples into output forms.
 *
 * Rules (agreed with the product owner):
 * - Fields keep a stable key across versions, so diffs are matched by key.
 * - New fields arrive switched off.
 * - Cases already in progress keep the form versions they started with.
 * - A new source version only becomes active once every affected output
 *   form has been reviewed and published.
 */

export const SOURCE_FORMS = {
  request: { label: "REQUEST form questionnaire", short: "Request", versions: ["CRC request form v1", "CRC request form v2"] },
  report: { label: "REPORT form questionnaire", short: "Report", versions: ["CRC report form v1", "CRC report form v2"] },
};

// Which questionnaire feeds each output section. System data (meeting,
// patient, attendees) never changes with a form version.
export const SECTION_SOURCE = {
  general: "system",
  patient: "system",
  clinician: "request",
  hospital: "request",
  summary: "request",
  radiology: "request",
  pathology: "request",
  mdt: "report",
  next_steps: "report",
  attendees: "system",
};

// Field changes introduced by each version, relative to the previous one.
export const FORM_DIFFS = {
  "CRC request form v2": {
    added: [
      { section: "summary", field: { key: "summary.ecog", label: "ECOG performance status", type: "para", value: "ECOG performance status: 1." } },
      { section: "pathology", field: { key: "pathology.pdl1", label: "PD-L1 status", type: "item", value: "PD-L1: CPS < 1" } },
    ],
    removed: ["pathology.kras", "case.appointment_type", "case.surgery_date", "req.proposed_policy"],
    columnAdded: [{ key: "case.ecog_status", label: "ECOG status", type: "Choice" }],
    changed: {
      "radiology.modality": { label: "Imaging modality & date", value: "CT Abdomen/Pelvis with contrast – 01/05/2025" },
      "clinician.name": { label: "Referring clinician" },
    },
  },
  "CRC report form v2": {
    added: [
      { section: "next_steps", field: { key: "next_steps.follow_up_mdt", label: "Follow-up MDT", type: "item", value: "Re-discuss at post-op MDT – 24/06/2025" } },
    ],
    removed: ["mdt.fitness", "rep.clinical_study"],
    pastMdtAdded: [{ key: "rep.follow_up_date", label: "Follow-up date", type: "Date" }],
    changed: {
      "mdt.plan": { label: "Treatment plan", lead: "Treatment plan:" },
    },
  },
};

export const versionOf = (formName) => formName.split(" ").pop(); // "CRC request form v2" -> "v2"

export const bumpVersion = (v) => {
  const [major, minor] = v.split(".").map(Number);
  return `${major}.${minor + 1}`;
};

// The concrete changes a source-form diff causes in one output form.
export function impactOf(sections, diff) {
  const ids = new Set(sections.map((s) => s.id));
  const keys = new Map(sections.flatMap((s) => s.fields.map((f) => [f.key, { field: f, section: s }])));
  const items = [];
  for (const a of diff.added) {
    if (ids.has(a.section)) items.push({ kind: "added", key: a.field.key, label: a.field.label, section: sections.find((s) => s.id === a.section).title });
  }
  for (const k of diff.removed) {
    if (keys.has(k)) items.push({ kind: "removed", key: k, label: keys.get(k).field.label, section: keys.get(k).section.title });
  }
  for (const [k, change] of Object.entries(diff.changed)) {
    if (keys.has(k)) {
      const old = keys.get(k).field;
      items.push({ kind: "changed", key: k, label: change.label ?? old.label, was: old.label, section: keys.get(k).section.title });
    }
  }
  return items;
}

// Marks removed/changed fields and appends new (hidden) ones.
export function applyDiff(sections, diff) {
  return sections.map((s) => {
    const fields = s.fields.map((f) => {
      if (diff.removed.includes(f.key)) return { ...f, status: "removed" };
      const change = diff.changed[f.key];
      if (change) return { ...f, ...change, status: "changed", was: f.label };
      return f;
    });
    const added = diff.added.filter((a) => a.section === s.id).map((a) => ({ ...a.field, on: false, status: "new" }));
    return { ...s, fields: [...fields, ...added] };
  });
}

// Publishing drops removed fields and clears the review markers.
export function publishSections(sections) {
  return sections.map((s) => ({
    ...s,
    fields: s.fields
      .filter((f) => f.status !== "removed")
      .map(({ status, was, ...f }) => f),
  }));
}

/* ---------------------------------------------------- agenda columns */

// Short, typed request-form fields a meeting agenda can show as a column.
export const REQUEST_COLUMN_FIELDS = [
  { key: "case.organ_type", label: "Organ type", type: "Choice" },
  { key: "case.appointment_type", label: "Appointment type", type: "Choice" },
  { key: "case.prepared_by", label: "Prepared by", type: "String" },
  { key: "case.surgery_date", label: "Surgery date", type: "Date" },
  { key: "case.urgency", label: "Urgency level", type: "Choice" },
  { key: "case.age_at_referral", label: "Age at referral", type: "Numeric" },
  { key: "case.diagnosis_date", label: "Date of diagnosis", type: "Date" },
  { key: "case.referral_reason", label: "Referral reason", type: "Choice" },
  { key: "case.second_opinion", label: "Second opinion", type: "Check-box" },
  { key: "case.tumour_stage", label: "Tumour stage", type: "Choice" },
  { key: "case.clinical_notes", label: "Clinical notes", type: "Text area", unsupported: "Text area – too long for a column" },
  // No longer on the request form; kept only so older agenda configurations can still name it.
  { key: "case.referral_source", label: "Referral source", type: "Choice", retired: true },
];

export const MAX_AGENDA_COLUMNS = 9;

// Column-eligible fields of a request form version.
export function columnFieldsFor(version) {
  const diff = FORM_DIFFS[version];
  if (!diff) return REQUEST_COLUMN_FIELDS.filter((f) => !f.retired);
  return [
    ...REQUEST_COLUMN_FIELDS.filter((f) => !f.retired && !diff.removed.includes(f.key)),
    ...(diff.columnAdded ?? []).map((f) => ({ ...f, isNew: true })),
  ];
}

// Configured agenda columns a version change would remove.
export function agendaImpact(columns, diff) {
  return columns
    .filter((k) => diff.removed.includes(k))
    .map((k) => ({ kind: "removed", key: k, label: REQUEST_COLUMN_FIELDS.find((f) => f.key === k)?.label ?? k }));
}

export const fieldByKey = (key) =>
  REQUEST_COLUMN_FIELDS.find((f) => f.key === key) ??
  Object.values(FORM_DIFFS).flatMap((d) => d.columnAdded ?? []).find((f) => f.key === key);

/* ------------------------------------------ report form pre-population */

// Mapping data types (requirement 2): mapping is allowed only between the same
// type and, for choice, the same subtype. Only select and radio choices map.
export const MAP_TYPES = {
  string: { label: "Text" },
  text: { label: "Text area" },
  boolean: { label: "Check-box" },
  date: { label: "Date" },
  dateTime: { label: "Date time" },
  "choice/select": { label: "Choice · select" },
  "choice/radio": { label: "Choice · radio" },
  "choice/checkboxes": { label: "Choice · checkboxes", unsupported: true },
  "open-choice": { label: "Open choice", unsupported: true },
};

export const REQUEST_MAP_FIELDS = [
  { key: "req.proposed_conclusion", label: "Proposed conclusion", type: "string" },
  { key: "req.proposed_policy", label: "Proposed policy", type: "string" },
  { key: "req.proposed_study", label: "Proposed study", type: "text" },
  { key: "req.diagnosis", label: "Diagnosis", type: "choice/select" },
  { key: "req.organ_type", label: "Organ type", type: "choice/select" },
  { key: "req.tumour_stage", label: "Tumour stage", type: "choice/radio" },
  { key: "req.diagnosis_date", label: "Date of diagnosis", type: "date" },
  { key: "req.second_opinion", label: "Second opinion requested", type: "boolean" },
  { key: "req.referral_reason", label: "Reason for referral", type: "string" },
  { key: "req.comorbidities", label: "Comorbidities", type: "choice/checkboxes" },
  { key: "req.treating_hospital", label: "Treating hospital", type: "open-choice" },
];

export const REPORT_MAP_FIELDS = [
  { key: "rep.conclusion", label: "Conclusion", type: "string" },
  { key: "rep.policy", label: "Policy", type: "string" },
  { key: "rep.clinical_study", label: "Clinical study", type: "text" },
  { key: "rep.diagnosis", label: "Diagnosis", type: "choice/select" },
  { key: "rep.organ_structure", label: "Organ structure", type: "choice/select" },
  { key: "rep.tumour_stage", label: "Tumour stage", type: "choice/radio" },
  { key: "rep.diagnosis_date", label: "Date of diagnosis", type: "date" },
  { key: "rep.mdt_datetime", label: "MDT date and time", type: "dateTime" },
  { key: "rep.treatment_intent", label: "Treatment intent", type: "choice/radio" },
  { key: "rep.discussed_before", label: "Discussed before", type: "boolean" },
  { key: "rep.treatment_options", label: "Treatment options", type: "choice/checkboxes" },
];

export const mapFieldByKey = (key) => [...REQUEST_MAP_FIELDS, ...REPORT_MAP_FIELDS].find((f) => f.key === key);

// Fields of a form version available for mapping (removed ones drop out).
export function mapFieldsFor(source, version) {
  const all = source === "request" ? REQUEST_MAP_FIELDS : REPORT_MAP_FIELDS;
  const diff = FORM_DIFFS[version];
  return diff ? all.filter((f) => !diff.removed.includes(f.key)) : all;
}

// Why a from → to pair can't be saved, or null when it can.
export function mappingIssue(m) {
  if (!m.from || !m.to) return "incomplete";
  const a = mapFieldByKey(m.from);
  const b = mapFieldByKey(m.to);
  if (a.type !== b.type) return `Type mismatch: ${MAP_TYPES[a.type].label} → ${MAP_TYPES[b.type].label}. Map fields of the same type.`;
  return null;
}

// Mappings a version change would break: a removed "from" (request) or "to" (report) field.
export function prepopImpact(mappings, diff, source) {
  const side = source === "request" ? "from" : "to";
  return mappings
    .filter((m) => diff.removed.includes(m[side]))
    .map((m) => ({ kind: "removed", key: m[side], label: mapFieldByKey(m[side]).label }));
}

/* ------------------------------------------------- past MDTs fields */

// Report form fields a re-discussed case can show from its previous MDT report.
// Requirement 3: no limit on the number of fields and every data type is allowed.
export const PAST_MDT_FIELDS = [
  ...REPORT_MAP_FIELDS.map((f) => ({ ...f, type: MAP_TYPES[f.type].label })),
  { key: "rep.reason_for_referral", label: "Reason for referral", type: "Text" },
  { key: "rep.treatment_phase", label: "Treatment phase", type: "Choice · select" },
  { key: "rep.attachments", label: "Attachments", type: "Attachment" },
];

export const pastMdtFieldByKey = (key) =>
  PAST_MDT_FIELDS.find((f) => f.key === key) ??
  Object.values(FORM_DIFFS).flatMap((d) => d.pastMdtAdded ?? []).find((f) => f.key === key);

// Fields of a report form version available for Past MDTs (removed ones drop out, new ones are flagged).
export function pastMdtFieldsFor(version) {
  const diff = FORM_DIFFS[version];
  if (!diff) return PAST_MDT_FIELDS;
  return [
    ...PAST_MDT_FIELDS.filter((f) => !diff.removed.includes(f.key)),
    ...(diff.pastMdtAdded ?? []).map((f) => ({ ...f, isNew: true })),
  ];
}

// Configured Past MDTs fields a report form version change would remove.
export function pastMdtImpact(fields, diff) {
  return fields
    .filter((k) => diff.removed.includes(k))
    .map((k) => ({ kind: "removed", key: k, label: pastMdtFieldByKey(k)?.label ?? k }));
}
