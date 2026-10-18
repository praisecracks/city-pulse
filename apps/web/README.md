# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Connecting the admin app to the API

The local Vite server proxies `/api/v1` to `http://localhost:5002` by default.
Start the backend in a separate terminal with `npm run dev` from
`city-pulse-backend` before signing in locally.

If the backend reports a different port, set `VITE_API_PROXY_TARGET` in
`apps/web/.env.local` to that backend origin (for example,
`http://localhost:5003`) and restart Vite. This is useful when a local
environment intentionally runs the backend on another port.

To use the deployed API while running the local web app, set `VITE_API_BASE`
in `apps/web/.env.local` to the API base URL, including `/api/v1`, and restart
Vite. Admin credentials are checked by whichever backend the web app is
currently using; local and deployed admin credentials may differ.

The contact page's Android download button uses `VITE_ANDROID_APP_DOWNLOAD_URL`.
Set it to the public EAS internal-distribution build URL in the production
environment and rebuild the site after each APK release. iOS availability is
shown separately.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
