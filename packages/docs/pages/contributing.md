Thanks for wanting to contribute! That really means a lot for us. You can contribute in many ways, with or without any coding required.

If you encounter any issue, you can join [our Discord](https://discord.lagon.app/) so we can help you.

## Non-code contributions

### Issues and community help

Work in progress...

### Documentation website

The documentation website is made of [Markdown](https://en.wikipedia.org/wiki/Markdown) files, located in `packages/docs/pages/`. It uses [Nextra](https://nextra.vercel.app/) behind the scenes.

If you want to preview your changes, you can run the documenation website locally. First, follow the [Requirements](#requirements), and then run `pnpm start:docs` at the root of the project. You can now access the documentation website on `localhost:3000`.

## Code contributions

### Coding guidelines

- Commits are following the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) convention.
- We use ESLint and Prettier to format our code, which should be handled automatically by most editors. If this is not the case, you can run the `lint` script.
- Make sure to add a test when adding new features / fixing bugs, so we can prevent any other future bug.

### Requirements

You will need [Node.js](https://nodejs.org/en/) >= 16 and [PNPM](https://pnpm.io/) >= 7.3.0 (as of writing). You will also need [Docker](https://www.docker.com/) installed, and if you want to contribute to any Rust code, you will need [Rust](https://www.rust-lang.org/) >= 1.63 installed.

1. Fork and clone the repository
2. Install all NPM dependencies: `pnpm install`

And if you want to contribute on the Dashboard / Runtime:

3. Run the local docker-compose: `docker-compose up -d`

### Dashboard

The first step is to copy the `.env.example` file and rename it to `.env`. You will need to fill the following environment variables:

```bash
NEXTAUTH_SECRET= # Random secret
S3_REGION= # S3 credentials to a bucket you own
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
GITHUB_CLIENT_ID= # Create a new Github OAuth app: https://github.com/settings/developers
GITHUB_CLIENT_SECRET=
```

Then, navigate to `packages/dashboard` and run `pnpm prisma migrate dev` to generate the database tables. You can now start the dashboard using `pnpm dev`.

### Runtime

Work in progress...
