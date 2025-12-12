// src/components/tables/QuotesTable.tsx
import type { QuotesTableOptions } from "../../types";
import { thStyle, tdStyle, secondaryButtonStyle } from "../../styles";

interface QuotesTableProps {
  quotes: any[];
  options?: QuotesTableOptions;
}

export default function QuotesTable({ quotes, options }: QuotesTableProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>No quotes yet.</p>
    );
  }

  const showActions =
    options?.showActionsForCustomer && !!options.onSelectQuote;

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
            <th style={thStyle}>Quote #</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Currency</th>
            <th style={thStyle}>Created</th>
            {showActions && <th style={thStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {quotes.map((q: any) => (
            <tr key={q.id}>
              <td style={tdStyle}>{q.quoteNumber}</td>
              <td style={tdStyle}>{q.status}</td>
              <td style={tdStyle}>
                {typeof q.totalAmount === "number"
                  ? q.totalAmount.toFixed(2)
                  : "-"}
              </td>
              <td style={tdStyle}>{q.currency || "USD"}</td>
              <td style={tdStyle}>
                {q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"}
              </td>
              {showActions && (
                <td style={tdStyle}>
                  <button
                    style={{
                      ...secondaryButtonStyle,
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                    }}
                    onClick={() =>
                      options?.onSelectQuote && options.onSelectQuote(q)
                    }
                  >
                    View
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}