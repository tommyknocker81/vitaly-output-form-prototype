import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence, Reorder, useDragControls, LayoutGroup } from "framer-motion";
import { ChevronDown, ChevronLeft, Star, Bell, User, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

import { T } from "./tokens.js";
import BasicInformation from "./BasicInformation.jsx";
import { SECTION_SOURCE, SOURCE_FORMS, FORM_DIFFS, versionOf, bumpVersion, impactOf, applyDiff, publishSections } from "./formVersions.js";

/*
 * Form data model. Every section is a card on the left and a block in the
 * preview; every field is a toggleable row and one element of that block.
 *
 * kind:   meta | patient | contact | content — how the preview renders it
 * layout: half sections pair up side by side when they are adjacent
 * field.type (content sections):
 *   line  – a single line of text
 *   para  – a paragraph
 *   list  – optional lead line + bullet list
 *   item  – one bullet; consecutive items merge into one list
 * gapAfter adds a paragraph gap below the element.
 */
const INITIAL_SECTIONS = [
  {
    id: "general",
    title: "General info",
    kind: "meta",
    fields: [
      { key: "meeting.name", label: "Meeting name", on: true, prefix: "for", value: "COLORECTAL MDT" },
      { key: "meeting.date", label: "Meeting date", on: true, prefix: "on", value: "18/5/2025" },
      { key: "meeting.time", label: "Meeting time", on: true, prefix: "at", value: "14:30" },
    ],
  },
  {
    id: "patient",
    title: "Patient details",
    kind: "patient",
    fields: [
      { key: "patient.name", label: "Patient name", on: true, value: "BAUER, Ana" },
      { key: "patient.bsn", label: "BSN", on: true, value: "ID 161 885  4347" },
      { key: "patient.birth_date", label: "Birthdate", on: true, value: "16.08.1957 (67yrs)" },
      { key: "patient.gender", label: "Gender", on: true, value: "Female" },
    ],
  },
  {
    id: "clinician",
    title: "Main treating clinican",
    kind: "contact",
    layout: "half",
    fields: [
      { key: "clinician.name", label: "Clinician name", on: true, value: "Dr. CAMPBEL, Sara", strong: true },
      { key: "clinician.specialty", label: "Specialty", on: false, value: "Colorectal surgeon" },
      { key: "clinician.email", label: "Email", on: true, value: "sara.campbel@hospital.com" },
      { key: "clinician.phone", label: "Phone", on: true, value: "+385 544 30 40" },
    ],
  },
  {
    id: "hospital",
    title: "Reffering hospital",
    kind: "contact",
    layout: "half",
    fields: [
      { key: "hospital.name", label: "Hospital name", on: true, value: "Silver River Memorial Hospital", strong: true },
      { key: "hospital.email", label: "Email", on: true, value: "mike.myers@silver-river-hospital.co.uk" },
      { key: "hospital.phone", label: "Phone", on: true, value: "+385 544 30 40" },
    ],
  },
  {
    id: "summary",
    title: "Summary",
    kind: "content",
    fields: [
      {
        key: "summary.presentation", label: "Clinical presentation", on: true, type: "para",
        value: "67-year-old female with moderately differentiated adenocarcinoma of the sigmoid colon, confirmed on colonoscopy biopsy.",
      },
      { key: "summary.comorbidities", label: "Comorbidities", on: true, type: "para", value: "Comorbidities: controlled hypertension, Type 2 diabetes." },
    ],
  },
  {
    id: "radiology",
    title: "Radiology",
    kind: "content",
    layout: "half",
    fields: [
      { key: "radiology.modality", label: "Modality", on: true, type: "line", value: "CT Abdomen/Pelvis, 01/05/2025" },
      {
        key: "radiology.findings", label: "Findings", on: true, type: "list",
        items: [
          "4.8 cm sigmoid lesion, no obstruction",
          "Pericolic lymph nodes (largest 9 mm)",
          "No distant metastases",
        ],
      },
      { key: "radiology.staging", label: "Staging proposal", on: true, type: "line", value: "Staging: T3 N1 M0" },
    ],
  },
  {
    id: "pathology",
    title: "Pathology",
    kind: "content",
    layout: "half",
    fields: [
      { key: "pathology.specimen", label: "Specimen", on: true, type: "line", value: "Specimen: Colonoscopy biopsy" },
      { key: "pathology.tumor_type", label: "Tumor type", on: true, type: "item", value: "Adenocarcinoma, grade 2" },
      { key: "pathology.mmr", label: "MMR / MSI", on: true, type: "item", value: "MMR intact, MSS" },
      { key: "pathology.kras", label: "KRAS / NRAS / BRAF", on: true, type: "item", value: "KRAS/NRAS/BRAF: Wild type" },
    ],
  },
  {
    id: "mdt",
    title: "MDT decision",
    kind: "content",
    fields: [
      { key: "mdt.diagnosis", label: "Diagnosis", on: true, type: "line", value: "Diagnosis: Sigmoid adenocarcinoma, Stage IIIB" },
      { key: "mdt.intent", label: "Treatment intent", on: true, type: "line", value: "Intent: Curative" },
      {
        key: "mdt.plan", label: "Recommended plan", on: true, type: "list", lead: "Plan:",
        items: [
          "Laparoscopic anterior resection",
          "Adjuvant CAPOX 6–8 weeks post-op",
        ],
      },
      { key: "mdt.fitness", label: "Patient fitness", on: true, type: "line", value: "Fitness: WHO PS 1" },
    ],
  },
  {
    id: "next_steps",
    title: "Next steps",
    kind: "content",
    ordered: true,
    fields: [
      { key: "next_steps.surgery", label: "Surgical scheduling", on: true, type: "item", value: "Schedule surgery – Dr. Olivia Foster" },
      { key: "next_steps.oncology", label: "Oncology review", on: true, type: "item", value: "Post-op oncology review – Dr. Claire Dubois" },
      { key: "next_steps.coordinator", label: "GP report", on: true, type: "item", value: "Send report to GP" },
    ],
  },
  {
    id: "attendees",
    title: "MDT attendees",
    kind: "content",
    fields: [
      { key: "attendees.chair", label: "Chair", on: true, type: "item", value: "Prof. Dr. Johan Muller – Oncologist (Chair)" },
      { key: "attendees.surgeon", label: "Surgeon", on: true, type: "item", value: "Dr. Olivia Foster – Surgeon" },
      { key: "attendees.radiologist", label: "Radiologist", on: true, type: "item", value: "Dr. Elise van den Berg – Radiologist" },
      { key: "attendees.pathologist", label: "Pathologist", on: true, type: "item", value: "Dr. Lukas Schmidt – Pathologist" },
    ],
  },
];

const DEFAULT_EXPANDED = ["general", "patient"];

const visibleFields = (s) => s.fields.filter((f) => f.on);

/* ---------------------------------------------------------------- icons */

// 4×4 dot grid used as the drag handle in the Figma cards.
function DragDots({ color = T.gray600 }) {
  const dots = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dots.push(<circle key={`${r}${c}`} cx={4.5 + c * 5} cy={4.5 + r * 5} r={1} />);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      {dots}
    </svg>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative flex items-center rounded-[32px] w-8 h-4 p-[2px] transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: checked ? T.primary : "#fff",
        border: checked ? `1px solid ${T.primary}` : "1px solid rgba(0,0,0,0.25)",
        "--tw-ring-color": T.primary,
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
        className="block w-3 h-3 rounded-full"
        style={{ background: checked ? "#fff" : "rgba(0,0,0,0.25)", marginLeft: checked ? "auto" : 0 }}
      />
    </button>
  );
}

