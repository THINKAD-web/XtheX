"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "fixed inset-x-0 top-0 z-[200] mx-auto flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:items-end",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

type ToastProps = React.ComponentPropsWithoutRef<"li"> & {
  variant?: "default" | "destructive";
};

const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <li
      ref={ref}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-4 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-950",
        variant === "destructive" &&
          "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
        className,
      )}
      {...props}
    />
  ),
);
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "font-medium text-zinc-900 dark:text-zinc-50",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "mt-1 text-xs text-zinc-600 dark:text-zinc-400",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export { Toast, ToastDescription, ToastTitle, ToastViewport };

