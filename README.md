# Rsbuild Project

## Getting Started

Follow the steps below to set up and run the project locally.

### Prerequisites

Ensure the following tools are installed on your system:

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)

### 1. Install Dependencies

Install the project dependencies using Yarn:

```bash
yarn install
```

### 2. Environment Configuration

Copy the example environment file to create your local `.env` file:

```bash
cp .env.example .env
```

Open the `.env` file and configure the required environment variables.

> **Note:** Make sure all required environment variables are configured before starting the application.

### 3. Start the Development Server

Run the following command to start the development server:

```bash
yarn run dev
```

Once the server starts, open the application in your browser:

**http://localhost:3001**

## Available Scripts

| Command | Description |
|---|---|
| `yarn install` | Install project dependencies. |
| `yarn run dev` | Start the development server. |
| `yarn run build` | Build the application for production. |
| `yarn run preview` | Preview the production build locally. |

### Build for Production

To create a production build, run:

```bash
yarn run build
```

The generated build files will be available in the output directory configured in the Rsbuild project.

### Preview the Production Build

To preview the production build locally, run:

```bash
yarn run preview
```

## Learn More

For additional information, refer to the following resources:

- [Rsbuild Documentation](https://rsbuild.rs/) — Learn about Rsbuild features, configuration, and APIs.
- [Rsbuild GitHub Repository](https://github.com/web-infra-dev/rsbuild) — Explore the source code, report issues, and contribute to the project.

## Contributing

Before submitting changes, ensure that the application builds successfully and that any relevant tests pass.

## License

Specify the project license here, if applicable.