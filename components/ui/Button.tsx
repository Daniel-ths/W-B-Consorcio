import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'cta'; // Adicionei 'cta' (Call to Action)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-6 py-2 active:scale-95"
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
      cta: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-900/30 border border-blue-400/20",
      outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white hover:border-slate-500",
      ghost: "hover:bg-slate-800/50 text-slate-300 hover:text-white"
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }