import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0 focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs shadow-black/5 hover:bg-primary/90",
        mono: "bg-slate-950 text-white shadow-xs shadow-black/5 hover:bg-slate-900",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs shadow-black/5 hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs shadow-black/5 hover:bg-secondary/90",
        outline: "border border-input bg-background text-foreground hover:bg-accent",
        dashed:
          "border border-dashed border-input bg-background text-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        dim: "text-muted-foreground hover:bg-accent hover:text-foreground",
        foreground: "text-foreground hover:bg-accent",
        inverse: "text-background hover:bg-foreground/10",
      },
      appearance: {
        default: "",
        ghost: "bg-transparent shadow-none",
      },
      underline: {
        solid: "",
        dashed: "",
      },
      underlined: {
        solid: "",
        dashed: "",
      },
      size: {
        lg: "h-10 rounded-md px-4 text-sm [&_svg:not([class*=size-])]:size-4",
        md: "h-9 rounded-md px-3 text-sm [&_svg:not([class*=size-])]:size-4",
        sm: "h-7 rounded-md px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5",
        icon: "size-9 rounded-md p-0 [&_svg:not([class*=size-])]:size-4",
      },
      autoHeight: {
        true: "h-auto",
        false: "",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
      mode: {
        default: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        icon: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        link: "h-auto rounded-none bg-transparent p-0 text-primary shadow-none hover:bg-transparent",
        input:
          "justify-start border border-input bg-background text-left font-normal hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/30",
      },
      placeholder: {
        true: "text-muted-foreground",
        false: "",
      },
    },
    compoundVariants: [
      {
        mode: "link",
        underline: "solid",
        className: "hover:underline hover:underline-offset-4",
      },
      {
        mode: "link",
        underline: "dashed",
        className: "hover:underline hover:decoration-dashed hover:underline-offset-4",
      },
      {
        mode: "link",
        underlined: "solid",
        className: "underline underline-offset-4",
      },
      {
        mode: "link",
        underlined: "dashed",
        className: "underline decoration-dashed underline-offset-4",
      },
      {
        mode: "icon",
        size: "sm",
        className: "size-7 p-0",
      },
      {
        mode: "icon",
        size: "md",
        className: "size-9 p-0",
      },
      {
        mode: "icon",
        size: "lg",
        className: "size-10 p-0",
      },
      {
        variant: "dim",
        mode: "icon",
        className: "text-muted-foreground hover:text-foreground",
      },
    ],
    defaultVariants: {
      variant: "primary",
      mode: "default",
      size: "md",
      shape: "default",
      appearance: "default",
      autoHeight: false,
      placeholder: false,
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    selected?: boolean;
    asChild?: boolean;
  };

function Button({
  className,
  selected,
  variant,
  shape,
  appearance,
  mode,
  size,
  autoHeight,
  underlined,
  underline,
  asChild = false,
  placeholder = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      {...(selected ? { "data-state": "open" } : {})}
      className={cn(
        buttonVariants({
          variant,
          size,
          shape,
          appearance,
          mode,
          autoHeight,
          placeholder,
          underlined,
          underline,
        }),
        className,
        asChild && props.disabled && "pointer-events-none opacity-50",
      )}
      {...props}
    />
  );
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon;
}

function ButtonArrow({
  icon: Icon = ChevronDown,
  className,
  ...props
}: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn("ms-auto -me-1", className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
