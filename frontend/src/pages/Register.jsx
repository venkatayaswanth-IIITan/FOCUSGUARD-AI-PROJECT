import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import ParticleBackground from "../components/ParticleBackground";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
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

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setNotification({
      message: "",
      type: "",
    });

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
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
        setNotification({
          message: "Account created successfully! Redirecting...",
          type: "success",
        });

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setNotification({
          message: data.message || "Registration failed",
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

      {/* Register Card */}
      <div className="login-card">

        <div className="brand-section">
          <div className="logo-container">
            <span>FG</span>
          </div>

          <h1>FocusGuard AI</h1>

          <p>
            Create your account.
            <br />
            Start protecting your focus.
          </p>
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
        />

        <form onSubmit={handleRegister}>

          <div className="input-group">
            <label>Username</label>

            <div className="input-container">
              <span className="input-icon">◉</span>

              <input
                name="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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

            <label>Password</label>

            <div className="input-container">

              <span className="input-icon">⌾</span>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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
              <input type="checkbox" required />
              <span>I agree to the Terms & Privacy Policy</span>
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
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <span className="arrow">→</span>
              </>
            )}
          </button>

        </form>

        <div className="divider">
          <span></span>
          <p>ALREADY HAVE AN ACCOUNT?</p>
          <span></span>
        </div>

        <button
          className="create-account"
          onClick={() => navigate("/login")}
        >
          Sign In Instead
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

export default Register;
