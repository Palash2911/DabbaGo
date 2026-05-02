import { useState, useEffect, useRef } from "react";
import {
  getAppSettings,
  updateStoreStatus,
  getCurrentMenu,
  saveMenu,
} from "../firebase/menuService";
import {
  getNewOrders,
  deleteOrder,
  markOrdersExported,
} from "../firebase/orderService";
import { runWeeklyCleanupIfDue } from "../firebase/cleanup";
import "./AdminPage.css";

const ADMIN_PIN = "1234";

// ── PIN Screen ────────────────────────────────────────────────────────────────

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onUnlock();
    } else {
      setError("Incorrect PIN, try again.");
      setPin("");
    }
  }

  return (
    <div className="pin-page">
      <div className="pin-card">
        <div className="pin-brand">
          <span className="pin-emoji">🍱</span>
          <span className="pin-brand-name">DabbaGo</span>
        </div>
        <p className="pin-heading">Owner Login</p>
        <form onSubmit={handleSubmit} noValidate>
          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(""); }}
            placeholder="Enter PIN"
            autoFocus
          />
          {error && <p className="pin-error">{error}</p>}
          <button type="submit" className="pin-btn">Enter Dashboard</button>
        </form>
      </div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <label className={`toggle ${checked ? "toggle--on" : "toggle--off"} ${disabled ? "toggle--disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="toggle-input"
      />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTodayLong() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const errorTimer = useRef(null);

  const [isOpen, setIsOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  const [menuItems, setMenuItems] = useState([""]);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);

  const [orders, setOrders] = useState([]);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const [exportMsg, setExportMsg] = useState("");

  function showError(msg) {
    setError(msg);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(""), 4000);
  }

  useEffect(() => {
    async function init() {
      await runWeeklyCleanupIfDue().catch(() => {}); // silent — never block the dashboard
      try {
        const [settings, menu, newOrders] = await Promise.all([
          getAppSettings(),
          getCurrentMenu(),
          getNewOrders(),
        ]);
        setIsOpen(settings.isOpen ?? true);
        setMenuItems(menu ? menu.split(",").map((s) => s.trim()).filter(Boolean) : [""]);
        setOrders(newOrders);
      } catch {
        showError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => clearTimeout(errorTimer.current);
  }, []);

  // ── Menu item helpers ──

  function addMenuItem() {
    setMenuItems((prev) => [...prev, ""]);
    setMenuSaved(false);
  }

  function updateMenuItem(i, val) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? val : item)));
    setMenuSaved(false);
  }

  function removeMenuItem(i) {
    setMenuItems((prev) => prev.filter((_, idx) => idx !== i));
    setMenuSaved(false);
  }

  // ── Handlers ──

  async function handleToggle() {
    const newVal = !isOpen;
    setIsOpen(newVal);
    setTogglingStore(true);
    try {
      await updateStoreStatus(newVal);
    } catch {
      setIsOpen(!newVal);
      showError("Something went wrong. Please try again.");
    } finally {
      setTogglingStore(false);
    }
  }

  async function handleSaveMenu() {
    const items = menuItems.map((i) => i.trim()).filter(Boolean);
    if (items.length === 0) return;
    setSavingMenu(true);
    setMenuSaved(false);
    try {
      await saveMenu(items.join(", "));
      setMenuSaved(true);
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setSavingMenu(false);
    }
  }

  async function handleDeleteOrder(orderId) {
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      showError("Something went wrong. Please try again.");
    }
  }

  async function handleRefreshOrders() {
    setRefreshingOrders(true);
    try {
      setOrders(await getNewOrders());
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setRefreshingOrders(false);
    }
  }

  async function handleExport() {
    if (orders.length === 0) {
      setExportMsg("No new orders to export.");
      return;
    }
    const lines = orders.map((o, i) => {
      const unit = o.quantity === 1 ? "tiffin" : "tiffins";
      return `${i + 1}. ${o.name} — ${o.phone} — ${o.quantity} ${unit}`;
    });
    const total = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    const message = `🍱 DabbaGo Orders — ${formatTodayLong()}\n\n${lines.join("\n")}\n\nTotal tiffins: ${total}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");

    try {
      await markOrdersExported(orders);
      const count = orders.length;
      setOrders([]);
      setExportMsg(`Exported! ${count} order${count === 1 ? "" : "s"} sent to WhatsApp.`);
    } catch {
      showError("Something went wrong. Please try again.");
    }
  }

  const hasValidItems = menuItems.some((i) => i.trim());

  // ── Render ──

  if (loading) {
    return (
      <div className="admin-page">
        <AdminHeader />
        <p className="loading-msg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {error && <div className="error-banner">{error}</div>}

      <AdminHeader />

      {/* Section 1 — Store Status */}
      <section className="card">
        <h2 className="card-heading">
          <span className="card-icon">🔔</span> Store Status
        </h2>
        <div className="store-row">
          <Toggle checked={isOpen} onChange={handleToggle} disabled={togglingStore} />
          <div className="status-group">
            <span className={`status-badge ${isOpen ? "status-open" : "status-closed"}`}>
              {isOpen ? "Open" : "Closed"}
            </span>
            <span className="status-hint">
              {isOpen ? "Customers can order" : "Orders paused"}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2 — Today's Menu */}
      <section className="card">
        <h2 className="card-heading">
          <span className="card-icon">🍽️</span> Today's Menu
        </h2>

        <div className="items-list">
          {menuItems.map((item, i) => (
            <div key={i} className="item-row">
              <span className="item-num">{i + 1}.</span>
              <input
                className="item-input"
                type="text"
                value={item}
                placeholder={`e.g. Dal Tadka`}
                onChange={(e) => updateMenuItem(i, e.target.value)}
              />
              {menuItems.length > 1 && (
                <button
                  className="btn-remove"
                  type="button"
                  onClick={() => removeMenuItem(i)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="btn-add" type="button" onClick={addMenuItem}>
          + Add menu item
        </button>

        {menuSaved && <p className="success-msg">✓ Menu saved! Customers can see it now.</p>}

        <button
          className="btn-primary"
          onClick={handleSaveMenu}
          disabled={savingMenu || !hasValidItems}
        >
          {savingMenu ? "Saving..." : "Save Menu"}
        </button>
      </section>

      {/* Section 3 — New Orders */}
      <section className="card">
        <div className="orders-header">
          <div>
            <h2 className="card-heading">
              <span className="card-icon">📋</span> New Orders
            </h2>
            <p className="order-count">
              {orders.length} new {orders.length === 1 ? "order" : "orders"}
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={handleRefreshOrders}
            disabled={refreshingOrders}
          >
            {refreshingOrders ? "..." : "↻ Refresh"}
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="empty-msg">No new orders yet 🍱</p>
        ) : (
          <ul className="order-list">
            {orders.map((order, i) => (
              <li key={order.id} className="order-row">
                <span className="order-num">{i + 1}</span>
                <div className="order-info">
                  <span className="order-name">{order.name}</span>
                  <span className="order-phone">{order.phone}</span>
                </div>
                <span className="order-qty">
                  {order.quantity} {order.quantity === 1 ? "tiffin" : "tiffins"}
                </span>
                <button className="btn-delete" onClick={() => handleDeleteOrder(order.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section 4 — Export */}
      <section className="card">
        <h2 className="card-heading">
          <span className="card-icon">📤</span> Export to WhatsApp
        </h2>
        {exportMsg && <p className="success-msg">✓ {exportMsg}</p>}
        <button className="btn-export" onClick={handleExport}>
          Send to WhatsApp
        </button>
      </section>
    </div>
  );
}

// ── Admin Header ──────────────────────────────────────────────────────────────

function AdminHeader() {
  return (
    <header className="admin-header">
      <h1 className="admin-logo">🍱 DabbaGo</h1>
      <p className="admin-subtitle">Owner Dashboard</p>
    </header>
  );
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}
