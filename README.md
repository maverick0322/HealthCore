# HealthCore

HealthCore is a comprehensive health and fitness management platform. 

## 📂 Repository Structure

- `apps/health-core`: Main React web application.
- `apps/health-core-desktop`: Placeholder for the future desktop client.
- `services/`: Backend microservices (pending).
- `docs/`: Technical documentation.

## 🛠️ Getting Started

To get the project running locally, please follow the **[Setup Guide](docs/setup.md)**.

## 🏗️ Architecture

For a deep dive into our technology stack and the reasons behind our architecture, see **[Architecture & Decisions](docs/architecture.md)**.

---

## 📜 Developer Guidelines

1. **Follow Clean Architecture**: Ensure logic is separated into `core`, `features`, and `shared`.
2. **Use Aliases**: Always use `@/` for internal imports.
3. **Compatibility**: When installing new packages, remember to use `--legacy-peer-deps` due to current Vite 8 plugin resolution.