/* ------------------------------------------------------------ chrome */

// Condensed primary navigation ("Expanded-nav" 14002:280777). Icons are the Figma exports in ./nav:
// 00 = logo, 01–11 = main items, 12–13 = bottom items.
const NAV_ICONS = import.meta.glob("./nav/*.svg", { eager: true, query: "?url", import: "default" });
const navIcon = (n) => NAV_ICONS[`./nav/${String(n).padStart(2, "0")}.svg`];
const NAV_ACTIVE = 7; // Care unit manager

function NavItem({ n, active, bg = "#002532" }) {
  return (
    <button
      className="w-14 h-12 flex items-center justify-center transition-colors hover:brightness-150"
      style={{ background: active ? T.primary : bg }}
      aria-current={active ? "page" : undefined}
      title={active ? "Care unit manager" : undefined}
    >
      <img src={navIcon(n)} alt="" className="w-6 h-6" />
    </button>
  );
}

function SideNav() {
  return (
    <aside className="w-14 shrink-0 sticky top-0 h-screen flex flex-col justify-between" style={{ background: "#002532" }}>
      <div>
        <div className="h-[108px] px-4 pt-6">
          <img src={navIcon(0)} alt="OpenLine Vitaly" className="w-[25px] h-6" />
        </div>
        <nav>
          {Array.from({ length: 11 }, (_, i) => <NavItem key={i} n={i + 1} active={i + 1 === NAV_ACTIVE} />)}
        </nav>
      </div>
      <div>
        <NavItem n={12} />
        <NavItem n={13} bg="#001922" />
      </div>
    </aside>
  );
}

function TopHeader() {
  return (
    <header className="h-16 bg-white flex items-center justify-between px-8" style={{ borderBottom: `1px solid ${T.border}` }}>
      <h1 className="text-[22px] font-semibold" style={{ color: T.bodyText }}>Care unit manager</h1>
      <div className="flex items-center gap-6">
        <Star size={22} fill={T.primary} color={T.primary} />
        <span className="relative">
          <Bell size={22} fill={T.primary} color={T.primary} />
          <span className="absolute -top-0.5 right-0 w-1.5 h-1.5 rounded-full" style={{ background: T.danger }} />
        </span>
        <span className="w-px h-6" style={{ background: T.border }} />
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#E6F2F6" }}>
            <User size={18} color={T.primary} fill={T.primary} />
          </span>
          <span className="text-[14px] font-semibold" style={{ color: T.bodyText }}>Prof.Dr.Muller</span>
          <ChevronDown size={18} color={T.primary} />
        </div>
      </div>
    </header>
  );
}

