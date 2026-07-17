import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetMe } from "@/features/auth/hooks/useGetMe";
import { useGetDocuments } from "@/features/pdf-chat/hooks/useDocuments";
import { useGetChats } from "@/features/pdf-chat/hooks/useChats";
import { PDFUpload } from "@/features/dashboard/components/PDFUpload";
import { ChatInterface } from "@/features/dashboard/components/ChatInterface";
import { RecentDocuments } from "@/features/dashboard/components/RecentDocuments";
import { RecentChats } from "@/features/dashboard/components/RecentChats";
import { Sparkles, TrendingUp, FileText, MessageSquare } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";

// Computed once at module load — 54 static SVG circles, no reason to recreate
// them on every render of the Home component.
const DOT_GRID = Array.from({ length: 6 }).flatMap((_, row) =>
  Array.from({ length: 9 }).map((_, col) => (
    <circle
      key={`${row}-${col}`}
      cx={col * 20 + 10}
      cy={row * 20 + 10}
      r="1.5"
      fill="white"
    />
  ))
)

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const Home = () => {
  const { data: user } = useGetMe();
  const { data: documents } = useGetDocuments();
  const { data: chats } = useGetChats();
  const navigate = useNavigate();

  // useMemo so the greeting text is stable across re-renders within the same
  // session (it only matters if the hour changes, which is extremely rare).
  const greeting = useMemo(() => getGreeting(), []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const docCount = documents?.length ?? 0;
  const chatCount = chats?.length ?? 0;
  const readyDocCount = documents?.filter((d) => d.status === "COMPLETED").length ?? 0;

  return (
    <div className="space-y-8">
      {/* ── Hero greeting ──────────────────────────── */}
      <div className="ipdf-animate-slide-up relative overflow-hidden rounded-3xl ipdf-brand-gradient px-8 py-10 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-[40px]" />
          <div className="absolute top-4 right-24 h-24 w-24 rounded-full bg-white/10 blur-[20px]" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-indigo-900/40 blur-[40px]" />
          <div className="absolute bottom-6 left-1/3 h-24 w-24 rounded-full bg-violet-400/30 blur-[30px]" />
          {/* Dots grid */}
          <svg
            className="absolute right-8 bottom-0 opacity-10"
            width="180"
            height="120"
            xmlns="http://www.w3.org/2000/svg"
          >
            {DOT_GRID}
          </svg>
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-200" />
              <span className="text-[13px] font-medium text-indigo-200">
                AI-Powered PDF Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>
            <p className="mt-2 text-[14px] text-indigo-200 max-w-md">
              Upload your PDFs and start an intelligent conversation. Your
              documents are indexed and ready to answer any question.
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              onClick={() => navigate("/dashboard/pdf-chat")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md transition hover:bg-white/20 border border-white/5"
            >
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <span className="text-[13px] font-semibold text-white">
                {readyDocCount} doc{readyDocCount !== 1 ? "s" : ""} indexed
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard/pdf-chat")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md transition hover:bg-white/20 border border-white/5"
            >
              <MessageSquare className="h-4 w-4 text-violet-300" />
              <span className="text-[13px] font-semibold text-white">
                {chatCount} active chat{chatCount !== 1 ? "s" : ""}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={String(docCount)}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          delay="ipdf-delay-100"
        />
        <StatCard
          icon={MessageSquare}
          label="Chat Sessions"
          value={String(chatCount)}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          delay="ipdf-delay-200"
        />
        <StatCard
          icon={Sparkles}
          label="Ready to Chat"
          value={String(readyDocCount)}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          delay="ipdf-delay-300"
        />
        <StatCard
          icon={TrendingUp}
          label="Processing"
          value={String(documents?.filter((d) => d.status !== "COMPLETED" && d.status !== "FAILED").length ?? 0)}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay="ipdf-delay-400"
        />
      </div>

      {/* ── Upload + Chat (two column) ─────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PDFUpload />
        <ChatInterface />
      </div>

      {/* ── Recent sections (two column) ──────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentDocuments />
        <RecentChats />
      </div>
    </div>
  );
};

export default Home;
