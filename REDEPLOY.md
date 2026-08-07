# 🚀 Gymza Scratch Deployment Guide

Follow these exact steps to deploy the entire project (Database, Server, and Frontend) from scratch.

---

## 1. 🍃 Database Setup (MongoDB Atlas)
1.  Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new **Cluster**.
3.  Go to **Database Access**: Create a user with "Read and Write to any database" permissions.
4.  Go to **Network Access**: Add IP address `0.0.0.0/0` (Allow access from anywhere).
5.  Go to **Deployment > Database**: Click "Connect" > "Drivers" > Copy the **Connection String**.
    *   *Example:* `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/gymza?retryWrites=true&w=majority`

---

## 2. 🌍 Backend Setup (Render)
1.  Log in to [Render](https://render.com).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings:**
    *   **Name:** `gymza-backend`
    *   **Environment:** `Node`
    *   **Build Command:** `npm install && npm install --prefix server`
    *   **Start Command:** `npm start --prefix server`
5.  **Environment Variables:** Add the following:
    *   `MONGO_URI`: (Your copied MongoDB connection string)
    *   `JWT_ACCESS_SECRET`: `super_secret_access_key_123`
    *   `JWT_REFRESH_SECRET`: `super_secret_refresh_key_456`
    *   `CLIENT_ORIGIN`: `https://your-vercel-domain.vercel.app` (You can update this after Vercel is live)
    *   `NODE_ENV`: `production`
    *   `PORT`: `5000`
    *   `REDIS_URL`: (Optional - use Upstash Redis for caching)

---

## 3. 🎨 Frontend Setup (Vercel)
1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New** > **Project**.
3.  Import your GitHub repository.
4.  **Project Settings:**
    *   **Root Directory:** Select the `client` folder.
    *   **Framework Preset:** Vite.
5.  **Environment Variables:** Add the following:
    *   `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`
6.  Click **Deploy**.

---

## 4. 🔗 Final Connection (CORS)
Once Vercel gives you your live URL (e.g., `https://gymza-nine.vercel.app`):
1.  Go back to your **Render Dashboard**.
2.  Edit the `CLIENT_ORIGIN` environment variable.
3.  Set it to your Vercel URL: `https://gymza-nine.vercel.app`.
4.  **Save Changes**. Render will restart the server.

---

## 🔑 Default Login Credentials
After deployment, the server will automatically seed the database if it's empty.
*   **Gym ID:** `MAIN`
*   **Email:** `admin@gymza.com`
*   **Password:** `Password123`

---

## 🛠️ Troubleshooting
1.  **CORS Error**: Ensure `CLIENT_ORIGIN` in Render matches your Vercel URL exactly (no trailing slash).
2.  **404 on Refresh**: Ensure the `client/vercel.json` file is present in your repo.
3.  **Invalid Credentials**: Check your Render logs to see if "Auto-seed complete" was printed.
