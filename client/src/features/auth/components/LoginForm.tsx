import { useForm } from "react-hook-form";
import { useLogin } from "../hooks/useLogin";
import { type LoginFormType, LoginSchema } from "../schemas/login.schema";
import { AppForm } from "@/components/form/Form";
import { FormField } from "@/components/form/FormField";
import { FormInput } from "@/components/form/FormInput";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { isApiError } from "@/shared/utils/type-guards";
import { useToast } from "@/shared/hooks/useToast";
import { useGoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { GoogleAuthButton } from "./shared/GoogleAuthButton";

export const LoginForm = () => {
  const login = useLogin();
  const googleAuth = useGoogleAuth();
  const { addToast } = useToast();

  const methods = useForm<LoginFormType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormType) => {
    try {
      await login.mutateAsync(values);
      addToast({ type: "success", message: "Login successful" });
    } catch (error) {
      if (isApiError(error)) {
        addToast({ type: "error", message: error.message });
      }
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        await googleAuth.mutateAsync({ code: codeResponse.code });
        addToast({ type: "success", message: "Google login successful" });
      } catch (_error) {
        addToast({ type: "error", message: "Google login failed" });
      }
    },
    onError: () => {
      addToast({ type: "error", message: "Google login failed" });
    },
  });

  const isPending = login.isPending || googleAuth.isPending;

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Please enter your details to sign in
        </p>
      </div>

      <div className="space-y-6">
        <GoogleAuthButton onClick={() => handleGoogleLogin()} disabled={isPending}>Continue with Google</GoogleAuthButton>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-zinc-400">Or continue with email</span>
          </div>
        </div>

        <AppForm<LoginFormType> methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            <FormField<LoginFormType> name="email" label="Email">
              <FormInput<LoginFormType>
                name="email"
                placeholder="Enter your email"
                disabled={isPending}
              />
            </FormField>

            <FormField<LoginFormType> name="password" label="Password">
              <FormInput<LoginFormType>
                name="password"
                placeholder="Enter your password"
                type="password"
                disabled={isPending}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="remember" className="text-sm text-zinc-600">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-6 text-[15px] font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              {login.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Logging in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </div>
              )}
            </Button>
          </div>
        </AppForm>

        <p className="text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
