# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

E-commerce app for curated gift boxes. Two parts:

- `backend/` — Spring Boot (Java, Maven). REST API under `com.prettycrafted.giftbox`.
- `frontend/` — React 19 + Vite + Redux Toolkit, styled with a hand-rolled design system.

---

## Commands

### Frontend

```bash
cd frontend
npm run dev          # dev server on :5173, proxies /api → localhost:8080
npm run build        # production build
npm run lint         # ESLint
npm test             # Vitest (run once)
npm run test:watch   # Vitest watch mode
# Run a single test file:
npx vitest run src/test/cartSlice.test.js
```

### Backend

```bash
cd backend
./mvnw spring-boot:run          # start on :8080
./mvnw test                     # all tests
./mvnw test -Dtest=ClassName    # single test class
./mvnw clean package -DskipTests
```

Backend requires these env vars (set in shell or `.env`-equivalent before running):

| Var | Purpose |
|-----|---------|
| `APP_JWT_SECRET` | HS256 signing key (≥32 chars) |
| `DB_URL` | JDBC URL (e.g. `jdbc:postgresql://...`) |
| `DB_USERNAME` / `DB_PASSWORD` | DB credentials |
| `APP_CORS_ALLOWED_ORIGINS` | e.g. `http://localhost:5173` for dev |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | image uploads |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | payments |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | transactional email |

`application.properties` only contains `spring.application.name=giftbox` — everything else is env-var driven.

---

## ⚠️ Frontend design conventions — DO NOT break these

The UI has a deliberate, consistent look. When editing or adding components, **match the existing
style exactly**. Read a neighboring component before writing a new one.

### Styling is done with inline `style={{}}` objects, NOT Tailwind utility classes

Even though Tailwind is installed and configured, the components are written with **inline style
objects** (see `src/components/ui/ProductCard.jsx`, `Nav.jsx`, every modal in
`src/components/modals/`). Do not "convert" these to Tailwind classes, and do not introduce a new
styling approach (CSS modules, styled-components, etc.). Follow the inline-style pattern already in
the file you are editing.

### Color palette — use these exact values, never invent new colors

| Token            | Hex         | Used for                          |
|------------------|-------------|-----------------------------------|
| terracotta (TC)  | `#C4704A`   | primary accent, prices, CTAs      |
| terracotta-dark  | `#A85A38`   | hover/active terracotta           |
| sage             | `#7A9A6B`   | success / "New" / confirmation    |
| cream            | `#FAF7F2`   | page background                   |
| warm-beige       | `#EDE4D8`   | card borders, skeletons, tracks   |
| warm-mid         | `#D9CBBF`   | secondary surfaces                |
| dark             | `#2C1A0E`   | primary text                      |
| mid              | `#6B4F3A`   | secondary text                    |
| light-text       | `#9C7A63`   | captions / category labels        |

Components define `const TC = '#C4704A'` at the top and reuse it. The full palette also lives as CSS
variables in `src/index.css` (`:root`) and as Tailwind tokens in `tailwind.config.js`. Keep all three
in sync if you ever add a color — but prefer reusing what exists.

### Typography

- Headings / product names: **Playfair Display** (`fontFamily: "'Playfair Display',serif"`).
- Body / UI: **DM Sans** (the global default, set on `body`).
- Lora (serif) is available for longer-form text.
- Fonts load via `<link>` in `index.html` — don't move them to CSS `@import`.

### Recurring visual idioms (keep consistent)

- Cards: `background:'white'`, `borderRadius:20`, `border:'1px solid #EDE4D8'`, soft brown shadow
  (`0 2px 12px rgba(44,26,14,0.06)`, lifting to `0 12px 40px rgba(44,26,14,0.12)` on hover with a
  `translateY(-4px)`).
- Pills / buttons: `borderRadius:99`, uppercase micro-labels with `letterSpacing` ~`0.06–0.08em`.
- Prices: terracotta, bold, prefixed with `₹`.
- Transitions: `transition:'all 0.3s'` (or `0.2s` for small interactions).
- Modals: rendered over `.modal-backdrop` (defined in `index.css`) — dark translucent
  `rgba(44,26,14,0.55)` with `backdrop-filter: blur(4px)`.

### Animations live in `src/index.css`

Reuse the existing keyframes/utility classes instead of inventing new ones: `animate-fade-up`,
`float-anim`, `animate-slide-right`, `animate-slide-down`, `animate-spin-slow`, `animate-bounce-in`,
the `marquee-track` announcement banner, and the `oc*` OccasionPage animations / `skShimmer`
skeleton shimmer. Add new keyframes here (not inline) if genuinely needed.

### Layout / responsiveness

