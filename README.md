# NGON Restaurant

NGON Restaurant is a full-stack restaurant ordering application. It provides a customer-facing website for browsing the menu and placing orders, together with an administration dashboard for managing meals, users, orders, coupons, and sales statistics.

## Features

### Customer website

- Browse meals by category: noodles, rice, banh mi, and drinks
- Register and verify an account with an OTP code
- Log in, log out, change a password, and reset a forgotten password
- Manage delivery addresses and profile information
- Add meals to a cart and place orders
- Apply coupons to orders
- Track delivery and completed orders
- View total spending and cancel eligible orders

### Administration dashboard

- Authenticate administrators with OTP verification
- Create, update, enable, disable, and delete menu items
- Upload meal images
- View users and orders
- Update order delivery status
- Manage coupons
- View order, revenue, and best-selling-meal statistics

## Technology stack

- **Frontend:** React 18, React Router, Redux, Redux Thunk, Material UI, Axios
- **Admin dashboard:** React 18, Material UI, Redux, Recharts
- **Backend:** Node.js, Express, Mongoose, JWT
- **Database:** MongoDB
- **Email:** Nodemailer
- **Deployment:** Docker and Docker Compose with Nginx

## Project structure

```text
.
├── PE/                 # Express API and MongoDB integration
│   ├── controller/     # Request handlers and utilities
│   ├── db/             # Database connection
│   ├── middleware/     # User and administrator authentication
│   ├── models/         # Mongoose schemas
│   ├── routers/        # User and admin API routes
│   └── public/         # Uploaded images
├── ngon-master/        # Customer-facing React application
├── ngon-admin/         # Administrator React dashboard
├── docker-compose.yml  # Full-stack Docker configuration
└── report.pdf          # Project report
```

## Requirements

- Node.js 18 or later
- npm
- MongoDB 6 or later, or Docker Desktop

## Configuration

Create the following local environment files. Do not commit real credentials or secret keys.

### Backend: `PE/.env`

```env
MONGODB_URL=mongodb://127.0.0.1:27017/ngon_db
JWT_KEY=replace-with-a-long-random-secret
PORT=3000
```

### Customer website: `ngon-master/.env`

```env
REACT_APP_API_URL=http://localhost:3000
```

### Admin dashboard: `ngon-admin/.env`

```env
REACT_APP_API_URL=http://localhost:3000
```

The backend also requires valid SMTP credentials when email verification or password recovery is enabled. Keep those credentials in environment variables rather than source code.

## Run locally

Open three terminals from the repository root.

### 1. Start the backend

```bash
cd PE
npm install
npm start
```

The API runs on `http://localhost:3000`.

### 2. Start the customer website

```bash
cd ngon-master
npm install
npm start
```

The customer website runs on `http://localhost:3000` by default. If the backend is already using that port, set a different React development port when starting the frontend.

### 3. Start the admin dashboard

```bash
cd ngon-admin
npm install
npm start
```

The React development server will select an available port if the default port is already in use.

## Run the Program

Services:

| Service | URL / port |
|---|---|
| Customer website | `http://localhost` |
| Admin dashboard | `http://localhost:81` |
| Backend API | `http://localhost:3000` |
| MongoDB | `localhost:27017` |

## API route groups

The backend exposes routes for:

- Public menu queries under `/ngon/menu`
- Customer authentication and account management under `/users`
- Customer orders, addresses, coupons, and password recovery
- Administrator authentication under `/login` and `/admin`
- Meal and image management under `/ngon`
- Order management under `/OrderList`
- Dashboard statistics under `/dashboard`

Protected routes require the JWT returned during authentication. Administrator routes use a separate administrator authentication middleware.

## Available npm scripts

### Backend (`PE`)

```bash
npm start
```

Starts the API with Nodemon and loads variables from `PE/.env`.

### Customer and admin applications

```bash
npm start   # Start the development server
npm run build
npm test
```


