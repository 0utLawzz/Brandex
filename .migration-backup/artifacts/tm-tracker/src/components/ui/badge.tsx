import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "filed"
    | "examination"
    | "accepted"
    | "advertised"
    | "opposed"
    | "registered"
    | "abandoned"
    | "default";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-[#E8DFC7] text-[#0C0C0C]",
    filed: "bg-[#F0E8D0] border-[#D4A800] text-[#D4A800]",
    examination: "bg-[#F0E8D0] border-[#C94A00] text-[#C94A00]",
    accepted: "bg-[#F0E8D0] border-[#0D9970] text-[#0A6B52]",
    advertised: "bg-[#0D9970] border-[#0A6B52] text-white",
    opposed: "bg-[#F0E8D0] border-red-600 text-red-600",
    registered: "bg-[#0A6B52] border-[#0A6B52] text-white",
    abandoned: "bg-[#E8DFC7] border-gray-500 text-gray-600",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border-2 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
