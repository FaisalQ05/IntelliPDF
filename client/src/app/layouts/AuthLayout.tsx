import { Outlet } from "react-router-dom";
import { FileText, Sparkles, Zap, Shield } from "lucide-react";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Form Area */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[500px] xl:w-[600px] xl:px-24 border-r border-zinc-100">
        <div className="mx-auto w-full max-w-sm lg:w-96 ipdf-animate-fade-in">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl ipdf-brand-gradient shadow-lg ipdf-logo-glow">
              <FileText className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-zinc-900">
                Intelli
              </span>
              <span className="text-xl font-bold tracking-tight ipdf-brand-gradient-text">
                PDF
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-0.5 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span className="text-[11px] font-semibold tracking-wide text-indigo-600 uppercase">AI</span>
            </div>
          </div>

          <Outlet />
        </div>
      </div>

      {/* Right side - Premium Graphic Area */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-zinc-950 overflow-hidden">
          {/* Base gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-900/40 to-zinc-950" />
          
          {/* Glowing orbs */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
          
          {/* Subtle grid pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.15]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="auth-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-700" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-grid)" />
          </svg>

          {/* Floating content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <div className="ipdf-animate-slide-up space-y-8 max-w-lg z-10">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white/5 p-4 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                <FileText className="h-12 w-12 text-white/90" strokeWidth={1.5} />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
                Unlock the power of your documents
              </h1>
              
              <p className="text-lg leading-relaxed text-zinc-400">
                Instantly extract insights, summarize complex information, and chat with your PDFs using advanced AI.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-8 text-left">
                <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-md border border-white/10 transition-colors hover:bg-white/10">
                  <Zap className="h-6 w-6 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-zinc-100">Lightning Fast</h3>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">Get answers in seconds, not hours.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-md border border-white/10 transition-colors hover:bg-white/10">
                  <Shield className="h-6 w-6 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-zinc-100">Secure & Private</h3>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">Your documents stay completely private.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
