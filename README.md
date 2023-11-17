# NestJs Prisma template

Table of contents:

1. [Development environment](#development-environment)

   1. [Requirements](#requirements)
   1. [Setup](#setup)

1. [Testing](#testing)

   1. [Running tests via Docker](#running-tests-via-docker)
   1. [Running tests locally](#running-tests-locally)

1. [Database](#database)

   1. [Applying existing migrations](#applying-existing-migrations)
   1. [Creating new migrations](#creating-new-migrations)
   1. [Seeding the database](#seeding-the-database)

1. [Project structure](#project-structure)

   1. [Example component structure](#example-component-structure)

1. [Style guide](#style-guide)
1. [Architecture](#architecture)
1. [New environment setup](#new-environment-setup)
1. [Commit Message Format](#commit-message-format)
1. [Release Process](#release-process)

## Development environment

### Requirements

All environment variables are already configured for local development.

All scripts inside the project require sh to be run. Running the project on Windows is not supported out of the box but can be achieved via WSL.

The following tools must be installed:

- sh
- git
- docker
- docker-compose
- node (nvm is preferred)
- npm
- a code editor with prettier extension installed (optional)

---

**⚠️ WARNING**

Arm (Apple Silicon) architecture is not supported at the moment.

---

### Setup

Copy the project via the following command:

```bash
git clone <url>
```

Checkout the directory:

```bash
cd <project folder>
```

Install dependencies:

```bash
npm install
```

Build the api service:

```bash
docker-compose -f ./docker/docker-compose.yml build app
```

Apply database migrations to the database:

```bash
npm run prisma:migrate
```

Run the application:

---

**ℹ️ NOTE**

This command starts the service in watch mode. All your changes to the source code should be picked up automatically. Compilation can take a lot of time.

---

```bash
docker-compose -f ./docker/docker-compose.yml up
```

After compilation is finished the application will be available at http://localhost:3030.

You can visit Swagger documentation at http://localhost:3030/api to verify correct installation. You can test out some API endpoints without an account.

---

## Testing

All development tasks must be done via tests, this section describes how this is done.

At the moment, there 3 two options for running the tests:

- Docker;
- Locally (only infrastructure is run via Docker);
- GitLab CI.

Environment variables for all environments are configured in the [docker/testing/.e2e.env](./docker/testing/.e2e.env)

All test commands will fully configure the environment for testing, there are no other commands that need to be run.

Infrastructure (database, etc) will be created for each run individually and destroyed after the tests.

---

**ℹ️ NOTE**

In general, running tests locally can be faster (advised for local development). But running tests in Docker replicates production environment as close as possible.

Running e2e tests can take huge amount of time. It's strongly advised to run only required spec files and make use of Jest `.only` method (Documentation is [here](https://jestjs.io/docs/api#describeonlyname-fn) and [here](https://jestjs.io/docs/api#testonlyname-fn-timeout)).

---

### Running tests via Docker

Start e2e tests in watch mode (only changed spec files will be run):

```bash
npm run test:e2e:docker
```

Unit tests in watch mode can be run using the following command:

```
npm run test:watch:docker
```

### Running tests locally

Running tests locally still require Docker to be executed. All infrastructure is managed via Docker. The only difference is that Jest is run directly on the host machine instead of a container.

To run all e2e tests locally:

```bash
npm run test:e2e:local
```

To specify which file(s) to run the first parameter can be used, for example:

```bash
npm run test:e2e:local test/app-controller.e2e-spec.ts
```

Unit tests can be run using:

```bash
npm run test:unit:local
```

`test:unit:local` also supports file patterns:

```bash
npm run test:unit:local some-file.spec.ts
```

---

**ℹ️ NOTE**

First parameters for `test:e2e:local` and `test:unit:local` are passed directly to Jest via `testPathPattern` parameter, you make use of it's pattern matching.

---

## Database

The project uses [Prisma ORM](https://www.prisma.io/). To manage database migrations [Prisma Migrate](https://www.prisma.io/docs/reference/api-reference/command-reference#prisma-migrate) tool is used.

Prisma Migrate can create and apply the migrations. A database migration is a simple SQL file, any SQL can be executed there.

Prisma database schema is described at [schema.prisma](./src/infrastructure/database/schema.prisma).

---

**ℹ️ NOTE**

`schema.prisma` file represents the whole database structure and is matched 1:1 with the real database. If there is a mismatch between the real database and the schema file the tool will notify about that.

---

### Applying existing migrations

All testing environments will apply existing migrations automatically.

To apply migrations manually the following command can be used:

```bash
npx prisma migrate deploy
```

---

**ℹ️ NOTE**

Directly executing this CLI command may be tricky. Instead the Docker version of it (`prisma:migrate`) is described later in this section.

---

### Creating new migrations

New migrations can be automatically generated by comparing your development database and the `schema.prisma` file. Prisma Migrate will first sync your development database before creating new migrations.

After making a change to `schema.prisma` file you'll need to run the following command:

```bash
npm run prisma:migrate
```

The command will do the following things:

1. Generate new typings for `@prisma/client` package.
1. Build & start the development Docker containers
1. Apply existing migrations
1. Perform diff between the database & `schema.prisma` and if there is one will ask for the migration name.
1. Apply the migration.

The migration will be applied to the development database immediately.

Testing environments will pick it up on the next run.

### Seeding the database

Seeding the database is a required operation for all environments except testing & develop.

To seed a database the following command must be executed:

```bash
npx prisma db seed
```

---

**ℹ️ NOTE**

Make sure to provide `DATABASE_URL` for the script to run. For production environments please refer to [the example script](#example-script)

---

## Project structure

The project structure is divided into several levels:

1. Top level - includes points to connect to our application (`src/api`, `src/cli`)
2. Business logic layer - `src/modules`
3. Third-party services - `src/integrations` (Aws,Sentry, etc.)
4. Third-party services - `src/infrastructure` (database, etc.)

`src/api`

Controllers for connecting to the application via REST api.

`src/cli`

cli commands

`src/modules`

All business logic of the application must be implemented here

`src/integrations`

connections to third-party services are initialized in this directory

`src/common`

consists of common components (types, DTOs, etc) that can be reused.

`src/configs`

Contains all configuration variables.

All configuration variables are divided by a feature.

`src/infrastructure/database`

This directory contains all database-related information.

- `migrations` - database migrations are generated in this directory.
- `seeders` - database seeding logic is located here.
- `schema.prisma` - database schema.

`test`

All e2e tests are located here.

### Example component structure

- `<component>/<component>.module.ts` - the component's module with all imports,
- `<component>/<component>.(service|controller).ts` - main logic should be located here,
- `<component>.repository.ts` - database access logic (only for `src/modules`),
- `<component>/dto` - interfaces/classes that can be used outside of this module,
- `<component>/types` - custom types that are defined via `type` keyword,
- `<component>/interfaces` - the component's internal interfaces,
- `<component>/<operation>` - some logic-heavy operations can be extracted to a separate sub-directory.

## Style guide

The project uses [Prettier](https://prettier.io/) for managing code style.

It's advised to configure auto formatting on save/commit.

## New environment setup

This documentation omits configuration details about database, redis, 3rd-party integrations, aws resources, etc.

### Environment variables

To setup a new environment the application must be provided with all environment variables described in the [src/configs/config.ts](./src/config/config.ts).

At the moment, environment variables can be provided in two ways:

- AWS Secrets Manager
- plain .env file

To obtain and load environment variables from Secrets Manager the [printAwsSecrets](./src/cli/printAwsSecrets.ts) script can be used. Please make sure to provide enough environment variables for it to work (refer script description).

### Migrations

To apply a migrations in a production environment (must be used for anything that is not a dev/test env) please refer to the following section: [Applying existing migrations](#applying-existing-migrations).

### Example script

This script can be used as an entrypoint for a container:

```bash
export $(node ./dist/cli/printAwsSecrets | xargs -0); npx prisma migrate deploy && node ./dist/main
```

### Populating database

After application is up and running the database must be populated with the following information:

- seed information ([Seeding the database](#seeding-the-database))

## Commit Message Format

This project follows the Conventional Commits specification for commit messages.
Each commit message must have a type and a description, and must have a scope in the format `JIRA-<number>`, where `<number>` is a positive integer.

### Type

The type must be one of the following:

- **feat:** a new feature or enhancement
- **fix:** a bug fix
- **docs:** documentation changes
- **style:** changes that do not affect the code (e.g. formatting, whitespace)
- **refactor:** code changes that do not add new features or fix bugs
- **perf:** performance improvements
- **test:** adding or modifying tests
- **build:** changes to the build process or external dependencies
- **ci:** changes to the CI/CD pipeline
- **chore:** other changes that do not modify the code

### Scope

The scope should indicate the module, component, or subsystem that the commit applies to. The scope must be in uppercase letters and follow the format `JIRA-<number>`, where `<number>` is a positive integer. For example, `JIRA-1500`.

### Description

The description should be a concise summary of the changes in the commit message.

### Examples

- `feat(JIRA-1500): add new login page`
- `fix(JIRA-1501): fix issue with password reset`
- `docs(JIRA-1502): update README.md`

## Release Process

To release a new version of the project, follow these steps:

1. Run the following command to generate a new version and create a Git tag: `npm run release` This command uses the `standard-version` library to generate a new version based on the commit messages since the last release. It updates the `package.json` file with the new version, creates a new Git tag, and generates a changelog file.
2. Push the changes and the new Git tag to the Git repository
3. Merge the changes from the `develop` branch to the `stage` branch.
4. Deploy the new version to the production environment.

## HOW-TO Use CI/CD in Gitlab

1. Gitlab pipeline will be triggered after commit into one of the protected branches: develop, stage, preprod, master
2. You can run pipeline manually via CI/CD -> Pipelines -> Run Pipeline

##### CI/CD options

- run without any Variables from protected branch - will trigger only CI part ( docker_build, docker_push... )
- run with Variables "deploy=1" from protected branch - will trigger full CI/CD chain: docker_build, docker_push... + Blue-Green Deployment
