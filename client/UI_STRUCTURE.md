# Gymza UI Structure Documentation

This document outlines the UI architecture and design system for the Gymza SaaS project.

## 🎨 Design System

The UI follows a **Glassmorphism** aesthetic with a **Dark-first** approach.

### 🌈 Color Palette (CSS Variables)
Located in `client/src/styles/variables.css`

- `--clr-bg-base`: #0a0b10 (Deep black background)
- `--clr-bg-sidebar`: #12141d (Slightly lighter sidebar)
- `--clr-primary`: #8b5cf6 (Vivid Purple)
- `--clr-secondary`: #06b6d4 (Cyan Blue)
- `--clr-accent-gradient`: Linear gradient of primary and secondary
- `--clr-text-main`: #ffffff (Pure white for readability)
- `--clr-text-muted`: #94a3b8 (Slate gray for secondary text)

### ✨ Glassmorphism Effects
Located in `client/src/styles/glass.css`

- `.glass-panel`: Standard container with 12px blur and subtle border.
- `.glass-card`: Card component with hover lift effect and glow.
- `.bg-mesh`: Fixed background with animated neon blobs.

---

## 🏗️ Component Tree

```text
App
└── BrowserRouter
    └── Suspense
        └── Routes
            ├── /login -> LoginPage
            └── / (Protected) -> AppLayout
                ├── Sidebar
                └── MainWrapper
                    ├── Header
                    └── PageContent (Dashboard, Members, etc.)
```

---

## 📂 Project Structure

### 🖼️ Layout Components (`src/components/layout`)
- `AppLayout.tsx`: Main wrapper handling theme state and mesh background.
- `Sidebar.tsx`: Navigation menu with role-based filtering.
- `Header.tsx`: Top bar with search, theme toggle, and user profile.

### 📄 Pages (`src/pages`)
- `DashboardPage.tsx`: Overview with stat cards and analytics chart.
- `MembersPage.tsx`: Member management with searchable data table.
- `PlansPage.tsx`: Pricing tiers with monthly/yearly toggle.
- `TrainersPage.tsx`: Grid of trainer profiles.
- `AttendancePage.tsx`: Daily check-in log and peak activity stats.
- `PaymentsPage.tsx`: Revenue tracking and transaction history.
- `WorkoutsPage.tsx`: Personalized workout and nutrition plans.
- `SettingsPage.tsx`: Application and gym profile configuration.
- `LoginPage.tsx`: Split-screen glassmorphism login.
- `ProfilePage.tsx`: User profile management.

---

## 🌗 Theme System

The theme system uses `data-theme` attribute on the `html` element.
- **Toggle Logic**: Located in `AppLayout.tsx`.
- **Persistence**: Saved in `localStorage` under the key `theme`.
- **Styling**: Variables in `variables.css` are overridden under `[data-theme="light"]`.

---

## 🛠️ How to Modify

1. **Changing Colors**: Update the hex codes in `variables.css` under `:root`.
2. **Adding Menu Items**: Update the `navItems` array in `Sidebar.tsx`.
3. **New UI Components**: Use existing classes like `.glass-card`, `.btn-primary`, `.data-table` in `components.css`.
