# Deployment Guide - Gymza

This project is a MERN stack application designed to be deployed as a single unit (Server serving the Client build).

## 🚀 Recommended Platforms
- **Render** (Recommended for easiest setup)
- **Railway**
- **Heroku**
- **Vercel/Netlify** (Only for client - would need separate backend hosting)

---

## 🛠️ Deployment Steps (Render/Railway)

### 1. Environment Variables
You MUST set the following variables in your hosting provider's dashboard:

**Backend:**
- `NODE_ENV`: `production`
- `PORT`: `5000` (or leave empty if provided by host)
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: A long random string
- `REFRESH_TOKEN_SECRET`: Another long random string
- `CLIENT_ORIGIN`: Your production URL (e.g., `https://gymza.onrender.com`)
- `CLOUDINARY_CLOUD_NAME`: (If using image uploads)
- `CLOUDINARY_API_KEY`: (If using image uploads)
- `CLOUDINARY_API_SECRET`: (If using image uploads)
- `REDIS_URL`: (Optional, if using cache)

**Frontend:**
- `VITE_API_URL`: `/api` (This ensures it uses the relative path on the same domain)

### 2. Build Commands
- **Build Command**: `npm run install-all && npm run build`
- **Start Command**: `npm start`

---

## 📦 Production Architecture
- The server is configured to serve the React production build from `client/dist`.
- All API calls should use the `/api` prefix.
- The `package.json` in the root directory manages both sub-projects for easier deployment.

## 🧪 Local Production Test
To test the production build locally:
1. `npm run build`
2. `set NODE_ENV=production` (Windows) or `export NODE_ENV=production` (Linux/Mac)
3. `npm start`
4. Open `http://localhost:5000`
