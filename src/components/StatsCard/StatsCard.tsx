import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: "coffee" | "matcha" | "amber" | "danger";
  className?: string;
}

const colorClasses = {
  coffee: "from-coffee-50 to-coffee-100 text-coffee-700",
  matcha: "from-matcha-50 to-matcha-100 text-matcha-600",
  amber: "from-amber-50 to-amber-100 text-amber-600",
  danger: "from-danger-50 to-danger-100 text-danger-500",
};

const iconBgColors = {
  coffee: "bg-coffee-100 text-coffee-600",
  matcha: "bg-matcha-100 text-matcha-600",
  amber: "bg-amber-100 text-amber-600",
  danger: "bg-danger-100 text-danger-500",
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "coffee",
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-white rounded-2xl shadow-soft p-5 hover:shadow-medium transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-coffee-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-coffee-800">{value}</p>
        </div>
        {icon && (
          <div
            className={cn(
              "p-3 rounded-xl",
              iconBgColors[color as keyof typeof iconBgColors]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {subtitle && <p className="text-sm text-coffee-500">{subtitle}</p>}

      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={cn(
              "text-sm font-medium",
              trend.isUp ? "text-matcha-500" : "text-danger-500"
            )}
          >
            {trend.isUp ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-coffee-400">较上月</span>
        </div>
      )}
    </motion.div>
  );
}
