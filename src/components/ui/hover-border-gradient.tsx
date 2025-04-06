"use client";

import { ElementType, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface HoverBorderGradientProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function HoverBorderGradient({
  as: Component = "div",
  children,
  className,
  containerClassName,
}: HoverBorderGradientProps) {
  return (
    <div
      className={cn(
        "relative p-[2px] transition-transform duration-300 hover:scale-105",
        "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500",
        "rounded-lg",
        containerClassName
      )}
    >
      <Component
        className={cn(
          "relative bg-white dark:bg-black rounded-lg p-4",
          className
        )}
      >
        {children}
      </Component>
    </div>
  );
}
