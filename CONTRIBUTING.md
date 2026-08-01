# Contributing

## Development

```sh
pnpm install
pnpm test
pnpm build
```

Use `pnpm version patch/minor/major` to release — it runs lint, tests, and build, regenerates the changelog with git-cliff, then pushes the version tag which triggers the publish workflow.

## Publishing

Releases publish automatically via GitHub Actions using npm trusted publishing (OIDC, no stored token). The publish job needs `id-token: write` permissions; npm attaches provenance automatically under trusted publishing.

This repo is already configured. To set up a new package: `npm trust github <pkg> --file publish.yml --repo GMOD/<repo>` (requires npm >=11.10.0 and 2FA).
