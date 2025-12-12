// src/components/messages/MessagesList.tsx

interface MessagesListProps {
  messages: any[];
  newestOnTop?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function MessagesList({
  messages,
  newestOnTop,
  scrollRef,
}: MessagesListProps) {
  if (!messages || messages.length === 0) {
    return (
      <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>No messages yet.</p>
    );
  }

  const items = newestOnTop ? [...messages].reverse() : messages;

  return (
    <div ref={scrollRef} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {items.map((m: any) => (
        <div
          key={m.id}
          style={{
            padding: "0.45rem 0.6rem",
            borderRadius: "0.5rem",
            background: "#020617",
            border: "1px solid #1f2937",
            fontSize: "0.8rem",
          }}
        >
          <div
            style={{
              marginBottom: "0.15rem",
              color: "#9ca3af",
            }}
          >
            <strong>From: {m.senderRole === "SELLER" ? "Seller" : "Customer"}</strong>{" "}
            •{" "}
            {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
          </div>
          <div>{m.content}</div>
        </div>
      ))}
    </div>
  );
}