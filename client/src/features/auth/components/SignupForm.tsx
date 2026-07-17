import { useForm } from "react-hook-form";
import { useSignup } from "../hooks/useSignup";
import { type SignupFormType, SignupSchema } from "../schemas/signup.schema";
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
import { UserPlus } from "lucide-react";
import { GoogleAuthButton } from "./shared/GoogleAuthButton";

export const SignupForm = () => {
  const signup = useSignup();
  const googleAuth = useGoogleAuth();
  const { addToast } = useToast();

  const methods = useForm<SignupFormType>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupFormType) => {
    try {
      await signup.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      addToast({ type: "success", message: "Account created successfully" });
    } catch (error) {
      if (isApiError(error)) {
        addToast({ type: "error", message: error.message });
      } else if (error instanceof Error) {
        addToast({ type: "error", message: error.message });
      }
    }
  };

  const handleGoogleSignup = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        await googleAuth.mutateAsync({ code: codeResponse.code });
        addToast({ type: "success", message: "Google signup successful" });
      } catch (_error) {
        addToast({ type: "error", message: "Google signup failed" });
      }
    },
    onError: () => {
      addToast({ type: "error", message: "Google signup failed" });
    },
  });

  const isPending = signup.isPending || googleAuth.isPending;

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Create an account
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Get started with IntelliPDF today
        </p>
      </div>

      <div className="space-y-6">
        <GoogleAuthButton onClick={() => handleGoogleSignup()} disabled={isPending}>Sign up with Google</GoogleAuthButton>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-zinc-400">
              Or continue with email
            </span>
          </div>
        </div>

        <AppForm<SignupFormType> methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            <FormField<SignupFormType> name="name" label="Full Name">
              <FormInput<SignupFormType>
                name="name"
                placeholder="John Doe"
                disabled={isPending}
              />
            </FormField>

            <FormField<SignupFormType> name="email" label="Email">
              <FormInput<SignupFormType>
                name="email"
                placeholder="Enter your email"
                disabled={isPending}
              />
            </FormField>

            <FormField<SignupFormType> name="password" label="Password">
              <FormInput<SignupFormType>
                name="password"
                placeholder="Create a password"
                type="password"
                disabled={isPending}
              />
            </FormField>

            <FormField<SignupFormType>
              name="confirmPassword"
              label="Confirm Password"
            >
              <FormInput<SignupFormType>
                name="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                disabled={isPending}
              />
            </FormField>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-6 text-[15px] font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              {signup.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create account
                </div>
              )}
            </Button>
          </div>
        </AppForm>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
