# JobFlow AI — Design System & UI Overhaul
# Target aesthetic: Corporate & trustworthy (Greenhouse / Workday / Linear)
# Hand this entire file to AI agents — it is fully self-contained

---

## DESIGN PRINCIPLES (read before writing any CSS)

```
1. NO gradients anywhere — not on buttons, cards, backgrounds, or text
2. NO box-shadows with color — only neutral rgba(0,0,0,0.06) where absolutely needed
3. NO glowing effects, NO neon, NO colored drop shadows
4. NO rounded corners above 8px except modals (12px)
5. Borders separate elements — not shadows
6. White cards on light gray page background — that's the entire layout system
7. Navy (#0F2137) is the primary brand color — used for sidebar, CTAs, headings
8. One accent color only: #1D6FA4 (blue) for links and interactive states
9. Status colors are MUTED — no saturated reds/greens, only tinted backgrounds
10. Typography does the heavy lifting — size and weight, not color
```

---

## 1. CSS DESIGN TOKENS

### File: `frontend/src/styles/tokens.css`
Create this file and import it at the top of `frontend/src/index.css`

```css
/* ─── JobFlow Design Tokens ─── */
/* Import at top of index.css: @import './styles/tokens.css'; */

:root {
  /* Brand */
  --jf-navy:        #0F2137;
  --jf-navy-light:  #1A3352;
  --jf-navy-dim:    rgba(15, 33, 55, 0.06);
  --jf-blue:        #1D6FA4;
  --jf-blue-light:  #EBF4FB;
  --jf-blue-border: #BFDBF0;

  /* Page structure */
  --jf-page-bg:     #F4F5F7;
  --jf-surface:     #FFFFFF;
  --jf-surface-2:   #F9FAFB;

  /* Borders */
  --jf-border:      #E5E7EB;
  --jf-border-dark: #D1D5DB;

  /* Typography */
  --jf-text-primary:   #0F2137;
  --jf-text-body:      #374151;
  --jf-text-secondary: #6B7280;
  --jf-text-tertiary:  #9CA3AF;
  --jf-text-link:      #1D6FA4;

  /* Status — muted, never saturated */
  --jf-pending-bg:    #FEF3C7;
  --jf-pending-text:  #92400E;
  --jf-pending-border:#FDE68A;

  --jf-review-bg:     #DBEAFE;
  --jf-review-text:   #1E40AF;
  --jf-review-border: #BFDBFE;

  --jf-short-bg:      #E0E7FF;
  --jf-short-text:    #3730A3;
  --jf-short-border:  #C7D2FE;

  --jf-accept-bg:     #D1FAE5;
  --jf-accept-text:   #065F46;
  --jf-accept-border: #A7F3D0;

  --jf-reject-bg:     #FEE2E2;
  --jf-reject-text:   #991B1B;
  --jf-reject-border: #FECACA;

  --jf-interview-bg:    #F3E8FF;
  --jf-interview-text:  #6B21A8;
  --jf-interview-border:#E9D5FF;

  /* AI score colors */
  --jf-score-high:   #065F46;   /* 75-100 */
  --jf-score-mid:    #92400E;   /* 50-74  */
  --jf-score-low:    #991B1B;   /* 0-49   */

  /* Spacing */
  --jf-radius-sm:   4px;
  --jf-radius-md:   6px;
  --jf-radius-lg:   8px;
  --jf-radius-xl:   12px;

  /* Sidebar */
  --jf-sidebar-width: 220px;
  --jf-sidebar-bg:    #0F2137;
  --jf-sidebar-text:  rgba(255,255,255,0.55);
  --jf-sidebar-active:rgba(255,255,255,0.10);
  --jf-sidebar-hover: rgba(255,255,255,0.06);

  /* Shadows — subtle and neutral ONLY */
  --jf-shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --jf-shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

  /* Font stack */
  --jf-font: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  --jf-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Transitions */
  --jf-transition: 150ms ease;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --jf-page-bg:        #0D1117;
    --jf-surface:        #161B22;
    --jf-surface-2:      #1C2128;
    --jf-border:         #30363D;
    --jf-border-dark:    #484F58;
    --jf-text-primary:   #E6EDF3;
    --jf-text-body:      #C9D1D9;
    --jf-text-secondary: #8B949E;
    --jf-text-tertiary:  #6E7681;
    --jf-text-link:      #58A6FF;
    --jf-navy-dim:       rgba(88,166,255,0.08);
    --jf-sidebar-bg:     #0D1117;
  }
}
```

---

