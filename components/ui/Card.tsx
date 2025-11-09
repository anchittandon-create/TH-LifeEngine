import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "glass";
  hover?: boolean;
}

export function Card({ children, className = "", variant = "default", hover = false }: CardProps) {
  const baseStyles = "rounded-2xl shadow-lg border transition-all duration-300";
  
  const variantStyles = {
    default: "bg-white border-gray-200",
    gradient: "bg-gradient-to-br from-white to-gray-50 border-gray-200",
    glass: "bg-white/80 backdrop-blur-xl border-white/30 shadow-2xl",
  };
  
  const hoverStyles = hover ? "hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300" : "";
  
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}

export function CardHeader({ icon, title, subtitle, badge }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">{icon}</span>
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {badge && <div>{badge}</div>}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pt-4 mt-4 border-t border-gray-200 flex items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}
