// src/components/ui/SectionCard.tsx

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section
      style={{
        padding: "0.9rem 1rem",
        borderRadius: "0.9rem",
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(55,65,81,0.9)",
      }}
    >
      <h3
        style={{
          fontSize: "0.95rem",
          marginBottom: "0.6rem",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}