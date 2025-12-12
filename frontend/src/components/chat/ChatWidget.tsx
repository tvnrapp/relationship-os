// src/components/chat/ChatWidget.tsx
import type { FormEvent } from "react";
import type { User } from "../../types";
import MessagesList from "../messages/MessagesList";
import { inputStyle, primaryButtonStyle } from "../../styles";

interface ChatWidgetProps {
  user: User;
  isChatOpen: boolean;
  chatUnread: number;
  sellerCustomers: any[] | null;
  selectedChatCustomerId: number | "";
  onSelectChatCustomer: (val: number | "") => void;
  chatMessages: any[] | null;
  dashboardMessages: any[];
  chatListRef: React.RefObject<HTMLDivElement | null>;
  messageText: string;
  setMessageText: (val: string) => void;
  loading: boolean;
  onSendMessage: (e: FormEvent<HTMLFormElement>) => void;
  onToggleChatOpen: () => void;
}

export default function ChatWidget({
  user,
  isChatOpen,
  chatUnread,
  sellerCustomers,
  selectedChatCustomerId,
  onSelectChatCustomer,
  chatMessages,
  dashboardMessages,
  chatListRef,
  messageText,
  setMessageText,
  loading,
  onSendMessage,
  onToggleChatOpen,
}: ChatWidgetProps) {
  const messagesToShow =
    chatMessages && chatMessages.length > 0
      ? chatMessages
      : dashboardMessages || [];

  return (
    <div
      style={{
        position: "fixed",
        right: "1.25rem",
        bottom: "1.25rem",
        zIndex: 50,
      }}
    >
      {!isChatOpen && (
        <button
          onClick={onToggleChatOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.45rem 0.8rem",
            borderRadius: "999px",
            border: "none",
            background: "#1f2937",
            color: "#e5e7eb",
            fontSize: "0.8rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
          title="Open chat"
        >
          💬 Chat
          {chatUnread > 0 && (
            <span
              style={{
                background: "#ef4444",
                color: "white",
                borderRadius: "999px",
                padding: "0.05rem 0.45rem",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              {chatUnread}
            </span>
          )}
        </button>
      )}

      {isChatOpen && (
        <div
          style={{
            width: 320,
            maxHeight: 420,
            background: "#020617",
            borderRadius: "1rem",
            border: "1px solid #4b5563",
            boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.6rem 0.75rem",
              borderBottom: "1px solid #1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {user.role === "SELLER" ? "Customer Chat" : "Chat with Seller"}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#9ca3af",
                }}
              >
                Online • Relationship OS
              </div>
            </div>
            <button
              onClick={onToggleChatOpen}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "none",
                background: "#0f172a",
                color: "#e5e7eb",
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0f172a";
              }}
              title="Minimize"
            >
              —
            </button>
          </div>

          {/* Selector */}
          <div
            style={{
              padding: "0.5rem 0.7rem",
              borderBottom: "1px solid #111827",
              fontSize: "0.8rem",
              color: "#9ca3af",
            }}
          >
            {user.role === "SELLER" ? (
              <div>
                <div style={{ marginBottom: "0.35rem" }}>
                  Select a customer and start chatting.
                </div>
                <select
                  value={selectedChatCustomerId}
                  onChange={(e) =>
                    onSelectChatCustomer(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  style={{
                    ...inputStyle,
                    background: "#020617",
                    fontSize: "0.8rem",
                    marginTop: 0,
                  }}
                >
                  <option value="">Select customer</option>
                  {(sellerCustomers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} (id {c.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                You’re messaging your seller about your quotes and subscriptions.
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "0.5rem 0.6rem",
              overflowY: "auto",
            }}
          >
            <MessagesList
              messages={messagesToShow}
              newestOnTop={false}
              scrollRef={chatListRef}
            />
          </div>

          {/* Input */}
          <form
            onSubmit={onSendMessage}
            style={{
              padding: "0.5rem 0.6rem",
              borderTop: "1px solid #111827",
              display: "flex",
              gap: "0.4rem",
              background: "#020617",
            }}
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              style={{ ...inputStyle, flex: 1, marginTop: 0 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryButtonStyle,
                marginTop: 0,
                padding: "0.45rem 0.8rem",
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}