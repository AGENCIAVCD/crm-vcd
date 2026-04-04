import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 border border-transparent font-medium [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-emerald-600 text-white",
        warning: "bg-amber-500 text-slate-950",
        info: "bg-sky-500 text-white",
        outline: "border-border bg-transparent text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      appearance: {
        default: "",
        light: "",
        outline: "",
        ghost: "border-transparent bg-transparent",
      },
      disabled: {
        true: "pointer-events-none opacity-50",
      },
      size: {
        lg: "h-7 min-w-7 rounded-md px-2 text-xs [&_svg]:size-3.5",
        md: "h-6 min-w-6 rounded-md px-2 text-xs [&_svg]:size-3.5",
        sm: "h-5 min-w-5 rounded-sm px-1.5 text-[11px] [&_svg]:size-3",
        xs: "h-4 min-w-4 rounded-sm px-1 text-[10px] [&_svg]:size-3",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        appearance: "light",
        className: "bg-brand-soft text-brand",
      },
      {
        variant: "secondary",
        appearance: "light",
        className: "bg-slate-100 text-slate-700",
      },
      {
        variant: "success",
        appearance: "light",
        className: "bg-emerald-50 text-emerald-700",
      },
      {
        variant: "warning",
        appearance: "light",
        className: "bg-amber-50 text-amber-700",
      },
      {
        variant: "info",
        appearance: "light",
        className: "bg-sky-50 text-sky-700",
      },
      {
        variant: "destructive",
        appearance: "light",
        className: "bg-rose-50 text-rose-700",
      },
      {
        variant: "primary",
        appearance: "outline",
        className: "border-brand/20 bg-brand-soft/50 text-brand",
      },
      {
        variant: "success",
        appearance: "outline",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
      {
        variant: "warning",
        appearance: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      },
      {
        variant: "info",
        appearance: "outline",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      },
      {
        variant: "destructive",
        appearance: "outline",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      },
      {
        variant: "primary",
        appearance: "ghost",
        className: "text-brand",
      },
      {
        variant: "secondary",
        appearance: "ghost",
        className: "text-slate-700",
      },
      {
        variant: "success",
        appearance: "ghost",
        className: "text-emerald-700",
      },
      {
        variant: "warning",
        appearance: "ghost",
        className: "text-amber-700",
      },
      {
        variant: "info",
        appearance: "ghost",
        className: "text-sky-700",
      },
      {
        variant: "destructive",
        appearance: "ghost",
        className: "text-rose-700",
      },
    ],
    defaultVariants: {
      variant: "primary",
      appearance: "default",
      size: "md",
      shape: "default",
    },
  },
);

const badgeButtonVariants = cva(
  "inline-flex size-3.5 cursor-pointer items-center justify-center rounded-md opacity-60 transition hover:opacity-100 [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  appearance,
  shape,
  asChild = false,
  disabled,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(
        badgeVariants({ variant, size, appearance, shape, disabled }),
        className,
      )}
      {...props}
    />
  );
}

function BadgeButton({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof badgeButtonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="badge-button"
      className={cn(badgeButtonVariants({ variant }), className)}
      type="button"
      {...props}
    />
  );
}

function BadgeDot({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge-dot"
      className={cn("size-1.5 rounded-full bg-current opacity-75", className)}
      {...props}
    />
  );
}

export { Badge, BadgeButton, BadgeDot, badgeVariants };