## 2. GLOBAL RESET & BASE STYLES

### File: `frontend/src/index.css` — REPLACE existing content with:

```css
@import './styles/tokens.css';

/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--jf-font);
  background: var(--jf-page-bg);
  color: var(--jf-text-body);
  line-height: 1.5;
}

/* ── Typography ── */
h1 { font-size: 1.5rem;  font-weight: 600; color: var(--jf-text-primary); letter-spacing: -0.3px; }
h2 { font-size: 1.25rem; font-weight: 600; color: var(--jf-text-primary); letter-spacing: -0.2px; }
h3 { font-size: 1.05rem; font-weight: 600; color: var(--jf-text-primary); }
h4 { font-size: 0.9rem;  font-weight: 600; color: var(--jf-text-primary); }
p  { font-size: 0.9rem;  line-height: 1.6; color: var(--jf-text-body);    }

a {
  color: var(--jf-text-link);
  text-decoration: none;
}
a:hover { text-decoration: underline; }

/* ── REMOVE all of these from existing code ── */
/* DELETE any CSS containing these properties:
   - background: linear-gradient(...)
   - background: radial-gradient(...)
   - box-shadow with color (e.g. 0 0 20px rgba(99,102,241,0.3))
   - filter: blur(...)
   - backdrop-filter: blur(...)
   - text-shadow
   - animation that pulses colors
   - border with glowing color
   Any class with names: .glow, .gradient, .shimmer, .pulse-color
*/

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--jf-border-dark); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--jf-text-tertiary); }

/* ── Focus ring ── */
:focus-visible {
  outline: 2px solid var(--jf-blue);
  outline-offset: 2px;
}
```

---

## 3. LAYOUT SHELL

### File: `frontend/src/components/Layout.css` — CREATE

```css
/* ── App Shell ── */
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--jf-sidebar-width);
  background: var(--jf-sidebar-bg);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 20px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.sidebar-logo-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

.sidebar-logo-tagline {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 3px;
}

.sidebar-section-label {
  padding: 16px 16px 6px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 1px 8px;
  border-radius: var(--jf-radius-md);
  color: var(--jf-sidebar-text);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: background var(--jf-transition), color var(--jf-transition);
  text-decoration: none;
}

.sidebar-nav-item:hover {
  background: var(--jf-sidebar-hover);
  color: rgba(255,255,255,0.85);
  text-decoration: none;
}

.sidebar-nav-item.active {
  background: var(--jf-sidebar-active);
  color: #fff;
  font-weight: 500;
}

.sidebar-nav-item svg {
  width: 15px;
  height: 15px;
  opacity: 0.6;
  flex-shrink: 0;
}

.sidebar-nav-item.active svg {
  opacity: 1;
  color: #60A5FA;
}

.sidebar-bottom {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--jf-radius-md);
  cursor: pointer;
}

.sidebar-user:hover {
  background: var(--jf-sidebar-hover);
}

.sidebar-user-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.75);
}

.sidebar-user-role {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
}

/* ── Main content area ── */
.main-content {
  margin-left: var(--jf-sidebar-width);
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Top bar ── */
.topbar {
  height: 56px;
  background: var(--jf-surface);
  border-bottom: 1px solid var(--jf-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-breadcrumb {
  font-size: 13px;
  color: var(--jf-text-secondary);
}

.topbar-breadcrumb span {
  color: var(--jf-text-tertiary);
  margin: 0 6px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ── Page wrapper ── */
.page-wrapper {
  padding: 24px 28px;
  flex: 1;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.page-title-block {}

.page-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--jf-text-primary);
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 12px;
  color: var(--jf-text-secondary);
  margin-top: 3px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
```

---

## 4. COMPONENT LIBRARY

### File: `frontend/src/styles/components.css` — CREATE and import in index.css

