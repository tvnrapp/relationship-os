// frontend/src/App.tsx
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route } from "react-router-dom";
import useAppController from "./hooks/useAppController";

import NavButton from "./components/layout/NavButton";
import LoginForm from "./components/auth/LoginForm";
import ChatWidget from "./components/chat/ChatWidget";

import DashboardTab from "./features/dashboard/DashboardTab";
import QuotesTab from "./features/quotes/QuotesTab";
import SubscriptionsTab from "./features/subscriptions/SubscriptionsTab";
import MessagesTab from "./features/messages/MessagesTab";
import CustomersTab from "./features/customers/CustomersTab";

import { secondaryButtonStyle } from "./styles";

import AcceptInvite from "./pages/AcceptInvite";

function App() {
  const c = useAppController();
  const { logout } = useAuth0();

  // 🔐 full logout: app state + Auth0 SSO session
  const handleFullLogout = () => {
    c.handleLogout();
    logout({
      logoutParams: { returnTo: window.location.origin },
    });
  };

  // ---- NOT LOGGED IN ----
  // Allow invite acceptance route to work BEFORE login
  if (!c.user) {
    return (
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at top, #020617 0, #000000 50%, #020617 100%)",
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              <LoginForm
                role={c.role}
                email={c.email}
                password={c.password}
                error={c.error}
                loading={c.loading}
                onRoleChange={c.handleRoleChange}
                onEmailChange={c.setEmail}
                onPasswordChange={c.setPassword}
                onSubmit={c.handleLogin}
              />
            </div>
          }
        />
      </Routes>
    );
  }

  // ---- LOGGED IN: helper to render the active tab ----
  const renderMainContent = () => {
    switch (c.activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            isSeller={c.isSeller()}
            dashboardData={c.dashboardData}
            onSelectQuoteForCustomer={c.setSelectedQuoteForCustomer}
          />
        );
      case "quotes":
        return (
          <QuotesTab
            isSeller={c.isSeller()}
            dashboardData={c.dashboardData}
            sellerCustomers={c.sellerCustomers}
            loading={c.loading}
            quoteCustomerId={c.quoteCustomerId}
            setQuoteCustomerId={c.setQuoteCustomerId}
            quoteName={c.quoteName}
            setQuoteName={c.setQuoteName}
            quotePrice={c.quotePrice}
            setQuotePrice={c.setQuotePrice}
            quoteQty={c.quoteQty}
            setQuoteQty={c.setQuoteQty}
            quoteBillingCycle={c.quoteBillingCycle}
            setQuoteBillingCycle={c.setQuoteBillingCycle}
            quoteNotes={c.quoteNotes}
            setQuoteNotes={c.setQuoteNotes}
            selectedQuoteForCustomer={c.selectedQuoteForCustomer}
            setSelectedQuoteForCustomer={c.setSelectedQuoteForCustomer}
            onCreateQuote={c.handleCreateQuote}
            onCustomerQuoteAction={c.handleCustomerQuoteAction}
            quoteBanner={c.quoteBanner}
            onClearBanner={c.clearQuoteBanner}
          />
        );
      case "subscriptions":
        return (
          <SubscriptionsTab
            isSeller={c.isSeller()}
            dashboardData={c.dashboardData}
          />
        );
      case "messages":
        return (
          <MessagesTab
            user={c.user!}
            dashboardData={c.dashboardData}
            sellerCustomers={c.sellerCustomers}
            chatMessages={c.chatMessages}
            selectedChatCustomerId={c.selectedChatCustomerId}
            onSelectChatCustomer={c.handleSelectChatCustomer}
            chatPartnerId={c.chatPartnerId}
            messageText={c.messageText}
            setMessageText={c.setMessageText}
            loading={c.loading}
            onSendMessage={c.handleSendMessage}
          />
        );
      case "customers":
        return (
          <CustomersTab
            isSeller={c.isSeller()}
            sellerCustomers={c.sellerCustomers}
          />
        );
      default:
        return null;
    }
  };

  // ---- LOGGED IN LAYOUT ----
  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        height: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 220,
          background: "#020617",
          borderRight: "1px solid #1f2937",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Relationship OS
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              marginTop: "0.1rem",
            }}
          >
            {c.user.role === "SELLER" ? "Seller Portal" : "Customer Portal"}
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
          }}
        >
          <NavButton
            label="Dashboard"
            active={c.activeTab === "dashboard"}
            onClick={() => c.setActiveTab("dashboard")}
          />
          <NavButton
            label="Quotes"
            active={c.activeTab === "quotes"}
            onClick={() => c.setActiveTab("quotes")}
          />
          <NavButton
            label="Subscriptions"
            active={c.activeTab === "subscriptions"}
            onClick={() => c.setActiveTab("subscriptions")}
          />
          <NavButton
            label="Messages"
            active={c.activeTab === "messages"}
            onClick={() => c.setActiveTab("messages")}
          />
          {c.isSeller() && (
            <NavButton
              label="Customers"
              active={c.activeTab === "customers"}
              onClick={() => c.setActiveTab("customers")}
            />
          )}
        </nav>

        <div style={{ marginTop: "auto", fontSize: "0.8rem" }}>
          <div style={{ marginBottom: "0.4rem" }}>
            <div style={{ fontWeight: 600 }}>{c.user.name}</div>
            <div style={{ color: "#9ca3af" }}>{c.user.email}</div>
          </div>
          <button
            onClick={handleFullLogout}
            style={{
              width: "100%",
              padding: "0.4rem 0.6rem",
              fontSize: "0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          overflow: "auto",
          background: "radial-gradient(circle at top, #1f2937 0, #020617 55%)",
          position: "relative",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.15rem" }}>
              {c.activeTab.charAt(0).toUpperCase() + c.activeTab.slice(1)}
            </h1>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              {c.user.role === "SELLER"
                ? "Manage your customers, quotes, and subscriptions."
                : "View your subscriptions, quotes, and messages."}
            </div>
          </div>

          <button
            onClick={c.reloadData}
            disabled={c.loading}
            style={secondaryButtonStyle}
          >
            {c.loading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>

        {c.error && (
          <div
            style={{
              color: "#fecaca",
              background: "#7f1d1d",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
            }}
          >
            {c.error}
          </div>
        )}

        <div>{renderMainContent()}</div>

        {c.dashboardData && (
          <details
            style={{
              marginTop: "1.5rem",
              fontSize: "0.8rem",
              color: "#9ca3af",
            }}
          >
            <summary>Raw dashboard JSON (dev only)</summary>
            <pre
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "#020617",
                borderRadius: "0.5rem",
                maxHeight: "250px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(c.dashboardData, null, 2)}
            </pre>
          </details>
        )}

        <ChatWidget
          user={c.user}
          isChatOpen={c.isChatOpen}
          chatUnread={c.chatUnread}
          sellerCustomers={c.sellerCustomers}
          selectedChatCustomerId={c.selectedChatCustomerId}
          onSelectChatCustomer={c.handleSelectChatCustomer}
          chatMessages={c.chatMessages}
          dashboardMessages={c.dashboardData?.recentMessages || []}
          chatListRef={c.chatListRef}
          messageText={c.messageText}
          setMessageText={c.setMessageText}
          loading={c.loading}
          onSendMessage={c.handleSendMessage}
          onToggleChatOpen={c.toggleChatOpen}
        />
      </main>
    </div>
  );
}

export default App;