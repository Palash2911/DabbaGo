import { useEffect, useState } from "react";
import { getAppSettings, getCurrentMenu } from "../firebase/menuService";
import { placeOrder } from "../firebase/orderService";
import "./MenuPage.css";

function Header() {
  return (
    <div className="header-wrap">
      <h1 className="logo">🍱 DabbaGo</h1>
      <p className="tagline">Ghar jaisa khana, roz.</p>
    </div>
  );
}

export default function MenuPage() {
  // const isWeekend = [0, 6].includes(new Date().getDay());
  const isWeekend = false;

  const [loading, setLoading] = useState(!isWeekend);
  const [isOpen, setIsOpen] = useState(true);
  const [menuText, setMenuText] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", quantity: 1 });
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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      await placeOrder({
        name: form.name.trim(),
        phone: form.phone.trim(),
        quantity: Number(form.quantity),
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong, please try again.");
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

  if (loading) {
    return (
      <div className="page">
        <Header />
        <div className="status-box">
          <p className="status-msg">Loading today's menu...</p>
        </div>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="page">
        <Header />
        <div className="status-box">
          <span className="status-icon">🌿</span>
          <p className="status-msg">We're off for the weekend!</p>
          <p className="status-sub">See you Monday.</p>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="page">
        <Header />
        <div className="status-box">
          <span className="status-icon">🙏</span>
          <p className="status-msg">We're closed today.</p>
          <p className="status-sub">Check back tomorrow!</p>
        </div>
      </div>
    );
  }

  if (!menuText) {
    return (
      <div className="page">
        <Header />
        <div className="status-box">
          <span className="status-icon">🍛</span>
          <p className="status-msg">Menu not ready yet.</p>
          <p className="status-sub">Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <div className="content">
        <section className="menu-section">
          <h2 className="section-heading">Today's Menu</h2>
          <div className="menu-card">
            <ul className="menu-list">
              {menuItems.map((item, i) => (
                <li key={i} className="menu-list-item">
                  <span className="menu-bullet">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {submitted ? (
          <div className="thankyou-card">
            <div className="thankyou-icon">🍱</div>
            <p className="thankyou-text">Your order is placed!</p>
            <p className="thankyou-sub">See you at mealtime.</p>
          </div>
        ) : (
          <section className="form-section">
            <h2 className="section-heading">Place Your Order</h2>
            <div className="form-card">
              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="quantity">How many tiffins?</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.quantity}
                    onChange={handleChange}
                  />
                </div>

                {submitError && <p className="submit-error">{submitError}</p>}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Placing order..." : "Order Now"}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