```css
/* ══════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--jf-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--jf-transition);
  white-space: nowrap;
  border: 1px solid transparent;
  line-height: 1;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Primary — navy fill */
.btn-primary {
  background: var(--jf-navy);
  color: #fff;
  border-color: var(--jf-navy);
}
.btn-primary:hover:not(:disabled) {
  background: var(--jf-navy-light);
  border-color: var(--jf-navy-light);
}
.btn-primary:active:not(:disabled) { transform: scale(0.98); }

/* Secondary — outlined */
.btn-secondary {
  background: var(--jf-surface);
  color: var(--jf-text-body);
  border-color: var(--jf-border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--jf-surface-2);
  border-color: var(--jf-border-dark);
}

/* Ghost — no border */
.btn-ghost {
  background: transparent;
  color: var(--jf-text-secondary);
  border-color: transparent;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--jf-navy-dim);
  color: var(--jf-text-primary);
}

/* Danger */
.btn-danger {
  background: #FEE2E2;
  color: #991B1B;
  border-color: #FECACA;
}
.btn-danger:hover:not(:disabled) {
  background: #FECACA;
}

/* Sizes */
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-lg { padding: 10px 20px; font-size: 14px; }
.btn-icon { padding: 7px; }
.btn-icon svg { margin: 0; }


/* ══════════════════════════════════════
   CARDS
   ══════════════════════════════════════ */

.card {
  background: var(--jf-surface);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-lg);
  overflow: hidden;
}

.card-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--jf-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--jf-text-primary);
}

.card-subtitle {
  font-size: 12px;
  color: var(--jf-text-secondary);
  margin-top: 2px;
}

.card-body {
  padding: 16px 18px;
}

.card-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--jf-border);
  background: var(--jf-surface-2);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}


/* ══════════════════════════════════════
   STAT CARDS
   ══════════════════════════════════════ */

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--jf-surface);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-lg);
  padding: 16px 18px;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--jf-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--jf-text-primary);
  letter-spacing: -0.5px;
  line-height: 1;
}

.stat-delta {
  font-size: 11px;
  color: var(--jf-accept-text);
  font-weight: 500;
  margin-top: 6px;
}

.stat-delta.negative { color: var(--jf-reject-text); }
.stat-delta.neutral  { color: var(--jf-text-tertiary); }


/* ══════════════════════════════════════
   TABLES
   ══════════════════════════════════════ */

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead th {
  padding: 9px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: var(--jf-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background: var(--jf-surface-2);
  border-bottom: 1px solid var(--jf-border);
  white-space: nowrap;
}

.table tbody td {
  padding: 11px 16px;
  color: var(--jf-text-body);
  border-bottom: 1px solid var(--jf-border);
  vertical-align: middle;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover td {
  background: var(--jf-surface-2);
}

/* Checkbox column */
.table th.col-check,
.table td.col-check {
  width: 40px;
  padding-right: 0;
}

/* Actions column */
.table td.col-actions {
  text-align: right;
  white-space: nowrap;
}

/* Candidate name cell with avatar */
.candidate-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.candidate-name {
  font-weight: 500;
  color: var(--jf-text-primary);
}

.candidate-email {
  font-size: 11px;
  color: var(--jf-text-tertiary);
  margin-top: 1px;
}


/* ══════════════════════════════════════
   AVATAR
   ══════════════════════════════════════ */

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--jf-navy-dim);
  color: var(--jf-navy);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  border: 1px solid var(--jf-border);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-sm { width: 24px; height: 24px; font-size: 9px; }
.avatar-lg { width: 40px; height: 40px; font-size: 14px; }


/* ══════════════════════════════════════
   STATUS BADGES
   ══════════════════════════════════════ */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: var(--jf-radius-sm);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1px;
  white-space: nowrap;
  border: 1px solid transparent;
}

.badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.badge-pending    { background: var(--jf-pending-bg);   color: var(--jf-pending-text);   border-color: var(--jf-pending-border); }
.badge-reviewing  { background: var(--jf-review-bg);    color: var(--jf-review-text);    border-color: var(--jf-review-border); }
.badge-shortlisted{ background: var(--jf-short-bg);     color: var(--jf-short-text);     border-color: var(--jf-short-border); }
.badge-interviewed{ background: var(--jf-interview-bg); color: var(--jf-interview-text); border-color: var(--jf-interview-border); }
.badge-accepted   { background: var(--jf-accept-bg);    color: var(--jf-accept-text);    border-color: var(--jf-accept-border); }
.badge-rejected   { background: var(--jf-reject-bg);    color: var(--jf-reject-text);    border-color: var(--jf-reject-border); }

/* Generic info/success/warning/error badges */
.badge-info    { background: #DBEAFE; color: #1E40AF; border-color: #BFDBFE; }
.badge-success { background: #D1FAE5; color: #065F46; border-color: #A7F3D0; }
.badge-warning { background: #FEF3C7; color: #92400E; border-color: #FDE68A; }
.badge-error   { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }

/* No dot variant */
.badge-plain::before { display: none; }


/* ══════════════════════════════════════
   AI SCORE
   ══════════════════════════════════════ */

.ai-score {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ai-score.high { color: var(--jf-score-high); }
.ai-score.mid  { color: var(--jf-score-mid); }
.ai-score.low  { color: var(--jf-score-low); }

/* Score bar (for detail views) */
.score-bar-track {
  height: 4px;
  background: var(--jf-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.score-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--jf-navy);
  transition: width 0.4s ease;
}

.score-bar-fill.high { background: #059669; }
.score-bar-fill.mid  { background: #D97706; }
.score-bar-fill.low  { background: #DC2626; }


/* ══════════════════════════════════════
   FORM ELEMENTS
   ══════════════════════════════════════ */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--jf-text-primary);
  letter-spacing: 0.1px;
}

.form-hint {
  font-size: 11px;
  color: var(--jf-text-tertiary);
}

.form-error {
  font-size: 11px;
  color: var(--jf-reject-text);
}

.input,
.select,
.textarea {
  width: 100%;
  padding: 7px 11px;
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-md);
  font-size: 13px;
  font-family: var(--jf-font);
  color: var(--jf-text-body);
  background: var(--jf-surface);
  transition: border-color var(--jf-transition), box-shadow var(--jf-transition);
  outline: none;
  appearance: none;
}

.input::placeholder { color: var(--jf-text-tertiary); }

.input:hover,
.select:hover { border-color: var(--jf-border-dark); }

.input:focus,
.select:focus,
.textarea:focus {
  border-color: var(--jf-blue);
  box-shadow: 0 0 0 3px rgba(29, 111, 164, 0.12);
}

.input.error { border-color: #DC2626; }

.textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  cursor: pointer;
}

/* Search input with icon */
.search-input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.search-input-wrapper svg {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--jf-text-tertiary);
  pointer-events: none;
}

.search-input-wrapper .input {
  padding-left: 32px;
  width: 220px;
}

/* Checkbox */
.checkbox {
  width: 15px;
  height: 15px;
  border: 1px solid var(--jf-border-dark);
  border-radius: 3px;
  cursor: pointer;
  accent-color: var(--jf-navy);
}


/* ══════════════════════════════════════
   TABS
   ══════════════════════════════════════ */

.tabs {
  display: flex;
  border-bottom: 1px solid var(--jf-border);
  margin-bottom: 20px;
  gap: 0;
}

.tab {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--jf-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--jf-transition), border-color var(--jf-transition);
  white-space: nowrap;
}

.tab:hover { color: var(--jf-text-primary); }

.tab.active {
  color: var(--jf-navy);
  border-bottom-color: var(--jf-navy);
}

/* Count pill inside tab */
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  background: var(--jf-border);
  color: var(--jf-text-secondary);
  margin-left: 6px;
}

.tab.active .tab-count {
  background: var(--jf-navy);
  color: #fff;
}


/* ══════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════ */

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--jf-border);
  border-radius: 20px;
  font-size: 12px;
  color: var(--jf-text-secondary);
  background: var(--jf-surface);
  cursor: pointer;
  transition: all var(--jf-transition);
}

.filter-chip:hover {
  border-color: var(--jf-border-dark);
  color: var(--jf-text-primary);
}

.filter-chip.active {
  background: var(--jf-navy);
  border-color: var(--jf-navy);
  color: #fff;
}


/* ══════════════════════════════════════
   NOTIFICATIONS BELL
   ══════════════════════════════════════ */

.notif-btn {
  position: relative;
  padding: 7px;
  border-radius: var(--jf-radius-md);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--jf-text-secondary);
  transition: all var(--jf-transition);
}

.notif-btn:hover {
  background: var(--jf-surface-2);
  border-color: var(--jf-border);
  color: var(--jf-text-primary);
}

.notif-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #DC2626;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--jf-surface);
}


/* ══════════════════════════════════════
   EMPTY STATES
   ══════════════════════════════════════ */

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--jf-text-secondary);
}

.empty-state-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  color: var(--jf-text-tertiary);
}

.empty-state-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--jf-text-primary);
  margin-bottom: 4px;
}

.empty-state-desc {
  font-size: 13px;
  color: var(--jf-text-secondary);
  margin-bottom: 16px;
}


/* ══════════════════════════════════════
   MODALS
   ══════════════════════════════════════ */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: var(--jf-surface);
  border-radius: var(--jf-radius-xl);
  border: 1px solid var(--jf-border);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--jf-shadow-sm);
}

.modal-header {
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--jf-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--jf-text-primary);
}

.modal-body { padding: 20px; }

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--jf-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}


/* ══════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════ */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid var(--jf-border);
  background: var(--jf-surface-2);
}

.pagination-info {
  font-size: 12px;
  color: var(--jf-text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  padding: 5px 10px;
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-sm);
  font-size: 12px;
  background: var(--jf-surface);
  color: var(--jf-text-body);
  cursor: pointer;
  transition: all var(--jf-transition);
}

.pagination-btn:hover { background: var(--jf-surface-2); }
.pagination-btn.active {
  background: var(--jf-navy);
  border-color: var(--jf-navy);
  color: #fff;
}
.pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }


/* ══════════════════════════════════════
   LOADING STATES
   ══════════════════════════════════════ */

.skeleton {
  background: var(--jf-surface-2);
  border-radius: var(--jf-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--jf-border);
  border-top-color: var(--jf-navy);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }


/* ══════════════════════════════════════
   ALERTS / TOASTS
   ══════════════════════════════════════ */

.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--jf-radius-md);
  font-size: 13px;
  border: 1px solid transparent;
  margin-bottom: 16px;
}

.alert-success { background: var(--jf-accept-bg);  color: var(--jf-accept-text);  border-color: var(--jf-accept-border); }
.alert-error   { background: var(--jf-reject-bg);  color: var(--jf-reject-text);  border-color: var(--jf-reject-border); }
.alert-warning { background: var(--jf-pending-bg); color: var(--jf-pending-text); border-color: var(--jf-pending-border); }
.alert-info    { background: var(--jf-review-bg);  color: var(--jf-review-text);  border-color: var(--jf-review-border); }


/* ══════════════════════════════════════
   DIVIDERS
   ══════════════════════════════════════ */

.divider {
  border: none;
  border-top: 1px solid var(--jf-border);
  margin: 16px 0;
}

.divider-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--jf-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0;
}

.divider-label::before,
.divider-label::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--jf-border);
}
```

