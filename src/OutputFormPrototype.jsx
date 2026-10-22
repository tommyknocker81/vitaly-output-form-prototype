import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence, Reorder, useDragControls, LayoutGroup } from "framer-motion";
import { ChevronDown, ChevronLeft, Star, Bell, User, RotateCcw } from "lucide-react";

// Vitaly RSO design tokens (Figma: OpenLine-Vitaly, node 14002:280778)
const T = {
  primary: "#0080A3",
  danger: "#C74139",
  border: "#DEE2E6",
  cardBorder: "#BCC2C6",
  bodyText: "#212529",
  muted: "#727C82",
  gray600: "#6C757D",
  gray400: "#CED4DA",
  light: "#F7F8FA",
  fontFamily: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

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
const UNIT_TAB_ACTIVE = 1; // this page

function UnitHeader() {
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
        {UNIT_TABS.map((t, i) => (
          <span
            key={t}
            className="min-w-[145px] px-4 whitespace-nowrap flex items-center justify-center text-[13px] uppercase cursor-default"
            style={{
              color: i === UNIT_TAB_ACTIVE ? T.primary : T.bodyText,
              fontWeight: i === UNIT_TAB_ACTIVE ? 700 : 400,
              borderBottom: i === UNIT_TAB_ACTIVE ? `2px solid ${T.primary}` : "2px solid transparent",
            }}
          >
            {t}
          </span>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------ editor */

function FieldRow({ field, onToggle, onHover }) {
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
      style={{ background: T.light }}
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
          <div className="text-[12px] leading-[1.5] truncate" style={{ fontFamily: T.mono, color: T.muted, opacity: field.on ? 1 : 0.6 }}>
            {field.key}
          </div>
          <div
            className="text-[15px] leading-6 font-semibold truncate transition-colors"
            style={{ color: field.on ? T.bodyText : T.gray600 }}
          >
            {field.label}
          </div>
        </div>
      </div>
      <div className="px-2 flex items-center">
        <Toggle checked={field.on} onChange={() => onToggle(field.key)} label={`Show ${field.label}`} />
      </div>
    </Reorder.Item>
  );
}

function SectionCard({ section, expanded, onToggleExpand, onReorderFields, onToggleField, onHover }) {
  const controls = useDragControls();
  const shown = visibleFields(section).length;
  const total = section.fields.length;

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
                <FieldRow key={f.key} field={f} onToggle={onToggleField} onHover={onHover} />
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
      style={{ ...litStyle(lit), display: "inline" }}
    >
      {children}
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
              {f.value}
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
                            <span>{f.value}</span>
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
                      {f.lead && <div>{f.lead}</div>}
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
                    <div className={textCls}>{f.value}</div>
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
              {i > 0 && " "}{f.value}
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

/* -------------------------------------------------------------- page */

export default function OutputFormPrototype() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [expanded, setExpanded] = useState(() => new Set(DEFAULT_EXPANDED));
  const [hover, setHover] = useState(null);
  const [docTab, setDocTab] = useState(0);
  const scrollRef = useRef(null);
  const pendingScroll = useRef(null);

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

  const reset = () => {
    setSections(INITIAL_SECTIONS);
    setExpanded(new Set(DEFAULT_EXPANDED));
  };

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

  const isDirty = sections !== INITIAL_SECTIONS;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: T.fontFamily, color: T.bodyText, background: T.light }}>
      <SideNav />
      <div className="flex-1 min-w-0">
      <TopHeader />
      <UnitHeader />

      <main className="px-8 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-[1.2]">Output form name v1.3</h2>
          <button
            onClick={reset}
            disabled={!isDirty}
            className="flex items-center gap-1.5 text-[14px] font-semibold disabled:opacity-0 transition-opacity"
            style={{ color: T.primary }}
          >
            <RotateCcw size={15} /> Reset to default
          </button>
        </div>

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
      </div>
    </div>
  );
}
