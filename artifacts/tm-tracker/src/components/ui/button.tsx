import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    "primary" | "secondary" | "accent" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#C94A00] text-[#F0E8D0]",
      secondary: "bg-[#0A6B52] text-white",
      accent: "bg-[#D4A800] text-[#0C0C0C]",
      destructive: "bg-red-600 text-white",
      outline: "bg-[#E8DFC7] text-[#0C0C0C]",
      ghost:
        "bg-transparent text-[#0C0C0C] nb-shadow-none border-transparent hover:bg-[#E8DFC7]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-4 text-lg font-bold uppercase tracking-wider",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[6px] font-mono font-bold uppercase tracking-widest nb-border nb-shadow nb-button disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
