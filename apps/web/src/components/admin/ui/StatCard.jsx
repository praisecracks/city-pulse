import { forwardRef } from "react";
import Icon from "../../shared/Icon";

const StatCard = forwardRef(({
  label,
  value,
  change,
  changeLabel,
  icon,
  iconColor = "text-[#129E9E]",
  iconBg = "bg-[#E4F3F1]",
  trend = "neutral",
  className = "",
  ...props
}, ref) => {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-[#14232B]/60",
  };

  const trendIcons = {
    up: <Icon name="trending_up" size={14} className="text-green-600" />,
    down: <Icon name="trending_down" size={14} className="text-red-600" />,
    neutral: <Icon name="remove" size={14} className="text-[#14232B]/60" />,
  };

  return (
    <div
      ref={ref}
      className={`rounded-2xl p-6 bg-white border border-[#14232B]/5 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#14232B]/60 truncate">{label}</p>
          <p className="mt-1.5 font-[Baloo_2] text-3xl font-extrabold text-[#14232B] truncate">
            {value ?? "—"}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`text-sm font-medium ${trendColors[trend]}`}>
                {trendIcons[trend]}
                {change >= 0 ? `+${change}%` : `${change}%`}
              </span>
              {changeLabel && <span className="text-sm text-[#14232B]/50">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-sm flex-shrink-0 ml-4`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";
export default StatCard;