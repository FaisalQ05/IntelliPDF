"use client"

import {
  FormProvider,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form"
import clsx from "clsx"

interface AppFormProps<T extends FieldValues> {
  methods: UseFormReturn<T>
  onSubmit: (data: T) => void
  children: React.ReactNode
  className?: string
}

export function AppForm<T extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
}: AppFormProps<T>) {
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={clsx("w-full space-y-6", className)}
      >
        {children}
      </form>
    </FormProvider>
  )
}