const UNIT_TABS = ["Basic information", "Output forms", "Meeting dates", "Video conferencing", "Members"];

function UnitHeader({ activeTab, onChange }) {
  return (
    <div className="h-[94px] bg-white flex items-stretch justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="flex items-stretch">
        <button className="w-8 flex items-center justify-center" aria-label="Back">
          <ChevronLeft size={20} color={T.primary} />
        </button>
        <div className="flex items-center gap-3 px-6" style={{ borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
          <span className="w-[58px] h-[58px] rounded-full flex items-center justify-center" style={{ border: `1px solid ${T.primary}` }}>
            <span className="w-14 h-14 rounded-full flex items-end justify-center overflow-hidden" style={{ background: "#E6F2F6" }}>
              <User size={44} color={T.primary} fill={T.primary} strokeWidth={1} className="-mb-1.5" />
            </span>
          </span>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold" style={{ color: T.bodyText }}>Care unit name</div>
            <div className="text-[15px] mt-0.5" style={{ color: T.gray600 }}>Cardiology</div>
          </div>
        </div>
      </div>
      <nav className="flex items-stretch pr-8">
        {UNIT_TABS.map((t, i) => {
          const active = i === activeTab;
          const enabled = i <= 1; // only Basic information and Output forms are mocked
          return (
            <button
              key={t}
              onClick={() => enabled && onChange(i)}
              className={`relative min-w-[145px] px-4 whitespace-nowrap flex items-center justify-center text-[13px] uppercase ${enabled ? "cursor-pointer" : "cursor-default"}`}
              style={{
                color: active ? T.primary : T.bodyText,
                fontWeight: active ? 700 : 400,
                borderBottom: active ? `2px solid ${T.primary}` : "2px solid transparent",
              }}
            >
              {t}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------ editor */

// Review markers for fields touched by a source-form version change.
const STATUS = {
  new: { label: "New", bg: "#E6F2F6", fg: T.primary },
  changed: { label: "Changed", bg: "#FFF3E0", fg: "#9A5B00" },
  removed: { label: "Removed", bg: "#F8E7E6", fg: T.danger },
};

function Chip({ bg, fg, children, mono }) {
  return (
    <span
      className="inline-flex items-center px-1.5 rounded text-[11px] leading-[18px] font-semibold uppercase tracking-[0.5px] shrink-0"
      style={{ background: bg, color: fg, fontFamily: mono ? T.mono : undefined, letterSpacing: mono ? 0 : undefined }}
    >
      {children}
    </span>
  );
}

function FieldRow({ field, sourceTag, onToggle, onHover }) {
  const status = field.status && STATUS[field.status];
  const removed = field.status === "removed";
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={controls}
      onMouseEnter={() => onHover(field.key)}
      onMouseLeave={() => onHover(null)}
      whileDrag={{ scale: 1.01, boxShadow: "0 6px 16px rgba(0,0,0,0.12)", zIndex: 10 }}
      className="relative flex items-center justify-between rounded px-3 py-1.5 select-none"
      style={{ background: status ? status.bg : T.light, boxShadow: status ? `inset 3px 0 0 ${status.fg}` : "none" }}
    >
      <div className="flex items-start gap-1 min-w-0">
        <span
          onPointerDown={(e) => controls.start(e)}
          className="w-8 py-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <DragDots color={T.gray400} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] leading-[1.5] truncate" style={{ fontFamily: T.mono, color: T.muted, opacity: field.on ? 1 : 0.6 }}>
              {field.key}
            </span>
            {sourceTag && <Chip bg="#fff" fg={T.muted} mono>{sourceTag}</Chip>}
            {status && <Chip bg="#fff" fg={status.fg}>{status.label}</Chip>}
          </div>
          <div
            className="text-[15px] leading-6 font-semibold truncate transition-colors"
            style={{ color: field.on && !removed ? T.bodyText : T.gray600, textDecoration: removed ? "line-through" : "none" }}
          >
            {field.label}
            {field.status === "changed" && field.was !== field.label && (
              <span className="ml-2 text-[13px] font-normal" style={{ color: T.muted }}>was “{field.was}”</span>
            )}
          </div>
        </div>
      </div>
      <div className="px-2 flex items-center">
        {removed ? (
          <span className="text-[13px] text-right leading-tight max-w-[150px]" style={{ color: T.danger }}>Dropped when you publish</span>
        ) : (
          <Toggle checked={field.on} onChange={() => onToggle(field.key)} label={`Show ${field.label}`} />
        )}
      </div>
    </Reorder.Item>
  );
}

function SectionCard({ section, sourceTag, expanded, onToggleExpand, onReorderFields, onToggleField, onHover }) {
  const controls = useDragControls();
  const shown = visibleFields(section).length;
  const total = section.fields.length;
  const changes = section.fields.filter((f) => f.status).length;

  const handle = (
    <span
      onPointerDown={(e) => controls.start(e)}
      onClick={(e) => e.stopPropagation()}
      className="cursor-grab active:cursor-grabbing touch-none flex"
      title="Drag to reorder section"
    >
      <DragDots color={T.primary} />
    </span>
  );

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ boxShadow: "0 10px 24px rgba(0,0,0,0.14)", zIndex: 20 }}
      className="relative bg-white rounded"
      style={{ border: `1px solid ${T.cardBorder}` }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggleExpand}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggleExpand())}
        onMouseEnter={() => onHover(section.id)}
        onMouseLeave={() => onHover(null)}
        className="flex items-center justify-between p-6 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 pr-2">
          {handle}
          <span className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]" style={{ color: T.bodyText }}>
            {section.title}
          </span>
          <span
            className="ml-2 text-[13px] tabular-nums"
            style={{ color: shown ? T.muted : T.danger }}
          >
            {shown ? `${shown}/${total} visible` : "Hidden in output"}
          </span>
          {changes > 0 && <Chip bg="#FFF3E0" fg="#9A5B00">{changes} to review</Chip>}
        </div>
        <motion.span initial={false} animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
          <ChevronDown size={22} color={T.primary} />
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <Reorder.Group
              axis="y"
              values={section.fields}
              onReorder={(f) => onReorderFields(section.id, f)}
              className="flex flex-col gap-2 px-6 pb-6"
            >
              {section.fields.map((f) => (
                <FieldRow key={f.key} field={f} sourceTag={sourceTag} onToggle={onToggleField} onHover={onHover} />
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/* ----------------------------------------------------------- preview */

// Hover state from the editor, so preview elements can light up.
const HoverCtx = createContext({ hover: null });

function useLit(...keys) {
  const { hover } = useContext(HoverCtx);
  return hover != null && keys.includes(hover);
}

const litStyle = (lit) => ({
  background: lit ? "rgba(0,128,163,0.10)" : "transparent",
  boxShadow: lit ? `0 0 0 3px rgba(0,128,163,0.10)` : "none",
  borderRadius: 2,
  transition: "background .15s, box-shadow .15s",
});

const FLASH = { backgroundColor: ["rgba(0,128,163,0.22)", "rgba(0,128,163,0)"] };
const blockMotion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, ...FLASH },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1], backgroundColor: { duration: 1.4 } },
};

// A block-level preview element bound to one field key.
function Bit({ k, sectionId, as = "div", className = "", children, style }) {
  const lit = useLit(k, sectionId);
  const M = motion[as];
  return (
    <M data-k={k} {...blockMotion} className={`overflow-hidden ${className}`} style={style}>
      <div style={litStyle(lit)}>{children}</div>
    </M>
  );
}

// An inline preview element (used where several fields share one line).
function InlineBit({ k, sectionId, children }) {
  const lit = useLit(k, sectionId);
  return (
    <motion.span
      data-k={k}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, ...FLASH }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, backgroundColor: { duration: 1.4 } }}
    >
      <span style={litStyle(lit)}>{children}</span>
    </motion.span>
  );
}

