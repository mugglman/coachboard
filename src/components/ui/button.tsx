import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:brightness-105 shadow-sm",
        secondary: "bg-card text-fg border border-border hover:bg-hover",
        ghost: "text-fg hover:bg-hover",
        danger: "bg-danger text-white hover:brightness-110",
        subtle: "bg-hover text-fg hover:brightness-95",
      },
      size: {
        sm: "h-8 px-2.5",
        md: "h-9 px-3.5",
        lg: "h-11 px-5 text-sm",
        icon: "h-8 w-8",
        iconSm: "h-7 w-7 [&_svg]:size-3.5",
      },
      active: { true: "bg-accent-soft text-accent hover:bg-accent-soft", false: "" },
    },
    defaultVariants: { variant: "secondary", size: "md", active: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, active, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, active }), className)} {...props} />
  ),
);
Button.displayName = "Button";
