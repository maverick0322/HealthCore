# Architecture & Technology Stack

This document explains the technical foundations of HealthCore, focusing on the *reasons* behind our choices.

## 🚀 The Tech Stack

| Technology | Role | Reason for Choice |
| :--- | :--- | :--- |
| **React 19** | UI Library | Leveraging the latest features (Actions, improved hooks) for a more declarative UI. |
| **Vite 8** | Build Tool | Extremely fast HMR and modern build pipeline. We chose v8 to stay ahead of the curve, despite minor plugin compatibility hurdles. |
| **Tailwind v3** | Styling | We specifically chose **v3** over v4 (for now) to ensure 100% stability with the **Shadcn UI** ecosystem and existing component templates. |
| **Shadcn UI** | Components | Provides high-quality, accessible primitives that we *own* (since code is copied into `shared/ui`), allowing for total customization without "library lock-in". |
| **React Router 7** | Routing | The industry standard for SPAs, providing powerful data loading patterns and a nested routing model. |
| **TanStack Query** | Data Fetching | Handles caching, loading states, and synchronization with the server state efficiently. |
| **Zustand** | State Management | A minimalist, performant alternative to Redux for global client-side state. |
| **Axios** | HTTP Client | Better interceptors and error handling defaults compared to native `fetch`. |
| **Vitest** | Testing | Native Vite integration for blazing-fast unit and integration testing. |

---

## 🏗️ Clean Architecture

The frontend follows a simplified **Clean Architecture** pattern to ensure the codebase remains maintainable as it grows.

### Directory Structure

```text
src/
├── core/       # Infrastructure & Global Config
├── features/   # Domain Modules (The "What")
├── shared/     # Reusable Primitives
└── main.tsx    # Composition Root
```

### Why this Architecture?

1. **Separation of Concerns**: By separating `core` (infrastructure) from `features` (business logic), we ensure that an update to our API client or Router doesn't require hunting through UI components.
2. **Feature-Based Slicing**: Instead of grouping by "type" (all components together, all hooks together), we group by **domain**. If you are working on "Workouts", everything related to it is in `features/workouts`. This reduces cognitive load.
3. **Decoupling from the Framework**: The logic inside `features` should ideally be independent of the specifics of how the data is fetched (Core) or how the UI is rendered (Shared).
4. **Consistency**: Clean Architecture provides a clear "place for everything," which is vital for team collaboration.

### Key Decisions

- **Path Aliases (`@/*`)**: We use absolute path aliases to avoid "breadcrumb hell" (`../../../../`). This makes moving files much easier.
- **Component Ownership**: UI components in `shared/ui` are low-level. If a component needs business logic, it belongs in a `features/` directory, not in `shared`.
- **Legacy Peer Deps**: We standardise on `--legacy-peer-deps` for installations to maintain compatibility between Vite 8 and early-stage plugins.
