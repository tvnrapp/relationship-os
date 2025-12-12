// src/features/customers/CustomersTab.tsx
import { thStyle, tdStyle } from "../../styles";

interface CustomersTabProps {
  isSeller: boolean;
  sellerCustomers: any[] | null;
}

export default function CustomersTab({
  isSeller,
  sellerCustomers,
}: CustomersTabProps) {
  if (!isSeller) {
    return <p>This section is only for sellers.</p>;
  }

  if (!sellerCustomers || sellerCustomers.length === 0) {
    return <p>No customers found yet.</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        My Customers
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Company</th>
              <th style={thStyle}>Created</th>
            </tr>
          </thead>
          <tbody>
            {sellerCustomers.map((c) => (
              <tr key={c.id}>
                <td style={tdStyle}>{c.id}</td>
                <td style={tdStyle}>{c.name || "-"}</td>
                <td style={tdStyle}>{c.email}</td>
                <td style={tdStyle}>{c.companyName || "-"}</td>
                <td style={tdStyle}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}