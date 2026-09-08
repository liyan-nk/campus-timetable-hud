# Campus Timetable HUD 🎓⚡

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Capable-0052CC?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

A high-density, real-time tactical classroom timetable HUD and Progressive Web Application (PWA) built specifically for S3 CSE students. Designed around zero clutter, anti-slop ergonomics, offline capability, and instant situational awareness.

---

## 🚀 Key Features

- **⚡ Real-Time Dynamic Time Engine:** Calculates the active academic period, remaining seconds, progress percentage, passing periods, and upcoming classes dynamically based on campus slot definitions.
- **📅 S3 CSE Master Timetable:** Full support for Monday–Thursday 7-period schedules, Friday extended lunch break (12:30 PM – 2:00 PM), and afternoon lab blocks (Period 5–6 merged).
- **🕒 Human-Friendly 12-Hour Time Format:** Displays all class start/end times in crisp 12-hour format with AM/PM indicators (`9:00 AM`, `1:20 PM – 3:00 PM`).
- **🌗 Dual-Engine Light & Dark Themes:** Seamless toggle between **Tactical Dark Mode** (`Zinc-950`, `#09090b`) and **Paper Light Mode** (`Slate-50`, `#f8fafc`) with zero flash on load (anti-FOUC).
- **🛠️ Class Rep (CR) Live Quick-Overrides:** Passkey-authenticated admin interface allowing CRs to post emergency room swaps, faculty changes, or class cancellations stored in serverless **Neon PostgreSQL**.
- **📱 Progressive Web App (PWA):** Installs natively on iOS and Android devices, complete with a Service Worker caching core assets for offline usage during network dead zones.
- **⏱️ Time Simulator / Test Mode:** Integrated time-travel drawer for testing Friday schedules, edge-case break intervals, and class transitions.

---

## 🛠️ Architecture & Data Flow

```mermaid
graph TD
    User([Student Device]) -->|Renders UI| NextJS[Next.js App / React 18]
    NextJS -->|PWA Cache| SW[Service Worker / Cache Storage]
    NextJS -->|Local Math| TimeEngine[src/lib/timeResolver.ts]
    NextJS -->|12-Hr Formatting| FormatTime[src/lib/formatTime.ts]
    NextJS -->|Fetch Overrides| API[/api/overrides]
    API -->|Prisma Client| NeonDB[(Neon Serverless PostgreSQL)]
    CR([Class Representative]) -->|Auth & Write| CROverride[/cr-admin]
    CROverride -->|Persist Override| API
```

---

## 💻 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, React 18, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with Lucide React Icons |
| **State & Theme** | React Context + LocalStorage Anti-FOUC Inline Engine |
| **Database** | [Neon PostgreSQL](https://neon.tech/) (Serverless Pool) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Neon PostgreSQL Connection String (pooled connection recommended)
DATABASE_URL="postgres://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Class Representative Admin Passkey
CR_ADMIN_KEY="your-secure-admin-passkey"
```

---

## 🚀 Local Development Setup

1. **Clone Repository & Install Dependencies:**
   ```bash
   git clone https://github.com/liyan-nk/campus-timetable-hud.git
   cd campus-timetable-hud
   npm install
   ```

2. **Setup Database Schema:**
   ```bash
   npx prisma db push
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Verify Time Formatting Utilities:**
   ```bash
   node scripts/testFormatTime.mjs
   ```

---

## 📲 PWA Installation Guide

- **iOS (Safari):** Tap **Share** -> **Add to Home Screen**.
- **Android (Chrome):** Tap menu -> **Install App** / **Add to Home Screen**.
- **Desktop (Chrome/Edge):** Click the **Install Campus HUD** icon in the address bar.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
