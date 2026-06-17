import { cn } from '@/lib/utils';
import type { LucideIcon } from "lucide-react";

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export default function Empty({
  icon: Icon,
  title = "暂无数据",
  description,
  className,
}: EmptyProps) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center py-12", className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-coffee-50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-coffee-300" />
        </div>
      )}
      <p className="text-coffee-600 font-medium mb-1">{title}</p>
      {description && (
        <p className="text-coffee-400 text-sm">{description}</p>
      )}
    </div>
  )
}

