import { forwardRef } from "react";

const Badge = forwardRef(({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  ...props
}, ref) => {
  const variants = {
    default: "bg-[#14232B]/10 text-[#14232B]/70",
    primary: "bg-[#E4F3F1] text-[#129E9E]",
    success: "bg-[#E4F3F1] text-[#129E9E]",
    warning: "bg-[#F0EADB] text-[#14232B]",
    danger: "bg-[#F5E3E0] text-[#B5453B]",
    info: "bg-[#E4F3F1] text-[#0E7F7F]",
    neutral: "bg-[#F6F1E6] text-[#14232B]/70",
  };

  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px] gap-0.5",
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1",
    lg: "px-3 py-1 text-sm gap-1.5",
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center font-semibold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {children}
    </span>
  );
});

Badge.displayName = "Badge";
export default Badge;