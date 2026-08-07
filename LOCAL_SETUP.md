# 🏋️ Gymza - Local Development Setup

All external dependencies (Vercel, Render, Redis, Cloudinary) have been removed. This project now runs **100% locally**.

## Prerequisites

1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - **Option A: Local Installation** - [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - **Option B: Docker** (Recommended for quick setup)
     ```powershell
     docker run -d -p 27017:27017 --name mongodb mongo:latest
     ```

## Quick Start

### Step 1: Start MongoDB
```powershell
# If using Docker
docker start mongodb

# If using local MongoDB installation
mongod --dbpath ./data
```

### Step 2: Start Backend Server
```powershell
cd server
npm install  # Only needed first time
npm run dev
```
- Server runs on: **http://localhost:5000**
- Health check: **http://localhost:5000/api/health**

### Step 3: Start Frontend Client
```powershell
# In a new terminal
cd client
npm install  # Only needed first time
npm run dev
```
- Client runs on: **http://localhost:5173**

### Step 4: Login
Open http://localhost:5173 and login with:
- **Email:** admin@gymza.com
- **Password:** Password123
- **Gym ID:** MAIN
- **Sign in as:** Admin

## What's Pre-configured

✅ **Backend (.env)**
- Local MongoDB: `mongodb://127.0.0.1:27017/gymza`
- JWT Secrets: Pre-configured for development
- Redis: Disabled (using in-memory cache fallback)
- Cloudinary: Disabled (local file uploads)

✅ **Frontend (.env)**
- API URL: `http://localhost:5000/api`
- WebSocket: `http://localhost:5000`

## Troubleshooting

### Port 5000 already in use
The server will automatically try ports 5001, 5002, etc. Check the console for which port it's running on.

### MongoDB connection failed
- Make sure MongoDB is running: `mongod --version`
- For Docker: `docker ps` should show the mongodb container

### Port 5173 already in use
```powershell
cd client
npm run dev -- --port 5174
```

## File Structure
```
server/
  ├── .env                 # ✅ All local config
  ├── server.js            # Express app with auto-fallback
  ├── config/
  │   ├── db.js           # MongoDB with local fallback
  │   └── redis.js        # Redis with in-memory fallback
  
client/
  ├── .env                # ✅ Points to localhost:5000
  ├── vite.config.ts
  └── src/

.env files are configured for localhost - no changes needed!
```

## Development Commands

**Backend**
```powershell
cd server
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production mode
npm run seed         # Manually seed database
```

**Frontend**
```powershell
cd client
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
```

## API Testing

Visit **http://localhost:5000/api/health** to verify the server is running.

Expected response:
```json
{
  "success": true,
  "message": "Server healthy",
  "data": {
    "dbReady": true,
    "totalUsers": 5,
    "adminExists": true,
    "gymId": "MAIN"
  }
}
```

## Database Seeding

The database automatically seeds on first run with:
- 1 Admin user
- 2 Trainer accounts
- 5 Member accounts
- 3 Gym Plans (Monthly, Quarterly, Yearly)
- Workout & Diet templates

If you want to reseed, run:
```powershell
cd server
npm run seed
```

## Notes

- No Vercel deployment files needed locally
- No Render.com configuration needed locally
- Redis will fallback to in-memory cache if unavailable
- Cloudinary disabled - uploads go to `/server/uploads` folder
- Socket.io for real-time features works locally on WebSocket

## Production Deployment

For deploying to Vercel/Render, configure environment variables in their dashboards instead of .env files.

---

**Ready to develop!** 🚀
