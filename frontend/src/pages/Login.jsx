import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import ParticleBackground from "../components/ParticleBackground";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    message: "",
    type: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setNotification({
      message: "",
      type: "",
    });

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          if (data.user.username) localStorage.setItem("username", data.user.username);
        }

        setNotification({
          message: "Login successful! Welcome back.",
          type: "success",
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setNotification({
          message: data.message || "Invalid email or password",
          type: "error",
        });
      }
    } catch (error) {
      setNotification({
        message: "Unable to connect to server",
        type: "error",
      });
    }

    setLoading(false);
  };

  return (
    <div className="login-page">

      {/* Animated backgrounds */}
      <ParticleBackground />
      <div className="grid-background"></div>

      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>
      <div className="orb orb-three"></div>

      {/* Login Card */}
      <div className="login-card">

        <div className="brand-section">
          <div className="logo-container">
            <span>FG</span>
          </div>

          <h1>FocusGuard AI</h1>

          <p>
            Protect your attention.
            <br />
            Unlock your productivity.
          </p>
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
        />

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email Address</label>

            <div className="input-container">
              <span className="input-icon">✉</span>

              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">

            <div className="password-heading">
              <label>Password</label>

              <button
                type="button"
                className="forgot-button"
              >
                Forgot password?
              </button>
            </div>

            <div className="input-container">

              <span className="input-icon">⌾</span>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="eye-button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>

            </div>
          </div>

          <div className="remember-row">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span className="arrow">→</span>
              </>
            )}
          </button>

        </form>

        <div className="divider">
          <span></span>
          <p>NEW TO FOCUSGUARD?</p>
          <span></span>
        </div>

        <button
          className="create-account"
          onClick={() => navigate("/register")}
        >
          Create New Account
        </button>

        <p className="security-text">
          ◈ Your focus data stays private and secure
        </p>

      </div>

      <p className="footer-text">
        FocusGuard AI • Attention Intelligence Platform
      </p>

    </div>
  );
}

export default Login;
