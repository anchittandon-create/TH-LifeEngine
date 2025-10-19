import type { ButtonHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";
import styles from "./Form.module.css";

export function Form(props: FormHTMLAttributes<HTMLFormElement>) {
  const { className, ...rest } = props;
  return (
    <form className={`${styles.form} ${className ?? ""}`} {...rest}>
      {props.children}
    </form>
  );
}

export function Field({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.field} ${className ?? ""}`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <label className={styles.label}>{children}</label>;
}

export function HelpText({ children }: { children: ReactNode }) {
  return <span className={styles.help}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={`${styles.input} ${className ?? ""}`} {...rest} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className, ...rest } = props;
  return (
    <textarea className={`${styles.textarea} ${className ?? ""}`} {...rest} />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={`${styles.select} ${className ?? ""}`} {...rest} />;
}

export function Chips({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <div className={styles.chips}>
      {items.map((chip) => (
        <span key={chip} className={styles.chip}>
          {chip}
        </span>
      ))}
    </div>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  const classes =
    variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary;
  return (
    <button
      type="button"
      className={`${classes} ${className ?? ""}`}
      {...rest}
    />
  );
}
