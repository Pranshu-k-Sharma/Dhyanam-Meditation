# Futuristic Meditation Website

A calm, immersive meditation landing experience built with React + Vite, Tailwind CSS, and Framer Motion.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## Tech Stack

- React (Vite)
- Tailwind CSS
- Framer Motion

## Realtime Circle Presence (Optional)

The group circle page supports two participant-presence modes:

- Local fallback (default): works in local browser context using localStorage events.
- Cross-device realtime: enabled when Firebase Realtime Database env vars are configured.

To enable cross-device mode:

1. Copy `.env.example` to `.env`.
2. Fill all `VITE_FIREBASE_*` values from your Firebase project.
3. Restart the dev server.
