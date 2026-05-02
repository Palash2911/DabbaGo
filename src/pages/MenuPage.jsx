import { useEffect, useState } from "react";
import { getAppSettings, getCurrentMenu } from "../firebase/menuService";
import { placeOrder } from "../firebase/orderService";
import "./MenuPage.css";

function Header() {
  return (
    <header className="header">
      <h1 className="logo">🍱 DabbaGo</h1>
      <p className="tagline">Ghar jaisa khana, roz.</p>
    </header>
  );
}

export default function MenuPage() {
  const isWeekend = [0, 6].includes(new Date().getDay());

  const [loading, setLoading] = useState(!isWeekend);
  const [isOpen, setIsOpen] = useState(true);
  const [menuText, setMenuText] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", quantity: 1 });
  const [phoneError, setPhoneError] = useState("");
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
    if (name === "phone") setPhoneError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!/^\d{10}$/.test(form.phone)) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    try {
      await placeOrder({
        name: form.name.trim(),
        phone: form.phone,
        quantity: Number(form.quantity),
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Header />
        <p className="status-message">Loading today's menu...</p>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="page">
        <Header />
        <p className="status-message">
          We're off for the weekend 🌿 See you Monday!
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="page">
        <Header />
        <p className="status-message">
          We're closed today 🙏 Check back tomorrow!
        </p>
      </div>
    );
  }

  if (menuText === null) {
    return (
      <div className="page">
        <Header />
        <p className="status-message">
          Today's menu isn't ready yet. Check back soon! 🍛
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <div className="divider" />

      <section className="menu-section">
        <h2 className="section-heading">Today's Menu</h2>
        <div className="menu-card">
          <p className="menu-text">{menuText}</p>
        </div>
      </section>

      {submitted ? (
        <div className="thankyou-card">
          <p>Your order is placed! 🍱 See you at mealtime.</p>
        </div>
      ) : (
        <section className="form-section">
          <div className="form-card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
                {phoneError && (
                  <span className="field-error">{phoneError}</span>
                )}
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
  );
}
