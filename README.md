# Inventra — Inventory & Sales Management Dashboard

A production-ready React (Vite) SPA that pairs with the **Inventory & Sales REST API**
(Node.js/Express/MongoDB). Features a modern dark/light dashboard UI, POS, inventory
management and analytics charts.

## Stack

- **React 18** (functional components + hooks) · **Vite 5**
- **react-router-dom v6** — routing + protected routes
- **Axios** — instance with interceptors (token attach + silent refresh + request dedupe)
- **recharts** — revenue trend area chart
- **lucide-react** — icons
- **Vanilla CSS** — design-token system (`src/styles/tokens.css`) with light/dark themes

## Quick Start

```bash
npm install
cp .env.example .env        # point VITE_API_URL at the API (default http://localhost:5000)
npm run dev                 → http://localhost:5173
```

**Backend connection.** The Vite dev server proxies `/api/*` to the API, so cookies
(SameSite) and CORS work out of the box. In production, serve the built `dist/` behind the
same origin as the API or set `VITE_API_URL` to the API's public URL before `npm run build`.

```bash
# Backend (separate terminal)
cd ../inventory-sales-api && cp .env.example .env && npm install && npm run dev
```

**First login.** Register the first account on the API — the first user becomes `Admin`.

## Folder Structure

```
src/
├── assets/           # images / fonts
├── components/       # AppLayout, ProtectedRoute, Modal, Toast, StatCard, Badge,
│                     # Pagination, Feedback (Spinner/Skeleton/EmptyState),
│                     # ProductFormModal, StockAdjustModal
├── context/          # AuthContext.jsx — session state + silent restore
├── hooks/            # useAuth (via context), useDebounce, useTheme
├── pages/            # LoginPage, RegisterPage, DashboardPage, InventoryPage, SalesPage, NotFoundPage
├── services/         # api.js (axios + interceptors), auth/product/category/sale/analytics services
└── styles/           # tokens.css (design system), global.css (components + layout + responsive)
```

## Key implementation notes

### Auth & token lifecycle (`src/services/api.js`)
- Access token lives **in memory only** (never localStorage) — attached via a request interceptor.
- On any `401`, the response interceptor triggers **one** `/auth/refresh` call; concurrent
  failed requests queue behind it and are retried with the new token. If refresh fails, the
  session is cleared and the user is redirected to `/login?redirect=…`.
- The refresh token itself travels only in the `HttpOnly; Secure; SameSite=Strict` cookie
  managed by the backend.

### Protected routes (`src/components/ProtectedRoute.jsx`)
Wraps all dashboard routes: restores the session on first load (boot screen while the
silent refresh attempt resolves), redirects guests to login, and supports role gating via
`<ProtectedRoute roles={['Admin','Manager']}>`.

### Dashboard
Single call to `GET /analytics/dashboard` powers 4 stat cards, a revenue-trend
`recharts` area chart, top-sellers ranking, and a low-stock table with deep links into
the filtered inventory view.

### Inventory
Search (300 ms debounced), category filter, low-stock toggle — all synced to the URL
(query params) so filtered views are shareable. Managers get inline actions: restock modal
(with live projected stock and negative-stock guard), edit modal (with quick category
creation), and archive confirmation. Stock badges: In Stock / Low Stock / Out of Stock.

### Sales & POS
Two tabs:
- **Point of Sale** — searchable product tiles (out-of-stock hidden), quantity steppers
  capped by available stock, live totals, payment method, and a receipt confirmation modal.
  The backend processes each sale in an ACID transaction; errors surface as toasts.
- **Transactions** — paginated sales history with receipt IDs, timestamps, cashier and
  payment method (Admin/Manager only).

### Accessibility & UX
Keyboard-dismissable modals (Escape), aria labels, focus rings, reduced busywork via
skeletons/toasts/empty states, and a fully responsive shell: sticky sidebar collapses to
an overlay drawer below 860 px.
