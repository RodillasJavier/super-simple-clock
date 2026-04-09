# Super Simple Clock

A minimal Pomodoro timer and stopwatch. No framework, no build step — just HTML, Tailwind (CDN), and vanilla JS.

## Features

- **Pomodoro** — 25 min focus / 5 min break cycles, auto-switches phases, loops continuously
- **Stopwatch** — counts up freely
- Click **Focus** or **Break** to switch phases manually
- Click the time display to edit the duration inline (Pomodoro mode only)
- Progress bar fills left-to-right and shifts from slate → amber → red in the final 20%
- Web Notifications when a Pomodoro phase completes
- Tab title reflects current time and mode
- Fullscreen mode (`F` key or button)

## Usage

Visit the site hosted on GitHub Pages: [Super Simple Clock](https://rodillasjavier.github.io/super-simple-clock/)

Alternatively, you can open `index.html` in a browser — no install required.

## Development

```bash
npm install       # install dev tooling (ESLint + Prettier)
npm run lint      # ESLint on script.js and index.html
npm run format    # Prettier auto-format
npm run check     # format check + lint (CI)
```

Format-on-save works out of the box with the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) VS Code extensions (recommended in `.vscode/extensions.json`).

## Files

| File               | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `index.html`       | Markup + Tailwind CDN + minimal `<style>` for pseudo-elements |
| `script.js`        | All state, timer logic, and event wiring                      |
| `style.css`        | Replaced by Tailwind — kept as a placeholder                  |
| `eslint.config.js` | ESLint (JS + HTML inline scripts)                             |
| `.prettierrc`      | Prettier config with Tailwind class sorting                   |