---

## 5. PAGE-SPECIFIC STYLES

### File: `frontend/src/styles/pages.css` — CREATE

```css
/* ══════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════ */

/* DELETE ALL OF THESE from your existing landing page CSS:
   - .hero-gradient, .hero-glow, .hero-bg
   - background: linear-gradient(...)
   - Any animated gradient text
   - Any pulsing circles or blobs
   - backdrop-filter: blur on any hero section
*/

.landing-hero {
  background: var(--jf-navy);          /* solid navy — NO gradient */
  color: #fff;
  padding: 80px 40px;
  text-align: center;
}

.landing-hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  max-width: 640px;
  margin: 0 auto 16px;
  line-height: 1.2;
}

.landing-hero-subtitle {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.65);
  max-width: 480px;
  margin: 0 auto 32px;
  line-height: 1.6;
}

.landing-hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.landing-hero .btn-primary {
  background: #fff;
  color: var(--jf-navy);
  border-color: #fff;
  padding: 10px 22px;
  font-size: 14px;
}

.landing-hero .btn-secondary {
  background: transparent;
  color: rgba(255,255,255,0.8);
  border-color: rgba(255,255,255,0.25);
  padding: 10px 22px;
  font-size: 14px;
}

.landing-section {
  padding: 60px 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.landing-section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--jf-blue);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.landing-section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--jf-text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 12px;
}

.landing-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.landing-feature-card {
  background: var(--jf-surface);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-lg);
  padding: 20px;
}

.landing-feature-icon {
  width: 36px;
  height: 36px;
  background: var(--jf-navy-dim);
  border-radius: var(--jf-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--jf-navy);
}

.landing-feature-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--jf-text-primary);
  margin-bottom: 6px;
}

.landing-feature-desc {
  font-size: 13px;
  color: var(--jf-text-secondary);
  line-height: 1.5;
}

/* ══════════════════════════════════════
   JOB BOARD (Candidate)
   ══════════════════════════════════════ */

.job-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.job-card {
  background: var(--jf-surface);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-lg);
  padding: 18px;
  cursor: pointer;
  transition: border-color var(--jf-transition), box-shadow var(--jf-transition);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-card:hover {
  border-color: var(--jf-border-dark);
  box-shadow: var(--jf-shadow-xs);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.job-card-company-logo {
  width: 36px;
  height: 36px;
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-md);
  object-fit: contain;
  flex-shrink: 0;
  background: var(--jf-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--jf-navy);
}

.job-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--jf-text-primary);
  line-height: 1.3;
}

.job-card-company {
  font-size: 12px;
  color: var(--jf-text-secondary);
  margin-top: 2px;
}

.job-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.job-tag {
  padding: 2px 8px;
  background: var(--jf-surface-2);
  border: 1px solid var(--jf-border);
  border-radius: 3px;
  font-size: 11px;
  color: var(--jf-text-secondary);
  font-weight: 500;
}

.job-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--jf-border);
  margin-top: 4px;
}

.job-salary {
  font-size: 12px;
  font-weight: 600;
  color: var(--jf-text-primary);
}

.job-date {
  font-size: 11px;
  color: var(--jf-text-tertiary);
}

/* ══════════════════════════════════════
   APPLICATION DETAIL PAGE (Admin)
   ══════════════════════════════════════ */

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}

.detail-section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--jf-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--jf-border);
}

.skill-tag {
  display: inline-flex;
  padding: 3px 9px;
  background: var(--jf-navy-dim);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-sm);
  font-size: 11px;
  font-weight: 500;
  color: var(--jf-navy);
  margin: 3px;
}

.skill-tag.missing {
  background: var(--jf-reject-bg);
  border-color: var(--jf-reject-border);
  color: var(--jf-reject-text);
}

/* ══════════════════════════════════════
   CAREERBOT CHAT
   ══════════════════════════════════════ */

/* DELETE from existing: any glowing chat bubble, gradient message backgrounds */

.chat-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.chat-sessions-panel {
  border-right: 1px solid var(--jf-border);
  background: var(--jf-surface);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-session-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--jf-border);
  cursor: pointer;
  transition: background var(--jf-transition);
}

.chat-session-item:hover { background: var(--jf-surface-2); }
.chat-session-item.active { background: var(--jf-navy-dim); }

.chat-session-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--jf-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-session-date {
  font-size: 11px;
  color: var(--jf-text-tertiary);
  margin-top: 2px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--jf-page-bg);
}

.chat-message {
  display: flex;
  gap: 10px;
  max-width: 75%;
}

.chat-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble {
  padding: 10px 14px;
  border-radius: var(--jf-radius-lg);
  font-size: 13px;
  line-height: 1.55;
  border: 1px solid var(--jf-border);
  background: var(--jf-surface);
  color: var(--jf-text-body);
}

.chat-message.user .chat-bubble {
  background: var(--jf-navy);
  color: #fff;
  border-color: var(--jf-navy);
}

.chat-input-bar {
  padding: 14px 20px;
  border-top: 1px solid var(--jf-border);
  background: var(--jf-surface);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input-bar .textarea {
  flex: 1;
  resize: none;
  min-height: 40px;
  max-height: 120px;
}

/* ══════════════════════════════════════
   PROFILE PAGE (Candidate)
   ══════════════════════════════════════ */

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--jf-surface);
  border: 1px solid var(--jf-border);
  border-radius: var(--jf-radius-lg);
  margin-bottom: 20px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--jf-border);
  flex-shrink: 0;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--jf-text-primary);
}

.profile-headline {
  font-size: 13px;
  color: var(--jf-text-secondary);
  margin-top: 3px;
}

.reputation-score-ring {
  margin-left: auto;
  flex-shrink: 0;
  text-align: center;
}

.reputation-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--jf-navy);
  letter-spacing: -1px;
}

.reputation-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--jf-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

---

## 6. WHAT TO DELETE FROM EXISTING CODE

### Search and remove these exact patterns from all `.css` files:

```
PATTERNS TO DELETE — run a find-and-replace across all CSS/TSX files:

