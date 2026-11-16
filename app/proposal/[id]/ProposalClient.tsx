"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Section {
  heading: string;
  body: string;
}

interface ProposalClientProps {
  proposal: Record<string, unknown>;
}

// ─── Content Parser ───────────────────────────────────────────────────────────

function parseSections(proposal: Record<string, unknown>): Section[] {
  // Prefer explicit sections array
  if (Array.isArray(proposal.sections)) {
    return (proposal.sections as Array<{ heading: string; body: string }>)
      .filter((s) => s && typeof s.heading === "string")
      .map((s) => ({ heading: s.heading, body: s.body ?? "" }));
  }

  const raw = typeof proposal.content === "string" ? proposal.content : "";
  if (!raw.trim()) return [];

  const lines = raw.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  const isSectionHeading = (line: string) =>
    /^#{1,3}\s+/.test(line) ||          // ## Heading
    /^\*\*[^*]+\*\*\s*$/.test(line) ||  // **Bold heading**
    /^Day\s+\d+/i.test(line);           // Day N ...

  for (const line of lines) {
    if (isSectionHeading(line)) {
      if (current) sections.push(current);
      const heading = line
        .replace(/^#{1,3}\s+/, "")
        .replace(/^\*\*|\*\*$/g, "")
        .trim();
      current = { heading, body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);

  // Strip trailing blank lines from bodies
  return sections.map((s) => ({ ...s, body: s.body.trimEnd() }));
}

// ─── Body Renderer ────────────────────────────────────────────────────────────

function BodyContent({ body }: { body: string }) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="mt-3 space-y-1.5">
        {listBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-300">
            <span className="mt-1 text-amber-400 shrink-0">◆</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const listMatch = line.match(/^[-*•]\s+(.+)/);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
    } else {
      flushList(`list-${i}`);
      if (line.trim() === "") {
        // skip blank
      } else {
        elements.push(
          <p key={i} className="mt-2 text-slate-300 leading-relaxed">
            {line}
          </p>
        );
      }
    }
  });
  flushList("list-end");

  return <div>{elements}</div>;
}

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({
  section,
  index,
  open,
  onToggle,
  sectionRef,
}: {
  section: Section;
  index: number;
  open: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <article
      ref={sectionRef}
      id={`section-${index}`}
      className="border border-slate-700/60 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left
                   bg-slate-800/60 hover:bg-slate-800 transition-colors"
        aria-expanded={open}
      >
        <span className="font-serif text-lg text-amber-200 font-semibold">
          {section.heading}
        </span>
        <span
          className={`text-amber-400 text-xl transition-transform duration-300 ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden
        >
          +
        </span>
      </button>

      {/* Animated body */}
      <div
        ref={contentRef}
        style={
          open
            ? { maxHeight: contentRef.current?.scrollHeight ?? 2000 }
            : { maxHeight: 0 }
        }
        className="overflow-hidden transition-all duration-500 ease-in-out"
      >
        <div className="px-7 py-5 border-t border-slate-700/40">
          <BodyContent body={section.body} />
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Status = "idle" | "approved" | "changes";

export default function ProposalClient({ proposal }: ProposalClientProps) {
  const title = (proposal.title as string | undefined) ?? "Event Proposal";
  const clientName = proposal.clientName as string | undefined;
  const eventDate = proposal.eventDate as string | undefined;
  const venue = proposal.venue as string | undefined;
  const guests = proposal.guests as string | number | undefined;
  const plannerPhone = proposal.plannerPhone as string | undefined;

  const sections = parseSections(proposal);

  const [openMap, setOpenMap] = useState<Record<number, boolean>>(
    Object.fromEntries(sections.map((_, i) => [i, i === 0]))
  );
  const [activeSection, setActiveSection] = useState<number>(0);
  const [status, setStatus] = useState<Status>("idle");

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Scroll-spy
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(i);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections.length]);

  const allOpen = sections.every((_, i) => openMap[i]);

  const toggleAll = () => {
    setOpenMap(Object.fromEntries(sections.map((_, i) => [i, !allOpen])));
  };

  const scrollToSection = (i: number) => {
    setOpenMap((prev) => ({ ...prev, [i]: true }));
    setTimeout(
      () =>
        sectionRefs.current[i]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50
    );
  };

  const chips = [
    eventDate && { label: "📅 " + eventDate },
    venue && { label: "📍 " + venue },
    guests && { label: "👥 " + guests + " guests" },
  ].filter(Boolean) as { label: string }[];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 0%, #f59e0b55, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-amber-400 mb-6 font-medium">
            Bespoke Event Proposal
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-amber-100 leading-tight">
            {title}
          </h1>
          {clientName && (
            <p className="mt-5 text-lg text-slate-400">
              Prepared exclusively for{" "}
              <span className="text-amber-300 font-medium">{clientName}</span>
            </p>
          )}

          {/* Chips */}
          {chips.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-amber-500/30
                             bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300"
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Sticky nav ── */}
      {sections.length > 0 && (
        <nav className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
          <div className="mx-auto max-w-4xl px-4">
            <ul className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
              {sections.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToSection(i)}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
                      activeSection === i
                        ? "bg-amber-500 text-slate-950 font-semibold"
                        : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
                    }`}
                  >
                    {s.heading}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {/* ── Main content ── */}
      <main className="mx-auto max-w-4xl px-4 py-10">

        {/* Expand / Collapse all */}
        {sections.length > 1 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={toggleAll}
              className="text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        )}

        {/* Accordions */}
        <div className="space-y-3">
          {sections.map((section, i) => (
            <AccordionItem
              key={i}
              section={section}
              index={i}
              open={!!openMap[i]}
              onToggle={() =>
                setOpenMap((prev) => ({ ...prev, [i]: !prev[i] }))
              }
              sectionRef={(el) => {
                sectionRefs.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* No sections fallback */}
        {sections.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/40 px-7 py-6 text-slate-400">
            No proposal content available.
          </div>
        )}

        {/* ── Action bar ── */}
        {status === "idle" ? (
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setStatus("approved")}
              className="flex-1 sm:flex-none sm:min-w-[200px] rounded-full bg-amber-500
                         px-8 py-3.5 text-slate-950 font-semibold text-sm
                         hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              ✓ Approve Proposal
            </button>
            <button
              onClick={() => setStatus("changes")}
              className="flex-1 sm:flex-none sm:min-w-[200px] rounded-full border border-slate-600
                         px-8 py-3.5 text-slate-300 font-semibold text-sm
                         hover:border-amber-500/60 hover:text-amber-300 transition-colors"
            >
              ✎ Request Changes
            </button>

            {plannerPhone && (
              <a
                href={`https://wa.me/${plannerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none sm:min-w-[200px] rounded-full bg-green-600
                           px-8 py-3.5 text-white font-semibold text-sm text-center
                           hover:bg-green-500 transition-colors"
              >
                💬 WhatsApp Planner
              </a>
            )}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-8 py-8 text-center">
            {status === "approved" ? (
              <>
                <p className="text-3xl mb-3">🎉</p>
                <h2 className="font-serif text-2xl text-amber-200 font-semibold mb-2">
                  Proposal Approved!
                </h2>
                <p className="text-slate-400">
                  Thank you, {clientName ?? "valued client"}. Your planner will
                  be in touch shortly to confirm next steps.
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-3">✍️</p>
                <h2 className="font-serif text-2xl text-amber-200 font-semibold mb-2">
                  Changes Requested
                </h2>
                <p className="text-slate-400">
                  Got it! Your planner will reach out to discuss your feedback.
                </p>
              </>
            )}
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Back
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        CuraFlow Proposals · Crafted with care
      </footer>
    </div>
  );
}
