import { forwardRef } from "react";

const Card = forwardRef(({
  children,
  className = "",
  padding = "md",
  hover = false,
  bordered = true,
  ...props
}, ref) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      ref={ref}
      className={`rounded-2xl bg-white ${bordered ? "border border-[#14232B]/5" : ""} ${paddingStyles[padding]} ${hover ? "hover:shadow-md transition-shadow cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

const CardHeader = forwardRef(({
  children,
  className = "",
  ...props
}, ref) => (
  <div ref={ref} className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef(({
  children,
  subtitle,
  className = "",
  ...props
}, ref) => (
  <div ref={ref} className={className} {...props}>
    <h3 className="font-[Baloo_2] text-xl font-bold text-[#14232B]">{children}</h3>
    {subtitle && <p className="mt-0.5 text-sm text-[#14232B]/60">{subtitle}</p>}
  </div>
));

CardTitle.displayName = "CardTitle";

const CardContent = forwardRef(({
  children,
  className = "",
  ...props
}, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
));

CardContent.displayName = "CardContent";

const CardFooter = forwardRef(({
  children,
  className = "",
  ...props
}, ref) => (
  <div ref={ref} className={`mt-4 pt-4 border-t border-[#14232B]/5 flex items-center gap-3 ${className}`} {...props}>
    {children}
  </div>
));

CardFooter.displayName = "CardFooter";

export { CardHeader, CardTitle, CardContent, CardFooter };
export default Card;