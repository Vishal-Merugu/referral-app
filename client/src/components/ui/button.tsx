import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import styles from "./button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "gradient"
    | "ghost"
    | "outline"
    | "glass"
    | "soft"
    | "destructive"
    | "link"
    | "dark";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon-sm" | "icon" | "icon-lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "gradient", size = "md", asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const variantClass =
      variant === "dark" ? styles.darkVariant : styles[variant];

    // Map kebab-case sizes to camelCase CSS module keys
    let sizeClass = styles[size];
    if (size === "icon-sm") sizeClass = styles.iconSm;
    if (size === "icon") sizeClass = styles.iconMd;
    if (size === "icon-lg") sizeClass = styles.iconLg;

    const combinedClassName = [styles.base, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(" ");

    return <Comp className={combinedClassName} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button };
