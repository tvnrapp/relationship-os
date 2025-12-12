// src/features/subscriptions/SubscriptionsTab.tsx
import SubscriptionsTable from "../../components/tables/SubscriptionsTable";

interface SubscriptionsTabProps {
  isSeller: boolean;
  dashboardData: any;
}

export default function SubscriptionsTab({
  isSeller,
  dashboardData,
}: SubscriptionsTabProps) {
  if (!dashboardData) return <p>No data.</p>;

  const subs = isSeller
    ? dashboardData.recentSubscriptions || []
    : dashboardData.subscriptions || [];

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Subscriptions
      </h2>
      <SubscriptionsTable subs={subs} />
    </div>
  );
}