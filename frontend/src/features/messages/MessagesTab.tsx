// src/features/messages/MessagesTab.tsx
import MessagesList from "../../components/messages/MessagesList";
import { inputStyle, labelStyle, primaryButtonStyle } from "../../styles";
import type { User } from "../../types";
import type { FormEvent } from "react";

interface MessagesTabProps {
  user: User;
  dashboardData: any;
  sellerCustomers: any[] | null;
  chatMessages: any[] | null;
  selectedChatCustomerId: number | "";
  onSelectChatCustomer: (val: number | "") => void;
  chatPartnerId: number | null;
  messageText: string;
  setMessageText: (val: string) => void;
  loading: boolean;
  onSendMessage: (e: FormEvent<HTMLFormElement>) => void;
}

export default function MessagesTab({
  user,
  dashboardData,
  sellerCustomers,
  chatMessages,
  selectedChatCustomerId,
  onSelectChatCustomer,
  chatPartnerId,
  messageText,
  setMessageText,
  loading,
  onSendMessage,
}: MessagesTabProps) {
  if (!dashboardData) return <p>No data.</p>;

  const sellerIdForCustomer =
    user.role === "CUSTOMER"
      ? dashboardData?.recentMessages?.[0]?.sellerId ||
        dashboardData?.recentQuotes?.[0]?.sellerId ||
        chatPartnerId ||
        null
      : null;

  const msgs =
    chatMessages && chatMessages.length > 0
      ? chatMessages
      : dashboardData.recentMessages || [];

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Messages
      </h2>

      <section
        style={{
          padding: "0.85rem",
          borderRadius: "0.75rem",
          background: "rgba(15,23,42,0.85)",
          border: "1px solid rgba(55,65,81,0.8)",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
          Conversation
        </h3>

        {user.role === "SELLER" ? (
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>
              Chat with customer
              <select
                value={selectedChatCustomerId}
                onChange={(e) =>
                  onSelectChatCustomer(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                style={{ ...inputStyle, marginTop: "0.3rem" }}
              >
                <option value="">Select customer</option>
                {(sellerCustomers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} (id {c.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              marginBottom: "0.5rem",
            }}
          >
            You are messaging your seller
            {sellerIdForCustomer ? ` (id ${sellerIdForCustomer})` : ""}.
          </p>
        )}

        <MessagesList messages={msgs} />

        <form
          onSubmit={onSendMessage}
          style={{
            marginTop: "0.75rem",
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}