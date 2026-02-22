import * as React from "react";
import styles from "./input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconRight, ...props }, ref) => {
    const inputClassName = [
      styles.input,
      icon ? styles.withIconLeft : "",
      iconRight ? styles.withIconRight : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (icon || iconRight) {
      return (
        <div className={styles.wrapper}>
          {icon && <span className={styles.iconLeft}>{icon}</span>}
          <input type={type} ref={ref} className={inputClassName} {...props} />
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </div>
      );
    }
    return (
      <input type={type} ref={ref} className={inputClassName} {...props} />
    );
  },
);
Input.displayName = "Input";

export { Input };
