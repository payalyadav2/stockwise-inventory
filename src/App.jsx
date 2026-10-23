
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbymllKfOwsO7fpKjaRiy0I_KQI7AfOD6X8BnMCSNrRDc9jyWm45FMedwlArZUwepJ2lTw/exec";

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("Shop Owner"); 
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [lowStockLimit, setLowStockLimit] = useState(() => {
    const saved = window.localStorage.getItem(
      "stockwiseLowStockLimit"
    );
    return saved === null ? 10 : Number(saved);
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
  });

  // Restore the existing Supabase session and listen for auth changes.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setAuthLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;

        if (sessionError) {
          setAuthError(sessionError.message);
        }

        setSession(data?.session ?? null);
        setAuthLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load products only when a user has signed in.
  useEffect(() => {
    if (!session) {
      setProducts([]);
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        await loadProducts();
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [session]);

  // Format the Google Sheets response for the interface.
  function formatProducts(items) {
    return items.map((item) => ({
      id: item.id ?? item.ProductID,
      name: item.name ?? item.ProductName ?? "",
      category: item.category ?? item.Category ?? "",
      quantity: Number(item.quantity ?? item.Quantity ?? 0),
      price: Number(item.price ?? item.Price ?? 0),
    }));
  }

  // Read the latest products from Google Sheets.
  async function loadProducts() {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Could not connect to Google Sheets.");
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.products)) {
      throw new Error(
        result.error || "Unexpected data received from Google Sheets."
      );
    }

    setProducts(formatProducts(result.products));
  }

  // Sign up or log in using Supabase email/password authentication.
  async function handleAuthSubmit(event) {
    event.preventDefault();

    if (authBusy) return;

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      if (authMode === "signup") {
      const { data, error: signupError } =
  await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        designation: designation,
      },
    },
  });  

        if (signupError) throw signupError;

        if (data.session) {
          setAuthMessage("Account created successfully.");
        } else {
          setAuthMessage(
            "Account created. Check your email for a confirmation link, then log in."
          );
          setAuthMode("login");
        }
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;

        setAuthMessage("Login successful.");
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setActivePage("Dashboard");
    setMessage("");
    setError("");
    setAuthMessage("");
    setAuthError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Keep the existing Google Sheets write integration.
  async function sendWriteRequest(payload) {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const product = {
      name: form.name.trim(),
      category: form.category.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    if (
      !product.name ||
      !product.category ||
      form.quantity === "" ||
      form.price === "" ||
      !Number.isFinite(product.quantity) ||
      !Number.isFinite(product.price) ||
      !Number.isInteger(product.quantity) ||
      product.quantity < 0 ||
      product.price < 0
    ) {
      setError("Enter valid product details. Quantity must be a whole number.");
      return;
    }

    const isEditing = editingId !== null;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await sendWriteRequest({
        action: isEditing ? "update" : "create",
        product: isEditing
          ? { ...product, id: editingId }
          : product,
      });

      await loadProducts();
      resetForm();

      setMessage(
        isEditing
          ? "Update request sent. Check Google Sheets to confirm the change."
          : "Add request sent. Check Google Sheets to confirm the new row."
      );
    } catch (err) {
      console.error("Error saving product:", err);
      setError(
        "Could not verify the save. Check Google Sheets before trying again."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      category: "",
      quantity: "",
      price: "",
    });

    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    setForm({
      name: "",
      category: "",
      quantity: "",
      price: "",
    });

    setEditingId(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function handleEdit(product) {
    setForm({
      name: product.name,
      category: product.category,
      quantity: String(product.quantity),
      price: String(product.price),
    });

    setEditingId(product.id);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed || saving) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await sendWriteRequest({
        action: "delete",
        id,
      });

      await loadProducts();

      setMessage(
        "Delete request sent. Check Google Sheets to confirm the deletion."
      );
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(
        "Could not verify the deletion. Check Google Sheets before trying again."
      );
    } finally {
      setSaving(false);
    }
  }

  function saveStockLimit(event) {
    event.preventDefault();

    const value = Number(lowStockLimit);

    if (!Number.isInteger(value) || value < 0 || value > 1000000) {
      setError("Enter a whole number between 0 and 1,000,000.");
      return;
    }

    window.localStorage.setItem(
      "stockwiseLowStockLimit",
      String(value)
    );

    setLowStockLimit(value);
    setError("");
    setMessage("Low-stock alert limit saved in this browser.");
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const lowStockProducts = products.filter(
    (product) => product.quantity <= lowStockLimit
  );

  const inventoryValue = products.reduce(
    (total, product) => total + product.quantity * product.price,
    0
  );

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>StockWise</h1>
          <p>Checking your login session...</p>
        </div>
      </div>
    );
  }

  // Login and signup screen.
  if (!session) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <div className="auth-brand">StockWise</div>
          <p className="auth-subtitle">
            Inventory management made simple.
          </p>

          <h1>
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h1>

          <p className="auth-description">
          {authMode === "signup" && (
  <>
    <label htmlFor="full-name">Full name</label>
    <input
      id="full-name"
      type="text"
      autoComplete="name"
      placeholder="Enter your full name"
      value={fullName}
      onChange={(event) => setFullName(event.target.value)}
      required
    />

    <label htmlFor="designation">Your designation</label>
    <select
      id="designation"
      value={designation}
      onChange={(event) => setDesignation(event.target.value)}
      required
    >
      <option value="Shop Owner">Shop Owner</option>
      <option value="Store Manager">Store Manager</option>
      <option value="Inventory Staff">Inventory Staff</option>
    </select>
  </>
)}
            {authMode === "login"
              ? "Log in to access your inventory."
              : "Sign up with your email address and a password."}
          </p>

          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              authMode === "login" ? "current-password" : "new-password"
            }
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          {authError && (
            <p className="auth-error" role="alert">{authError}</p>
          )}

          {authMessage && (
            <p className="auth-message" role="status">{authMessage}</p>
          )}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={authBusy}
          >
            {authBusy
              ? "Please wait..."
              : authMode === "login"
                ? "Log In"
                : "Create Account"}
          </button>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthError("");
                setAuthMessage("");
              }}
            >
              {authMode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>StockWise</h2>
        <p className="sidebar-label">MAIN MENU</p>

        {["Dashboard", "Inventory", "Settings"].map((page) => (
          <button
            key={page}
            type="button"
            className={`nav-item ${activePage === page ? "active" : ""}`}
            onClick={() => {
              setActivePage(page);
              setError("");
              setMessage("");
            }}
          >
            {page === "Dashboard"
              ? "▦  Dashboard"
              : page === "Inventory"
                ? "□  Inventory"
                : "⚙  Settings"}
          </button>
        ))}

        <div className="sidebar-footer">
          <span>Signed in as</span>
          <strong>{session.user.email}</strong>
          <button
            type="button"
            className="secondary-btn logout-btn"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
  <h1>
    {activePage === "Dashboard"
      ? `Welcome, ${
          session.user.user_metadata?.full_name ||
          session.user.email
        }!`
      : activePage}
  </h1>

  <p>
    {activePage === "Dashboard"
      ? `Designation: ${
          session.user.user_metadata?.designation ||
          "Not specified"
        }`
      : activePage === "Inventory"
        ? "Search, add, edit and delete your products."
        : "Manage your StockWise preferences and account."}
  </p>
</div>
          <span className="status">● Google Sheets</span>
        </header>

        {error && <p role="alert" className="app-error">{error}</p>}
        {message && <p role="status" className="app-message">{message}</p>}

        {activePage === "Dashboard" && (
          <>
            <section className="stats">
              <div className="stat-card">
                <p>Total Products</p>
                <h2>{products.length}</h2>
              </div>

              <div className="stat-card">
                <p>Total Stock Units</p>
                <h2>{totalStock}</h2>
              </div>

              <div className="stat-card">
                <p>Low Stock Products</p>
                <h2>{lowStockProducts.length}</h2>
              </div>

              <div className="stat-card">
                <p>Inventory Value</p>
                <h2>₹{inventoryValue.toLocaleString("en-IN")}</h2>
              </div>
            </section>

            <section className="inventory-section">
              <div className="section-header">
                <div>
                  <h2>Low Stock Alerts</h2>
                  <p>
                    Products with quantity at or below {lowStockLimit}.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => setActivePage("Inventory")}
                >
                  View Inventory
                </button>
              </div>

              {loading ? (
                <p>Loading products from Google Sheets...</p>
              ) : lowStockProducts.length === 0 ? (
                <p>There are no low-stock products right now.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="product-name">{product.name}</td>
                          <td>{product.category}</td>
                          <td>{product.quantity}</td>
                          <td>₹{product.price.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activePage === "Inventory" && (
          <section className="inventory-section">
            <div className="section-header">
              <div>
                <h2>Product Inventory</h2>
                <p>View and manage your products.</p>
              </div>
              <button className="primary-btn" onClick={openAddForm}>
                + Add Product
              </button>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="Search product by name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {loading && <p>Loading products from Google Sheets...</p>}
            {saving && <p>Processing request...</p>}

            {showForm && (
              <form className="product-form" onSubmit={handleSubmit}>
                <h3>
                  {editingId !== null ? "Edit Product" : "Add New Product"}
                </h3>

                <div className="form-grid">
                  <input
                    name="name"
                    placeholder="Product name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="category"
                    placeholder="Category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price (₹)"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Processing..."
                      : editingId !== null
                        ? "Save Changes"
                        : "Add Product"}
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading &&
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.quantity}</td>
                        <td>₹{product.price.toLocaleString("en-IN")}</td>
                        <td>
                          <span
                            className={
                              product.quantity <= lowStockLimit
                                ? "stock-badge low"
                                : "stock-badge healthy"
                            }
                          >
                            {product.quantity <= lowStockLimit
                              ? "Low Stock"
                              : "In Stock"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(product)}
                              disabled={saving}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(product.id)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!loading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        {search
                          ? "No products found."
                          : "No products in inventory."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "Settings" && (
          <section className="inventory-section settings-section">
            <h2>Settings</h2>
            <p>Configure your inventory preferences and account.</p>

            <div className="settings-card">
              <h3>Account</h3>
              <p>Email: <strong>{session.user.email}</strong></p>
              <p>Your account is managed through Supabase Authentication.</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>

            <form className="settings-card" onSubmit={saveStockLimit}>
              <h3>Low Stock Alerts</h3>
              <p>
                A product is marked low stock when its quantity is at or
                below this number.
              </p>

              <label htmlFor="stock-limit">Low-stock quantity limit</label>
              <input
                id="stock-limit"
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={lowStockLimit}
                onChange={(event) =>
                  setLowStockLimit(event.target.value)
                }
                required
              />

              <button type="submit" className="primary-btn">
                Save Settings
              </button>
              <p className="settings-note">
                This preference is saved in this browser only.
              </p>
            </form>
          </section>
        )}

        <p className="footer-note">StockWise Inventory System</p>
      </main>
    </div>
  );
}

export default App;
