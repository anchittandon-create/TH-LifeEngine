"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  const handleSave = () => {
    // Save settings logic here
    alert("Settings saved!");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your LifeEngine experience</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>

          <Field label="Theme">
            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </Select>
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>

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

          <Field label="Email Notifications">
            <Select
              value={notifications ? "enabled" : "disabled"}
              onChange={(e) => setNotifications(e.target.value === "enabled")}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </Select>
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>

          <Field label="Display Name">
            <Input
              type="text"
              placeholder="Your display name"
              defaultValue="User"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              placeholder="your.email@example.com"
              defaultValue="user@example.com"
            />
          </Field>
        </section>

        <div className={styles.actions}>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}