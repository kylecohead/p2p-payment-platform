import React, { useEffect, useState } from "react";

// Lightweight side panel with overlay. Minimal inline styles; styling can be moved to CSS later.
export default function SidePanel({
  title,
  onClose,
  children,
  side = "right",
}) {
  // Minimal slide-in animation on mount and slide-out on close
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Defer to next paint for smoother entry
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    // Trigger slide-out, then unmount after transition ends
    setOpen(false);
  };

  const onTransitionEnd = () => {
    if (!open) onClose?.();
  };

  const isRight = side !== "left"; // default to right

  return (
    <div>
      {/* Overlay */}
      <div className="sp-overlay" onClick={handleClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        onTransitionEnd={onTransitionEnd}
        className={`sp-panel ${isRight ? "right" : "left"} ${
          open ? "open" : ""
        }`}
      >
        <div className="sp-panel-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 className="mb-0">{title}</h3>
            <button
              className="btn-icon"
              onClick={handleClose}
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="sp-panel-body">{children}</div>
      </div>
    </div>
  );
}
