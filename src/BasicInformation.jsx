import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "./tokens.js";
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

const FORM_OPTIONS = {
  request: ["CRC request form v1", "CRC request form v2", "General MDT request v3"],
  report: ["CRC request form v1", "Output form name v1.3", "CRC report form v2"],
};

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

function FormPicker({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div>
      <div className="flex items-center gap-1 text-[14px] font-semibold leading-6" style={{ color: T.bodyText }}>
        {label} *
        <img src={infoIcon} alt="" className="w-6 h-6" title={`The ${label.toLowerCase()} used by this care unit`} />
      </div>
      <div ref={ref} className="relative flex items-center gap-1 text-[15px] leading-6">
        <img src={documentIcon} alt="" className="w-6 h-6" />
        <span style={{ color: T.bodyText }}>{value}</span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-1 hover:underline" style={{ color: T.primary }}>
          Change
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-6 top-7 z-20 min-w-[260px] bg-white rounded py-1 shadow-lg"
              style={{ border: `1px solid ${T.border}` }}
            >
              {options.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => { onChange(o); setOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[15px] hover:bg-[#F7F8FA] flex items-center justify-between gap-4"
                    style={{ color: T.bodyText, fontWeight: o === value ? 600 : 400 }}
                  >
                    {o}
                    {o === value && <span className="text-[13px]" style={{ color: T.primary }}>Current</span>}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FormsCard({ forms, onChange }) {
  return (
    <Card title="Forms">
      <div className="flex flex-col gap-6">
        <FormPicker label="REQUEST form questionnaire" value={forms.request} options={FORM_OPTIONS.request} onChange={(v) => onChange({ ...forms, request: v })} />
        <FormPicker label="REPORT form questionnaire" value={forms.report} options={FORM_OPTIONS.report} onChange={(v) => onChange({ ...forms, report: v })} />
      </div>
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

export default function BasicInformation() {
  const [info, setInfo] = useState(INITIAL_INFO);
  const [forms, setForms] = useState({ request: "CRC request form v1", report: "CRC request form v1" });
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
          <FormsCard forms={forms} onChange={setForms} />
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
