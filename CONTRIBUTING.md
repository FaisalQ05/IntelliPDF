# Contributing to IntelliPDF

First off, thank you for considering contributing to IntelliPDF! 🎉

We welcome bug reports, feature requests, documentation improvements, and code contributions. Please take a moment to read these guidelines before submitting a pull request.

---

# Getting Started

## 1. Fork the Repository

Fork the repository to your GitHub account and clone it locally.

```bash
git clone https://github.com/<your-username>/IntelliPDF.git
cd IntelliPDF
```

---

## 2. Install Dependencies

### Server

```bash
cd server
pnpm install
```

### Client

```bash
cd client
pnpm install
```

---

## 3. Configure Environment Variables

Create local environment files.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update the required API keys and configuration before running the application.

---

## 4. Start Development

Start the required infrastructure.

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis qdrant
```

Run the backend.

```bash
cd server
pnpm dev
```

Run the frontend.

```bash
cd client
pnpm dev
```

---

# Development Guidelines

* Follow the existing project structure.
* Write clear, readable, and maintainable code.
* Keep pull requests focused on a single feature or bug fix.
* Avoid unrelated refactoring in the same PR.
* Never commit secrets, API keys, or `.env` files.
* Update documentation whenever behavior changes.

---

# Code Style

Before opening a pull request, run the relevant checks.

### Client

```bash
pnpm lint
pnpm typecheck
pnpm build
```

### Server

```bash
pnpm build
```

Ensure your changes build successfully before submitting.

---

# Commit Messages

Use descriptive commit messages.

Examples:

```
feat: add document sharing

fix: resolve PDF upload validation

docs: improve README architecture section

refactor: simplify queue worker
```

---

# Pull Requests

Please include:

* A clear description of the change.
* Screenshots or GIFs for UI updates.
* Documentation updates when necessary.
* Database migrations if the schema changes.

Small, focused pull requests are appreciated.

---

# Reporting Issues

When opening an issue, please include:

* A clear description of the problem.
* Steps to reproduce.
* Expected behavior.
* Actual behavior.
* Screenshots or logs (if applicable).

---

# Feature Requests

Feature requests are welcome.

Please explain:

* The problem you're trying to solve.
* Your proposed solution.
* Any alternative approaches you've considered.

---

# Questions

If you have questions about the project, feel free to open a discussion or issue.

Thank you for helping improve IntelliPDF! 🚀
