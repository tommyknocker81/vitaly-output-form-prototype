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
    removed: ["pathology.kras"],
    changed: {
      "radiology.modality": { label: "Imaging modality & date", value: "CT Abdomen/Pelvis with contrast – 01/05/2025" },
      "clinician.name": { label: "Referring clinician" },
    },
  },
  "CRC report form v2": {
    added: [
      { section: "next_steps", field: { key: "next_steps.follow_up_mdt", label: "Follow-up MDT", type: "item", value: "Re-discuss at post-op MDT – 24/06/2025" } },
    ],
    removed: ["mdt.fitness"],
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
