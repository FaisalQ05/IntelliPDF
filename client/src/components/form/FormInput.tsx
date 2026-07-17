
import { Input } from "@/components/ui/input"
import { useFormContext, type FieldValues, type Path } from "react-hook-form"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import clsx from "clsx"

interface FormInputProps<
  T extends FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>
  left?: ReactNode // optional left icon/element
  right?: ReactNode // optional right icon/element
  inputSize?: "sm" | "md" | "lg" // new size prop
}

export function FormInput<T extends FieldValues>({
  name,
  className,
  type = "text",
  left,
  right,
  inputSize = "md",
  ...props
}: FormInputProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>()

  const error = errors?.[name]?.message as string | undefined

  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && showPassword ? "text" : type

  const sizeClass = {
    sm: "h-9 text-[13px] px-3 py-1.5",
    md: "h-11 text-[14px] px-3.5 py-2.5",
    lg: "h-12 text-[15px] px-4 py-3",
  }[inputSize]

  return (
    <div className="relative w-full group">
      {/* Left slot */}
      {left && (
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
          {left}
        </div>
      )}

      <Input
        {...register(name)}
        {...props}
        type={inputType}
        className={clsx(
          className,
          sizeClass,
          "bg-white border-zinc-200 shadow-sm transition-all duration-200",
          "placeholder:text-zinc-400",
          error
            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/10"
            : "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 hover:border-zinc-300",
          left && "pl-10",
          (isPassword || right) && "pr-12",
        )}
      />

      {/* Right slot */}
      {isPassword ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-1/2 right-2 -translate-y-1/2 h-7 rounded-md px-2.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-colors"
        >
          {showPassword ? "Hide" : "Show"}
        </Button>
      ) : (
        right && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
            {right}
          </div>
        )
      )}
    </div>
  )
}
