# Hockeylån frontend

This directory contains the React frontend for Hockeylån, a web application for administering loans and returns of hockey equipment.

The user interface is written in Swedish. The project documentation is maintained in English.

For the complete project overview, backend documentation, environment configuration, Docker Compose instructions, security considerations, backup procedures and production guidance, see the repository-level [`README.md`](../README.md).

## Main functionality

The frontend provides:

- Administrator login and logout.
- Protected administrator routes.
- Equipment creation, editing, activation and deactivation.
- Equipment search and filtering.
- QR-code display, download and browser-based scanning.
- Administrator-controlled loan registration.
- Active-loan and overdue-loan views.
- Loan return registration.
- Paginated and filterable loan history.
- Structured API-error presentation.
- Privacy, success and not-found pages.

Loan registration and equipment administration require an authenticated administrator session.

## Technology

The frontend uses:

- React 19.
- React Router.
- Axios.
- Vite.
- Tailwind CSS.
- html5-qrcode.
- Vitest.
- Testing Library.
- ESLint.

Exact dependency versions are locked in [`package-lock.json`](package-lock.json).

## Prerequisites

For local frontend development, install:

- Node.js 24, matching the CI environment.
- npm.

Docker builds use the Node.js image declared in [`Dockerfile`](Dockerfile).

## Install dependencies

Run these commands from the `frontend` directory:

```bash
npm ci
```

`npm ci` installs the exact dependency versions recorded in `package-lock.json`.

## Local development

Start the Vite development server:

```bash
npm run dev
```

By default, Vite listens on:

```text
http://localhost:5173
```

The frontend expects the Hockeylån backend API to be available under `/api`.

For the recommended local Docker or hybrid development setup, follow the repository-level [`README.md`](../README.md).

## Environment configuration

The supported frontend build variable is:

```dotenv
VITE_API_BASE_URL=/api
```

An example is available in [`.env.example`](.env.example).

Variables prefixed with `VITE_` are embedded into the browser bundle during the build. Passwords, tokens and other secrets must never be stored in a `VITE_*` variable.

The production configuration uses `/api` so browser requests remain on the same public origin as the frontend.

## Available commands

Run all commands from the `frontend` directory.

Start the development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Run the complete frontend test suite once:

```bash
npm run test:run
```

Run Vitest in watch mode:

```bash
npm test
```

Open the Vitest user interface:

```bash
npm run test:ui
```

Create a production build:

```bash
npm run build
```

Preview a completed production build locally:

```bash
npm run preview
```

## Docker and Nginx

The frontend uses a multi-stage Docker build:

1. Node.js installs locked dependencies and creates the Vite production build.
2. Nginx serves the generated static files.
3. Nginx proxies `/api` requests to `hockeylan-backend:8080`.
4. Nginx exposes an internal health endpoint at `/health`.
5. Security headers are loaded from [`security-headers.conf`](security-headers.conf).

The frontend container listens on port `80`.

In the server-specific production configuration, only the frontend joins the external `homelab_net` network. Nginx Proxy Manager reaches the application through:

```text
hockeylan-frontend:80
```

The backend remains reachable only through the internal application network and is not directly exposed through the external proxy network.

## Production deployment

Do not deploy the frontend independently from this directory.

The server deployment uses the following Compose files together:

```text
docker-compose.yml
docker-compose.prod.yml
docker-compose.server.yml
```

The public production address is:

```text
https://bkflagg.norops.se
```

Nginx Proxy Manager terminates HTTPS and forwards requests to the frontend container. The frontend Nginx instance serves the application and proxies `/api` requests to the backend.

The complete deployment procedure, environment configuration, storage layout, backup and restore instructions belong in the repository-level [`README.md`](../README.md).
