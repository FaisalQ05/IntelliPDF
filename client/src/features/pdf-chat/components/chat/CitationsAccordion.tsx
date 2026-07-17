import { useState } from "react"
import { BookOpen, ChevronDown, ChevronUp, FileText } from "lucide-react"
import type { Citation } from "../../types/pdf-chat.types"

function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const page = citation.metadata?.page ?? citation.metadata?.loc?.lines?.from ?? null
  const preview = citation.pageContent?.slice(0, 160)?.trim()
  const full = citation.pageContent?.trim()
  const scoreClass = citation.score === undefined || citation.score < 0.6
    ? "bg-slate-100 text-slate-600"
    : citation.score < 0.75 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"

  return (
    <div className="overflow-hidden rounded-lg border border-indigo-100 bg-indigo-50/40">
      <button onClick={() => setExpanded((value) => !value)} className="flex w-full items-start gap-2.5 p-2.5 text-left transition-colors hover:bg-indigo-50/70">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-100 text-indigo-600"><span className="text-[10px] font-bold">{index + 1}</span></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {page !== null && <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"><FileText className="h-2.5 w-2.5" />Page {page}</span>}
            {citation.score !== undefined && <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${scoreClass}`}>{Math.round(citation.score * 100)}% match</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-zinc-600">{preview}{full && full.length > 160 ? "…" : ""}</p>
        </div>
        <div className="mt-0.5 shrink-0 text-indigo-400">{expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</div>
      </button>
      {expanded && <div className="border-t border-indigo-100/50 px-3 pb-3 pt-2"><p className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-zinc-700">{full}</p></div>}
    </div>
  )
}

export function CitationsAccordion({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  if (citations.length === 0) return null
  return <div className="mt-2.5">
    <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100">
      <BookOpen className="h-3 w-3" />{citations.length} Source{citations.length !== 1 ? "s" : ""}{open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    </button>
    {open && <div className="mt-2 space-y-1.5">{citations.map((citation, index) => <CitationCard key={index} citation={citation} index={index} />)}</div>}
  </div>
}
