# C208B APE III Performance (Uganda)

A web app that calculates take-off, landing and obstacle-clearance performance for the Cessna 208B on the Uganda programme. It reads values from the tables in *MAF Cockpit Printables – C208B – UGA* and works them out for the conditions you enter: weight, pressure altitude, temperature, wind, slope and runway lengths.

It's built with React 19 and Vite 8, hosted on Firebase Hosting, and installs as a Progressive Web App (PWA), so it works offline once it has been opened.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or newer (includes npm)
- [Git](https://git-scm.com/)
- The Firebase CLI, only if you will deploy: `npm install -g firebase-tools`

### 1. Clone the repo

```bash
git clone https://github.com/bsvsoftwarestudio/performance.git
cd performance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add the environment variables

The app reads its Firebase config from environment variables, and these are kept out of the repo. Copy the template:

```bash
cp .env.example .env.local
```

Then fill in the `VITE_FIREBASE_*` values. You can get them from the project maintainer, or from the Firebase console under **Project settings → General → Your apps**. `.env.local` is already in `.gitignore`, so don't commit it.

### 4. Run the dev server

```bash
npm run dev
```

Open the URL that Vite prints (usually http://localhost:5173). The page reloads by itself when you save a file.

## Scripts

| Command           | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Starts the local dev server with hot reload                          |
| `npm run build`   | Builds the production bundle into `dist/`                            |
| `npm run preview` | Serves the built `dist/` locally, which is useful for testing the PWA |
| `npm run lint`    | Lints the code with [Oxlint](https://oxc.rs)                         |
| `npm run deploy`  | Builds and deploys to Firebase Hosting (needs project access)        |

## Project structure

```
src/
  App.jsx            Main app: tabs (Take-off, Landing, Obstacles) and the settings they share
  firebase.js        Firebase initialisation (config comes from .env.local)
  components/        React UI: one component per tab, plus the tables and form fields
  utilities/         Performance calculations, with no React code in them
    groundroll.js, speeds.js, corrections.js                Take-off tables
    landingroll.js, landingdistance.js, landingcorrections.js Landing tables
    obstacleCalculator.js                                   Obstacle clearance
    limits.js, range.js, options.js                         Shared limits and input ranges
public/              Icons and favicons (copied as they are into the build)
vite.config.js       Vite and PWA config; injects the app version and build date
firebase.json        Hosting config: SPA rewrites and cache headers
```

## Working on the performance data

The `utilities/` files are the important part. The figures they produce are used for real flight planning, so please be careful when you change them:

- Each table file has a header comment that gives its **source document and page**. If you change a table, update the source reference too.
- Values are **interpolated linearly**. Inputs above a table's range throw an error, because the app never extrapolates. Inputs below the range are clamped to the conservative value, and the app shows a warning.
- Check any change to a table or calculation by hand against the printed charts before you open a pull request. Include a few worked examples in the PR description.

## Contributing

1. Create a branch from `main`: `git checkout -b my-change`
2. Make your changes, then run `npm run lint` and `npm run build` to check that nothing is broken.
3. Bump `version` in `package.json` for any change that users will notice. It is shown in the app header.
4. Push your branch and open a pull request against `main`.

## Deploying

Only maintainers with access to the `uganda-performance` Firebase project can deploy:

```bash
firebase login
npm run deploy
```

Installed copies of the PWA update themselves the next time they are opened online.
