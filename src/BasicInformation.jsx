import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "./tokens.js";
import { SOURCE_FORMS, FORM_DIFFS, versionOf, bumpVersion, impactOf } from "./formVersions.js";
import editIcon from "./icons/edit.svg";
import usersIcon from "./icons/users.svg";
import infoIcon from "./icons/info.svg";
import documentIcon from "./icons/document.svg";
import removeIcon from "./icons/remove.svg";
import addIcon from "./icons/add.svg";
import addDisabledIcon from "./icons/add-disabled.svg";

// Care unit manager – Basic information tab (Figma node 14007:352151).

const INITIAL_INFO = {
  name: "CRC",
  therapeuticArea: "Oncology",
  leadOrganisation: "Vallee des fleurs clinique",
  speciality: "Bladder",
};

const INFO_FIELDS = [
  ["name", "Name"],
  ["leadOrganisation", "Lead organisation"],
  ["therapeuticArea", "Therapeutic area"],
  ["speciality", "Speciality"],
];


const INITIAL_ORGS = ["Silver river memorial hospital", "Goldriver Hopsital", "Tergoii", "Private practice"];
const ORG_DIRECTORY = ["UMC Utrecht", "St. Antonius Ziekenhuis", "Meander Medisch Centrum", "Diakonessenhuis"];

/* ------------------------------------------------------------ pieces */

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`bg-white rounded ${className}`} style={{ border: `1px solid ${T.cardBorder}` }}>
      <div className="flex items-center justify-between p-6">
        <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]" style={{ color: T.bodyText }}>{title}</h3>
        {action}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}

function IconButton({ src, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-6 h-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:hover:opacity-100"
    >
      <img src={src} alt="" className="w-6 h-6" />
    </button>
  );
}

function Radio({ checked, label, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[15px]" style={{ color: T.bodyText }}>
      <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
        style={{ background: checked ? T.primary : "#fff", border: checked ? "none" : "1px solid rgba(0,0,0,0.25)" }}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      {label}
    </label>
  );
}

function Checkbox({ checked, label, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[15px] py-1" style={{ color: T.bodyText }}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span
        className="w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors"
        style={{ background: checked ? T.primary : "#fff", border: checked ? `1px solid ${T.primary}` : "1px solid rgba(0,0,0,0.25)" }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.6" /></svg>
        )}
      </span>
      {label}
    </label>
  );
}

const inputCls = "w-full h-9 px-3 rounded text-[15px] outline-none focus:ring-2";
const inputStyle = { border: `1px solid ${T.gray400}`, color: T.bodyText, "--tw-ring-color": "rgba(0,128,163,0.25)" };

