# P2P Log Trace Analyzer 🔍

A high-performance, strictly-typed log analysis tool designed to parse and visualize Placetopay transaction logs. This application allows developers and support teams to quickly identify patterns, errors, and session flows from complex JSON logs.

## 🚀 Features

- **P2P Parser Engine**: Integrated with `@andrextor_ia11012/p2p-log-parser` for specialized log handling.
- **Support for Multiple Domains**:
  - **Checkout**: Token sessions, transaction IDs, and AWS request tracking.
  - **REST API**: Core API logs, including provider communication and Interdin flow.
  - **Micrositios**: Site-specific transaction patterns.
- **Intelligent Filtering**: Filter by log levels (DEBUG to CRITICAL), app types, and custom session IDs.
- **Visual Timelines**: Grouped event blocks with colombian time (es-CO) formatting.
- **Session Highlighting**: Instantly trace related logs across a complex stream.

## 🛠️ Technical Stack

- **Frontend**: [Vue 3](https://vuejs.org/) + [Astro](https://astro.build/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Linting & Formatting**: [BiomeJS](https://biomejs.dev/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)

## 🧞 Commands

All commands are run from the root of the project:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Builds the production site to `./dist/` |
| `npm run preview` | Previews the build locally |
| `npm run lint` | Runs BiomeJS lint and format checks |
| `npm run typecheck`| Runs Astro check and TypeScript validation |

## 👷 Project Structure

```text
/
├── .github/workflows/  # CI/CD (GitHub Actions)
├── public/             # Static assets
├── src/
│   ├── app/            # Main application layouts and views
│   ├── domains/        # Domain-specific logic (Checkout, REST)
│   ├── shared/         # Common types, UI helpers, and components
│   └── store/          # Pinia stores for global state
└── package.json
```

## 📄 License

MIT © [Iván Andrés López](https://github.com/andrextor)

