import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="themeToggleBtn"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      <div className={`themePill ${isDark ? "dark" : "light"}`}>
        <Sun size={13} className="themeIcon sunIcon" />
        <Moon size={13} className="themeIcon moonIcon" />
        <span className="themePillThumb" />
      </div>
      <span className="themeLabelText">{isDark ? "Dark Mode" : "Light Mode"}</span>
    </button>
  );
}

export default ThemeToggle;
