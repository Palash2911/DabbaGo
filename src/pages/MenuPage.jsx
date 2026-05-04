import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getAppSettings, getCurrentMenu } from "../firebase/menuService";
import { placeOrder } from "../firebase/orderService";
import "./MenuPage.css";

// ── Icons ─────────────────────────────────────────────────────────────────────

function TiffinIcon() {
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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Animation Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ── Header ─────────────────────────────────────────────────────────────────────

function Header() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <motion.div
      className="header-wrap"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="logo-mark"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <TiffinIcon />
      </motion.div>
      <h1 className="logo">
        Dabba<span>Go</span>
      </h1>
      <p className="tagline">Ghar jaisa khana, roz.</p>
      <div className="date-pill">{today}</div>
    </motion.div>
  );
}

// ── Trust Strip ────────────────────────────────────────────────────────────────

function TrustStrip() {
  const items = [
    { icon: "🏠", label: "Home cooked" },
    { icon: "🌿", label: "Fresh daily" },
    { icon: "🚀", label: "Fast delivery" },
  ];
  return (
    <motion.div className="trust-strip" variants={fadeUp}>
      {items.map((item, i) => (
        <div key={i} className="trust-item">
          <span className="trust-dot" />
          <span className="trust-label">{item.label}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ── MenuPage ───────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const isWeekend = false;

  const [loading, setLoading] = useState(!isWeekend);
  const [isOpen, setIsOpen] = useState(true);
  const [menuText, setMenuText] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", quantity: 1 });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isWeekend) return;
    async function fetchData() {
      try {
        const [settings, menu] = await Promise.all([
          getAppSettings(),
          getCurrentMenu(),
        ]);
        setIsOpen(settings.isOpen);
        setMenuText(menu);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isWeekend]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Please enter your name";
    if (!form.phone.trim()) {
      newErrors.phone = "Please enter your phone number";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Must be exactly 10 digits";
    }
    if (!form.quantity || form.quantity < 1 || form.quantity > 10) {
      newErrors.quantity = "Enter a number between 1 and 10";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await placeOrder({
        name: form.name.trim(),
        phone: form.phone.trim(),
        quantity: Number(form.quantity),
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const menuItems = menuText
    ? menuText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="page">
        <Header />
        <div className="state-card">
          <div className="state-spinner">
            <div className="spinner-ring" />
          </div>
          <p className="state-msg">Loading today's menu…</p>
        </div>
      </div>
    );
  }

  // ── Weekend ──
  if (isWeekend) {
    return (
      <div className="page">
        <Header />
        <motion.div
          className="state-card"
          variants={scaleIn}
          initial="hidden"
          animate="show"
        >
          <div className="state-icon-wrap state-icon-wrap--weekend">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.92 19.08l.7-.7M18.36 5.64l.7-.7"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <p className="state-msg">We're off for the weekend</p>
          <p className="state-sub">Back on Monday with fresh food</p>
        </motion.div>
      </div>
    );
  }

  // ── Closed ──
  if (!isOpen) {
    return (
      <div className="page">
        <Header />
        <motion.div
          className="state-card"
          variants={scaleIn}
          initial="hidden"
          animate="show"
        >
          <div className="state-icon-wrap state-icon-wrap--closed">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="state-msg">Closed for today</p>
          <p className="state-sub">Check back tomorrow morning!</p>
        </motion.div>
      </div>
    );
  }

  // ── Menu not ready ──
  if (!menuText) {
    return (
      <div className="page">
        <Header />
        <motion.div
          className="state-card"
          variants={scaleIn}
          initial="hidden"
          animate="show"
        >
          <div className="state-icon-wrap state-icon-wrap--soon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="M12 7v5l3 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="state-msg">Menu coming soon</p>
          <p className="state-sub">Check back in a little while!</p>
        </motion.div>
      </div>
    );
  }

  // ── Main ──
  return (
    <div className="page">
      <Header />

      <motion.div
        className="content"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <TrustStrip />

        {/* Menu Section */}
        <motion.section className="section" variants={fadeUp}>
          <div className="section-label">
            <span className="section-label__dot" />
            Today's Menu
          </div>
          <div className="menu-card">
            <motion.ul
              className="menu-list"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {menuItems.map((item, i) => (
                <motion.li key={i} className="menu-item" variants={itemVariant}>
                  <span className="menu-item__num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="menu-item__name">{item}</span>
                  <span className="menu-item__dot" />
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.section>

        {/* How it works */}
        <motion.div className="how-strip" variants={fadeUp}>
          <div className="how-step">
            <div className="how-num">1</div>
            <p>Pick your quantity</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-num">2</div>
            <p>Place your order</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-num">3</div>
            <p>We deliver to you</p>
          </div>
        </motion.div>

        {/* Order / Thank You */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thankyou"
              className="thankyou-card"
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="thankyou-check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <CheckIcon />
              </motion.div>
              <p className="thankyou-title">Order placed!</p>
              <p className="thankyou-sub">We'll see you at mealtime. 🍛</p>
              <motion.button
                className="new-order-btn"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", quantity: 1 });
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Place another order
              </motion.button>
            </motion.div>
          ) : (
            <motion.section
              key="form"
              className="section"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="section-label">
                <span className="section-label__dot" />
                Place Your Order
              </div>
              <div className="form-card">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="name">Your Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={form.name}
                      onChange={handleChange}
                      className={errors.name ? "input-error" : ""}
                      autoComplete="name"
                    />
                    {errors.name && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.name}
                      </motion.span>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={handleChange}
                      className={errors.phone ? "input-error" : ""}
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.phone}
                      </motion.span>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="quantity">How many tiffins?</label>
                    <div
                      className={`qty-wrap${errors.quantity ? " qty-wrap--error" : ""}`}
                    >
                      <motion.button
                        type="button"
                        className="qty-btn"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            quantity: Math.max(1, Number(p.quantity) - 1),
                          }))
                        }
                        whileTap={{ scale: 0.88 }}
                      >
                        −
                      </motion.button>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={form.quantity}
                        onChange={handleChange}
                        className="qty-input"
                      />
                      <motion.button
                        type="button"
                        className="qty-btn"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            quantity: Math.min(10, Number(p.quantity) + 1),
                          }))
                        }
                        whileTap={{ scale: 0.88 }}
                      >
                        +
                      </motion.button>
                    </div>
                    {errors.quantity && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.quantity}
                      </motion.span>
                    )}
                  </div>

                  {submitError && (
                    <motion.div
                      className="submit-error-banner"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {submitError}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {submitting ? (
                      <span className="btn-loading">
                        <span className="btn-spinner" />
                        Placing order…
                      </span>
                    ) : (
                      <>
                        Order Now
                        <ArrowIcon />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <p className="footer-note">Homemade with love · Delivered daily</p>
      </motion.div>
    </div>
  );
}
