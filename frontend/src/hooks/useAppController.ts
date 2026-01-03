// frontend/src/hooks/useAppController.ts
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, setAuthToken } from "../api";
import type {
  BillingCycle,
  Role,
  TabKey,
  User,
  QuoteBanner,
} from "../types";

export default function useAppController() {
  // ---- Auth0 (SSO) ----
  const {
    isAuthenticated,
    getAccessTokenSilently,
    isLoading: auth0Loading,
  } = useAuth0();

  // auth
  const [email, setEmail] = useState("tevin.rapp@gmail.com");
  const [password, setPassword] = useState("Baseball1!");
  const [role, setRole] = useState<Role>("SELLER");
  const [user, setUser] = useState<User | null>(null);

  // data
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [sellerCustomers, setSellerCustomers] = useState<any[] | null>(null);

  // ui/global
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [error, setError] = useState<string | null>(null); // global error only
  const [success, setSuccess] = useState<string | null>(null); // optional
  const [loading, setLoading] = useState(false);

  // quote banner / ribbon (Quotes page only)
  const [quoteBanner, setQuoteBanner] = useState<QuoteBanner | null>(null);

  // quotes
  const [quoteCustomerId, setQuoteCustomerId] = useState<number | "">("");
  const [quoteName, setQuoteName] = useState("Monitoring");
  const [quotePrice, setQuotePrice] = useState("99.99");
  const [quoteQty, setQuoteQty] = useState("1");
  const [quoteBillingCycle, setQuoteBillingCycle] =
    useState<BillingCycle>("MONTHLY");
  const [quoteNotes, setQuoteNotes] = useState(
    "Monthly monitoring subscription"
  );
  const [selectedQuoteForCustomer, setSelectedQuoteForCustomer] =
    useState<any | null>(null);

  // chat
  const [messageText, setMessageText] = useState("");
  const [selectedChatCustomerId, setSelectedChatCustomerId] =
    useState<number | "">("");
  const [chatMessages, setChatMessages] = useState<any[] | null>(null);
  const [chatPartnerId, setChatPartnerId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] =
    useState<number | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const isSeller = () => user?.role === "SELLER";
  const isAcceptInviteRoute = () => window.location.pathname === "/accept-invite";

  // ---------- effects ----------

  // restore session (our own JWT / user)
  useEffect(() => {
    // If we are on the accept-invite page, do NOT restore or SSO-sync here.
    // AcceptInvite.tsx controls the session creation + redirect.
    if (isAcceptInviteRoute()) return;

    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setAuthToken(savedToken);
    }

    if (savedToken && savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setUser(parsedUser);
        loadAllData(parsedUser);
      } catch {
        // bad localStorage state — clear it
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setAuthToken(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔐 When Auth0 says "this browser is authenticated", sync it with backend
  useEffect(() => {
    async function syncSsoSession() {
      // ✅ CRITICAL: AcceptInvite sets this flag so Auth0 sync can't clobber invite login
      if (sessionStorage.getItem("skip_sso_sync") === "1") return;

      // Never SSO-sync while accepting invites (extra safety)
      if (isAcceptInviteRoute()) return;

      // If user already logged in with Relationship OS, do nothing
      if (user) return;

      // If we already have an app token in storage, do nothing (avoid SSO clobber)
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (savedToken && savedUser) return;

      // Wait for Auth0 to be authenticated
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);

        // Get Auth0 access token for our API
        const accessToken = await getAccessTokenSilently();

        // Exchange Auth0 token for Relationship OS user + JWT
        const res = await api.post(
          "/auth/sso",
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const { token, user: backendUser } = res.data as {
          token: string;
          user: User;
        };

        setAuthToken(token);
        setUser(backendUser);
        localStorage.setItem("user", JSON.stringify(backendUser));
        localStorage.setItem("token", token);

        await loadAllData(backendUser);
        setActiveTab("dashboard");
      } catch (err: any) {
        console.error("SSO sync failed:", err);
        setError(
          err?.response?.data?.error ||
            "Single Sign-On failed. Try again or use email/password."
        );
      } finally {
        setLoading(false);
      }
    }

    syncSsoSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // unread count
  useEffect(() => {
    const msgs = dashboardData?.recentMessages as any[] | undefined;
    if (!msgs || msgs.length === 0) {
      setChatUnread(0);
      return;
    }

    const sorted = [...msgs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const latestId = sorted[sorted.length - 1].id as number;

    if (isChatOpen) {
      setLastReadMessageId(latestId);
      setChatUnread(0);
      return;
    }

    if (lastReadMessageId == null) {
      setLastReadMessageId(latestId);
      setChatUnread(0);
      return;
    }

    const unread = sorted.filter((m) => m.id > lastReadMessageId).length;
    setChatUnread(unread);
  }, [dashboardData?.recentMessages, isChatOpen, lastReadMessageId]);

  // auto-scroll chat
  useEffect(() => {
    if (!isChatOpen || !chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [isChatOpen, chatMessages, dashboardData?.recentMessages]);

  // customer: auto-pick seller
  useEffect(() => {
    if (!user || user.role !== "CUSTOMER" || !dashboardData) return;

    const sellerIdFromMessages =
      dashboardData?.recentMessages?.[0]?.sellerId || null;
    const sellerIdFromQuotes =
      dashboardData?.recentQuotes?.[0]?.sellerId || null;

    const sellerId = sellerIdFromMessages || sellerIdFromQuotes || null;
    if (sellerId && chatPartnerId !== sellerId) {
      loadChatForPartner(sellerId);
    }
  }, [user, dashboardData, chatPartnerId]);

  // ---------- data loading ----------

  async function loadAllData(currentUser: User) {
    try {
      setLoading(true);
      setChatMessages(null);
      setChatPartnerId(null);

      if (currentUser.role === "SELLER") {
        const [dashRes, customersRes] = await Promise.all([
          api.get("/seller/dashboard"),
          api.get("/seller/customers"),
        ]);
        setDashboardData(dashRes.data);
        setSellerCustomers(customersRes.data);
      } else {
        const dashRes = await api.get("/customer/dashboard");
        setDashboardData(dashRes.data);
        setSellerCustomers(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadChatForPartner(otherUserId: number) {
    if (!user) return;
    try {
      const res = await api.get(`/chat/${otherUserId}`);
      setChatMessages(res.data);
      setChatPartnerId(otherUserId);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages.");
    }
  }

  // ---------- helpers ----------

  function clearQuoteBanner() {
    setQuoteBanner(null);
  }

  // ---------- handlers ----------

  function handleRoleChange(newRole: Role) {
    setRole(newRole);
    if (newRole === "SELLER") {
      setEmail("tevin.rapp@gmail.com");
      setPassword("Baseball1!");
    } else {
      setEmail("corebase504@gmail.com");
      setPassword("Basketball1!");
    }
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setQuoteBanner(null);
    setLoading(true);
    setDashboardData(null);
    setSellerCustomers(null);
    setSelectedQuoteForCustomer(null);
    setChatMessages(null);
    setChatPartnerId(null);
    setIsChatOpen(false);
    setChatUnread(0);
    setLastReadMessageId(null);

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data as { token: string; user: User };

      setAuthToken(token);
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      await loadAllData(user);
      setActiveTab("dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setDashboardData(null);
    setSellerCustomers(null);
    setAuthToken(null);
    setError(null);
    setSuccess(null);
    setQuoteBanner(null);
    setSelectedQuoteForCustomer(null);
    setMessageText("");
    setChatMessages(null);
    setChatPartnerId(null);
    setIsChatOpen(false);
    setChatUnread(0);
    setLastReadMessageId(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // ----- QUOTES -----

  async function handleCreateQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || user.role !== "SELLER") return;

    setQuoteBanner(null);

    if (!quoteCustomerId) {
      setQuoteBanner({
        kind: "error",
        message: "Please select a customer for this quote.",
        context: "seller",
        quoteNumber: undefined,
      });
      return;
    }

    const price = parseFloat(quotePrice);
    const qty = parseInt(quoteQty || "1", 10);

    if (isNaN(price) || price <= 0) {
      setQuoteBanner({
        kind: "error",
        message: "Enter a valid unit price.",
        context: "seller",
        quoteNumber: undefined,
      });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setQuoteBanner({
        kind: "error",
        message: "Enter a valid quantity.",
        context: "seller",
        quoteNumber: undefined,
      });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/quotes", {
        customerId: quoteCustomerId,
        lines: [
          {
            type: "SUBSCRIPTION_SERVICE",
            name: quoteName,
            unitPrice: price,
            quantity: qty,
            billingCycle: quoteBillingCycle,
          },
        ],
        notes: quoteNotes,
      });

      const createdQuote = res.data?.quote;

      setQuoteBanner({
        kind: "success",
        message: createdQuote?.quoteNumber
          ? `Quote Q-${createdQuote.quoteNumber} created successfully.`
          : "Quote created successfully.",
        context: "seller",
        quoteNumber: createdQuote?.quoteNumber,
      });

      await loadAllData(user);
      setActiveTab("quotes");
    } catch (err: any) {
      console.error(err);
      setQuoteBanner({
        kind: "error",
        message:
          err?.response?.data?.error ||
          "Failed to create quote. Check backend logs.",
        context: "seller",
        quoteNumber: undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomerQuoteAction(status: "APPROVED" | "REJECTED") {
    if (!user || user.role !== "CUSTOMER") return;
    if (!selectedQuoteForCustomer) return;

    setQuoteBanner(null);

    try {
      setLoading(true);

      await api.post(`/quotes/${selectedQuoteForCustomer.id}/status`, {
        status,
        comment:
          status === "APPROVED"
            ? "Approved via customer portal"
            : "Rejected via customer portal",
      });

      setQuoteBanner({
        kind: status === "APPROVED" ? "success" : "warning",
        message:
          status === "APPROVED"
            ? `Quote ${selectedQuoteForCustomer.quoteNumber} approved.`
            : `Quote ${selectedQuoteForCustomer.quoteNumber} rejected.`,
        context: "customer",
        quoteNumber: selectedQuoteForCustomer.quoteNumber,
      });

      setSelectedQuoteForCustomer(null);
      await loadAllData(user);
    } catch (err: any) {
      console.error(err);
      setQuoteBanner({
        kind: "error",
        message: err?.response?.data?.error || "Failed to update quote status.",
        context: "customer",
        quoteNumber: selectedQuoteForCustomer.quoteNumber,
      });
    } finally {
      setLoading(false);
    }
  }

  // ----- MESSAGES -----

  async function handleSendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const trimmed = messageText.trim();
    if (!trimmed) {
      setError("Type a message before sending.");
      return;
    }

    let targetId: number | null = null;

    if (user.role === "CUSTOMER") {
      const fromMessages =
        dashboardData?.recentMessages?.[0]?.sellerId ?? null;
      const fromQuotes = dashboardData?.recentQuotes?.[0]?.sellerId ?? null;

      targetId = fromMessages || fromQuotes || chatPartnerId || null;

      if (!targetId) {
        setError("No seller to send a message to yet.");
        return;
      }
    } else {
      if (!selectedChatCustomerId) {
        setError("Select a customer to message.");
        return;
      }
      targetId = selectedChatCustomerId as number;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await api.post(`/chat/${targetId}`, { content: trimmed });

      setMessageText("");
      setSuccess("Message sent.");

      await loadAllData(user);
      await loadChatForPartner(targetId);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectChatCustomer(val: number | "") {
    setSelectedChatCustomerId(val);
    setChatMessages(null);
    if (val) {
      loadChatForPartner(val);
    }
  }

  function toggleChatOpen() {
    setIsChatOpen((prev) => {
      const next = !prev;

      if (!prev) {
        const msgs = dashboardData?.recentMessages as any[] | undefined;
        if (msgs && msgs.length > 0) {
          const sorted = [...msgs].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
          const latestId = sorted[sorted.length - 1].id as number;
          setLastReadMessageId(latestId);
          setChatUnread(0);
        }
      }

      return next;
    });
  }

  function reloadData() {
    if (user) loadAllData(user);
  }

  return {
    // auth
    email,
    password,
    role,
    user,
    handleRoleChange,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,

    // data/ui
    dashboardData,
    sellerCustomers,
    activeTab,
    setActiveTab,
    error,
    success,
    loading: loading || auth0Loading,
    reloadData,
    isSeller,

    // quote banner
    quoteBanner,
    clearQuoteBanner,

    // quotes
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
    handleCreateQuote,
    handleCustomerQuoteAction,

    // chat
    messageText,
    setMessageText,
    selectedChatCustomerId,
    handleSelectChatCustomer,
    chatMessages,
    chatPartnerId,
    isChatOpen,
    chatUnread,
    chatListRef,
    handleSendMessage,
    toggleChatOpen,
  };
}