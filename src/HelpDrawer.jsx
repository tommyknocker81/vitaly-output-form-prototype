import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronDown, ExternalLink } from "lucide-react";
import { T } from "./tokens.js";
import { PAGE_DOCS } from "./pageDocs.js";

// Renders `**bold**` segments; everything else stays plain text.
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : part
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-[13px] font-bold uppercase tracking-[1px] mb-2" style={{ color: T.muted }}>{children}</h3>;
}

function Story({ s }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded" style={{ border: `1px solid ${T.border}` }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#F7F8FA]"
      >
        <span className="text-[15px] font-semibold">{s.title}</span>
        <motion.span initial={false} animate={{ rotate: open ? 180 : 0 }} className="flex shrink-0">
          <ChevronDown size={18} color={T.primary} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-[14px] leading-[1.5]">
              <p className="italic" style={{ color: "#444C54" }}>{s.story}</p>
              <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: T.muted }}>Acceptance criteria</p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {s.ac.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-[9px] w-1 h-1 rounded-full shrink-0" style={{ background: T.primary }} />
                    <span><Rich text={a} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function DocBody({ doc }) {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <SectionTitle>Overview</SectionTitle>
        <div className="flex flex-col gap-2 text-[15px] leading-[1.5]">
          {doc.overview.map((p) => <p key={p}><Rich text={p} /></p>)}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[14px] leading-[1.5]">
          <dt className="font-semibold">In scope</dt><dd>{doc.scope.in}</dd>
          <dt className="font-semibold">Out of scope</dt><dd>{doc.scope.out}</dd>
        </dl>
      </section>

      <section>
        <SectionTitle>Rules</SectionTitle>
        <table className="w-full text-[14px] leading-[1.45] border-collapse">
          <tbody>
            {doc.rules.map(([k, v]) => (
              <tr key={k} style={{ borderTop: `1px solid ${T.border}` }}>
                <th scope="row" className="text-left align-top font-semibold py-2 pr-3 w-[130px]">{k}</th>
                <td className="py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {doc.epics.map((e) => (
        <section key={e.title}>
          <SectionTitle>{e.title}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {e.stories.map((s) => <Story key={s.title} s={s} />)}
          </ul>
        </section>
      ))}

      <section>
        <SectionTitle>Open questions</SectionTitle>
        <ul className="flex flex-col gap-1.5 text-[14px] leading-[1.5]">
          {doc.openQuestions.map((q) => (
            <li key={q} className="flex gap-2">
              <span className="mt-[9px] w-1 h-1 rounded-full shrink-0" style={{ background: T.muted }} />
              {q}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Floating help button (bottom right) that opens the page's documentation in a side drawer.
export default function HelpDrawer({ page }) {
  const doc = PAGE_DOCS[page];
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close when the page changes underneath the drawer.
  useEffect(() => setOpen(false), [page]);

  if (!doc) return null;

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return createPortal(
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={triggerRef}
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            aria-label={`Open documentation for ${doc.title}`}
            title="Page documentation"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:brightness-110 focus:outline-none focus-visible:ring-4"
            style={{ background: T.primary, "--tw-ring-color": "rgba(0,128,163,0.35)" }}
          >
            <BookOpen size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,37,50,0.25)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-title"
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[520px] bg-white flex flex-col shadow-2xl"
              style={{ fontFamily: T.fontFamily, color: T.bodyText }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <header className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: T.primary }}>Documentation</p>
                  <h2 id="help-title" className="text-[22px] font-semibold leading-[1.2] mt-1">{doc.title}</h2>
                  <p className="text-[13px] mt-1" style={{ color: T.muted }}>{doc.path}</p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close documentation"
                  className="w-10 h-10 rounded flex items-center justify-center hover:bg-[#F7F8FA] shrink-0"
                >
                  <X size={20} color={T.gray600} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <DocBody doc={doc} />
              </div>
              <footer className="px-6 py-4" style={{ borderTop: `1px solid ${T.border}`, background: "#FAFBFC" }}>
                <a
                  href={doc.fullDoc}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold hover:underline"
                  style={{ color: T.primary }}
                >
                  Open the full backlog document <ExternalLink size={14} />
                </a>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