1. Any line containing: linear-gradient
2. Any line containing: radial-gradient
3. Any line containing: conic-gradient
4. Any box-shadow containing a color name or rgba with hue (e.g. rgba(99,102,241,0.3))
   — KEEP: box-shadow: 0 1px 2px rgba(0,0,0,0.06)  ← neutral only
   — DELETE: box-shadow: 0 0 20px rgba(99,102,241,0.4) ← has color = DELETE
5. Any line containing: filter: blur
6. Any line containing: backdrop-filter
7. Any line containing: text-shadow
8. Any CSS animation that animates: background-color, background, border-color in a loop
9. Classes named: .glow, .shimmer, .gradient-text, .gradient-bg, .pulse, .neon
10. Framer Motion animations with: background color changes or glow effects
    — KEEP: opacity, x, y, scale animations
    — DELETE: custom color transitions in Framer Motion

SPECIFIC COMPONENTS to strip:
- Landing page hero: remove all gradient backgrounds, replace with var(--jf-navy)
- Sidebar: remove gradient, use solid var(--jf-navy)
- Buttons: remove all gradient fills, use solid backgrounds
- Cards: remove glowing border-shadows, use 1px solid var(--jf-border)
- Stat cards: remove colored gradient fills, use plain white
- Badges: remove gradient fills, use flat tinted backgrounds
- CareerBot bubbles: remove gradient assistant messages
- AI score display: remove glow rings, use plain colored text
```

---

## 7. TYPOGRAPHY COMPONENT

### File: `frontend/src/components/Typography.tsx` — CREATE

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

// Consistent text styles — use these instead of inline font styles
export const PageTitle = ({ children, className = '' }: Props) => (
  <h1 className={`page-title ${className}`}>{children}</h1>
);

export const SectionTitle = ({ children, className = '' }: Props) => (
  <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--jf-text-primary)', marginBottom: 12 }} className={className}>
    {children}
  </h2>
);

export const Label = ({ children, className = '' }: Props) => (
  <span style={{
    fontSize: '10px', fontWeight: 700, color: 'var(--jf-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.6px'
  }} className={className}>{children}</span>
);

export const Muted = ({ children, className = '' }: Props) => (
  <span style={{ color: 'var(--jf-text-secondary)', fontSize: '13px' }} className={className}>{children}</span>
);
```

