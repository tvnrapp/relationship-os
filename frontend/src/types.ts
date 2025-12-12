// frontend/src/types.ts

export type Role = "SELLER" | "CUSTOMER";

export type TabKey = "dashboard" | "quotes" | "subscriptions" | "messages" | "customers";

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface QuotesTableOptions {
  showActionsForCustomer?: boolean;
  onSelectQuote?: (quote: any) => void;
}

/**
 * Banner/ribbon that only belongs to the Quotes page.
 */
export interface QuoteBanner {
  kind: "success" | "error" | "warning";
  message: string;
  quoteNumber?: string;
  context: "seller" | "customer";
}