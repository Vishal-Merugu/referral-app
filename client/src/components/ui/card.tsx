import * as React from "react";
import styles from "./card.module.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "ghost";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const combinedClassName = [styles.card, styles[variant], className]
      .filter(Boolean)
      .join(" ");

    return <div ref={ref} className={combinedClassName} {...props} />;
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const combinedClassName = [styles.header, className]
    .filter(Boolean)
    .join(" ");
  return <div ref={ref} className={combinedClassName} {...props} />;
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const combinedClassName = [styles.title, className].filter(Boolean).join(" ");
  return <h3 ref={ref} className={combinedClassName} {...props} />;
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const combinedClassName = [styles.description, className]
    .filter(Boolean)
    .join(" ");
  return <p ref={ref} className={combinedClassName} {...props} />;
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const combinedClassName = [styles.content, className]
    .filter(Boolean)
    .join(" ");
  return <div ref={ref} className={combinedClassName} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const combinedClassName = [styles.footer, className]
    .filter(Boolean)
    .join(" ");
  return <div ref={ref} className={combinedClassName} {...props} />;
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
