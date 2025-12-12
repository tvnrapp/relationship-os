// src/components/layout/NavButton.tsx

interface NavButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function NavButton({ label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "0.4rem 0.6rem",
        borderRadius: "0.5rem",
        border: "none",
        background: active ? "#1d4ed8" : "transparent",
        color: active ? "#f9fafb" : "#9ca3af",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
