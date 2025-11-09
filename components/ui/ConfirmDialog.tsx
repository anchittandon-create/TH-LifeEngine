"use client";

import React from "react";
import styles from "./ConfirmDialog.module.css";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  details?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  details,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={`${styles.dialog} animate-fade-in`}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>
            {variant === "danger" ? "⚠️" : "ℹ️"}
          </div>
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
          {details && <div className={styles.details}>{details}</div>}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className={styles.confirmBtn}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