---

## 8. STATUS BADGE COMPONENT

### File: `frontend/src/components/StatusBadge.tsx` — CREATE

```tsx
const STATUS_MAP: Record<string, string> = {
  pending:     'badge-pending',
  reviewing:   'badge-reviewing',
  shortlisted: 'badge-shortlisted',
  interviewed: 'badge-interviewed',
  accepted:    'badge-accepted',
  rejected:    'badge-rejected',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  reviewing:   'Reviewing',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  accepted:    'Accepted',
  rejected:    'Rejected',
};

interface Props {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const cls = STATUS_MAP[status.toLowerCase()] || 'badge-info';
  const label = STATUS_LABELS[status.toLowerCase()] || status;
  return (
    <span className={`badge ${cls} ${className}`}>{label}</span>
  );
}
```

---

## 9. AI SCORE COMPONENT

### File: `frontend/src/components/AIScore.tsx` — CREATE

```tsx
interface Props {
  score: number | null;
  showBar?: boolean;
}

function getScoreClass(score: number): string {
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export default function AIScore({ score, showBar = false }: Props) {
  if (score === null || score === undefined) {
    return <span style={{ color: 'var(--jf-text-tertiary)', fontSize: 13 }}>—</span>;
  }

  const cls = getScoreClass(score);

  return (
    <div>
      <span className={`ai-score ${cls}`}>{Math.round(score)}</span>
      {showBar && (
        <div className="score-bar-track" style={{ width: 80 }}>
          <div
            className={`score-bar-fill ${cls}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 10. AVATAR COMPONENT

