import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../layouts/DashboardLayout";
import AuthLayout from "../layouts/AuthLayout";
import AuthInitializer from "@/features/auth/components/AuthInitializer";
import { PublicRoute } from "./PublicRoute";

const Login = React.lazy(() => import("@/features/auth/pages/Login"));
const Signup = React.lazy(() => import("@/features/auth/pages/Signup"));
const Home = React.lazy(() => import("@/features/dashboard/pages/Home"));
const PdfChat = React.lazy(() => import("@/features/pdf-chat/pages/PdfChat"));

const SuspenseFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthInitializer />}>
          {/* PUBLIC Routes */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route 
                path="/login"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <Login />
                  </Suspense>
                } 
              />
              <Route 
                path="/signup"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <Signup />
                  </Suspense>
                } 
              />
            </Route>
          </Route>

          {/* PRIVATE Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* DEFAULT DASHBOARD */}
              <Route 
                path="/dashboard" 
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <Home />
                  </Suspense>
                } 
              />
              
              {/* PDF CHAT */}
              <Route 
                path="/dashboard/pdf-chat" 
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <PdfChat />
                  </Suspense>
                } 
              />

              {/* MANAGER PAGES */}
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
