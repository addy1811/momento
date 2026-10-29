import { useEffect } from "react";

export default function ConfirmDialog({ title, text, confirmLabel = "Delete", busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
    };
    window.addEventListener("keydown", onKey, true); // capture: runs before the viewer's own Esc handler
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return (
    <div className="cfm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="cfm" role="alertdialog" aria-modal="true" aria-labelledby="cfm-title">
        <h3 id="cfm-title">{title}</h3>
        <p>{text}</p>
        <div className="cfm-actions">
          <button className="cfm-cancel" onClick={onCancel} autoFocus>Keep it</button>
          <button className="cfm-ok" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
