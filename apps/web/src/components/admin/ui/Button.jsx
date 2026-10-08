import { forwardRef } from "react";

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#129E9E] text-white hover:bg-[#0E7F7F] focus-visible:ring-[#129E9E] shadow-sm",
    secondary: "bg-white text-[#14232B] border border-[#14232B]/15 hover:bg-[#F0EADB] focus-visible:ring-[#14232B]",
    outline: "bg-transparent text-[#129E9E] border border-[#129E9E] hover:bg-[#E4F3F1] focus-visible:ring-[#129E9E]",
    ghost: "bg-transparent text-[#14232B]/70 hover:bg-[#14232B]/5 hover:text-[#14232B] focus-visible:ring-[#14232B]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    success: "bg-[#129E9E] text-white hover:bg-[#0E7F7F] focus-visible:ring-[#129E9E]",
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    xl: "px-8 py-4 text-lg gap-2.5",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;