function Button({ variant = "primary", children, ...props }) {
  const styles = {
    primary: { background: T.primary, border: `1px solid ${T.primary}`, color: "#fff" },
    secondary: { background: "#fff", border: `1px solid ${T.gray400}`, color: T.bodyText },
    danger: { background: T.danger, border: `1px solid ${T.danger}`, color: "#fff" },
    success: { background: "#62A752", border: "1px solid #62A752", color: "#fff" },
  };
  return (
    <button type="button" className="px-[13px] py-[7px] rounded text-[15px] leading-[1.5] transition-opacity hover:opacity-90" style={styles[variant]} {...props}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ cards */

function MdtInfoCard({ info, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(info);

  const start = () => { setDraft(info); setEditing(true); };

  return (
    <Card
      title="MDT info"
      action={!editing && <IconButton src={editIcon} label="Edit MDT info" onClick={start} />}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {INFO_FIELDS.map(([k, label]) => (
          <div key={k}>
            <div className="text-[14px] font-semibold leading-6" style={{ color: T.bodyText }}>{label}</div>
            {editing ? (
              <input
                className={`${inputCls} mt-1 max-w-[360px]`}
                style={inputStyle}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                autoFocus={k === "name"}
              />
            ) : (
              <div className="text-[15px] leading-6" style={{ color: T.bodyText }}>{info[k] || "—"}</div>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <div className="flex gap-2 mt-6">
          <Button onClick={() => { onSave(draft); setEditing(false); }}>Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      )}
    </Card>
  );
}

function FormPicker({ source, state, outputForms, onPick, onCancel, onGoReview }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { label, versions } = SOURCE_FORMS[source];
  const activeIdx = versions.indexOf(state.active);

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const inReview = outputForms.filter((f) => f.reviews.some((r) => r.source === source));
  const totalAffected = state.pending ? outputForms.filter((f) => f.reviews.some((r) => r.source === source) || f.builtOn[source] === state.pending).length : 0;

  return (
    <div>
      <div className="flex items-center gap-1 text-[14px] font-semibold leading-6" style={{ color: T.bodyText }}>
        {label} *
        <img src={infoIcon} alt="" className="w-6 h-6" title="Output forms take their fields from this questionnaire" />
      </div>
      <div ref={ref} className="relative flex items-center gap-1 text-[15px] leading-6">
        <img src={documentIcon} alt="" className="w-6 h-6" />
        <span style={{ color: T.bodyText }}>{state.active}</span>
        {!state.pending && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="ml-1 hover:underline" style={{ color: T.primary }}>
            Change
          </button>
        )}
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-6 top-7 z-20 min-w-[280px] bg-white rounded py-1 shadow-lg"
              style={{ border: `1px solid ${T.border}` }}
            >
              {versions.map((v, i) => {
                const current = i === activeIdx;
                const older = i < activeIdx;
                return (
                  <li key={v}>
                    <button
                      type="button"
                      disabled={current || older}
                      onClick={() => { onPick(v); setOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-[15px] hover:bg-[#F7F8FA] disabled:hover:bg-transparent disabled:cursor-default flex items-center justify-between gap-4"
                      style={{ color: older ? T.gray600 : T.bodyText, fontWeight: current ? 600 : 400 }}
                    >
                      {v}
                      {current && <span className="text-[13px]" style={{ color: T.primary }}>Current</span>}
                      {older && <span className="text-[13px]">Older version</span>}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {state.pending && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded px-3 py-2 text-[14px] leading-[1.5]" style={{ background: "#FFF8EC", border: "1px solid #FFB853", color: T.bodyText }}>
              <div>
                <strong>{state.pending}</strong> is waiting for review –{" "}
                {totalAffected - inReview.length} of {totalAffected} affected output form{totalAffected > 1 ? "s" : ""} published.
                It goes live once all are reviewed.
              </div>
              <div className="flex gap-4 mt-1">
                <button type="button" onClick={() => onGoReview(source)} className="font-semibold hover:underline" style={{ color: T.primary }}>
                  Review output forms
                </button>
                <button type="button" onClick={() => onCancel(source)} className="hover:underline" style={{ color: T.danger }}>
                  Cancel change
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const KIND = {
  added: { sign: "+", fg: T.primary, text: "added, hidden by default" },
  removed: { sign: "−", fg: T.danger, text: "removed" },
  changed: { sign: "~", fg: "#9A5B00", text: "changed" },
};

// Shown before a source form version change is started.
function ImpactDialog({ change, sourceForms, outputForms, onConfirm, onClose }) {
  const { source, target } = change;
  const diff = FORM_DIFFS[target];
  const from = sourceForms[source].active;
  const impacts = outputForms.map((f) => ({ form: f, items: impactOf(f.sections, diff) }));
  const affected = impacts.filter((i) => i.items.length);
  const fieldChanges = [
    ...diff.added.map((a) => ({ kind: "added", key: a.field.key, label: a.field.label })),
    ...diff.removed.map((k) => ({ kind: "removed", key: k })),
    ...Object.entries(diff.changed).map(([k, c]) => ({ kind: "changed", key: k, label: c.label })),
  ];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,37,50,0.45)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="impact-title"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="bg-white rounded w-full max-w-[640px] max-h-[calc(100vh-48px)] overflow-y-auto shadow-xl"
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${T.border}` }}>
          <h3 id="impact-title" className="text-[20px] font-semibold leading-[1.2]" style={{ color: T.bodyText }}>
            Change {SOURCE_FORMS[source].label.toLowerCase()}?
          </h3>
          <p className="text-[15px] mt-1" style={{ color: T.gray600 }}>
            {from} → <strong style={{ color: T.bodyText }}>{target}</strong>
          </p>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <h4 className="text-[13px] uppercase tracking-[1px] font-bold mb-2" style={{ color: T.muted }}>Field changes in {versionOf(target)}</h4>
            <ul className="flex flex-col gap-1">
              {fieldChanges.map((c) => (
                <li key={c.key} className="flex items-baseline gap-2 text-[15px]">
                  <span className="w-4 text-center font-bold" style={{ color: KIND[c.kind].fg }}>{KIND[c.kind].sign}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 13, color: T.muted }}>{c.key}</span>
                  <span style={{ color: T.bodyText }}>{c.label && c.kind !== "removed" ? `“${c.label}” ` : ""}{KIND[c.kind].text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] uppercase tracking-[1px] font-bold mb-2" style={{ color: T.muted }}>
              Output forms ({affected.length} of {outputForms.length} need review)
            </h4>
            <ul className="rounded" style={{ border: `1px solid ${T.border}` }}>
              {impacts.map(({ form, items }, i) => (
                <li key={form.id} className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${T.border}` : "none" }}>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: T.bodyText }}>
                      {form.name} v{form.version}
                      {items.length > 0 && <span className="font-normal" style={{ color: T.muted }}> → v{bumpVersion(form.version)}</span>}
                    </div>
                    {items.length > 0 && (
                      <div className="text-[13px]" style={{ color: T.muted }}>
                        {items.map((it) => `${KIND[it.kind].sign} ${it.label}`).join(" · ")}
                      </div>
                    )}
                  </div>
                  {items.length ? (
                    <span className="text-[13px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "#FFF3E0", color: "#9A5B00" }}>
                      {items.length} change{items.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-[13px] shrink-0" style={{ color: T.muted }}>Not affected</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <ul className="text-[14px] leading-[1.5] flex flex-col gap-1 rounded-lg p-4" style={{ background: "rgba(0,128,163,0.05)", color: T.bodyText }}>
            <li>• {from} stays active until every affected output form is reviewed and published.</li>
            <li>• Cases already in progress keep {versionOf(from)} and their current output form versions.</li>
            <li>• New fields are added hidden; removed fields are dropped when each output form is published.</li>
          </ul>
        </div>

        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>{affected.length ? `Start review (${affected.length})` : "Change form"}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormsCard({ sourceForms, outputForms, onStartChange, onCancelChange, onGoReview }) {
  const [change, setChange] = useState(null);
  return (
    <Card title="Forms">
      <div className="flex flex-col gap-6">
        {Object.keys(SOURCE_FORMS).map((src) => (
          <FormPicker
            key={src}
            source={src}
            state={sourceForms[src]}
            outputForms={outputForms}
            onPick={(target) => setChange({ source: src, target })}
            onCancel={onCancelChange}
            onGoReview={onGoReview}
          />
        ))}
      </div>
      {createPortal(
      <AnimatePresence>
        {change && (
          <ImpactDialog
            change={change}
            sourceForms={sourceForms}
            outputForms={outputForms}
            onClose={() => setChange(null)}
            onConfirm={() => { onStartChange(change.source, change.target); setChange(null); }}
          />
        )}
      </AnimatePresence>,
      document.body
      )}
    </Card>
  );
}

function OrganisationsCard({ orgs, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const available = ORG_DIRECTORY.filter((o) => !orgs.includes(o));

  return (
    <Card
      title="Participating organisations"
      action={<IconButton src={available.length ? addIcon : addDisabledIcon} label="Add organisation" disabled={!available.length} onClick={() => setAdding((a) => !a)} />}
    >
      <AnimatePresence initial={false}>
        {adding && available.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-4">
              <span className="text-[14px] self-center mr-1" style={{ color: T.gray600 }}>Add:</span>
              {available.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => { onAdd(o); setAdding(false); }}
                  className="px-3 py-1 rounded-full text-[14px] transition-colors hover:bg-[#E6F2F6]"
                  style={{ border: `1px solid ${T.primary}`, color: T.primary }}
                >
                  + {o}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul>
        <AnimatePresence initial={false}>
          {orgs.map((o, i) => (
            <motion.li
              key={o}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 py-2" style={{ borderTop: i ? `1px solid ${T.border}` : "none" }}>
                <img src={usersIcon} alt="" className="w-6 h-6" />
                <span className="flex-1 text-[15px] font-semibold leading-6" style={{ color: "#000" }}>{o}</span>
                <IconButton src={removeIcon} label={`Remove ${o}`} onClick={() => onRemove(o)} />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {orgs.length === 0 && (
        <p className="text-[15px] text-center py-6" style={{ color: T.gray600 }}>No participating organisations yet.</p>
      )}
    </Card>
  );
}

function RequestSubmissionCard({ orgs, mode, setMode, selected, setSelected }) {
  const picked = selected.filter((o) => orgs.includes(o));
  return (
    <Card
      title={mode === "all" ? "Allow request submission from HIS" : "Request submission policy from HIS"}
      action={<img src={mode === "all" ? addDisabledIcon : addIcon} alt="" className="w-6 h-6" />}
    >
      <div className="flex gap-9">
        <Radio checked={mode === "all"} label="All participating organisations" onChange={() => setMode("all")} />
        <Radio checked={mode === "selected"} label="Only selected organisations" onChange={() => setMode("selected")} />
      </div>
      <AnimatePresence initial={false}>
        {mode === "selected" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-5">
              {orgs.map((o) => (
                <Checkbox
                  key={o}
                  label={o}
                  checked={picked.includes(o)}
                  onChange={() => setSelected(picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o])}
                />
              ))}
              {picked.length === 0 && (
                <div className="flex flex-col items-center gap-3 pt-10 pb-6 text-center">
                  <img src={usersIcon} alt="" className="w-6 h-6" />
                  <p className="text-[15px]" style={{ color: "#000" }}>
                    No organisation will be able to submit requests until at least one is added.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function ActivationCard({ active, setActive }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="bg-white rounded w-full lg:w-[518px] shrink-0" style={{ border: `1px solid ${T.cardBorder}` }}>
      <div className="flex items-center justify-between p-6">
        <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]" style={{ color: T.bodyText }}>
          MDT ({active ? "Activate" : "Inactive"})
        </h3>
        <span
          className="text-[13px] font-semibold px-2 py-0.5 rounded-full"
          style={active ? { background: "#E8F3E5", color: "#3E7A31" } : { background: "#F8E7E6", color: T.danger }}
        >
          {active ? "Active" : "Deactivated"}
        </span>
      </div>
      <div className="px-6 pb-6">
        <div className="rounded-lg p-4" style={{ background: "rgba(0,128,163,0.05)" }}>
          <p className="text-[16px] font-semibold leading-[1.2] mb-2" style={{ color: T.bodyText }}>
            {active ? "Once a Care Unit is active, Admin can:" : "While a Care Unit is deactivated:"}
          </p>
          {active ? (
            <ul className="text-[15px] leading-[1.5] list-disc pl-[22px]" style={{ color: T.bodyText }}>
              <li>Modify Name and Code</li>
              <li>Change Forms</li>
              <li>Add or remove Participant Organizations.</li>
            </ul>
          ) : (
            <ul className="text-[15px] leading-[1.5] list-disc pl-[22px]" style={{ color: T.bodyText }}>
              <li>No new requests can be submitted</li>
              <li>Scheduled meetings are paused</li>
              <li>Existing reports remain available</li>
            </ul>
          )}
          <p className="text-[15px] leading-[1.5] mt-6" style={{ color: T.bodyText }}>
            <strong>Important:</strong> Changes to Forms and Codes must be made cautiously and follow detailed instructions to maintain system integrity.
          </p>
        </div>
      </div>
      <div className="px-6 py-6" style={{ borderTop: `1px solid ${T.border}` }}>
        {confirming ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] mr-2" style={{ color: T.bodyText }}>Deactivate this care unit?</span>
            <Button variant="danger" onClick={() => { setActive(false); setConfirming(false); }}>Yes, deactivate</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : active ? (
          <Button variant="danger" onClick={() => setConfirming(true)}>Deactivate care unit</Button>
        ) : (
          <Button variant="success" onClick={() => setActive(true)}>Activate care unit</Button>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- page */

export default function BasicInformation({ sourceForms, outputForms, onStartChange, onCancelChange, onGoReview }) {
  const [info, setInfo] = useState(INITIAL_INFO);
  const [orgs, setOrgs] = useState(INITIAL_ORGS);
  const [mode, setMode] = useState("all");
  const [selected, setSelected] = useState([]);
  const [active, setActive] = useState(true);

  return (
    <main className="px-8 pt-6 pb-10">
      <h2 className="text-[22px] font-semibold leading-[1.2]">Basic information</h2>
      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
          <MdtInfoCard info={info} onSave={setInfo} />
          <FormsCard
            sourceForms={sourceForms}
            outputForms={outputForms}
            onStartChange={onStartChange}
            onCancelChange={onCancelChange}
            onGoReview={onGoReview}
          />
          <OrganisationsCard
            orgs={orgs}
            onAdd={(o) => setOrgs([...orgs, o])}
            onRemove={(o) => setOrgs(orgs.filter((x) => x !== o))}
          />
          <RequestSubmissionCard orgs={orgs} mode={mode} setMode={setMode} selected={selected} setSelected={setSelected} />
        </div>
        <ActivationCard active={active} setActive={setActive} />
      </div>
    </main>
  );
}
