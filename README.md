# 💻 TrainHub Frontend — React 19 SPA

Modern, accessible web client for **TrainHub Training Center SaaS**, built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

- **Four Persona Workspaces**: Specialized dashboard layouts and feature sets for **Super Admin**, **Organization Admin**, **Instructor**, and **Student**.
- **Native Bilingual Support**: Complete localization in **English** and **Arabic** with automatic RTL layout flipping, font styling, and direction-aware icons.
- **Dual Runtime Architecture**:
  - **Fullstack Mode**: Connects to the ASP.NET Core API via Axios with JWT authentication and RFC 7807 problem details parsing.
  - **Standalone Preview Mode**: Runs completely offline or decoupled with rich client-side seed data in `localStorage` for instant demos.
- **Dark & Light Theme**: Built-in CSS variables theming with instant toggle and persistence.
- **Accessible Design**: Semantic HTML5 elements, ARIA landmarks, keyboard navigation, and focus management.

---

## 🚀 Getting Started

### Installation
```bash
cd TrainHub-Frontend
npm install
```

### Development Server
```bash
npm run dev
```
Starts the local development server on `http://localhost:5173`.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🛠️ NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Start HMR development server |
| `npm run build` | `tsc -b && vite build` | Compile TypeScript and bundle production assets to `dist/` |
| `npm run typecheck` | `tsc --noEmit` | Validate TypeScript types without emitting files |
| `npm test` | `node --test tests/*.test.mjs` | Execute 236 regression unit tests |
| `npm run lint` | `eslint .` | Lint source files |

---

## 🔐 Demo Credentials

Quick credentials available directly on the login page:

- **Super Admin**: `jordan.lee@trainhub.io` / `demo1234`
- **Org Admin**: `alex.morgan@trainhub.io` / `demo1234`
- **Instructor**: `sarah.jenkins@trainhub.io` / `demo1234`
- **Learner**: `david.kim@trainhub.io` / `demo1234`

---

## 🚢 Production Deployment

### Docker Deployment
A multi-stage `Dockerfile` is included:
```bash
docker build -t trainhub-frontend .
docker run -p 80:80 trainhub-frontend
```

### Vercel / Netlify
Configured with SPA rewrite rules (`vercel.json` and `public/_redirects`) to correctly route client-side deep links to `/index.html`.
