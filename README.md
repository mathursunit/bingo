# SunSar Bingo 2026

A shared PWA for Sara & Sunit's 2026 Yearly Bingo.

## Features
- **Real-time Sync**: Updates instantly across devices using Firebase Firestore.
- **PWA**: Installable on iOS/Android.
- **Confetti**: Celebrates wins!
- **Edit Mode**: Customize the board goals.

## Development

```bash
npm install
npm run dev
```

## Deployment
This project is configured for Firebase Hosting / GitHub Pages.

**Firebase:**
1. `npm run build`
2. `firebase deploy`

**GitHub Pages:**
The project includes a CNAME in `public/` for `bingo.sunitmathur.com`.
You can configure a GitHub Action to build and deploy to the `gh-pages` branch.
