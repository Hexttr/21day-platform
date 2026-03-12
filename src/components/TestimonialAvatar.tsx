import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarVariant = "male" | "female";

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
} as const;

interface TestimonialAvatarProps {
  variant: AvatarVariant;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function TestimonialAvatar({
  variant,
  size = "md",
  className,
}: TestimonialAvatarProps) {
  const isFemale = variant === "female";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border border-white/45 shadow-[0_16px_32px_rgba(76,29,149,0.16)]",
        isFemale
          ? "bg-[linear-gradient(135deg,rgba(236,72,153,0.22),rgba(168,85,247,0.18),rgba(255,255,255,0.92))]"
          : "bg-[linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.16),rgba(255,255,255,0.92))]",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <circle cx="32" cy="24" r="10" fill="rgba(255,255,255,0.92)" />
        {isFemale ? (
          <>
            <path
              d="M18 22c1-8 7-14 14-14s13 6 14 14c-2-3-5-5-8-5-2 0-4 1-6 2-2-1-4-2-6-2-3 0-6 2-8 5Z"
              fill="rgba(88,28,135,0.55)"
            />
            <path
              d="M14 56c0-11 8-18 18-18s18 7 18 18H14Z"
              fill="rgba(255,255,255,0.9)"
            />
            <path
              d="M20 56c1-8 6-13 12-13s11 5 12 13H20Z"
              fill="rgba(244,114,182,0.45)"
            />
          </>
        ) : (
          <>
            <path
              d="M22 16h20v8c0 2-2 4-4 4H26c-2 0-4-2-4-4v-8Z"
              fill="rgba(30,41,59,0.35)"
            />
            <path
              d="M13 56c0-11 8-18 19-18s19 7 19 18H13Z"
              fill="rgba(255,255,255,0.9)"
            />
            <path
              d="M20 56c1-7 6-11 12-11s11 4 12 11H20Z"
              fill="rgba(96,165,250,0.4)"
            />
          </>
        )}
      </svg>
    </div>
  );
}
