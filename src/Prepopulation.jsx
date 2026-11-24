import { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Plus, ArrowRight, ArrowRightLeft, AlertTriangle, AlertCircle, ChevronDown, Check } from "lucide-react";
import { T } from "./tokens.js";
import { InfoTip } from "./MeetingSettings.jsx";
import { MAP_TYPES, mapFieldByKey, mapFieldsFor, mappingIssue, versionOf, FORM_DIFFS, SOURCE_FORMS } from "./formVersions.js";

// Forms › Report form pre-population (requirement 2 – Request > Report field mapping).

const AMBER = { bg: "#FFF8EC", border: "#FFB853", icon: "#C77700", chipBg: "#FFF3E0", chipFg: "#9A5B00" };

function Chip({ bg, fg, children }) {
  return (
    <span className="inline-flex items-center px-2 rounded text-[11px] leading-[20px] font-bold uppercase tracking-[0.06em] shrink-0" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

// White on the grey mapping rows; light grey inside the white dropdown.
function TypeChip({ type, muted, onWhite }) {
  return (
    <span className="text-[12px] px-2 py-0.5 rounded shrink-0 whitespace-nowrap" style={{ background: onWhite ? "#EEF1F3" : "#fff", color: muted ? "#6B747C" : "#444C54" }}>
      {MAP_TYPES[type].label}
    </span>
  );
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

const rowOk = { border: "1px solid transparent", background: T.light };
const rowGone = { border: "1px solid #F8E7E6", background: "#F8E7E6", boxShadow: `inset 3px 0 0 ${T.danger}` };

// One side of a mapping in read-only mode.
function FieldBox({ fieldKey, removedIn, formName }) {
  const f = mapFieldByKey(fieldKey);
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded" style={removedIn ? rowGone : rowOk}>
      {removedIn && (
        <InfoTip label={`Why ${f.label} is marked as removed`}>
          <span className="block font-semibold mb-1">Field removed in {removedIn}</span>
          The new version of the {formName} no longer contains this field, so this mapping is skipped when the report is pre-filled.
          <span className="block mt-2" style={{ color: "#B9D3DC" }}>
            To delete it, use <strong className="text-white">Remove mappings and confirm</strong> above.
          </span>
        </InfoTip>
      )}
      <span
        className="flex-1 min-w-0 truncate font-semibold text-[15px]"
        style={removedIn ? { textDecoration: "line-through", color: T.gray600 } : undefined}
      >
        {f.label}
      </span>
      <TypeChip type={f.type} />
    </div>
  );
}

function ColumnHeads() {
  return (
    <div className="flex items-center gap-3 text-[13px] font-semibold" style={{ color: T.muted }}>
      <span className="flex-1">From — request form</span>
      <span className="w-5" aria-hidden="true" />
      <span className="flex-1">To — report form</span>
    </div>
  );
}

// Field dropdown in the design system's style: label + type tag, unsupported types
// and already-mapped targets listed but disabled. Keyboard: Enter/Space/↓ open,
// ↑/↓ move, Enter picks, Esc closes.
function FieldSelect({ label, value, fields, used, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const listId = useId();
  const selected = value ? mapFieldByKey(value) : null;

  const options = [
    ...fields.filter((f) => !MAP_TYPES[f.type].unsupported).map((f) => {
      const taken = used?.includes(f.key) && f.key !== value;
      return { f, disabled: taken, note: taken ? "Already mapped" : null };
    }),
    ...fields.filter((f) => MAP_TYPES[f.type].unsupported).map((f) => ({ f, disabled: true, note: "Not supported", unsupported: true })),
  ];
  const enabledIdx = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openList = () => {
    setOpen(true);
    setActive(Math.max(0, options.findIndex((o) => o.f.key === value)));
  };
  const pick = (o) => {
    if (o.disabled) return;
    onChange(o.f.key);
    setOpen(false);
  };
  const move = (dir) => {
    const pos = enabledIdx.indexOf(active);
    const next = enabledIdx[Math.min(enabledIdx.length - 1, Math.max(0, (pos < 0 ? -1 : pos) + dir))];
    if (next !== undefined) setActive(next);
  };
  const onKey = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && ["Enter", " ", "ArrowDown"].includes(e.key)) return e.preventDefault(), openList();
    if (!open) return;
    if (e.key === "ArrowDown") return e.preventDefault(), move(1);
    if (e.key === "ArrowUp") return e.preventDefault(), move(-1);
    if (e.key === "Enter") return e.preventDefault(), options[active] && pick(options[active]);
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className="w-full h-10 flex items-center gap-2 pl-3 pr-2.5 rounded bg-white text-left focus:outline-none focus-visible:ring-2"
        style={{
          border: `1px solid ${invalid ? T.danger : open ? T.primary : T.gray400}`,
          "--tw-ring-color": "rgba(0,128,163,0.25)",
        }}
      >
        <span className="flex-1 min-w-0 truncate text-[15px]" style={{ color: selected ? T.bodyText : T.muted, fontWeight: selected ? 600 : 400 }}>
          {selected ? selected.label : "Select a field…"}
        </span>
        {selected && <TypeChip type={selected.type} onWhite />}
        <motion.span initial={false} animate={{ rotate: open ? 180 : 0 }} className="flex shrink-0">
          <ChevronDown size={18} color={T.primary} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-white rounded py-1 max-h-[280px] overflow-y-auto"
            style={{ border: `1px solid ${T.gray400}`, boxShadow: "0 6px 18px rgba(0,37,50,.12)" }}
          >
            {options.map((o, i) => {
              const isSel = o.f.key === value;
              return (
                <li key={o.f.key}>
                  {o.unsupported && !options[i - 1]?.unsupported && (
                    <div className="px-3 pt-2 pb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: T.muted, borderTop: "1px solid #EEF1F3" }}>
                      Not supported
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled}
                    tabIndex={-1}
                    onMouseEnter={() => !o.disabled && setActive(i)}
                    onClick={() => pick(o)}
                    className="w-full min-h-10 flex items-center gap-2.5 px-3 text-left text-[15px]"
                    style={{
                      background: i === active && !o.disabled ? "#F2FAFC" : "transparent",
                      color: o.disabled ? "#6B747C" : T.bodyText,
                      cursor: o.disabled ? "not-allowed" : "pointer",
                      fontWeight: isSel ? 600 : 400,
                    }}
                  >
                    <span className="flex-1 min-w-0 truncate">{o.f.label}</span>
                    {o.note && !o.unsupported && <span className="text-[12px]">{o.note}</span>}
                    <TypeChip type={o.f.type} muted={o.disabled} onWhite />
                    {isSel && <Check size={16} color={T.primary} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

let nextId = 1;
const withIds = (ms) => ms.map((m) => ({ ...m, id: m.id ?? `m${nextId++}` }));

export default function Prepopulation({ prepop, setPrepop, onConfirmReview }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);

  const reviews = prepop.reviews;
  // Per mapping: which side's field the pending version removes, and in which version.
  const staleOf = (m) => {
    for (const r of reviews) {
      const side = r.source === "request" ? "from" : "to";
      if (FORM_DIFFS[r.to].removed.includes(m[side])) return { side, version: r.to };
    }
    return null;
  };
  const staleCount = prepop.mappings.filter(staleOf).length;

  const requestFields = mapFieldsFor("request", prepop.builtOn.request);
  const reportFields = mapFieldsFor("report", prepop.builtOn.report);

  const issues = draft.map(mappingIssue);
  const errorCount = issues.filter((x) => x && x !== "incomplete").length;
  const incomplete = issues.filter((x) => x === "incomplete").length;
  const usedTargets = draft.map((m) => m.to).filter(Boolean);

  const startEdit = (addRow = false) => {
    setDraft(withIds([...prepop.mappings, ...(addRow ? [{ from: null, to: null }] : [])]));
    setEditing(true);
  };
  const save = () => {
    setPrepop((p) => ({ ...p, mappings: draft.map(({ id, ...m }) => m) }));
    setEditing(false);
  };
  const update = (id, patch) => setDraft((d) => d.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const status = editing ? (
    <Chip bg="#E6F2F6" fg="#00566E">Editing</Chip>
  ) : reviews.length ? (
    <Chip bg={AMBER.chipBg} fg={AMBER.chipFg}>Needs review</Chip>
  ) : prepop.mappings.length ? (
    <Chip bg="#E8F3E5" fg="#3E7A31">Up to date</Chip>
  ) : (
    <Chip bg="#EEF1F3" fg="#444C54">Not set up</Chip>
  );

  return (
    <section
      className="bg-white rounded max-w-[960px]"
      style={{ border: editing ? `2px solid ${T.primary}` : `1px solid ${T.cardBorder}`, margin: editing ? 0 : 1 }}
      aria-labelledby="prepop-h"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 id="prepop-h" className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">Report form pre-population</h3>
            {status}
          </div>
          {!editing && prepop.mappings.length > 0 && (
            <Btn variant="outline" onClick={() => startEdit(false)}><Pencil size={15} /> Edit</Btn>
          )}
        </div>
        <p className="mt-1.5 text-[13px]" style={{ color: T.muted }}>
          From {prepop.builtOn.request} → to {prepop.builtOn.report}
        </p>
        <p className="mt-3.5 text-[14px] leading-[1.5] max-w-[720px]">
          When a referral enters <strong>In review</strong> and the scribe opens the Decision draft for the first time, these report fields are filled in with the request form's values. They keep updating until the MDT decision is saved.
        </p>
      </div>

      <div className="px-6 pb-6">
        {!editing && reviews.length > 0 && (
          <div role="status" className="mt-4 flex gap-2.5 p-3 rounded" style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}>
            <AlertTriangle size={20} color={AMBER.icon} className="shrink-0 mt-0.5" />
            <div className="text-[14px] leading-[1.5]">
              <p className="font-semibold">One or more forms are changing. Please review.</p>
              <ul className="mt-0.5">
                {reviews.map((r) => (
                  <li key={r.to}>{SOURCE_FORMS[r.source].short} form: {versionOf(r.from)} → {versionOf(r.to)}</li>
                ))}
              </ul>
              <p className="mt-0.5">
                {staleCount
                  ? `${staleCount} mapping${staleCount > 1 ? "s use fields" : " uses a field"} the new version removes. Removed mappings are skipped when the report is pre-filled.`
                  : "No mapping uses a removed field."}
              </p>
              <Btn className="mt-2.5" onClick={onConfirmReview}>
                {staleCount ? `Remove ${staleCount} mapping${staleCount > 1 ? "s" : ""} and confirm` : "Confirm review"}
              </Btn>
            </div>
          </div>
        )}

        {!editing && prepop.mappings.length === 0 ? (
          <div className="mt-5 px-6 py-10 rounded flex flex-col items-center text-center" style={{ border: `1px dashed ${T.gray400}`, background: "#FAFBFC" }}>
            <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E6F2F6" }}>
              <ArrowRightLeft size={22} color={T.primary} />
            </span>
            <p className="mt-3 text-[16px] font-semibold">No pre-population set up yet</p>
            <p className="mt-1 mb-4 text-[14px] leading-[1.5] max-w-[440px]" style={{ color: T.muted }}>
              Map request form fields to report form fields so the scribe starts from the referral's answers instead of a blank report.
            </p>
            <Btn onClick={() => startEdit(true)}><Pencil size={15} /> Set up pre-population</Btn>
          </div>
        ) : editing ? (
          <div className="mt-5">
            <ColumnHeads />
            <ul className="mt-2 flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {draft.map((m, i) => {
                  const issue = issues[i];
                  const bad = issue && issue !== "incomplete";
                  return (
                    <motion.li
                      key={m.id}
                      layout="position"
                      // Fade only: clipping the row would cut off an open field dropdown.
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="relative focus-within:z-20"
                    >
                      <div className="flex items-center gap-3 p-2 rounded" style={bad ? rowGone : rowOk}>
                        <FieldSelect
                          label={`Request form field ${i + 1}`}
                          value={m.from}
                          fields={requestFields}
                          onChange={(v) => update(m.id, { from: v })}
                          invalid={bad}
                        />
                        <ArrowRight size={20} color={T.gray600} className="shrink-0" />
                        <FieldSelect
                          label={`Report form field ${i + 1}`}
                          value={m.to}
                          fields={reportFields}
                          used={usedTargets}
                          onChange={(v) => update(m.id, { to: v })}
                          invalid={bad}
                        />
                        <button
                          type="button"
                          aria-label={`Remove mapping ${i + 1}`}
                          onClick={() => setDraft((d) => d.filter((x) => x.id !== m.id))}
                          className="w-9 h-9 flex items-center justify-center rounded hover:bg-white shrink-0"
                          style={{ color: T.gray600 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {bad && (
                        <p className="flex items-center gap-1.5 mt-1 ml-1 text-[13px]" style={{ color: T.danger }}>
                          <AlertCircle size={14} /> {issue}
                        </p>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            <button
              type="button"
              onClick={() => setDraft((d) => withIds([...d, { from: null, to: null }]))}
              className="mt-3 w-full min-h-10 inline-flex items-center justify-center gap-1.5 rounded font-semibold text-[15px]"
              style={{ border: `1px dashed ${T.primary}`, color: T.primary }}
            >
              <Plus size={16} /> Add mapping
            </button>
            <p className="mt-3 text-[13px]" style={{ color: T.muted }}>
              Fields map only to the same type (and the same choice subtype). Choice · checkboxes and Open choice are not supported.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <ColumnHeads />
            <ul className="mt-2 flex flex-col gap-2">
              {prepop.mappings.map((m) => {
                const stale = staleOf(m);
                return (
                  <li key={`${m.from}>${m.to}`} className="flex items-center gap-3">
                    <FieldBox
                      fieldKey={m.from}
                      removedIn={stale?.side === "from" ? stale.version : null}
                      formName="request form"
                    />
                    <ArrowRight size={20} color={T.gray600} className="shrink-0" />
                    <FieldBox
                      fieldKey={m.to}
                      removedIn={stale?.side === "to" ? stale.version : null}
                      formName="report form"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 rounded-b flex-wrap" style={{ borderTop: `1px solid ${T.border}`, background: "#FAFBFC" }}>
          <span className="mr-auto text-[13px]" style={{ color: errorCount ? T.danger : T.muted }} role="status">
            {errorCount
              ? `Fix ${errorCount} type mismatch${errorCount > 1 ? "es" : ""} to save.`
              : incomplete
              ? `Complete or remove ${incomplete} unfinished mapping${incomplete > 1 ? "s" : ""}.`
              : `${draft.length} mapping${draft.length === 1 ? "" : "s"}`}
          </span>
          <Btn variant="secondary" onClick={() => setEditing(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={errorCount > 0 || incomplete > 0}>Save mappings</Btn>
        </div>
      )}
    </section>
  );
}
