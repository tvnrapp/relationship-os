// src/features/dashboard/DashboardTab.tsx
import InfoCard from "../../components/ui/InfoCard";
import SectionCard from "../../components/ui/SectionCard";
import QuotesTable from "../../components/tables/QuotesTable";
import SubscriptionsTable from "../../components/tables/SubscriptionsTable";
import MessagesList from "../../components/messages/MessagesList";

interface DashboardTabProps {
  isSeller: boolean;
  dashboardData: any;
  onSelectQuoteForCustomer: (quote: any) => void;
}

export default function DashboardTab({
  isSeller,
  dashboardData,
  onSelectQuoteForCustomer,
}: DashboardTabProps) {
  if (!dashboardData) return <p>No dashboard data yet.</p>;

  const summary = dashboardData.summary || {};

  if (isSeller) {
    return (
      <div>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
          Seller Dashboard
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <InfoCard label="Total Quotes" value={summary.totalQuotes} />
          <InfoCard
            label="Active Subs"
            value={summary.totalActiveSubscriptions}
          />
          <InfoCard
            label="Est. MRR"
            value={
              typeof summary.estimatedMRR === "number"
                ? `$${summary.estimatedMRR.toFixed(2)}`
                : "-"
            }
          />
        </div>

        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <SectionCard title="Recent Quotes">
            <QuotesTable quotes={dashboardData.recentQuotes || []} />
          </SectionCard>

          <SectionCard title="Recent Subscriptions">
            <SubscriptionsTable subs={dashboardData.recentSubscriptions || []} />
          </SectionCard>

          <SectionCard title="Recent Messages">
            <MessagesList
              messages={dashboardData.recentMessages || []}
              newestOnTop
            />
          </SectionCard>
        </div>
      </div>
    );
  }

  // Customer view
  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Customer Dashboard
      </h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <InfoCard label="Total Quotes" value={summary.totalQuotes} />
        <InfoCard label="Total Subs" value={summary.totalSubscriptions} />
        <InfoCard label="Active Subs" value={summary.activeSubscriptions} />
        <InfoCard
          label="Est. Monthly Spend"
          value={
            typeof summary.estimatedMonthlySpend === "number"
              ? `$${summary.estimatedMonthlySpend.toFixed(2)}`
              : "-"
          }
        />
      </div>

      <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        <SectionCard title="My Subscriptions">
          <SubscriptionsTable subs={dashboardData.subscriptions || []} />
        </SectionCard>

        <SectionCard title="Recent Quotes">
          <QuotesTable
            quotes={dashboardData.recentQuotes || []}
            options={{
              showActionsForCustomer: true,
              onSelectQuote: onSelectQuoteForCustomer,
            }}
          />
        </SectionCard>

        <SectionCard title="Recent Messages">
          <MessagesList
            messages={dashboardData.recentMessages || []}
            newestOnTop
          />
        </SectionCard>
      </div>
    </div>
  );
}