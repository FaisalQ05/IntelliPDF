import { useToast } from "@/shared/hooks/useToast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "error": return <AlertCircle className="h-4.5 w-4.5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />;
      default: return <Info className="h-4.5 w-4.5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="ipdf-animate-slide-down pointer-events-auto flex min-w-[320px] max-w-[400px] items-start gap-3 rounded-2xl bg-white/90 p-4 shadow-xl shadow-zinc-200/40 backdrop-blur-md ring-1 ring-zinc-200/60"
        >
          <div className="mt-0.5 shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="min-w-0 flex-1">
            {toast.title && <p className="text-[14px] font-semibold text-zinc-900">{toast.title}</p>}
            <p className="text-[13px] font-medium text-zinc-500 mt-0.5">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 mt-0.5 shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
