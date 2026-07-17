import { Send } from "lucide-react"
import type { KeyboardEvent } from "react"

interface ChatComposerProps { value: string; pending: boolean; onChange: (value: string) => void; onSend: () => void }
export function ChatComposer({ value, pending, onChange, onSend }: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend() }
  }
  return <div className="border-t border-zinc-100 bg-white p-4"><div className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50 px-4 py-2.5 shadow-sm transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
    <input type="text" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your document..." disabled={pending} className="flex-1 bg-transparent text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50" />
    <button onClick={onSend} disabled={!value.trim() || pending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" strokeWidth={2.2} /></button>
  </div></div>
}
