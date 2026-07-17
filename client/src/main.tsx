import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { ThemeProvider } from "@/app/providers/theme-provider.tsx"
import { QueryProvider } from "./app/providers/QueryProvider.tsx"
import { AuthProvider } from "./app/providers/AuthProvider.tsx"
import { AppRouter } from "./app/routes/AppRouter.tsx"
import { ToastProvider } from "./app/providers/ToastProvider.tsx"
import { ToastContainer } from "./components/toast/ToastContainer.tsx"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { env } from "./config/env.ts"
import { SocketProvider } from "./shared/providers/SocketProvider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <ToastProvider>
                <AppRouter />
                <ToastContainer />
              </ToastProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
