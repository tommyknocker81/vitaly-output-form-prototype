import { useState, useId } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Pencil, X, Plus, Search, AlertCircle, AlertTriangle, ChevronDown, CalendarDays, Video, Info } from "lucide-react";
import { T } from "./tokens.js";
import { MAX_AGENDA_COLUMNS, columnFieldsFor, fieldByKey, versionOf, FORM_DIFFS } from "./formVersions.js";

// Care unit › Meeting (agenda columns from the "Care unit – Meeting agenda columns" canvas,
// styled after the Vitaly MDT meeting Patient list in Figma).

export const MEETING_TABS = ["Meeting dates", "Video conferencing", "Agenda columns"];

const AMBER = { bg: "#FFF8EC", border: "#FFB853", icon: "#C77700", chipBg: "#FFF3E0", chipFg: "#9A5B00" };

function Chip({ bg, fg, children }) {
  return (
    <span className="inline-flex items-center px-2 rounded text-[11px] leading-[20px] font-bold uppercase tracking-[0.06em] shrink-0" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

function TypeChip({ children }) {
  return <span className="text-[12px] px-2 py-0.5 rounded shrink-0" style={{ background: "#EEF1F3", color: "#444C54" }}>{children}</span>;
}

function Btn({ variant = "primary", children, className = "", ...props }) {
  const styles = {
    primary: { background: T.primary, border: `1px solid ${T.primary}`, color: "#fff" },
    outline: { background: "#fff", border: `1px solid ${T.primary}`, color: T.primary },
    secondary: { background: "#fff", border: `1px solid ${T.gray400}`, color: T.bodyText },
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 px-[13px] py-[7px] rounded text-[15px] leading-[1.5] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------- sample agenda */

const SYSTEM_COLUMNS = ["#", "Patient", "Discussion type", "Organisation", "Status", "Modified", "Publishing", "Treating clinician", "Referrer"];

const PATIENTS = [
  {
    hospital: "Hospital A",
    rows: [
      { name: "NAVARI, Nema", id: "5402170622", dob: "18/09/1986", sex: "f", tags: ["Re-discussed"], org: "Meander medical center", status: "In review", modified: "19.9.2024", publishing: "—", clinician: "Dr. Campbel", referrer: "Silver River MH",
        v: { "case.organ_type": "Rectum", "case.appointment_type": "Follow-up", "case.prepared_by": "Radiology", "case.surgery_date": "—", "case.urgency": "Normal", "case.age_at_referral": "38", "case.diagnosis_date": "02.08.2024", "case.referral_reason": "Staging", "case.second_opinion": "No", "case.tumour_stage": "T3 N1", "case.ecog_status": "1" } },
      { name: "BAUER, Fredric", id: "5402170622", dob: "18/09/1957", sex: "m", tags: [], org: "Meander medical center", status: "In review", modified: "19.9.2024", publishing: "—", clinician: "Dr. Myers", referrer: "UMC Utrecht",
        v: { "case.organ_type": "Colon", "case.appointment_type": "First consultation", "case.prepared_by": "Radiology, Pathology", "case.surgery_date": "02.10.2024", "case.urgency": "High", "case.age_at_referral": "67", "case.diagnosis_date": "28.08.2024", "case.referral_reason": "Treatment plan", "case.second_opinion": "Yes", "case.tumour_stage": "T2 N0", "case.ecog_status": "0" } },
      { name: "ROSAIRE, Carry", id: "5402170622", dob: "18/09/1986", sex: "f", tags: ["Re-discussed", "Re-scheduled"], org: "Meander medical center", status: "In review", modified: "19.9.2024", publishing: "—", clinician: "Dr. Campbel", referrer: "Antonius",
        v: { "case.organ_type": "Colon", "case.appointment_type": "Re-discussion", "case.prepared_by": "Radiology", "case.surgery_date": "—", "case.urgency": "Normal", "case.age_at_referral": "38", "case.diagnosis_date": "11.07.2024", "case.referral_reason": "Second line", "case.second_opinion": "No", "case.tumour_stage": "T4 N2", "case.ecog_status": "2" } },
    ],
  },
  {
    hospital: "Hospital B",
    rows: [
      { name: "LARSON, Zoe", id: "5402170622", dob: "18/09/1986", sex: "f", tags: [], org: "Twins Hospital Center", status: "Submitted", modified: "18.9.2024", publishing: "—", clinician: "Dr. Johnson", referrer: "Twins HC",
        v: { "case.organ_type": "Colon", "case.appointment_type": "First consultation", "case.prepared_by": "Radiology", "case.surgery_date": "—", "case.urgency": "Normal", "case.age_at_referral": "38", "case.diagnosis_date": "05.09.2024", "case.referral_reason": "Staging", "case.second_opinion": "No", "case.tumour_stage": "T1 N0", "case.ecog_status": "0" } },
      { name: "DAVIS, Eric", id: "5402170622", dob: "18/09/1986", sex: "m", tags: ["Re-scheduled"], org: "Twins Hospital Center", status: "In review", modified: "18.9.2024", publishing: "—", clinician: "Dr. Black", referrer: "Twins HC",
        v: { "case.organ_type": "Rectum", "case.appointment_type": "Follow-up", "case.prepared_by": "Pathology", "case.surgery_date": "14.10.2024", "case.urgency": "High", "case.age_at_referral": "38", "case.diagnosis_date": "20.06.2024", "case.referral_reason": "Treatment plan", "case.second_opinion": "Yes", "case.tumour_stage": "T3 N0", "case.ecog_status": "1" } },
    ],
  },
];

const TAG_STYLE = {
  "Re-discussed": { bg: "#FCE8C8", fg: "#9A5B00" },
  "Re-scheduled": { bg: "#EEDFF5", fg: "#7A3E94" },
};

function SexIcon({ sex }) {
  const female = sex === "f";
  const c = female ? "#C74139" : T.primary;
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#EEF1F3" }} aria-label={female ? "Female" : "Male"} role="img">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        {female ? (
          <><circle cx="12" cy="9" r="5" /><path d="M12 14v7M9 18h6" /></>
        ) : (
          <><circle cx="10" cy="14" r="5" /><path d="M14 10l6-6M15 4h5v5" /></>
        )}
      </svg>
    </span>
  );
}

const cellBase = "px-3 py-2.5 whitespace-nowrap text-[14px]";

function AgendaPreview({ columns, mode, setMode, highlight, removed, editing }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const full = mode === "full";
  const extra = columns.map((k) => ({ key: k, field: fieldByKey(k) }));

  const headCfg = (k) => {
    const isRemoved = removed.includes(k);
    const isNew = highlight.includes(k);
    return {
      background: isRemoved ? "#F8E7E6" : "#E6F2F6",
      color: isRemoved ? T.danger : "#00566E",
      textDecoration: isRemoved ? "line-through" : "none",
      outline: isNew ? `2px dashed ${T.primary}` : "none",
      outlineOffset: -2,
    };
  };
  const cellCfg = (k) => ({
    background: removed.includes(k) ? "#FDF4F3" : "#F2FAFC",
    color: removed.includes(k) ? T.danger : T.bodyText,
    textDecoration: removed.includes(k) ? "line-through" : "none",
    outline: highlight.includes(k) ? `2px dashed ${T.primary}` : "none",
    outlineOffset: -2,
  });

  const totalCols = (full ? 9 : 3) + extra.length;

  return (
    <section className="bg-white rounded min-w-0" style={{ border: `1px solid ${T.cardBorder}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">Preview</h3>
          {editing && <span className="text-[13px]" style={{ color: T.muted }}>Unsaved changes</span>}
        </div>
        <div role="group" aria-label="Preview mode" className="inline-flex rounded overflow-hidden" style={{ border: `1px solid ${T.gray400}` }}>
          {[["extra", "Additional columns"], ["full", "Full agenda"]].map(([m, label], i) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 text-[14px]"
              style={{
                background: mode === m ? "#E6F2F6" : "#fff",
                color: mode === m ? "#00566E" : "#444C54",
                fontWeight: mode === m ? 600 : 400,
                borderLeft: i ? `1px solid ${T.gray400}` : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-6">
        <p className="text-[13px] mb-3" style={{ color: T.muted }}>
          {removed.length
            ? "Struck-through columns disappear once you confirm the review."
            : editing
            ? "Updates as you add, remove and reorder. New columns are outlined."
            : "Meeting agenda · sample data. Configured columns are highlighted."}
        </p>
        <div className="overflow-x-auto rounded" style={{ border: `1px solid ${T.border}` }}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th scope="col" className={`${cellBase} font-semibold w-10`}>#</th>
                <th scope="col" className={`${cellBase} font-semibold`}>Patient</th>
                {full ? (
                  SYSTEM_COLUMNS.slice(2).map((c) => <th key={c} scope="col" className={`${cellBase} font-semibold`}>{c}</th>)
                ) : (
                  <th scope="col" className={`${cellBase} font-normal italic`} style={{ color: T.muted }}>+ 7 system columns</th>
                )}
                <AnimatePresence initial={false}>
                  {extra.map(({ key, field }) => (
                    <motion.th
                      key={key}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      scope="col"
                      className={`${cellBase} font-bold`}
                      style={headCfg(key)}
                    >
                      {field?.label ?? key}
                    </motion.th>
                  ))}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {PATIENTS.map((g) => {
                const open = !collapsed.has(g.hospital);
                return [
                  <tr key={g.hospital} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td colSpan={totalCols} className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setCollapsed((c) => { const n = new Set(c); n.has(g.hospital) ? n.delete(g.hospital) : n.add(g.hospital); return n; })}
                        className="flex items-center gap-2 text-[18px] font-semibold"
                        aria-expanded={open}
                      >
                        <motion.span initial={false} animate={{ rotate: open ? 0 : -90 }} className="flex"><ChevronDown size={18} color={T.primary} /></motion.span>
                        {g.hospital}
                      </button>
                    </td>
                  </tr>,
                  ...(open
                    ? g.rows.map((r, i) => (
                        <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td className={cellBase} style={{ color: T.gray600 }}>{i + 1}</td>
                          <td className={cellBase}>
                            <div className="flex items-center gap-2.5">
                              <SexIcon sex={r.sex} />
                              <div className="leading-tight">
                                <div className="font-semibold text-[14px]">{r.name}</div>
                                <div className="text-[12px]" style={{ color: T.gray600 }}>ID {r.id} - {r.dob}</div>
                              </div>
                            </div>
                          </td>
                          {full ? (
                            <>
                              <td className={cellBase}>
                                <div className="flex gap-1">
                                  {r.tags.map((t) => (
                                    <span key={t} className="px-2 rounded-full text-[11px] leading-[20px] font-bold uppercase tracking-[0.08em]" style={{ background: TAG_STYLE[t].bg, color: TAG_STYLE[t].fg }}>{t}</span>
                                  ))}
                                </div>
                              </td>
                              {[r.org, r.status, r.modified, r.publishing, r.clinician, r.referrer].map((v, j) => (
                                <td key={j} className={cellBase}>{v}</td>
                              ))}
                            </>
                          ) : (
                            <td className={cellBase} style={{ color: T.gray400 }}>…</td>
                          )}
                          {extra.map(({ key }) => (
                            <td key={key} className={cellBase} style={cellCfg(key)}>
                              {r.v[key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))
                    : []),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ columns card */

function EditRow({ k, n, isNew, onRemove }) {
  const controls = useDragControls();
  const f = fieldByKey(k);
  return (
    <Reorder.Item
      value={k}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ boxShadow: "0 4px 12px rgba(0,37,50,.14)", borderColor: T.primary, background: "#F2FAFC", zIndex: 10 }}
      className="relative flex items-center gap-1.5 py-1 pl-0.5 pr-1 rounded select-none"
      style={
        f.retired
          ? { border: "1px solid #F8E7E6", background: "#F8E7E6", boxShadow: `inset 3px 0 0 ${T.danger}` }
          : { border: `1px solid ${T.border}`, background: "#fff" }
      }
    >
      <button
        type="button"
        aria-label={`Reorder ${f.label}`}
        onPointerDown={(e) => controls.start(e)}
        className="w-7 h-9 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        style={{ color: "#8A949C" }}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
          {[4, 9, 14].flatMap((y) => [4, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
        </svg>
      </button>
      <span className="w-5 text-[12px] font-bold tabular-nums" style={{ color: f.retired ? T.danger : "#00566E" }}>{n}</span>
      <span className="flex-1 font-semibold text-[15px]" style={f.retired ? { textDecoration: "line-through", color: T.gray600 } : undefined}>{f.label}</span>
      {isNew && <Chip bg="#E6F2F6" fg="#00566E">New</Chip>}
      <TypeChip>{f.type}</TypeChip>
      <button type="button" aria-label={`Remove ${f.label}`} onClick={() => onRemove(k)} className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#F7F8FA]" style={{ color: T.gray600 }}>
        <X size={16} />
      </button>
    </Reorder.Item>
  );
}

function FieldPicker({ available, onAdd, full }) {
  const [q, setQ] = useState("");
  const list = available.filter((f) => f.label.toLowerCase().includes(q.toLowerCase()));
  const ok = list.filter((f) => !f.unsupported);
  const bad = list.filter((f) => f.unsupported);
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mt-1.5 bg-white rounded"
      style={{ border: `1px solid ${T.gray400}`, boxShadow: "0 6px 18px rgba(0,37,50,.12)" }}
    >
      <div className="p-2.5" style={{ borderBottom: "1px solid #EEF1F3" }}>
        <label htmlFor="field-search" className="block text-[12px] mb-1" style={{ color: T.muted }}>Request form fields</label>
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" color={T.muted} />
          <input
            id="field-search"
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fields…"
            className="w-full h-10 pl-8 pr-2.5 rounded text-[15px] outline-none"
            style={{ border: `1px solid ${T.primary}` }}
          />
        </div>
      </div>
      <ul className="py-1 max-h-[240px] overflow-y-auto">
        {ok.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              disabled={full}
              onClick={() => onAdd(f.key)}
              className="w-full min-h-10 flex items-center gap-2.5 px-3 text-left text-[15px] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex-1">{f.label}</span>
              {f.isNew && <Chip bg="#E6F2F6" fg="#00566E">New</Chip>}
              <TypeChip>{f.type}</TypeChip>
            </button>
          </li>
        ))}
        {ok.length === 0 && <li className="px-3 py-2 text-[14px]" style={{ color: T.muted }}>No matching fields.</li>}
        {bad.length > 0 && (
          <>
            <li className="px-3 pt-2 pb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: T.muted, borderTop: "1px solid #EEF1F3" }}>Not supported</li>
            {bad.map((f) => (
              <li key={f.key}>
                <button type="button" disabled className="w-full min-h-10 flex items-center gap-2.5 px-3 text-left text-[15px]" style={{ color: "#6B747C" }}>
                  <span className="flex-1">{f.label}</span>
                  <span className="text-[12px]">{f.unsupported}</span>
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </motion.div>
  );
}

// Icon with an explanatory tooltip, shown on hover and keyboard focus.
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex rounded-full focus:outline-none focus-visible:ring-2"
        style={{ "--tw-ring-color": T.danger }}
      >
        <AlertCircle size={22} color={T.danger} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-[-10px] bottom-[calc(100%+10px)] z-30 w-[300px] rounded px-3.5 py-3 text-[13px] leading-[1.5] text-white shadow-lg"
            style={{ background: "#002532" }}
          >
            {children}
            <span className="absolute left-[17px] -bottom-[5px] w-2.5 h-2.5 rotate-45" style={{ background: "#002532" }} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SystemColumns() {
  return (
    <details className="mt-5 pt-4" style={{ borderTop: "1px solid #EEF1F3" }}>
      <summary className="cursor-pointer text-[14px]" style={{ color: "#444C54" }}>System columns · always shown (9)</summary>
      <p className="mt-2 text-[13px]" style={{ color: T.muted }}>{SYSTEM_COLUMNS.join(", ")}</p>
    </details>
  );
}

function Progress({ used, label }) {
  return (
    <div className="mt-4 flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded" style={{ background: "#E3E7EA" }}>
        <motion.div className="h-1.5 rounded" style={{ background: T.primary }} initial={false} animate={{ width: `${(used / MAX_AGENDA_COLUMNS) * 100}%` }} />
      </div>
      <span className="text-[13px] whitespace-nowrap" style={{ color: "#444C54" }}>{label ?? `${used} of ${MAX_AGENDA_COLUMNS} additional columns`}</span>
    </div>
  );
}

function AgendaColumns({ agenda, setAgenda, requestForm, onConfirmReview }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(agenda.columns);
  const [picker, setPicker] = useState(false);
  const [mode, setMode] = useState("extra");

  const review = agenda.review;
  const removedInReview = review ? agenda.columns.filter((k) => FORM_DIFFS[review.to].removed.includes(k)) : [];
  // Columns whose field no longer exists on the active request form: hidden on the agenda until removed here.
  const orphans = agenda.columns.filter((k) => fieldByKey(k)?.retired);
  const removeOrphans = () => setAgenda((a) => ({ ...a, columns: a.columns.filter((k) => !orphans.includes(k)) }));
  // While a review is pending the live form is still the old one; edit against it.
  const fields = columnFieldsFor(agenda.builtOn);
  const columns = editing ? draft.filter((k) => !orphans.includes(k)) : agenda.columns.filter((k) => !orphans.includes(k));
  const added = editing ? draft.filter((k) => !agenda.columns.includes(k)) : [];
  const available = fields.filter((f) => !draft.includes(f.key));
  const full = draft.length >= MAX_AGENDA_COLUMNS;

  const startEdit = (withPicker = false) => {
    setDraft(agenda.columns);
    setEditing(true);
    setPicker(withPicker);
  };
  const save = () => {
    setAgenda((a) => ({ ...a, columns: draft }));
    setEditing(false);
    setPicker(false);
  };

  const status = editing ? (
    <Chip bg="#E6F2F6" fg="#00566E">Editing</Chip>
  ) : review || orphans.length ? (
    <Chip bg={AMBER.chipBg} fg={AMBER.chipFg}>Needs review</Chip>
  ) : agenda.columns.length ? (
    <Chip bg="#E8F3E5" fg="#3E7A31">Up to date</Chip>
  ) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <section
        className="bg-white rounded w-full lg:w-[440px] shrink-0"
        style={{ border: editing ? `2px solid ${T.primary}` : `1px solid ${T.cardBorder}`, margin: editing ? 0 : 1 }}
        aria-labelledby="cols-h"
      >
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 id="cols-h" className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">Agenda columns</h3>
              {status}
            </div>
            {!editing && agenda.columns.length > 0 && (
              <Btn variant="outline" onClick={() => startEdit(false)}><Pencil size={15} /> Edit</Btn>
            )}
          </div>
          <p className="mt-1.5 text-[13px]" style={{ color: T.muted }}>
            Fields from {agenda.builtOn}{editing && " · drag to reorder"}
          </p>
        </div>

        <div className="px-6 pb-6">
          {!editing && !review && orphans.length > 0 && (
            <div role="status" className="mt-4 flex gap-2.5 p-3 rounded" style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}>
              <AlertTriangle size={20} color={AMBER.icon} className="shrink-0 mt-0.5" />
              <div className="text-[14px] leading-[1.5]">
                <p className="font-semibold">{orphans.length} column{orphans.length > 1 ? "s use fields" : " uses a field"} no longer on the request form</p>
                <p className="mt-0.5">It's not in {agenda.builtOn}, so it's already hidden on the agenda.</p>
                <Btn className="mt-2.5" onClick={removeOrphans}>
                  Remove {orphans.length} removed field{orphans.length > 1 ? "s" : ""}
                </Btn>
              </div>
            </div>
          )}

          {!editing && review && removedInReview.length > 0 && (
            <div role="status" className="mt-4 flex gap-2.5 p-3 rounded" style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}>
              <AlertTriangle size={20} color={AMBER.icon} className="shrink-0 mt-0.5" />
              <div className="text-[14px] leading-[1.5]">
                <p className="font-semibold">The request form is changing ({versionOf(review.from)} → {versionOf(review.to)})</p>
                <p className="mt-0.5">
                  {removedInReview.length} column{removedInReview.length > 1 ? "s use fields" : " uses a field"} that {versionOf(review.to)} removes.
                  {" "}{versionOf(review.to)} goes live once this and every affected output form are reviewed.
                </p>
                <Btn className="mt-2.5" onClick={onConfirmReview}>
                  Remove {removedInReview.length} column{removedInReview.length > 1 ? "s" : ""} and confirm
                </Btn>
              </div>
            </div>
          )}

          {!editing && agenda.columns.length === 0 ? (
            <div className="mt-5 px-4 py-6 rounded text-center" style={{ border: `1px dashed ${T.gray400}` }}>
              <p className="font-semibold">No additional columns yet</p>
              <p className="mt-1 mb-3.5 text-[14px]" style={{ color: T.muted }}>
                The agenda shows the system columns only. Add up to {MAX_AGENDA_COLUMNS} fields from the request form.
              </p>
              <Btn onClick={() => startEdit(true)}><Plus size={16} /> Add column</Btn>
            </div>
          ) : (
            <>
              {!editing && (
                <p className="mt-3.5 text-[14px]">Extra columns shown on the MDT meeting agenda, after the system columns.</p>
              )}
              <Progress
                used={editing ? draft.filter((k) => !fieldByKey(k)?.retired).length : agenda.columns.length - removedInReview.length - orphans.length}
                label={
                  !editing && (removedInReview.length || orphans.length)
                    ? `${agenda.columns.length - removedInReview.length - orphans.length} of ${MAX_AGENDA_COLUMNS} in use · ${removedInReview.length + orphans.length} removed`
                    : undefined
                }
              />

              {editing ? (
                <Reorder.Group axis="y" values={draft} onReorder={setDraft} className="mt-3.5 flex flex-col gap-1.5">
                  {draft.map((k, i) => (
                    <EditRow key={k} k={k} n={i + 1} isNew={added.includes(k)} onRemove={(x) => setDraft((d) => d.filter((y) => y !== x))} />
                  ))}
                </Reorder.Group>
              ) : (
                <ol className="mt-3.5 flex flex-col gap-1.5">
                  {(() => {
                    let n = 0;
                    return agenda.columns.map((k) => {
                      const f = fieldByKey(k);
                      const inReview = removedInReview.includes(k);
                      const gone = inReview || orphans.includes(k);
                      if (!gone) n++;
                      return (
                        <li
                          key={k}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded"
                          style={
                            gone
                              ? { border: "1px solid #F8E7E6", background: "#F8E7E6", boxShadow: `inset 3px 0 0 ${T.danger}` }
                              : { border: `1px solid ${T.border}`, background: "#fff" }
                          }
                        >
                          {gone ? (
                            <InfoTip label={`Why ${f.label} is marked as removed`}>
                              {inReview ? (
                                <>
                                  <span className="block font-semibold mb-1">Field removed in {review.to}</span>
                                  The new version of the request form no longer contains this field. Once the change goes live, this column can't be shown on the agenda.
                                  <span className="block mt-2" style={{ color: "#B9D3DC" }}>
                                    To delete it, use <strong className="text-white">Remove {removedInReview.length} column{removedInReview.length > 1 ? "s" : ""} and confirm</strong> above.
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="block font-semibold mb-1">Field no longer on the request form</span>
                                  The request form has been updated and no longer contains this field, so this column is hidden on the agenda.
                                  <span className="block mt-2" style={{ color: "#B9D3DC" }}>
                                    To delete it, use <strong className="text-white">Remove {orphans.length} removed field{orphans.length > 1 ? "s" : ""}</strong> above, or click <strong className="text-white">Edit</strong> and remove it with ×.
                                  </span>
                                </>
                              )}
                            </InfoTip>
                          ) : (
                            <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: "#E6F2F6", color: "#00566E" }}>{n}</span>
                          )}
                          <span className="flex-1 font-semibold" style={{ textDecoration: gone ? "line-through" : "none", color: gone ? T.gray600 : T.bodyText }}>{f.label}</span>
                          <TypeChip>{f.type}</TypeChip>
                        </li>
                      );
                    });
                  })()}
                </ol>
              )}

              {editing && (
                <>
                  <button
                    type="button"
                    aria-expanded={picker}
                    disabled={full && !picker}
                    onClick={() => setPicker((p) => !p)}
                    className="mt-3 w-full min-h-10 inline-flex items-center justify-center gap-1.5 rounded font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ border: `1px dashed ${T.primary}`, color: T.primary }}
                  >
                    <Plus size={16} /> {full ? `Maximum of ${MAX_AGENDA_COLUMNS} columns reached` : "Add column"}
                  </button>
                  <AnimatePresence>
                    {picker && !full && (
                      <FieldPicker
                        available={available}
                        full={full}
                        onAdd={(k) => setDraft((d) => [...d, k])}
                      />
                    )}
                  </AnimatePresence>
                </>
              )}

              <SystemColumns />
            </>
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-2.5 px-6 py-4 rounded-b" style={{ borderTop: `1px solid ${T.border}`, background: "#FAFBFC" }}>
            <Btn variant="secondary" onClick={() => { setEditing(false); setPicker(false); }}>Cancel</Btn>
            <Btn onClick={save}>Save columns</Btn>
          </div>
        )}

        {!requestForm && (
          <div className="mx-6 mb-6 flex gap-2.5 p-3 rounded" style={{ background: T.light }}>
            <Info size={20} color={T.primary} className="shrink-0" />
            <p className="text-[14px]">Select a request form first. Agenda columns use its fields.</p>
          </div>
        )}
      </section>

      <div className="flex-1 min-w-0 w-full">
        <AgendaPreview
          columns={columns}
          mode={mode}
          setMode={setMode}
          highlight={added}
          removed={editing ? [] : removedInReview}
          editing={editing}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- placeholders */

function Placeholder({ icon: Icon, title, text }) {
  return (
    <section className="bg-white rounded max-w-[720px]" style={{ border: `1px solid ${T.cardBorder}` }}>
      <div className="p-6">
        <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">{title}</h3>
      </div>
      <div className="px-6 pb-10 pt-4 flex flex-col items-center text-center gap-3">
        <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E6F2F6" }}>
          <Icon size={24} color={T.primary} />
        </span>
        <p className="text-[15px] font-semibold">Not part of this prototype yet</p>
        <p className="text-[14px] max-w-[440px]" style={{ color: T.muted }}>{text}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function MeetingSettings({ tab, setTab, agenda, setAgenda, requestForm, onConfirmAgendaReview }) {
  return (
    <main className="px-8 pt-6 pb-10">
      <h2 className="text-[22px] font-semibold leading-[1.2]">Meeting</h2>
      <div className="mt-6 flex gap-6" style={{ borderBottom: `1px solid ${T.border}` }}>
        {MEETING_TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className="pb-2 text-[15px] -mb-px flex items-center gap-1.5"
            style={{ fontWeight: tab === i ? 600 : 400, borderBottom: tab === i ? `2px solid ${T.primary}` : "2px solid transparent" }}
          >
            {t}
            {i === 2 && agenda.review && <span className="w-2 h-2 rounded-full" style={{ background: AMBER.border }} aria-label="Needs review" />}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 0 && (
          <Placeholder icon={CalendarDays} title="Meeting dates" text="Recurring schedule, upcoming meeting dates and exceptions for this care unit will be configured here." />
        )}
        {tab === 1 && (
          <Placeholder icon={Video} title="Video conferencing" text="The video conferencing provider and meeting link settings for this care unit will be configured here." />
        )}
        {tab === 2 && (
          <AgendaColumns agenda={agenda} setAgenda={setAgenda} requestForm={requestForm} onConfirmReview={onConfirmAgendaReview} />
        )}
      </div>
    </main>
  );
}
