# 🚀 GitMatch: Discover Your Next Favorite Repo

[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/sharfuddin-shawon/GitMatch/ci.yml?branch=main&style=for-the-badge&logo=github&label=CI/CD)](https://github.com/sharfuddin-shawon/GitMatch/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/sharfuddin-shawon/GitMatch/actions)
[![Code Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/sharfuddin-shawon/GitMatch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**GitMatch** is a swipe-based discovery tool designed for developers who are tired of endless scrolling and want to find projects that actually matter. Whether you're looking for your next side project, a library to use at work, or an open-source repo to contribute to, GitMatch surfaces the best of GitHub through an intuitive Tinder-like interface.

---

## ✨ Features

- **🔥 Swipe-to-Discover:** Quickly filter through thousands of repositories with simple gestures.
- **🧠 Personalized Feed:** Our recommendation engine learns from your 'Likes' and 'Passes' to surface high-priority projects.
- **🔐 Secure Authentication:** Seamless login via GitHub and Google.
- **📂 Stash Collections:** Save your favorite discoveries into custom collections for later.
- **⚡ High Performance:** Built with **React 19** and **Vite** for near-instant interactions.
- **🎨 Modern UI:** Fluid animations powered by **Motion (React)** and styled with **Tailwind CSS 4**.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State & DB:** [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Animations:** [Motion](https://motion.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [Google Gemini API](https://ai.google.dev/) (for smart tagging and recommendations)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v22+)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sharfuddin-shawon/GitMatch.git
   cd GitMatch
   ```

2. **Install dependencies:**
   ```bash
   make install # or npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Run development server:**
   ```bash
   make dev # or npm run dev
   ```

### Quality Gates

We use a `Makefile` to manage quality gates:
- `make lint`: Run ESLint.
- `make typecheck`: Run TypeScript compiler check.
- `make coverage`: Run Vitest with coverage report.
- `make build`: Verify production build.

---

## 📸 Preview

*(Coming Soon: Add a high-quality GIF of the swiping interaction here!)*

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve GitMatch, please follow these steps:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for the Open Source Community
</p>
