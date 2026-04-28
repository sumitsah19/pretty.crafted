# PrettyCrafted Giftbox — Backend

Spring Boot REST API for the PrettyCrafted e-commerce platform. Handles auth, products, cart, custom gift boxes, orders, payments, and admin management.

## Tech Stack

- Java 21 · Spring Boot 4
- Spring Security (JWT via OAuth2 Resource Server)
- MySQL 8 · Spring Data JPA · Flyway migrations
- Razorpay payment gateway
- Spring Mail (Thymeleaf HTML emails)
- Bucket4j rate limiting · springdoc OpenAPI 2

## Prerequisites

- Java 21+
- Maven 3.9+
- MySQL 8.0+

## Setup

### 1. Clone

```bash
git clone https://github.com/sumitsah19/pretty.crafted.git
cd pretty.crafted
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default (dev only) |
|---|---|---|
| `DB_URL` | JDBC connection string | `jdbc:mysql://localhost:3306/prettycrafted?...` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `root` |
| `JWT_SECRET` | HS256 signing key (≥ 32 chars) | insecure dev fallback |
| `RAZORPAY_KEY_ID` | Razorpay API key | `rzp_test_placeholder` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `placeholder` |
| `MAIL_USERNAME` | SMTP username | _(empty)_ |
| `MAIL_PASSWORD` | SMTP app password | _(empty)_ |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

> **Never commit `.env` or real credentials to version control.**

### 3. Run

```bash
./mvnw spring-boot:run
```

The server starts at `http://localhost:8080`.  
Flyway runs migrations automatically on startup.

## API Documentation

Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Key Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| POST | `/api/auth/forgot-password` | Public | Request password reset email |
| POST | `/api/auth/reset-password` | Public | Reset password with token |
| GET | `/api/products` | Public | List products |
| GET | `/api/categories` | Public | List categories |
| POST | `/api/orders` | User | Place order |
| POST | `/api/orders/verify-payment` | User | Verify Razorpay payment |
| GET | `/api/admin/stats` | Admin | Dashboard analytics |
| PATCH | `/api/admin/products/{id}/stock` | Admin | Update stock |

## Security Notes

- JWT tokens are invalidated immediately when a user resets or changes their password (`tokenVersion` claim)
- Auth endpoints are rate-limited to 5 requests/minute per IP
- The `X-Forwarded-For` header is only trusted from private/loopback IPs (trusted proxies)
- All secrets must be supplied via environment variables in production — never use the dev defaults

## Project Structure

```
src/main/java/com/prettycrafted/giftbox/
├── config/        # Security, CORS, rate limiting, OpenAPI, Flyway validator
├── controller/    # REST controllers
├── domain/        # JPA entities
├── dto/           # Request / response records
├── exception/     # Global exception handler + custom exceptions
├── repository/    # Spring Data JPA repositories
└── service/       # Business logic

src/main/resources/
├── db/migration/  # Flyway SQL migrations
└── templates/     # Thymeleaf email templates
```
