import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { runWeeklyCleanupIfDue } from "../firebase/cleanup";
import {
  getAppSettings,
  getCurrentMenuFull,
  saveMenu,
  updateStoreStatus,
} from "../firebase/menuService";
import {
  deleteOrder,
  getNewOrders,
  markOrdersExported,
} from "../firebase/orderService";
import "./AdminPage.css";

const ADMIN_PIN = "1234";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2a6 6 0 0 1 6 6v2.5l1.5 2.5H2.5L4 10.5V8a6 6 0 0 1 6-6z" />
      <path d="M8 16a2 2 0 0 0 4 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h12l-1.5 8H5.5L4 4z" />
      <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="17" r="1" fill="currentColor" stroke="none" />
      <path d="M4 4H2" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v10M6 6l4-4 4 4" />
      <path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

function TiffinLogoIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="4"
        y="14"
        width="32"
        height="18"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="4"
        y="14"
        width="32"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 14V11C10 8.79 11.79 7 14 7H26C28.21 7 30 8.79 30 11V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 22H36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <circle cx="20" cy="27" r="2" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M13 4l-.9 9a1 1 0 0 1-1 .9H4.9a1 1 0 0 1-1-.9L3 4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 9a7.5 7.5 0 1 0 1.7-4.7" />
      <path d="M1.5 3.5v4h4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8.5l3.5 3.5 7-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ── Animation Variants ────────────────────────────────────────────────────────

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

const orderVariant = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    marginBottom: 0,
    padding: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

