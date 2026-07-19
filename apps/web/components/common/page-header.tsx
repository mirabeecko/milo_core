import type { ReactNode, ElementType } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: ElementType;
}

export function PageHeader({ title, description, children, actions, icon: Icon }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 opacity-70" />}
          {title}
        </h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {(children || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {actions}
        </div>
      )}
    </div>
  );
}