function MetaLine({ section }) {
  const fields = visibleFields(section);
  return (
    <p className="text-[15px] leading-[1.5]" style={{ color: "#000" }}>
      Final report
      <AnimatePresence initial={false}>
        {fields.map((f) => (
          <InlineBit key={f.key} k={f.key} sectionId={section.id}>
            {" "}{f.prefix} {f.value}
          </InlineBit>
        ))}
      </AnimatePresence>
    </p>
  );
}

function Logo() {
  return (
    <div className="relative w-[173px] h-[44px] overflow-hidden shrink-0">
      <img
        src={`${import.meta.env.BASE_URL}umc-utrecht.png`}
        alt="UMC Utrecht"
        className="absolute left-0 w-full max-w-none"
        style={{ height: "154.55%", top: "-27.27%" }}
      />
    </div>
  );
}

function PatientBlock({ section }) {
  const fields = visibleFields(section);
  const name = fields.find((f) => f.key === "patient.name");
  // Name is the heading; everything else joins into the ID line in field order.
  const rest = fields.filter((f) => f !== name);
  return (
    <div>
      <AnimatePresence initial={false}>
        {name && (
          <Bit key={name.key} k={name.key} sectionId={section.id}>
            <h2 className="text-[24px] leading-[1.2] font-semibold pb-1.5" style={{ color: "#000" }}>{name.value}</h2>
          </Bit>
        )}
      </AnimatePresence>
      {rest.length > 0 && (
        <p className="text-[15px] leading-[1.5]" style={{ color: "#000" }}>
          <AnimatePresence initial={false}>
            {rest.map((f, i) => (
              <InlineBit key={f.key} k={f.key} sectionId={section.id}>
                {i > 0 && " - "}{f.value}
              </InlineBit>
            ))}
          </AnimatePresence>
        </p>
      )}
    </div>
  );
}