// ── PIN Screen ────────────────────────────────────────────────────────────────

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onUnlock();
    } else {
      setError("Incorrect PIN. Try again.");
      setPin("");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="pin-page">
      <motion.div
        className="pin-card"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pin-logo-wrap">
          <div className="pin-logo-icon">
            <TiffinLogoIcon />
          </div>
        </div>
        <h1 className="pin-brand-name">DabbaGo</h1>
        <p className="pin-heading">Owner Dashboard</p>

        <form onSubmit={handleSubmit} noValidate>
          <motion.div
            animate={shaking ? { x: [-8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="pin-field-wrap">
              <div className="pin-lock-icon">
                <LockIcon />
              </div>
              <input
                className={`pin-input${error ? " pin-input--error" : ""}`}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                placeholder="Enter 4-digit PIN"
                autoFocus
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="pin-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="pin-btn"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            Enter Dashboard
          </motion.button>
        </form>

        <p className="pin-footer">Secured · DabbaGo Admin</p>
      </motion.div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <label
      className={`toggle ${checked ? "toggle--on" : "toggle--off"} ${disabled ? "toggle--disabled" : ""}`}
      aria-label="Toggle store open/closed"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="toggle-input"
      />
      <span className="toggle-track">
        <motion.span
          className="toggle-thumb"
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
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

// ── Stat Pill ─────────────────────────────────────────────────────────────────

function StatBar({ orders }) {
  const total = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  return (
    <motion.div className="stat-bar" variants={cardVariant} custom={0}>
      <div className="stat-item">
        <span className="stat-value">{orders.length}</span>
        <span className="stat-label">Orders</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Tiffins</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value">{formatTodayLong().split(" ")[1]}</span>
        <span className="stat-label">{formatTodayLong().split(" ")[0]}</span>
      </div>
    </motion.div>
  );
}

// ── Current Menu Card ─────────────────────────────────────────────────────────

function CurrentMenuCard({ activeMenu, custom }) {
  const items = activeMenu?.items
    ? activeMenu.items
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const savedAt =
    activeMenu?.createdAt instanceof Date
      ? activeMenu.createdAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null;

  return (
    <motion.section
      className="card card--current-menu"
      variants={cardVariant}
      custom={custom}
    >
      <h2 className="card-heading">
        <span className="card-icon card-icon--live">
          <MenuIcon />
        </span>
        Today Menu
        <span className="live-badge">LIVE</span>
      </h2>

      {items.length === 0 ? (
        <p className="empty-sub" style={{ padding: "4px 0" }}>
          No menu set yet. Use the form below to publish today's menu.
        </p>
      ) : (
        <>
          <ul className="current-menu-list">
            {items.map((item, i) => (
              <li key={i} className="current-menu-item">
                <span className="current-menu-num">{i + 1}</span>
                <span className="current-menu-name">{item}</span>
              </li>
            ))}
          </ul>
          {savedAt && <p className="current-menu-time">Updated at {savedAt}</p>}
        </>
      )}
    </motion.section>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const errorTimer = useRef(null);

  const [isOpen, setIsOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  const [activeMenu, setActiveMenu] = useState(null);
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
      await runWeeklyCleanupIfDue().catch(() => {});
      try {
        const [settings, menuFull, newOrders] = await Promise.all([
          getAppSettings(),
          getCurrentMenuFull(),
          getNewOrders(),
        ]);
        setIsOpen(settings.isOpen ?? true);
        setActiveMenu(menuFull);
        setMenuItems([""]);
        setOrders(newOrders);
      } catch (e) {
        showError(`Something went wrong. Please refresh`);
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => clearTimeout(errorTimer.current);
  }, []);

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

  async function handleToggle() {
    const newVal = !isOpen;
    setIsOpen(newVal);
    setTogglingStore(true);
    try {
      await updateStoreStatus(newVal);
    } catch {
      setIsOpen(!newVal);
      showError("Could not update store status. Try again.");
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
      setActiveMenu({ items: items.join(", "), createdAt: new Date() });
    } catch {
      showError("Could not save menu. Try again.");
    } finally {
      setSavingMenu(false);
    }
  }

  async function handleDeleteOrder(orderId) {
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      showError("Could not delete order. Try again.");
    }
  }

  async function handleRefreshOrders() {
    setRefreshingOrders(true);
    try {
      setOrders(await getNewOrders());
    } catch {
      showError("Could not refresh orders. Try again.");
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
      return `${i + 1}. ${o.name}: ${o.phone} - ${o.quantity} ${unit}`;
    });
    const total = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    const message = `DabbaGo Orders: ${formatTodayLong()}\n\n${lines.join("\n")}\n\nTotal tiffins: ${total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    try {
      await markOrdersExported(orders);
      const count = orders.length;
      setOrders([]);
      setExportMsg(
        `${count} order${count === 1 ? "" : "s"} exported to WhatsApp!`,
      );
    } catch {
      showError("Export failed. Please try again.");
    }
  }

  const hasValidItems = menuItems.some((i) => i.trim());

  if (loading) {
    return (
      <div className="admin-page">
        <AdminHeader />
        <div className="loading-wrap">
          <div className="loading-ring" />
          <p className="loading-msg">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AdminHeader />

      <motion.div
        className="dashboard-grid"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {/* Stats Bar */}
        <StatBar orders={orders} />

        {/* Section 1 — Store Status */}
        <motion.section className="card" variants={cardVariant} custom={1}>
          <h2 className="card-heading">
            <span className="card-icon card-icon--bell">
              <BellIcon />
            </span>
            Store Status
          </h2>
          <div className="store-row">
            <Toggle
              checked={isOpen}
              onChange={handleToggle}
              disabled={togglingStore}
            />
            <div className="status-group">
              <span
                className={`status-badge ${isOpen ? "status-open" : "status-closed"}`}
              >
                {isOpen ? "Open" : "Closed"}
              </span>
              <span className="status-hint">
                {isOpen ? "Customers can place orders" : "Ordering is paused"}
              </span>
            </div>
            {togglingStore && <div className="inline-spinner" />}
          </div>
        </motion.section>

        {/* Section 2 — Current Menu (read-only live view) */}
        <CurrentMenuCard activeMenu={activeMenu} custom={2} />

        {/* Section 3 — Today's Menu (edit) */}
        <motion.section className="card" variants={cardVariant} custom={3}>
          <h2 className="card-heading">
            <span className="card-icon card-icon--menu">
              <MenuIcon />
            </span>
            Add New Menu
          </h2>

          <div className="items-list">
            <AnimatePresence>
              {menuItems.map((item, i) => (
                <motion.div
                  key={i}
                  className="item-row"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <span className="item-num">{i + 1}</span>
                  <input
                    className="item-input"
                    type="text"
                    value={item}
                    placeholder="e.g. Dal Makhani"
                    onChange={(e) => updateMenuItem(i, e.target.value)}
                    autoComplete="off"
                  />
                  {menuItems.length > 1 && (
                    <motion.button
                      className="btn-remove"
                      type="button"
                      onClick={() => removeMenuItem(i)}
                      aria-label="Remove item"
                      whileTap={{ scale: 0.9 }}
                    >
                      <TrashIcon />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button className="btn-add" type="button" onClick={addMenuItem}>
            <PlusIcon />
            Add item
          </button>

          <AnimatePresence>
            {menuSaved && (
              <motion.p
                className="success-msg"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="success-icon">
                  <CheckIcon />
                </span>
                Menu saved! Customers can see it now.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            className="btn-primary"
            onClick={handleSaveMenu}
            disabled={savingMenu || !hasValidItems}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {savingMenu ? (
              <>
                <span className="btn-inline-spinner" /> Saving…
              </>
            ) : (
              "Save Menu"
            )}
          </motion.button>
        </motion.section>

        {/* Section 4 — New Orders */}
        <motion.section className="card" variants={cardVariant} custom={4}>
          <div className="orders-header">
            <div>
              <h2 className="card-heading">
                <span className="card-icon card-icon--orders">
                  <OrdersIcon />
                </span>
                New Orders
              </h2>
              <p className="order-count">
                {orders.length} {orders.length === 1 ? "order" : "orders"} ·{" "}
                {orders.reduce((s, o) => s + (Number(o.quantity) || 0), 0)}{" "}
                tiffins total
              </p>
            </div>
            <motion.button
              className="btn-ghost"
              onClick={handleRefreshOrders}
              disabled={refreshingOrders}
              whileTap={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              title="Refresh orders"
            >
              <RefreshIcon />
              {refreshingOrders ? "…" : "Refresh"}
            </motion.button>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <OrdersIcon />
              </div>
              <p className="empty-msg">No new orders yet</p>
              <p className="empty-sub">
                Orders will appear here when customers place them
              </p>
            </div>
          ) : (
            <ul className="order-list">
              <AnimatePresence>
                {orders.map((order, i) => (
                  <motion.li
                    key={order.id}
                    className="order-row"
                    variants={orderVariant}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
                  >
                    <span className="order-num">{i + 1}</span>
                    <div className="order-info">
                      <span className="order-name">{order.name}</span>
                      <span className="order-phone">{order.phone}</span>
                    </div>
                    <div className="order-qty-pill">
                      <span className="order-qty">{order.quantity}</span>
                      <span className="order-qty-label">
                        {order.quantity === 1 ? "tiffin" : "tiffins"}
                      </span>
                    </div>
                    <motion.button
                      className="btn-delete"
                      onClick={() => handleDeleteOrder(order.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      title="Delete order"
                    >
                      <TrashIcon />
                    </motion.button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.section>

        {/* Section 5 — Export */}
        <motion.section
          className="card card--export"
          variants={cardVariant}
          custom={5}
        >
          <h2 className="card-heading">
            <span className="card-icon card-icon--export">
              <ExportIcon />
            </span>
            Export Orders
          </h2>
          <p className="export-desc">
            Send today's order list directly to WhatsApp for delivery
            coordination.
          </p>

          <AnimatePresence>
            {exportMsg && (
              <motion.p
                className="success-msg"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="success-icon">
                  <CheckIcon />
                </span>
                {exportMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            className="btn-export"
            onClick={handleExport}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="wa-icon">
              <WhatsAppIcon />
            </span>
            Send to WhatsApp
          </motion.button>
        </motion.section>
      </motion.div>
    </div>
  );
}

// ── Admin Header ──────────────────────────────────────────────────────────────

function AdminHeader() {
  return (
    <motion.header
      className="admin-header"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="admin-logo-wrap">
        <div className="admin-logo-icon">
          <TiffinLogoIcon />
        </div>
        <div>
          <h1 className="admin-logo">DabbaGo</h1>
          <p className="admin-subtitle">Owner Dashboard</p>
        </div>
      </div>
      <div className="admin-date">{formatTodayLong()}</div>
    </motion.header>
  );
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}
