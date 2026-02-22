import * as React from "react";
import styles from "./badge.module.css";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "purple"
    | "soft";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const combinedClassName = [styles.base, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return <div className={combinedClassName} {...props} />;
}

export { Badge };
