// src/components/ui/InfoCard.tsx

interface InfoCardProps {
  label: string;
  value: any;
}

export default function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div
      style={{
        minWidth: 140,
        padding: "0.75rem",
        borderRadius: "0.75rem",
        background: "rgba(15,23,42,0.8)",
        border: "1px solid rgba(148,163,184,0.35)",
      }}
    >
      <div
        style={{
          fontSize: "0.8rem",
          color: "#9ca3af",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
        {value === undefined || value === null ? "-" : String(value)}
      </div>
    </div>
  );
}