import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
}

const variantClass = {
  primary:
    "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg hover:opacity-90",
  ghost: "text-slate-400 hover:bg-slate-800 hover:text-white",
  outline:
    "border border-slate-600 text-slate-200 hover:border-violet-500 hover:text-violet-400",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`rounded-xl px-5 py-2.5 font-semibold transition disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export default Button;
