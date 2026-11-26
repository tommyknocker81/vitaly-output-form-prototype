import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Pencil, Plus, AlertTriangle, ChevronDown, FileText, History } from "lucide-react";
import { T } from "./tokens.js";
import { lorem } from "./lorem.js";
import { AgendaColumns, AMBER, Chip, TypeChip, Btn, EditRow, FieldPicker, InfoTip } from "./MeetingSettings.jsx";
import { FORM_DIFFS, versionOf, pastMdtFieldByKey, pastMdtFieldsFor } from "./formVersions.js";

// Care unit › Other settings: Agenda columns (moved from Meeting) and Past MDTs fields
// (requirement 3 – Past MDTs fields configuration, VS-16817 / VS-16818).

export const OTHER_TABS = ["Agenda columns", "Past MDTs fields"];

/* ------------------------------------------------ past MDTs preview data */

// Previous MDT reports of a re-discussed patient, newest first. Values per report form field.
const PAST_REPORTS = [
  { title: "CRC MDT Report", date: "18/08/2026" },
  { title: "CRC MDT Report", date: "13/08/2026" },
  // Answered on an earlier report form version: keeps that version's fields.
  { title: "CRC MDO Verslag", date: "11/06/2026", legacy: ["rep.conclusion"] },
];


function HistoricalMdts({ fields, added }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${T.cardBorder}`, boxShadow: "0 1px 3px rgba(0,37,50,.06)" }} aria-label="Past MDTs preview">
      <div className="grid grid-cols-3 text-[13px] font-semibold uppercase tracking-[0.04em]" style={{ borderBottom: `1px solid ${T.border}` }} aria-hidden="true">
        <span className="py-3.5 text-center mx-6" style={{ borderBottom: `2px solid ${T.primary}`, marginBottom: -1 }}>
          Historical MDTs <span className="ml-1 font-normal" style={{ color: T.primary }}>({PAST_REPORTS.length})</span>
        </span>
        <span className="py-3.5 text-center" style={{ color: T.gray600 }}>Consultation material</span>
        <span className="py-3.5 text-center" style={{ color: T.gray600 }}>My notes</span>
      </div>
      <ul className="px-6">
        {PAST_REPORTS.map((r, i) => {
          const isOpen = open === i;
          const shown = r.legacy ?? fields;
          return (
            <li key={i} style={{ borderBottom: i < PAST_REPORTS.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-start gap-2.5 py-3.5 text-left"
              >
                <FileText size={22} color="#fff" fill={T.primary} strokeWidth={1.5} className="shrink-0 mt-px" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold leading-[1.3]">{r.title}</span>
                  <span className="block text-[14px] italic mt-0.5" style={{ color: T.gray600 }}>{r.date}</span>
                </span>
                <motion.span initial={false} animate={{ rotate: isOpen ? 180 : 0 }} className="flex shrink-0 mt-1">
                  <ChevronDown size={20} color={T.primary} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 px-4 py-4 rounded-sm flex flex-col gap-3.5" style={{ background: "#E8F0F3" }}>
                      {shown.length === 0 && (
                        <p className="text-[14px] italic" style={{ color: T.gray600 }}>No fields configured. Only the report title and date are shown.</p>
                      )}
                      {shown.map((k) => {
                        const isAdded = !r.legacy && added.includes(k);
                        return (
                          <motion.div
                            key={k}
                            layout="position"
                            initial={isAdded ? { backgroundColor: "rgba(0,128,163,0.18)" } : false}
                            animate={{ backgroundColor: "rgba(0,128,163,0)" }}
                            transition={{ duration: 1.2 }}
                            className="rounded-sm -mx-1.5 px-1.5"
                            style={isAdded ? { boxShadow: `inset 2px 0 0 ${T.primary}` } : undefined}
                          >
                            <p className="text-[14px] font-semibold">{pastMdtFieldByKey(k)?.label}</p>
                            <p className="text-[15px] mt-0.5">{lorem(k, 3, 3)}</p>
                          </motion.div>
                        );
                      })}
                      {r.legacy && (
                        <p className="text-[13px] italic pt-2" style={{ color: T.gray600, borderTop: "1px solid #D3DFE4" }}>
                          Answered on an earlier report form version, so it keeps that version's fields.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------ config card */

function PastMdtFields({ pastMdt, setPastMdt, onConfirmReview }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pastMdt.fields);
  const [picker, setPicker] = useState(false);

  const review = pastMdt.review;
  const removedInReview = review ? pastMdt.fields.filter((k) => FORM_DIFFS[review.to].removed.includes(k)) : [];
  // While a review is pending the live form is still the old one; edit against it.
  const available = pastMdtFieldsFor(pastMdt.builtOn).filter((f) => !draft.includes(f.key));
  const added = editing ? draft.filter((k) => !pastMdt.fields.includes(k)) : [];
  const previewFields = editing ? draft : pastMdt.fields.filter((k) => !removedInReview.includes(k));

  const startEdit = (withPicker = false) => {
    setDraft(pastMdt.fields);
    setEditing(true);
    setPicker(withPicker);
  };
  const save = () => {
    setPastMdt((p) => ({ ...p, fields: draft }));
    setEditing(false);
    setPicker(false);
  };

  const status = editing ? (
    <Chip bg="#E6F2F6" fg="#00566E">Editing</Chip>
  ) : review ? (
    <Chip bg={AMBER.chipBg} fg={AMBER.chipFg}>Needs review</Chip>
  ) : pastMdt.fields.length ? (
    <Chip bg="#E8F3E5" fg="#3E7A31">Up to date</Chip>
  ) : (
    <Chip bg="#EEF1F3" fg="#444C54">Not set up</Chip>
  );

  const kept = pastMdt.fields.length - removedInReview.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <section
        className="bg-white rounded w-full lg:w-[440px] shrink-0"
        style={{ border: editing ? `2px solid ${T.primary}` : `1px solid ${T.cardBorder}`, margin: editing ? 0 : 1 }}
        aria-labelledby="past-h"
      >
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 id="past-h" className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">Past MDTs fields</h3>
              {status}
            </div>
            {!editing && pastMdt.fields.length > 0 && (
              <Btn variant="outline" onClick={() => startEdit(false)}><Pencil size={15} /> Edit</Btn>
            )}
          </div>
          <p className="mt-1.5 text-[13px]" style={{ color: T.muted }}>
            Fields from {pastMdt.builtOn}{editing && " · drag to reorder"}
          </p>
        </div>

        <div className="px-6 pb-6">
          {!editing && review && removedInReview.length > 0 && (
            <div role="status" className="mt-4 flex gap-2.5 p-3 rounded" style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}` }}>
              <AlertTriangle size={20} color={AMBER.icon} className="shrink-0 mt-0.5" />
              <div className="text-[14px] leading-[1.5]">
                <p className="font-semibold">The report form is changing ({versionOf(review.from)} → {versionOf(review.to)})</p>
                <p className="mt-0.5">
                  {removedInReview.length} field{removedInReview.length > 1 ? "s are" : " is"} no longer in {versionOf(review.to)}.
                  {" "}Reports already written on {versionOf(review.from)} keep showing their fields.
                </p>
                <Btn className="mt-2.5" onClick={onConfirmReview}>
                  Remove {removedInReview.length} field{removedInReview.length > 1 ? "s" : ""} and confirm
                </Btn>
              </div>
            </div>
          )}

          {!editing && pastMdt.fields.length === 0 ? (
            <div className="mt-5 px-6 py-10 rounded flex flex-col items-center text-center" style={{ border: `1px dashed ${T.gray400}`, background: "#FAFBFC" }}>
              <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E6F2F6" }}>
                <History size={22} color={T.primary} />
              </span>
              <p className="mt-3 text-[16px] font-semibold">No fields configured</p>
              <p className="mt-1 mb-4 text-[14px] leading-[1.5] max-w-[340px]" style={{ color: T.muted }}>
                When a patient is re-discussed, previous MDT reports show only their title and date. Choose report form fields to show with them.
              </p>
              <Btn onClick={() => startEdit(true)}><Pencil size={15} /> Configure fields</Btn>
            </div>
          ) : (
            <>
              {!editing && (
                <p className="mt-3.5 text-[14px] leading-[1.5]">
                  Shown when a patient is re-discussed: each previous MDT report lists these fields, stacked in this order.
                </p>
              )}
              <p className="mt-3 text-[13px]" style={{ color: "#444C54" }}>
                {editing
                  ? (() => {
                      const gone = draft.filter((k) => removedInReview.includes(k)).length;
                      const kept = draft.length - gone;
                      return `${kept} field${kept === 1 ? "" : "s"} selected${gone ? ` · ${gone} removed` : ""}`;
                    })()
                  : removedInReview.length
                    ? `${kept} field${kept === 1 ? "" : "s"} in use · ${removedInReview.length} removed`
                    : `${kept} field${kept === 1 ? "" : "s"} in use`}
              </p>

              {editing ? (
                <Reorder.Group axis="y" values={draft} onReorder={setDraft} className="mt-2.5 flex flex-col gap-1.5">
                  {draft.map((k, i) => (
                    <EditRow
                      key={k}
                      k={k}
                      n={i + 1}
                      field={pastMdtFieldByKey(k)}
                      isNew={added.includes(k)}
                      removed={removedInReview.includes(k)}
                      onRemove={(x) => setDraft((d) => d.filter((y) => y !== x))}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <ol className="mt-2.5 flex flex-col gap-1.5">
                  {(() => {
                    let n = 0;
                    return pastMdt.fields.map((k) => {
                      const f = pastMdtFieldByKey(k);
                      const gone = removedInReview.includes(k);
                      if (!gone) n++;
                      return (
                        <li
                          key={k}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded"
                          style={
                            gone
                              ? { border: "1px solid #F8E7E6", background: "#F8E7E6", boxShadow: `inset 3px 0 0 ${T.danger}` }
                              : { border: "1px solid transparent", background: T.light }
                          }
                        >
                          {gone ? (
                            <InfoTip label={`Why ${f.label} is marked as removed`}>
                              <span className="block font-semibold mb-1">Field removed in {review.to}</span>
                              The new version of the report form no longer contains this field. Reports written on the new version can't show it.
                              <span className="block mt-2" style={{ color: "#B9D3DC" }}>
                                To delete it, use <strong className="text-white">Remove {removedInReview.length} field{removedInReview.length > 1 ? "s" : ""} and confirm</strong> above.
                              </span>
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
                    onClick={() => setPicker((p) => !p)}
                    className="mt-3 w-full min-h-10 inline-flex items-center justify-center gap-1.5 rounded font-semibold text-[15px]"
                    style={{ border: `1px dashed ${T.primary}`, color: T.primary }}
                  >
                    <Plus size={16} /> Add field
                  </button>
                  <AnimatePresence>
                    {picker && (
                      <FieldPicker
                        label="Report form fields"
                        available={available}
                        full={false}
                        onAdd={(k) => setDraft((d) => [...d, k])}
                      />
                    )}
                  </AnimatePresence>
                  <p className="mt-3 text-[13px]" style={{ color: T.muted }}>
                    No limit on the number of fields; every data type can be shown.
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-2.5 px-6 py-4 rounded-b" style={{ borderTop: `1px solid ${T.border}`, background: "#FAFBFC" }}>
            <Btn variant="secondary" onClick={() => { setEditing(false); setPicker(false); }}>Cancel</Btn>
            <Btn onClick={save}>Save fields</Btn>
          </div>
        )}
      </section>

      <div className="flex-1 min-w-0 w-full max-w-[720px]">
        <HistoricalMdts fields={previewFields} added={added} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function OtherSettings({ tab, setTab, agenda, setAgenda, requestForm, onConfirmAgendaReview, pastMdt, setPastMdt, onConfirmPastMdtReview }) {
  const flags = [!!agenda.review, !!pastMdt.review];
  return (
    <main className="px-8 pt-6 pb-10">
      <h2 className="text-[22px] font-semibold leading-[1.2]">Other settings</h2>
      <div className="mt-6 flex gap-6" style={{ borderBottom: `1px solid ${T.border}` }}>
        {OTHER_TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className="pb-2 text-[15px] -mb-px flex items-center gap-1.5"
            style={{ fontWeight: tab === i ? 600 : 400, borderBottom: tab === i ? `2px solid ${T.primary}` : "2px solid transparent" }}
          >
            {t}
            {flags[i] && <span className="w-2 h-2 rounded-full" style={{ background: AMBER.border }} aria-label="Needs review" />}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 0 ? (
          <AgendaColumns agenda={agenda} setAgenda={setAgenda} requestForm={requestForm} onConfirmReview={onConfirmAgendaReview} />
        ) : (
          <PastMdtFields pastMdt={pastMdt} setPastMdt={setPastMdt} onConfirmReview={onConfirmPastMdtReview} />
        )}
      </div>
    </main>
  );
}
