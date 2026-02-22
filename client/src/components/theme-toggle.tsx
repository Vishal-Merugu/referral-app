"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="outline" size="sm" className={styles.toggleBtn} />;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={styles.toggleBtn}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className={styles.sunIcon} />
      <Moon className={styles.moonIcon} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
