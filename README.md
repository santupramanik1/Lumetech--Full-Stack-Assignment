# SwiftMart - On-Demand Hyperlocal E-Commerce Platform

SwiftMart is a modern, high-fidelity, real-time hyperlocal e-commerce web application. The platform provides a customized user experience with three distinct access portals: **Store Managers**, **Customers**, and **Delivery Riders**. 

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
  .\venv\Scripts\Activate.ps1
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
Create a `.env` file in the `backend/` folder (a preconfigured one exists):
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
The backend API server will run at `http://127.0.0.1:7000/`. You can view the automated Swagger documentation at `http://127.0.0.1:7000/docs`.

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
The web application compiles and will run at `http://localhost:5173/`. Open this address in your browser to interact with the UI portals.