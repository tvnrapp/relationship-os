// src/components/tables/SubscriptionsTable.tsx
import { thStyle, tdStyle } from "../../styles";

interface SubscriptionsTableProps {
  subs: any[];
}

export default function SubscriptionsTable({ subs }: SubscriptionsTableProps) {
  if (!subs || subs.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        No subscriptions yet.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Start</th>
            <th style={thStyle}>End</th>
            <th style={thStyle}>Auto Renew</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s: any) => (
            <tr key={s.id}>
              <td style={tdStyle}>{s.name}</td>
              <td style={tdStyle}>{s.status}</td>
              <td style={tdStyle}>
                {s.startDate
                  ? new Date(s.startDate).toLocaleDateString()
                  : "-"}
              </td>
              <td style={tdStyle}>
                {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
              </td>
              <td style={tdStyle}>{s.autoRenew ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}