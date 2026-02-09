import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleIdRef = useRef<string>('modal-title-' + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', onKey);
      // focus the close button or the dialog
      requestAnimationFrame(() => {
        if (closeBtnRef.current) closeBtnRef.current.focus();
        else dialogRef.current?.focus();
      });
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      // restore focus when modal closes
      if (previouslyFocused.current) previouslyFocused.current.focus();
    };
  }, []);

  if (!isOpen) return null;

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const content = (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="presentation"
      onMouseDown={onOverlayMouseDown}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleIdRef.current : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div id={titleIdRef.current} className={styles.title}>
            {title}
          </div>
          <button
            ref={closeBtnRef}
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return content;
  return ReactDOM.createPortal(content, document.body);
}