### File: `frontend/src/components/Avatar.tsx` — CREATE

```tsx
interface Props {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

export default function Avatar({ name, photoUrl, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`avatar ${sizeClass}`} />;
  }

  return (
    <div className={`avatar ${sizeClass}`} title={name}>
      {getInitials(name)}
    </div>
  );
}
```

---

## 11. SIDEBAR COMPONENT — FULL REWRITE

### File: `frontend/src/components/Sidebar.tsx` — REPLACE existing

```tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

// Lucide icons (already installed)
import {
  LayoutDashboard, FileText, Briefcase, Users,
  Sparkles, MessageSquare, Settings, CreditCard,
  BookOpen, Award, Search, ChevronRight
} from 'lucide-react';

const CANDIDATE_NAV = [
  { section: 'Jobs', items: [
    { to: '/jobs',            icon: Briefcase,       label: 'Job Board' },
    { to: '/my-applications', icon: FileText,         label: 'My Applications' },
  ]},
  { section: 'AI Tools', items: [
    { to: '/careerbot',      icon: MessageSquare,    label: 'Career Bot' },
    { to: '/ats-analyzer',   icon: Search,           label: 'ATS Analyzer' },
    { to: '/mock-interview', icon: Sparkles,          label: 'Mock Interview' },
    { to: '/skill-assessment',icon: Award,           label: 'Skill Assessment' },
  ]},
  { section: 'Account', items: [
    { to: '/profile',        icon: Users,            label: 'Profile' },
    { to: '/billing',        icon: CreditCard,       label: 'Billing' },
  ]},
];

const ADMIN_NAV = [
  { section: 'Recruitment', items: [
    { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/applications', icon: FileText,         label: 'Applications' },
    { to: '/admin/jobs',         icon: Briefcase,        label: 'Job Postings' },
    { to: '/admin/users',        icon: Users,            label: 'Candidates' },
  ]},
  { section: 'AI Tools', items: [
    { to: '/admin/careerbot',    icon: MessageSquare,    label: 'AI Chat' },
    { to: '/admin/ats',          icon: Search,           label: 'ATS Analyzer' },
  ]},
  { section: 'Admin', items: [
    { to: '/admin/settings',     icon: Settings,         label: 'Settings' },
    { to: '/billing',            icon: CreditCard,       label: 'Billing' },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : CANDIDATE_NAV;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">JobFlow</div>
        <div className="sidebar-logo-tagline">Recruitment Platform</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingBottom: 12 }}>
        {nav.map(group => (
          <div key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-user" onClick={logout}>
          <Avatar name={user?.name || 'User'} photoUrl={user?.photoURL} size="sm" />
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email}
            </div>
            <div className="sidebar-user-role">{isAdmin ? 'Recruiter' : 'Candidate'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

---

## 12. IMPORT ORDER IN index.css

```css
/* index.css — final import order */
@import './styles/tokens.css';
@import './styles/components.css';
@import './styles/pages.css';

