# E-Commerce Demo (Spring Boot + HTML/CSS/JS)

This project implements a simple e-commerce system with the following modules:

- User Service (register, login, profile)
- Product Service (admin CRUD, public view)
- Cart Service (add/view/update/remove)
- Order Service (place orders, view history, admin status update)
- Payment Service (simulated payment + status)

## Tech Stack

- Java 21
- Spring Boot 3
- Spring Web + Spring Data JPA + Validation
- H2 in-memory database
- Plain frontend in `src/main/resources/static`

## Run

```powershell
cd "C:\Users\2503402\Downloads\project\project"
.\mvnw.cmd spring-boot:run
```

Open:

- App UI: `http://localhost:8080/`
- H2 Console: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:ecommerce`
  - User: `sa`
  - Password: (blank)

## API Overview

### User

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/profile`
- `PUT /api/users/profile`

### Product

- `POST /api/products` (ADMIN)
- `GET /api/products`
- `GET /api/products/{id}`
- `PUT /api/products/{id}` (ADMIN)
- `DELETE /api/products/{id}` (ADMIN)

### Cart

- `POST /api/cart/add`
- `GET /api/cart`
- `PUT /api/cart/{itemId}`
- `DELETE /api/cart/{itemId}`

### Order

- `POST /api/orders/place`
- `GET /api/orders`
- `PUT /api/orders/{orderId}/status` (ADMIN)

### Payment

- `POST /api/payments/process`
- `GET /api/payments/{paymentId}`

## Authentication Notes

- Login/Register returns a token.
- Public registration always creates a `USER` account (no admin self-registration).
- A default admin is auto-created on startup: `admin@shop.com` / `admin123`.
- Demo products are auto-seeded on first startup so the homepage has featured items.
- For protected APIs, set header: `Authorization: Bearer <token>`.
- This is a demo token system (in-memory) and uses plain-text passwords. Use Spring Security + hashed passwords for production.

