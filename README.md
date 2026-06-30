# SwiftMart - On-Demand E-Commerce Platform

SwiftMart is a modern, high-fidelity, real-time  e-commerce web application. The platform provides a customized user experience with three distinct access portals: **Store Managers**, **Customers**, and **Delivery Riders**. 

The system relies on real-time WebSockets to stream active orders to the manager dashboard, coordinate-based closest-store lookups, and auto-dispatch matching algorithms.

---

## Key Features

1. **Authentication Flow Control**:
   - Defaults to the **Register** view for first-time onboarding.
   - Transitions to the **Sign In** (Login) tab after successful registration, requiring manual credentials verification before dashboard access.
2. **Store Manager Dashboard**:
   - Automated store lookup (automatically matches and loads the managed store on login).
   - Dynamic inventory management (add new products & inline edit product properties directly in the stock table).
   - Real-time Active Orders Board (orders transition dynamically from PLACED → PACKING → DISPATCHED using WebSockets).
3. **Customer App**:
   - Browse store catalogs, add items to the cart, and clear active carts.
   - Coordinate-based closest-store validation for delivery simulation.
4. **Delivery Rider Portal**:
   - Check the available orders pool in the local area.
   - Accept and mark deliveries as fulfilled.
5. **Modern Design System**:
   - Glassmorphic panels, neon dark mode gradients, micro-interactions, and localized button loaders for asynchronous tasks.

---

## Project Structure

```
├── backend/            # FastAPI Backend Application
└── frontend/           # Vite React TypeScript Frontend
```

##  API Documentation

### Authentication (`/api/auth`)

| Method | Endpoint | Access Level | Description |
|--------|----------|--------------|-------------|
| **POST** | `/api/auth/register` | Public | Registers a new user account with a specific role (`STORE_MANAGER`, `CUSTOMER`, or `DELIVERY_RIDER`). |
| **POST** | `/api/auth/login` | Public | Authenticates user credentials and returns a JWT access token. |

---

### Dark Stores (`/api/stores`)

| Method | Endpoint | Access Level | Description |
|--------|----------|--------------|-------------|
| **POST** | `/api/stores` | Store Manager | Registers a new dark store with its name and location coordinates. |
| **GET** | `/api/stores/managed` | Store Manager | Retrieves the dark store managed by the currently authenticated store manager. |
| **GET** | `/api/stores/{store_id}/orders` | Store Manager | Retrieves all active orders assigned to the specified store. |

---

### Products & Inventory (`/api/products`)

| Method | Endpoint | Access Level | Description |
|--------|----------|--------------|-------------|
| **POST** | `/api/products` | Store Manager | Adds a new product with its name, price, and stock quantity to the manager's store. |
| **PATCH** | `/api/products/{product_id}` | Store Manager | Updates product details such as name, price, or stock using inline editing. |
| **GET** | `/api/products/search` | Public / Customer | Searches for available products across all stores using a query string. |

---

### Orders & Delivery (`/api/orders` & `/api/delivery`)

| Method | Endpoint | Access Level | Description |
|--------|----------|--------------|-------------|
| **POST** | `/api/orders` | Customer | Places a new order, matches it with the nearest eligible store, reserves stock, and creates the order. |
| **PATCH** | `/api/orders/{order_id}/status` | Store Manager | Updates the order status through the workflow: **PLACED → PACKING → DISPATCHED**. |
| **PATCH** | `/api/orders/{order_id}/deliver` | Delivery Rider | Marks a dispatched order as **DELIVERED** and completes the delivery process. |
| **GET** | `/api/delivery/orders/available` | Delivery Rider | Retrieves all dispatched orders currently waiting to be accepted or delivered by riders. |

---

### Live WebSocket Streams (`/ws`)

| Protocol | Connection Endpoint | Access Level | Description |
|----------|---------------------|--------------|-------------|
| **WebSocket (WS)** | `/ws/stores/{store_id}/live-orders` | Store Manager | Establishes a persistent WebSocket connection that pushes new order notifications and live status updates to the Store Manager dashboard in real time. |

---

### API Summary

| Module | Base Path | Purpose |
|--------|-----------|---------|
| Authentication | `/api/auth` | User registration and login with JWT authentication. |
| Dark Stores | `/api/stores` | Store registration, management, and order retrieval. |
| Products | `/api/products` | Product creation, inventory management, and product search. |
| Orders | `/api/orders` | Customer order placement and store order processing. |
| Delivery | `/api/delivery` | Rider order management and delivery completion. |
| WebSockets | `/ws` | Real-time order updates without page refresh. |
---

## Backend Setup Instructions

### Prerequisites
- **Python 3.10+**
- **PostgreSQL** database (a hosted Supabase instance is preset)
- **Redis** server (Upstash Redis is preset)

### 1. Installation
Navigate to the backend directory, create a Python virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
```
Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\activate
  ```
- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```
Install the package requirements:
```bash
pip install -r requirements.txt
```

### 2. Environment Variables (`.env`)
Create a `.env` file in the `backend/` folder
```ini
PORT=7000
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>"
REDIS_URL="rediss://default:<password>@<redis-host>:<port>"
ACCESS_TOKEN_EXPIRY=1440
SECRET_KEY="<your-secret-key-for-jwt>"
ALGORITHM=HS256
```

### 3. Running the Server
Launch the FastAPI application:
```bash
python main.py
```
The backend API server will run at `http://127.0.0.1:7000/`.

---

## Frontend Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### 1. Installation
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

### 2. Running the Development Server
Start the frontend dev environment:
```bash
npm run dev
```
The web application compiles and will run at `http://localhost:5173/`.

## 🎥 Project Demo

[![SwiftMart Demo]](https://www.youtube.com/watch?v=NGG3BavJaII)

👉 Click the thumbnail above to watch the complete project demonstration.
