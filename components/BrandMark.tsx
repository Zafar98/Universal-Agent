type BrandMarkProps = {
  size?: number;
  showWordmark?: boolean;
};

export function BrandMark({ size = 32, showWordmark = true }: BrandMarkProps) {
  const glyphSize = Math.max(22, size);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <div
        aria-hidden="true"
        style={{
          width: `${glyphSize}px`,
          height: `${glyphSize}px`,
          borderRadius: "10px",
          border: "1px solid rgba(52, 211, 153, 0.65)",
          background:
            "radial-gradient(circle at 20% 16%, rgba(56,189,248,0.45), transparent 58%), linear-gradient(140deg, #020617 0%, #031425 100%)",
          boxShadow:
            "0 0 0 1px rgba(34,211,238,0.24) inset, 0 0 24px rgba(6,182,212,0.35), 0 0 44px rgba(16,185,129,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a7f3d0",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          fontSize: `${Math.round(glyphSize * 0.52)}px`,
          lineHeight: 1,
          fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        }}
      >
        A
      </div>
      {showWordmark ? (
        <span
          style={{
            color: "#ecfeff",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            fontSize: "16px",
            textShadow: "0 0 18px rgba(34,211,238,0.22)",
            fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
          }}
        >
          Asistoria
        </span>
      ) : null}
    </div>
  );
}