with open(r"c:\Users\aravi\project_ervamp\maths_explorer\NexStep\frontend\src\index.css", "r", encoding="utf-8") as f:
    text = f.read()

before_idx = text.find("::-webkit-scrollbar-thumb {\n  background: var(--bg-tertiary);")
after_idx = text.find(".navbar-brand {")

before_text = text[:before_idx]
after_text = text[after_idx:]

inject = """::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

/* -- Global link -- */
a {
  color: var(--accent-primary-hover);
  text-decoration: none;
  transition: color 0.2s;
}
a:hover {
  color: var(--accent-primary);
}

/* -- Button base -- */
button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
}

/* -- Animations -- */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
  50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
}
@keyframes stepReveal {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
.slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

/* -- Utility -- */
.container {
  width: 100vw;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 5vw;
  box-sizing: border-box;
}

/* -- Input styles -- */
input, select, textarea {
  font-family: inherit;
  font-size: 0.95rem;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: all 0.3s ease;
  outline: none;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
input::placeholder, textarea::placeholder {
  color: var(--text-muted);
}

/* -- Navbar -- */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: var(--bg-glass);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}
"""

with open(r"c:\Users\aravi\project_ervamp\maths_explorer\NexStep\frontend\src\index.css", "w", encoding="utf-8") as f:
    f.write(before_text + inject + after_text)
