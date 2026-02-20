"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Props = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema"
      className={
        "h-9 w-9 rounded-full border border-black/10 dark:border-white/10 " +
        "bg-white/70 dark:bg-white/5 backdrop-blur-md " +
        "hover:bg-white dark:hover:bg-white/10 " +
        "active:scale-[0.98] transition flex items-center justify-center " +
        className
      }
    >
      {isDark ? (
        <Sun size={16} className="text-white/80" />
      ) : (
        <Moon size={16} className="text-black/70" />
      )}
    </button>
  );
}