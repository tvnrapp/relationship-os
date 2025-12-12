// frontend/src/features/quotes/QuotesTab.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { BillingCycle, QuoteBanner } from "../../types";
import SectionCard from "../../components/ui/SectionCard";
import QuotesTable from "../../components/tables/QuotesTable";
import {
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../../styles";

interface QuotesTabProps {
  isSeller: boolean;
  dashboardData: any;
  sellerCustomers: any[] | null;
  loading: boolean;

  // quote form
  quoteCustomerId: number | "";
  setQuoteCustomerId: (val: number | "") => void;
  quoteName: string;
  setQuoteName: (val: string) => void;
  quotePrice: string;
  setQuotePrice: (val: string) => void;
  quoteQty: string;
  setQuoteQty: (val: string) => void;
  quoteBillingCycle: BillingCycle;
  setQuoteBillingCycle: (val: BillingCycle) => void;
  quoteNotes: string;
  setQuoteNotes: (val: string) => void;

  selectedQuoteForCustomer: any | null;
  setSelectedQuoteForCustomer: (quote: any | null) => void;

  onCreateQuote: (e: FormEvent<HTMLFormElement>) => void;
  onCustomerQuoteAction: (status: "APPROVED" | "REJECTED") => void;

  // banner / ribbon
  quoteBanner: QuoteBanner | null;
  onClearBanner: () => void;
}

export default function QuotesTab({
  isSeller,
  dashboardData,
  sellerCustomers,
  loading,
  quoteCustomerId,
  setQuoteCustomerId,
  quoteName,
  setQuoteName,
  quotePrice,
  setQuotePrice,
  quoteQty,
  setQuoteQty,
  quoteBillingCycle,
  setQuoteBillingCycle,
  quoteNotes,
  setQuoteNotes,
  selectedQuoteForCustomer,
  setSelectedQuoteForCustomer,
  onCreateQuote,
  onCustomerQuoteAction,
  quoteBanner,
  onClearBanner,
}: QuotesTabProps) {
  if (!dashboardData) return <p>No data.</p>;

  const quotes = dashboardData.recentQuotes || [];

  // ---- banner animation state ----
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    if (!quoteBanner) {
      setIsBannerVisible(false);
      return;
    }

    // show
    setIsBannerVisible(true);

    // start fade-out a bit before clearing
    const fadeTimer = window.setTimeout(() => {
      setIsBannerVisible(false);
    }, 9000); // fade out around 9s

    const clearTimer = window.setTimeout(() => {
      onClearBanner();
    }, 10000); // fully remove at 10s

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [quoteBanner, onClearBanner]);

  // ---- top ribbon / banner ----
  const bannerNode = quoteBanner ? (
    <div
      style={{
        marginBottom: "0.75rem",
        padding: "0.5rem 0.9rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 500,
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
        gap: "0.4rem",
        background:
          quoteBanner.kind === "success"
            ? "rgba(22,163,74,0.22)"
            : "rgba(220,38,38,0.22)",
        border:
          quoteBanner.kind === "success"
            ? "1px solid rgba(34,197,94,0.9)"
            : "1px solid rgba(248,113,113,0.9)",
        color: quoteBanner.kind === "success" ? "#bbf7d0" : "#fecaca",
        boxShadow: "0 20px 45px rgba(0,0,0,0.55)",
        backdropFilter: "blur(14px)",
        letterSpacing: 0.3,
        // animation
        opacity: isBannerVisible ? 1 : 0,
        transform: isBannerVisible ? "translateX(0)" : "translateX(-32px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <span>
        {quoteBanner.kind === "success" ? "✅" : "⚠️"} {quoteBanner.message}
      </span>
    </div>
  ) : null;

  // ---------- SELLER VIEW ----------
  if (isSeller) {
    return (
      <div>
        {bannerNode}

        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
          Quotes
        </h2>

        <SectionCard title="Create New Quote">
          <form
            onSubmit={onCreateQuote}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                Customer
              </label>
              <select
                value={quoteCustomerId}
                onChange={(e) =>
                  setQuoteCustomerId(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                style={inputStyle}
              >
                <option value="">Select customer</option>
                {(sellerCustomers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} (id {c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Line name</label>
              <input
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Unit price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                type="number"
                value={quoteQty}
                onChange={(e) => setQuoteQty(e.target.value)}
                style={inputStyle}
                min={1}
              />
            </div>

            <div>
              <label style={labelStyle}>Billing cycle</label>
              <select
                value={quoteBillingCycle}
                onChange={(e) =>
                  setQuoteBillingCycle(e.target.value as BillingCycle)
                }
                style={inputStyle}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={2}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={primaryButtonStyle}
              >
                {loading ? "Creating..." : "Create Quote"}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Quotes List">
          <QuotesTable quotes={quotes} />
        </SectionCard>
      </div>
    );
  }

  // ---------- CUSTOMER VIEW ----------
  return (
    <div>
      {bannerNode}

      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        My Quotes
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedQuoteForCustomer ? "2fr 1fr" : "1fr",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        <SectionCard title="Quotes">
          <QuotesTable
            quotes={quotes}
            options={{
              showActionsForCustomer: true,
              onSelectQuote: (q) => setSelectedQuoteForCustomer(q),
            }}
          />
        </SectionCard>

        {selectedQuoteForCustomer && (
          <SectionCard
            title={`Quote ${selectedQuoteForCustomer.quoteNumber}`}
          >
            <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              <strong>Status:</strong> {selectedQuoteForCustomer.status}
            </p>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              <strong>Total:</strong>{" "}
              {typeof selectedQuoteForCustomer.totalAmount === "number"
                ? `$${selectedQuoteForCustomer.totalAmount.toFixed(2)}`
                : "-"}
            </p>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              <strong>Created:</strong>{" "}
              {selectedQuoteForCustomer.createdAt
                ? new Date(
                    selectedQuoteForCustomer.createdAt
                  ).toLocaleString()
                : "-"}
            </p>
            {selectedQuoteForCustomer.notes && (
              <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                <strong>Notes:</strong> {selectedQuoteForCustomer.notes}
              </p>
            )}

            {selectedQuoteForCustomer.lines && (
              <div
                style={{
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                <strong>Lines:</strong>
                <ul style={{ marginTop: "0.25rem", paddingLeft: "1rem" }}>
                  {selectedQuoteForCustomer.lines.map((l: any) => (
                    <li key={l.id}>
                      {l.name} ({l.type}) x{l.quantity} @ {l.unitPrice}
                      {l.billingCycle ? ` / ${l.billingCycle}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.75rem",
              }}
            >
              {/* Show Approve/Reject while quote is still actionable */}
              {["SENT", "PENDING"].includes(
                selectedQuoteForCustomer.status
              ) && (
                <>
                  <button
                    onClick={() => onCustomerQuoteAction("APPROVED")}
                    disabled={loading}
                    style={primaryButtonStyle}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onCustomerQuoteAction("REJECTED")}
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle,
                      background: "#b91c1c",
                    }}
                  >
                    Reject
                  </button>
                </>
              )}

              <button
                onClick={() => setSelectedQuoteForCustomer(null)}
                style={{
                  ...secondaryButtonStyle,
                  marginLeft: "auto",
                }}
              >
                Close
              </button>
            </div>

            {/* Message seller helper */}
            <div style={{ marginTop: "0.5rem" }}>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                  marginBottom: "0.25rem",
                }}
              >
                Need to discuss this quote or fix a mistake?
              </p>
              <button
                type="button"
                onClick={() => {
                  alert(
                    "Use the Messages tab or chat widget to message your seller about this quote."
                  );
                }}
                style={{
                  ...secondaryButtonStyle,
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.75rem",
                }}
              >
                Message Seller about this quote
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}