# Pretty.Crafted 🎁

A full-stack e-commerce platform for handcrafted gifts — built with Spring Boot and React.

> Browse curated handmade products, build custom gift boxes, and complete orders with Razorpay payment integration.

---

## Project Structure

```
pretty.crafted/
├── backend/          # Spring Boot REST API
│   ├── src/
│   │   ├── main/java/com/prettycrafted/giftbox/
│   │   │   ├── config/        # Security, CORS, web config
│   │   │   ├── controller/    # REST endpoints
│   │   │   ├── domain/        # JPA entities
│   │   │   ├── dto/           # Request/response records
│   │   │   ├── exception/     # Global exception handling
│   │   │   ├── repository/    # Spring Data JPA repos
│   │   │   ├── service/       # Business logic
│   │   │   └── seed/          # Dev data seeder
│   │   └── main/resources/
│   │       ├── application.properties
│   │       ├── templates/     # Thymeleaf email templates
│   │       └── db/migration/  # Flyway migrations
│   ├── pom.xml
│   └── .env.example
├── frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── api/           # Axios client & service methods
│   │   ├── components/    # Nav, modals, UI components
│   │   ├── pages/         # HomePage, AdminPage, VerifyEmailPage
│   │   ├── store/         # Redux Toolkit slices
│   │   └── hooks/         # useWindowWidth, useDebounce
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Frontend  | React 18, Vite, Redux Toolkit, React Router, Axios |
| Styling   | Inline styles (design-system tokens), Tailwind CSS |
| Backend   | Spring Boot 3.4, Spring Security, Spring Data JPA  |
| Database  | MySQL 8                                            |
| Auth      | JWT (HttpOnly cookie) + Google OAuth2              |
| Payments  | Razorpay                                           |
| Email     | Spring Mail / Gmail SMTP + Thymeleaf templates     |
| Build     | Maven Wrapper (backend), npm (frontend)            |

---

## Features

- **Product catalogue** — filter by category, recipient, price; full-text search
- **Custom gift boxes** — drag-and-drop box builder with size/ribbon options
- **Cart & checkout** — server-side cart, Razorpay payment, COD option
- **Auth** — email/password + Google OAuth2, email verification, password reset
- **Orders** — real-time status timeline, admin status updates
- **Admin dashboard** — KPI stats, product CRUD, order management
- **Wishlist** — persist wishlist via Redux
- **Occasions** — curated gift sets per occasion
- **Responsive** — mobile-first design, sticky navbar, slide-up modals

---

## Setup

### Prerequisites

- Java 21+
- Maven 3.9+ (or use the `mvnw` wrapper)
- Node.js 20+ / npm 9+
- MySQL 8 running locally

---

### Backend

```bash
cd backend

# Copy env template and fill in values
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, GOOGLE_CLIENT_ID, etc.

# Run (dev profile — uses ddl-auto=update, swagger enabled)
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local"
# Windows:
mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local"
```

The API starts on **http://localhost:8080**.  
Swagger UI: **http://localhost:8080/swagger-ui.html** (when `SWAGGER_ENABLED=true`)

#### application-local.properties (not committed)

Create `backend/src/main/resources/application-local.properties` for local overrides:

```properties
spring.jpa.hibernate.ddl-auto=update
spring.flyway.enabled=false
springdoc.api-docs.enabled=true
springdoc.swagger-ui.enabled=true
app.google.client-id=YOUR_GOOGLE_CLIENT_ID
app.cookie.secure=false
```

---

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.development
# Set VITE_GOOGLE_CLIENT_ID to your Google OAuth client ID

# Start dev server (proxies /api → http://localhost:8080)
npm run dev
```

The app starts on **http://localhost:5173**.

#### Production build

```bash
npm run build   # outputs to frontend/dist/
```

Copy `dist/` contents to the Spring Boot `src/main/resources/static/` folder, or serve via Nginx/CDN.

---

## Environment Variables

### Backend (`backend/.env.example`)

| Variable              | Description                              | Default                    |
|-----------------------|------------------------------------------|----------------------------|
| `DB_URL`              | MySQL JDBC connection URL                | localhost:3306/prettycrafted |
| `DB_USERNAME`         | MySQL username                           | root                       |
| `DB_PASSWORD`         | MySQL password                           | *(empty)*                  |
| `JWT_SECRET`          | 64-char random string for signing JWTs   | dev-only placeholder       |
| `GOOGLE_CLIENT_ID`    | Google OAuth2 client ID                  | —                          |
| `RAZORPAY_KEY_ID`     | Razorpay API key ID                      | —                          |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret                      | —                          |
| `MAIL_USERNAME`       | Gmail address for sending emails         | *(empty — logs to console)*|
| `MAIL_PASSWORD`       | Gmail App Password                       | —                          |
| `SENTRY_DSN`          | Sentry error-tracking DSN (optional)     | —                          |
| `COOKIE_SECURE`       | Set `false` for local HTTP dev           | true                       |

### Frontend (`frontend/.env.example`)

| Variable               | Description                              |
|------------------------|------------------------------------------|
| `VITE_API_BASE_URL`    | API base path (`/api` in dev, full URL in prod) |
| `VITE_GOOGLE_CLIENT_ID`| Google OAuth2 client ID                  |

---

## API Overview

| Method | Path                              | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | /api/auth/register                | Register new user            |
| POST   | /api/auth/login                   | Email + password login       |
| POST   | /api/auth/google                  | Google OAuth2 login          |
| GET    | /api/auth/verify-email?token=     | Verify email address         |
| POST   | /api/auth/forgot-password         | Send reset link              |
| GET    | /api/products                     | List products (paginated)    |
| GET    | /api/products/popular             | Popular products             |
| GET    | /api/cart                         | Get cart                     |
| POST   | /api/cart/items                   | Add item to cart             |
| POST   | /api/orders                       | Place order                  |
| POST   | /api/orders/:id/payment/verify    | Verify Razorpay payment      |
| GET    | /api/admin/stats                  | Admin KPI dashboard          |
| PATCH  | /api/admin/orders/:id/status      | Update order status          |

Full spec: `http://localhost:8080/swagger-ui.html` (enable `SWAGGER_ENABLED=true`)

---

## Future Improvements

- [ ] Product image upload (S3 / Cloudinary)
- [ ] Pagination on admin order/product lists
- [ ] Saved addresses via API (currently local state)
- [ ] Push/email notifications for order status
- [ ] Review & rating system
- [ ] Coupon/discount code engine
- [ ] PWA support

---

## License

MIT © 2026 Pretty.Crafted
