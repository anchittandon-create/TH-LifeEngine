"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [autoSave, setAutoSave] = useState(true);
  const [language, setLanguage] = useState("en");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedAutoSave = localStorage.getItem("autoSave") !== "false";
    const savedLanguage = localStorage.getItem("language") || "en";
    const savedDisplayName = localStorage.getItem("displayName") || "";
    const savedEmail = localStorage.getItem("email") || "";

    setTheme(savedTheme);
    setAutoSave(savedAutoSave);
    setLanguage(savedLanguage);
    setDisplayName(savedDisplayName);
    setEmail(savedEmail);

    // Apply theme
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleSave = () => {
    // Save all settings to localStorage
    localStorage.setItem("theme", theme);
    localStorage.setItem("autoSave", autoSave.toString());
    localStorage.setItem("language", language);
    localStorage.setItem("displayName", displayName);
    localStorage.setItem("email", email);

    alert("Settings saved successfully!");
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      localStorage.clear();
      // Clear in-memory stores (this would need to be enhanced for a real app)
      window.location.reload();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your TH_LifeEngine experience</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>

          <Field label="Theme">
            <Select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System (follows OS)</option>
            </Select>
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>

          <Field label="Auto-Save Generated Plans">
            <Select
              value={autoSave ? "enabled" : "disabled"}
              onChange={(e) => setAutoSave(e.target.value === "enabled")}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </Select>
          </Field>

          <Field label="Language">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </Select>
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>

          <Field label="Display Name">
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Management</h2>

          <div className={styles.dangerZone}>
            <p className={styles.warning}>
              <strong>Warning:</strong> This action will permanently delete all your profiles, plans, and chat history.
            </p>
            <Button variant="danger" onClick={handleResetData}>
              Reset All Data
            </Button>
          </div>
        </section>

        <div className={styles.actions}>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}