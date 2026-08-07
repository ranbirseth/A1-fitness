# 🏋️‍♂️ Gymza - Modern Gym Management System

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/gymza?style=for-the-badge&color=ffd700)](https://github.com/yourusername/gymza/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/yourusername/gymza?style=for-the-badge&color=007bff)](https://github.com/yourusername/gymza/network/members)
[![License](https://img.shields.io/github/license/yourusername/gymza?style=for-the-badge&color=28a745)](LICENSE)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://gymza.vercel.app)

**Gymza** is a production-ready, full-stack gym management platform designed to streamline operations for gym owners, trainers, and members. Built with the MERN stack and enhanced with real-time capabilities, it offers a seamless experience for tracking attendance, managing memberships, and optimizing workout plans.

---

## 🚀 Live Demo & Status

- **Live Demo:** [https://gymza.vercel.app](https://gymza.vercel.app)
- **API Status:** ![API Status](https://img.shields.io/website?url=https%3A%2F%2Fgymza-api.render.com%2Fapi%2Fhealth&style=flat-square)
- **Frontend Status:** ![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=flat-square)

---

## 📸 Preview

<details>
<summary><b>View App Screenshots</b></summary>

| Dashboard | Attendance Tracking | Member Management |
| :---: | :---: | :---: |
| ![Dashboard](https://via.placeholder.com/800x450?text=Gymza+Dashboard) | ![Attendance](https://via.placeholder.com/800x450?text=QR+Attendance) | ![Members](https://via.placeholder.com/800x450?text=Member+List) |

</details>

---

## 📑 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 About The Project

### The Problem
Traditional gym management often involves fragmented systems or manual spreadsheets for tracking memberships, attendance, and payments. This leads to administrative overhead, errors in subscription tracking, and a disconnected experience for members and trainers.

### The Solution
**Gymza** provides a centralized hub for all gym-related activities. By integrating real-time notifications, automated expiry reminders, and a secure QR attendance system, Gymza reduces administrative burden and enhances member engagement through personalized workout and diet plans.

---

## ✨ Key Features

### 🔐 Multi-Role Access Control (RBAC)
- **Superadmin:** Full system control, gym configuration, and management of all admins.
- **Admin:** Manage members, trainers, plans, and payments.
- **Trainer:** Create and assign workout/diet plans to members.
- **Member:** Track personal progress, attendance history, and view assigned plans.

### 📡 Real-time Ecosystem
- **Instant Notifications:** Real-time alerts via Socket.io for check-ins, payment updates, and plan assignments.
- **Live Attendance Dashboard:** Watch gym occupancy in real-time.

### 🎫 Smart Attendance
- **QR Code Check-in:** Members can mark attendance instantly using their unique QR codes.
- **Manual Overrides:** Admins can manually log attendance if needed.

### 💳 Financial Management
- **Subscription Tracking:** Automated monitoring of membership validity.
- **Payment History:** Detailed logs of all transactions with PDF receipt generation (planned).

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **State Management:** Zustand
- **Styling:** TailwindCSS & Glassmorphism UI
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Real-time:** Socket.io-client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Caching:** Redis (with in-memory fallback)
- **Real-time:** Socket.io
- **Validation:** Zod
- **Logging:** Winston & Morgan

### Infrastructure
- **Authentication:** JWT (JSON Web Tokens) with Cookie storage
- **Image Storage:** Cloudinary
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🏗 Architecture

Gymza follows a modern client-server architecture:

1.  **Client Layer:** A responsive React SPA that communicates with the API via Axios. Uses Zustand for lightweight global state.
2.  **API Layer:** RESTful Express server with role-based middleware for security.
3.  **Real-time Layer:** Socket.io server for push notifications and live updates.
4.  **Data Layer:** MongoDB for persistent storage, Redis for performance-critical caching.

---

## 📂 Folder Structure

```bash
gymza/
├── client/                # React Frontend
│   ├── src/
│   │   ├── api/          # Axios configurations
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature-based logic
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route components
│   │   ├── store/        # Zustand state stores
│   │   └── styles/       # CSS & Tailwind configurations
├── server/                # Express Backend
│   ├── config/           # Database & Third-party configs
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Auth & Error middlewares
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic & Cache services
│   └── utils/            # Helper functions
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local instance
- Redis instance (optional, fallback to in-memory)
- Cloudinary account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/gymza.git
   cd gymza
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm install
   # Create .env file based on Environment Variables section
   npm run dev
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   # Create .env file
   npm run dev
   ```

---

## 🔑 Environment Variables

### Server (`/server/.env`)
| Variable | Description |
| :--- | :--- |
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `REDIS_URL` | Redis connection URL |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_ORIGIN` | Allowed CORS origin |

### Client (`/client/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## 🗺 API Documentation

| Endpoint | Method | Description | Auth |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Authenticate user | Public |
| `/api/members` | GET | List all members | Admin+ |
| `/api/attendance` | POST | Mark attendance | Public/QR |
| `/api/plans` | GET | Fetch gym plans | Public |
| `/api/dashboard` | GET | Stats & Analytics | Admin+ |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

<p align="center">Made with ❤️ for the Fitness Community</p>