/* Then your existing app-level styles below */
```

---

## 13. AGENT INTEGRATION CHECKLIST

```
STEP 1 — Create files:
  ✓ frontend/src/styles/tokens.css          (design tokens)
  ✓ frontend/src/styles/components.css      (component library)
  ✓ frontend/src/styles/pages.css           (page-specific styles)
  ✓ frontend/src/components/StatusBadge.tsx
  ✓ frontend/src/components/AIScore.tsx
  ✓ frontend/src/components/Avatar.tsx
  ✓ frontend/src/components/Typography.tsx
  ✓ frontend/src/components/Sidebar.tsx     (full replace)

STEP 2 — Update index.css:
  ✓ Replace with the reset + imports from Section 2

STEP 3 — Update Layout.css or Sidebar.css:
  ✓ Replace with layout shell from Section 3

STEP 4 — Remove from ALL .css files:
  ✓ Every gradient (linear-gradient, radial-gradient)
  ✓ Every colored box-shadow (keep only rgba(0,0,0,...))
  ✓ Every filter:blur / backdrop-filter
  ✓ Every text-shadow
  ✓ Every color-animating keyframe

STEP 5 — Replace in .tsx component files:
  ✓ All inline badge elements → <StatusBadge status={...} />
  ✓ All AI score displays → <AIScore score={...} />
  ✓ All user avatar/initials circles → <Avatar name={...} />
  ✓ All hardcoded nav items in Sidebar → new Sidebar.tsx

STEP 6 — Update className strings:
  ✓ btn classes: .btn + .btn-primary / .btn-secondary / .btn-ghost
  ✓ card classes: .card + .card-header + .card-body
  ✓ table classes: .table inside .table-wrapper inside .card
  ✓ input classes: .input, .select, .textarea (replace any custom input styles)
  ✓ stat card classes: .stat-grid > .stat-card > .stat-label + .stat-value

STEP 7 — Landing page:
  ✓ Hero background: solid var(--jf-navy), NO gradient
  ✓ Feature cards: white, 1px border, no shadows with color
  ✓ CTA buttons: .btn-primary (navy)
  ✓ Remove all Framer Motion color animations

STEP 8 — Verify:
  ✓ Open DevTools → search for "gradient" in Computed Styles → should be zero results
  ✓ Open DevTools → search for "blur" in Computed Styles → should be zero results
  ✓ Check dark mode → all text readable, no invisible elements
```

---

## 14. QUICK REFERENCE — COLOR USAGE

```
Page background:     var(--jf-page-bg)        #F4F5F7
Cards / surfaces:    var(--jf-surface)         #FFFFFF
Secondary surface:   var(--jf-surface-2)       #F9FAFB
Borders:             var(--jf-border)          #E5E7EB
Primary text:        var(--jf-text-primary)    #0F2137
Body text:           var(--jf-text-body)       #374151
Secondary text:      var(--jf-text-secondary)  #6B7280
Tertiary/hints:      var(--jf-text-tertiary)   #9CA3AF
Links:               var(--jf-text-link)       #1D6FA4
Brand navy:          var(--jf-navy)            #0F2137
Accent blue:         var(--jf-blue)            #1D6FA4

NEVER use:
  ✗ #6366f1 (indigo — replace with navy or blue)
  ✗ Any purple as primary
  ✗ Any gradient
  ✗ Any shadow with color
```

---

*JobFlow AI Design System v1.0 — Corporate & Trustworthy*
*Modeled after Greenhouse ATS + Workday visual language*
*Total: ~800 lines of CSS + 4 TypeScript components*