- Mobile breakpoint is `< 640px`, read via the `useWindowWidth()` hook (`src/hooks/`). Match that
  rather than hardcoding new breakpoints.
- The app guards against horizontal scroll (`overflow-x: hidden`, `max-width:100vw` on
  `html/body/#root`). Don't add wide fixed-width elements that reintroduce horizontal scroll.
- Custom thin terracotta scrollbar is styled globally — leave it.

---

## Frontend architecture

### State (Redux Toolkit)

Slices in `src/store/slices/`:
- `uiSlice` — which modal/drawer is open. Always dispatch its `open*`/`close*`/`set*` actions rather than local open/close state. Full action list: `openLogin`, `openSearch`, `openBoxBuilder`, `openOccasions`, `openCheckout`, `setActiveProduct`, `setActiveOccasion`, `setPersonalizationProduct`, `openUserAccount`, `openCart`, `openWishlist` (and their close/clear counterparts).
- `authSlice` — current user, login/logout thunks.
- `cartSlice` — dual-mode: local (`addLocal`/`updateLocal`/`removeLocal`) for optimistic UI, server-synced thunks for authenticated users. On 401, the axios interceptor fires a `pc:logout` window event that the auth slice listens for.
- `productsSlice` — paginated product list; `normalize()` spreads all backend fields through automatically.
- `wishlistSlice` — wishlist items.

### API layer

- `src/api/axios.js` — configured instance. In dev, `VITE_API_BASE_URL` is unset so requests go to `/api` (Vite proxies to `localhost:8080`). In prod set `VITE_API_BASE_URL=https://api.prettycrafted.com`. Includes exponential-backoff retry for 408/429/502/503/504 and auto-logout on 401.
- `src/api/tokenStore.js` — in-memory JWT store (avoids XSS risk of localStorage). Token is also sent as `pc_token` HttpOnly cookie by the backend.
- `src/api/services.js` — all endpoint wrappers grouped by domain: `authApi`, `productsApi`, `cartApi`, `ordersApi`, `giftBoxApi`, `categoriesApi`, `promotionsApi`, `couponAdminApi`, `adminApi`, `uploadApi`, `productAdminApi`. Always call these, never `fetch` directly.

### Routing

`react-router-dom` v7. Pages in `src/pages/`. Route guards: `ProtectedRoute` (authenticated users), `AdminProtectedRoute` (ROLE_ADMIN).

### Other

- **SEO**: `react-helmet-async` via `src/components/SEO.jsx`.
- **Analytics/monitoring**: PostHog (`src/analytics.js`) + Sentry; wrapped in `ErrorBoundary`.

---

## Backend architecture

Standard Spring Boot layering under `backend/src/main/java/com/prettycrafted/giftbox/`:
`controller/` → `service/` → `repository/` → `domain/` (JPA entities), with `dto/` for transport and `config/` for security, CORS, rate limiting, OpenAPI, Cloudinary, async.

### Security — two filter chains

`SecurityConfig` registers two `SecurityFilterChain` beans (important to understand when adding endpoints):

1. **Chain 1 (Order 1, public)** — matches product/category reads, all `/auth/*` login flows, `/public/**`, webhook, Swagger. Has **no** `oauth2ResourceServer`, so the JWT filter is never registered. Stale cookies are silently ignored; requests always reach `permitAll()`.
2. **Chain 2 (Order 2, secured)** — everything else. Full JWT validation via `pc_token` cookie or `Authorization: Bearer` header. `/api/admin/**` and product/category writes require `ROLE_ADMIN`.

When adding a new endpoint: if it should be public, add it to Chain 1's `securityMatcher`. If it needs auth, leave it for Chain 2.

### Auth flow

JWT is HS256 signed with `APP_JWT_SECRET`. The `role` claim (`USER` or `ADMIN`) is mapped to Spring authorities as `ROLE_USER`/`ROLE_ADMIN`. `TokenVersionValidator` invalidates tokens when the user's token version is bumped (e.g. on password change). JWT is returned in the response body **and** set as an HttpOnly `pc_token` cookie.

### Other backend notes

- `DataSeeder` seeds initial data on startup (dev/prod).
- Payments: Razorpay. `RazorpayController` creates orders; `RazorpayWebhookController` handles async confirmations.
- Image uploads: Cloudinary via `UploadController` (admin only).
- Schema: Hibernate `ddl-auto=update` — new entity fields auto-migrate on deploy.
- `GlobalExceptionHandler` maps domain exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`) to HTTP status codes.

---

## Conventions

- Match the style of the file you're editing; read a neighbor first.
- Don't commit, push, or run outward-facing actions unless asked.
