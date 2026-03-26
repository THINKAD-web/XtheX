import * as React from "react";

import { cn } from "@/lib/utils";
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Controller, FormProvider, useFormContext } from "react-hook-form";

export function Form<TFieldValues extends FieldValues>({
  children,
  ...methods
}: { children: React.ReactNode } & UseFormReturn<TFieldValues>) {
  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

const FormItemContext = React.createContext<{ id: string } | null>(null);

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function useFormField() {
  const item = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  if (!item) throw new Error("useFormField must be used within <FormItem>");
  return {
    id: item.id,
    name: undefined as unknown as string,
    getFieldState,
    formState,
  };
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function FormControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function FormMessage({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p className={cn("text-sm text-red-600", className)}>
      {children}
    </p>
  );
}