function ContactBlock({ section }) {
  const lit = useLit(section.id);
  return (
    <div>
      <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2] mb-1" style={{ color: "#000", ...litStyle(lit) }}>
        {section.title}
      </h3>
      <AnimatePresence initial={false}>
        {visibleFields(section).map((f) => (
          <Bit key={f.key} k={f.key} sectionId={section.id}>
            <div className={`text-[15px] leading-6 ${f.strong ? "font-semibold" : ""}`} style={{ color: f.strong ? T.bodyText : "#000" }}>
              <Val f={f} />
            </div>
          </Bit>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SectionHeading({ section }) {
  const lit = useLit(section.id);
  return (
    <div className="flex items-center gap-2 mb-[15px]">
      <h3 className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2] whitespace-nowrap" style={{ color: "#000", ...litStyle(lit) }}>
        {section.title}
      </h3>
      <span className="flex-1 h-px" style={{ background: T.border }} />
    </div>
  );
}

// Groups consecutive `item` fields into a single list so bullets/numbering flow.
function groupFields(fields) {
  const groups = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (f.type === "item" && last?.type === "items") last.fields.push(f);
    else if (f.type === "item") groups.push({ type: "items", id: f.key, fields: [f] });
    else groups.push({ type: "single", id: f.key, field: f });
  }
  return groups;
}

const textCls = "text-[15px] leading-[1.5]";

// Field value in the preview, marked while its output form is under review.
function Val({ f, children }) {
  const content = children ?? f.value;
  if (f.status === "removed") {
    return (
      <span style={{ color: T.danger, textDecoration: "line-through" }} title="Removed in the new source form version">
        {content}
      </span>
    );
  }
  if (f.status === "changed" || f.status === "new") {
    const bg = f.status === "new" ? "rgba(0,128,163,0.12)" : "rgba(255,184,83,0.28)";
    return <span style={{ background: bg, borderRadius: 2, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{content}</span>;
  }
  return content;
}

function ContentBlock({ section }) {
  const groups = groupFields(visibleFields(section));
  const ListTag = section.ordered ? "ol" : "ul";
  return (
    <div>
      <SectionHeading section={section} />
      <div style={{ color: "#000" }}>
        <AnimatePresence initial={false}>
          {groups.map((g, gi) => {
            const isLast = gi === groups.length - 1;
            if (g.type === "items") {
              return (
                <motion.div key={`grp-${section.id}`} layout="position">
                  {/* Markers are drawn by hand: native ones sit outside the box and get clipped by the height animation. */}
                  <ListTag className={textCls}>
                    <AnimatePresence initial={false}>
                      {g.fields.map((f, i) => (
                        <Bit key={f.key} k={f.key} sectionId={section.id} as="li">
                          <div className="flex">
                            <span className="w-[22px] shrink-0 pl-1.5 tabular-nums">{section.ordered ? `${i + 1}.` : "•"}</span>
                            <span><Val f={f} /></span>
                          </div>
                        </Bit>
                      ))}
                    </AnimatePresence>
                  </ListTag>
                </motion.div>
              );
            }
            const f = g.field;
            const gap = f.gapAfter && !isLast ? "pb-[23px]" : "";
            return (
              <Bit key={f.key} k={f.key} sectionId={section.id}>
                <div className={gap}>
                  {f.type === "list" ? (
                    <div className={textCls}>
                      {f.lead && <div><Val f={f}>{f.lead}</Val></div>}
                      <ul>
                        {f.items.map((it) => (
                          <li key={it} className="flex">
                            <span className="w-[22px] shrink-0 pl-1.5">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className={textCls}><Val f={f} /></div>
                  )}
                </div>
              </Bit>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Summary-style sections: paragraph fields flow together inline.
function ParagraphBlock({ section }) {
  return (
    <div>
      <SectionHeading section={section} />
      <p className={textCls} style={{ color: "#000" }}>
        <AnimatePresence initial={false}>
          {visibleFields(section).map((f, i) => (
            <InlineBit key={f.key} k={f.key} sectionId={section.id}>
              {i > 0 && " "}<Val f={f} />
            </InlineBit>
          ))}
        </AnimatePresence>
      </p>
    </div>
  );
}

function renderBlock(section) {
  switch (section.kind) {
    case "meta": return <MetaLine section={section} />;
    case "patient": return <PatientBlock section={section} />;
    case "contact": return <ContactBlock section={section} />;
    default:
      return section.fields.every((f) => f.type === "para")
        ? <ParagraphBlock section={section} />
        : <ContentBlock section={section} />;
  }
}

// Turns the ordered visible sections into rows; adjacent half-width sections pair up.
function buildRows(sections) {
  const rows = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.layout === "half" && next?.layout === "half") {
      rows.push([s, next]);
      i++;
    } else rows.push([s]);
  }
  return rows;
}

// Header-like sections are separated by full-width rules, as in the Figma letterhead.
const isFramed = (row) => row.some((s) => s.kind !== "content");

function Preview({ sections }) {
  const visible = sections.filter((s) => visibleFields(s).length > 0);
  const meta = visible.find((s) => s.kind === "meta");
  const metaFirst = visible[0]?.kind === "meta";
  const rows = buildRows(metaFirst ? visible.slice(1) : visible);

  return (
    <div className="bg-white mx-auto max-w-[976px] px-12 py-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ fontFamily: T.fontFamily }}>
      {/* Letterhead */}
      <div className="flex items-center justify-between gap-6 min-h-[44px]">
        <div className="min-w-0">{metaFirst && <MetaLine section={meta} />}</div>
        <Logo />
      </div>
      <hr className="my-8 border-0 h-px" style={{ background: "#000" }} />

      <LayoutGroup>
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((row, ri) => {
            const isLast = ri === rows.length - 1;
            const framed = isFramed(row);
            const nextFramed = !isLast && isFramed(rows[ri + 1]);
            return (
              <motion.div
                key={row.map((s) => s.id).join("+")}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", ...FLASH }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], backgroundColor: { duration: 1.4 } }}
                data-k={row.map((s) => s.id).join(" ")}
                className="overflow-hidden"
              >
                <div className={row.length === 2 ? "grid grid-cols-2 gap-6" : ""}>
                  {row.map((s) => <div key={s.id} className="min-w-0">{renderBlock(s)}</div>)}
                </div>
                {!isLast && (framed || nextFramed ? (
                  <hr className="my-8 border-0 h-px" style={{ background: framed ? "#000" : T.border }} />
                ) : (
                  <div className="h-6" />
                ))}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </LayoutGroup>

      {visible.length === 0 && (
        <p className="text-[15px] italic py-10 text-center" style={{ color: T.gray600 }}>
          All fields are hidden — nothing will be printed.
        </p>
      )}

      {/* Running footer */}
      <div className="flex items-center justify-between gap-6 mt-8 pt-0 min-h-[44px]">
        <div className="min-w-0">{meta && <MetaLine section={meta} />}</div>
        <Logo />
      </div>
    </div>
  );
}

/* ------------------------------------------------------- output forms */

const pick = (ids) => INITIAL_SECTIONS.filter((s) => ids.includes(s.id));
const INITIAL_BUILT_ON = { request: "CRC request form v1", report: "CRC report form v1" };

// A care unit can own several output forms; each picks its own sections.
const INITIAL_OUTPUT_FORMS = [
  { id: "mdt-report", name: "MDT final report", version: "1.3", sections: INITIAL_SECTIONS },
  { id: "gp-letter", name: "GP summary letter", version: "2.1", sections: pick(["general", "patient", "clinician", "summary", "mdt", "next_steps"]) },
  { id: "attendance", name: "Attendance record", version: "1.0", sections: pick(["general", "attendees"]) },
].map((f) => ({ ...f, baseline: f.sections, builtOn: INITIAL_BUILT_ON, reviews: [], preReview: null }));

const sourcesUsed = (sections) => [...new Set(sections.map((s) => SECTION_SOURCE[s.id]).filter((x) => x !== "system"))];

function sourceTagFor(form, sectionId) {
  const src = SECTION_SOURCE[sectionId];
  if (src === "system") return "SYSTEM";
  const review = form.reviews.find((r) => r.source === src);
  return `${SOURCE_FORMS[src].short.toUpperCase()} ${versionOf(review ? review.to : form.builtOn[src])}`;
}

function StatusChip({ form }) {
  return form.reviews.length ? (
    <Chip bg="#FFF3E0" fg="#9A5B00">Review needed</Chip>
  ) : (
    <Chip bg="#E8F3E5" fg="#3E7A31">Up to date</Chip>
  );
}

function OutputFormSwitcher({ forms, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
        <h2 className="text-[22px] font-semibold leading-[1.2]">{active.name} v{active.version}</h2>
        <ChevronDown size={20} color={T.primary} />
        <StatusChip form={active} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-9 z-30 w-[380px] bg-white rounded py-1 shadow-lg"
            style={{ border: `1px solid ${T.border}` }}
          >
            <li className="px-4 pt-2 pb-1 text-[12px] uppercase tracking-[1px] font-semibold" style={{ color: T.muted }}>
              Output forms of this care unit
            </li>
            {forms.map((f) => {
              const used = sourcesUsed(f.sections);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(f.id); setOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA]"
                    style={{ background: f.id === active.id ? "#F0F7FA" : undefined }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold" style={{ color: T.bodyText }}>{f.name} v{f.version}</span>
                      <StatusChip form={f} />
                    </div>
                    <div className="text-[13px]" style={{ color: T.muted }}>
                      {used.length ? `Uses ${used.map((u) => f.builtOn[u]).join(" · ")}` : "System data only – not affected by form changes"}
                    </div>
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

function ReviewBanner({ form, onPublish }) {
  const all = form.sections.flatMap((s) => s.fields);
  const count = (st) => all.filter((f) => f.status === st).length;
  const [added, changed, removed] = [count("new"), count("changed"), count("removed")];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded p-4 flex items-start gap-3"
      style={{ background: "#FFF8EC", border: "1px solid #FFB853" }}
    >
      <AlertTriangle size={20} color="#C77700" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 text-[15px] leading-[1.5]" style={{ color: T.bodyText }}>
        <div className="font-semibold">
          {form.reviews.map((r) => `${SOURCE_FORMS[r.source].label}: ${r.from} → ${versionOf(r.to)}`).join(" · ")}
        </div>
        <div>
          {[
            added && `${added} new field${added > 1 ? "s" : ""} (added hidden)`,
            changed && `${changed} changed`,
            removed && `${removed} removed`,
          ].filter(Boolean).join(", ")}
          . Check the marked fields below, then publish. Removed fields are dropped on publish.
        </div>
        <div className="text-[13px] mt-1" style={{ color: T.muted }}>
          The new form version goes live once every affected output form is published. Cases already in progress keep their current versions.
        </div>
      </div>
      <button
        type="button"
        onClick={onPublish}
        className="shrink-0 px-[13px] py-[7px] rounded text-[15px] text-white hover:opacity-90"
        style={{ background: T.primary }}
      >
        Publish v{bumpVersion(form.version)}
      </button>
    </motion.div>
  );
}

function OutputFormEditor({ form, forms, onSelectForm, setSections, onPublish }) {
  const sections = form.sections;
  const [expanded, setExpanded] = useState(() => new Set(DEFAULT_EXPANDED));
  const [hover, setHover] = useState(null);
  const [docTab, setDocTab] = useState(0);
  const scrollRef = useRef(null);
  const pendingScroll = useRef(null);

  // Open every section that holds changes when a review starts.
  const reviewKey = form.reviews.map((r) => r.to).join();
  useEffect(() => {
    const ids = sections.filter((s) => s.fields.some((f) => f.status)).map((s) => s.id);
    if (ids.length) setExpanded((prev) => new Set([...prev, ...ids]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewKey]);

  const toggleField = (key) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((f) => {
          if (f.key !== key) return f;
          if (!f.on) pendingScroll.current = key;
          return { ...f, on: !f.on };
        }),
      }))
    );
  };

  const reorderFields = (sectionId, fields) =>
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, fields } : s)));

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Bring a field that was just switched on into view in the preview.
  useEffect(() => {
    const key = pendingScroll.current;
    if (!key || !scrollRef.current) return;
    pendingScroll.current = null;
    const t = setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-k="${key}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 320);
    return () => clearTimeout(t);
  }, [sections]);

  const isDirty = sections !== form.baseline;
  const used = sourcesUsed(sections);

  return (
    <main className="px-8 pt-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <OutputFormSwitcher forms={forms} active={form} onSelect={onSelectForm} />
          <div className="text-[13px] mt-1" style={{ color: T.muted }}>
            {used.length ? `Built on ${used.map((u) => form.builtOn[u]).join(" · ")}` : "Uses system data only"}
          </div>
        </div>
        <button
          onClick={() => setSections(form.baseline)}
          disabled={!isDirty}
          className="flex items-center gap-1.5 text-[14px] font-semibold disabled:opacity-0 transition-opacity mt-1"
          style={{ color: T.primary }}
        >
          <RotateCcw size={15} /> Reset changes
        </button>
      </div>

      {form.reviews.length > 0 && <ReviewBanner form={form} onPublish={onPublish} />}

      <div className="mt-6 flex gap-6" style={{ borderBottom: `1px solid ${T.border}` }}>
        {["PDF output document", "EMR outpust document"].map((t, i) => (
          <button
            key={t}
            onClick={() => i === 0 && setDocTab(0)}
            className={`pb-2 text-[15px] -mb-px ${i === 0 ? "cursor-pointer" : "cursor-default"}`}
            style={{
              fontWeight: docTab === i ? 600 : 400,
              borderBottom: docTab === i ? `2px solid ${T.primary}` : "2px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 items-start grid-cols-1 lg:grid-cols-[minmax(420px,737fr)_minmax(0,1039fr)]">
        {/* Left: form data sections */}
        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="flex flex-col gap-4">
          {sections.map((s) => (
            <SectionCard
              key={s.id}
              section={s}
              sourceTag={sourceTagFor(form, s.id)}
              expanded={expanded.has(s.id)}
              onToggleExpand={() => toggleExpand(s.id)}
              onReorderFields={reorderFields}
              onToggleField={toggleField}
              onHover={setHover}
            />
          ))}
        </Reorder.Group>

        {/* Right: live preview */}
        <section
          className="bg-white rounded flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)]"
          style={{ border: `1px solid ${T.cardBorder}` }}
        >
          <div className="p-6 flex items-center justify-between">
            <span className="text-[16px] font-bold uppercase tracking-[1px] leading-[1.2]">Preview</span>
            <span className="text-[13px]" style={{ color: T.muted }}>
              {sections.reduce((n, s) => n + visibleFields(s).length, 0)} of{" "}
              {sections.reduce((n, s) => n + s.fields.length, 0)} fields shown
            </span>
          </div>
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-[30px] py-4" style={{ background: T.light }}>
            <HoverCtx.Provider value={{ hover }}>
              <Preview sections={sections} />
            </HoverCtx.Provider>
          </div>
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------- page */

export default function OutputFormPrototype() {
  const [unitTab, setUnitTab] = useState(1); // 0 = Basic information, 1 = Output forms
  const [outputForms, setOutputForms] = useState(INITIAL_OUTPUT_FORMS);
  const [activeId, setActiveId] = useState(INITIAL_OUTPUT_FORMS[0].id);
  const [sourceForms, setSourceForms] = useState({
    request: { active: INITIAL_BUILT_ON.request, pending: null },
    report: { active: INITIAL_BUILT_ON.report, pending: null },
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const activeForm = outputForms.find((f) => f.id === activeId);

  const setSections = (upd) =>
    setOutputForms((fs) => fs.map((f) => (f.id === activeId ? { ...f, sections: typeof upd === "function" ? upd(f.sections) : upd } : f)));

  const activate = (source, version) => {
    setSourceForms((sf) => ({ ...sf, [source]: { active: version, pending: null } }));
    setToast(`${version} is now active for new cases.`);
  };

  // Changing a source form: affected output forms enter review, the new version waits.
  const startChange = (source, target) => {
    const diff = FORM_DIFFS[target];
    const from = sourceForms[source].active;
    let affected = 0;
    const next = outputForms.map((f) => {
      if (!impactOf(f.sections, diff).length) return f;
      affected++;
      const sections = applyDiff(f.sections, diff);
      return {
        ...f,
        preReview: f.reviews.length ? f.preReview : f.sections,
        reviews: [...f.reviews, { source, from, to: target }],
        sections,
        baseline: sections,
      };
    });
    setOutputForms(next);
    if (affected) setSourceForms((sf) => ({ ...sf, [source]: { ...sf[source], pending: target } }));
    else activate(source, target);
  };

  const cancelChange = (source) => {
    setOutputForms((fs) =>
      fs.map((f) => {
        if (!f.reviews.some((r) => r.source === source)) return f;
        const rest = f.reviews.filter((r) => r.source !== source);
        const sections = rest.reduce((acc, r) => applyDiff(acc, FORM_DIFFS[r.to]), f.preReview);
        return { ...f, reviews: rest, sections, baseline: sections, preReview: rest.length ? f.preReview : null };
      })
    );
    setSourceForms((sf) => ({ ...sf, [source]: { ...sf[source], pending: null } }));
    setToast("Form change cancelled. Output forms restored.");
  };

  const publish = () => {
    const done = activeForm.reviews;
    const next = outputForms.map((f) => {
      if (f.id !== activeId) return f;
      const sections = publishSections(f.sections);
      const builtOn = { ...f.builtOn };
      done.forEach((r) => (builtOn[r.source] = r.to));
      return { ...f, sections, baseline: sections, version: bumpVersion(f.version), builtOn, reviews: [], preReview: null };
    });
    setOutputForms(next);
    let activated = false;
    for (const r of done) {
      if (!next.some((f) => f.reviews.some((x) => x.source === r.source))) {
        activate(r.source, r.to);
        activated = true;
      }
    }
    if (!activated) {
      const left = next.filter((f) => f.reviews.length).length;
      setToast(`${activeForm.name} v${bumpVersion(activeForm.version)} published. ${left} output form${left > 1 ? "s" : ""} still to review.`);
    }
  };

  const goReview = (source) => {
    const first = outputForms.find((f) => f.reviews.some((r) => r.source === source));
    if (first) setActiveId(first.id);
    setUnitTab(1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: T.fontFamily, color: T.bodyText, background: T.light }}>
      <SideNav />
      <div className="flex-1 min-w-0">
        <TopHeader />
        <UnitHeader activeTab={unitTab} onChange={setUnitTab} />

        {/* Both pages stay mounted so their state survives tab switches. */}
        <div className={unitTab === 0 ? "" : "hidden"}>
          <BasicInformation
            sourceForms={sourceForms}
            outputForms={outputForms}
            onStartChange={startChange}
            onCancelChange={cancelChange}
            onGoReview={goReview}
          />
        </div>
        <div className={unitTab === 1 ? "" : "hidden"}>
          <OutputFormEditor
            key={activeId}
            form={activeForm}
            forms={outputForms}
            onSelectForm={setActiveId}
            setSections={setSections}
            onPublish={publish}
          />
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded shadow-lg text-[15px] text-white"
            style={{ background: "#002532" }}
          >
            <CheckCircle2 size={18} color="#62A752" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
