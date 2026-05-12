# S&OP PRO - React Frontend + Python Backend

This project is a fully functional S&OP (Sales and Operations Planning) application. It features a beautiful **React/Tailwind CSS frontend** and a robust **Python FastAPI backend** connected to **Microsoft SQL Server**.

We have completely removed Node.js from the backend. The architecture is now perfectly sorted:

- **`/` (Root Folder)**: Contains the React/Vite Frontend.
- **`/backend`**: Contains the Python FastAPI Backend.

## How to Run Locally

### 1. Start the Python Backend

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your Database Credentials:
   - Rename `.env.example` to `.env`.
   - Open `.env` and update the values to match your MS SQL Server instance.
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend is now running on `http://localhost:8000`.*

### 2. Start the React Frontend

1. Open a **new** terminal window and navigate to the **root folder** of the project.
2. Install the Node.js dependencies for the frontend (Node.js is only used to build/serve the React UI, not as a backend server):
   ```bash
   npm install
   ```
3. **Connect Frontend to Python Backend**:
   - Open `vite.config.ts` in the root folder.
   - Remove `mockApiPlugin()` from the plugins array.
   - Add the proxy configuration to point to your Python backend:
     ```typescript
     server: {
       port: 3000,
       host: '0.0.0.0',
       proxy: {
         '/api': {
           target: 'http://localhost:8000',
           changeOrigin: true,
         }
       }
     },
     ```
4. Run the React frontend:
   ```bash
   npm run dev
   ```
   *The frontend is now running on `http://localhost:5173` (or the port Vite assigns).*

## Architecture Details

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Python 3, FastAPI, PyODBC (for MS SQL Server).
- **Database**: Microsoft SQL Server. The Python backend will automatically create all necessary tables (`clients`, `products`, `forecasts`, `crm_leads`, `action_items`, `purchase_orders`, etc.) the first time it connects.
