# portfolio-websites

Monorepo for four sites sharing one "poster wall" design system:

| Site                 | Domains                | Purpose                                             |
| -------------------- | ---------------------- | --------------------------------------------------- |
| `sites/sanderdh`     | sanderdh.com / .nl     | Hub: three doors to the other sites                 |
| `sites/webenjoyer`   | webenjoyer.com / .nl   | Client work, open source, school projects           |
| `sites/imlostincode` | imlostincode.com / .nl | Public tools with versioned docs pulled from GitHub |
| `sites/nickmous`     | nickmous.com / .nl     | Personal side: games, side projects, guestbook      |
| `sites/playground`   | (not deployed)         | Preview of every ui-kit component                   |

- `packages/ui-kit`: shared tokens (Tailwind preset), fonts, layout and components
- `api/`: Symfony API for nickmous (guestbook, Steam proxy, Nintendo backoffice)

Built with Astro (static output) and npm workspaces. `.com` serves English and `.nl` serves Dutch.

Work is tracked in [milestones](https://github.com/NickMous/portfolio-websites/milestones).

## Development

Requires Node 24+ (see `.nvmrc`).

```sh
npm install
npm run dev:sanderdh     # dev server for one site
npm run dev:playground   # preview every ui-kit component
#   (imlostincode: GITHUB_TOKEN=$(gh auth token) npm run dev:imlostincode)
LOCALE=nl npm run dev:sanderdh  # same, in Dutch
npm run build            # astro check + build every site, both locales
npm run build:sanderdh   # build one site
npm test                 # Vitest across all workspaces
npm run format           # Prettier
```

### Languages

Each site is built once per locale: `LOCALE=en` (served on `.com`) and
`LOCALE=nl` (served on `.nl`), into `dist/en` and `dist/nl`. Paths are the
same on both domains. Strings live in `src/i18n/{en,nl}.ts` per site, with
shared strings in `packages/ui-kit/src/i18n`. A typo in a key is a type
error, and a key missing in Dutch fails the build.

### imlostincode docs

imlostincode reads its docs from GitHub at build time (public repos with the
`imlostincode-docs` topic). Set `GITHUB_TOKEN` for the API rate limit, e.g.
`GITHUB_TOKEN=$(gh auth token) npm run dev:imlostincode`. How to add a repo,
its `imlostincode.json` and the rebuild-on-release workflow:
[docs/imlostincode-docs-repo.md](docs/imlostincode-docs-repo.md).

## Deploying

Each site deploys when a GitHub release with its tag prefix is published
(`sanderdh-v1.0.0`, `webenjoyer-v1.0.0`, `imlostincode-v1.0.0`). That builds one
image per locale, and Flux image automation rolls `k8s/<site>/production`.
imlostincode also redeploys when a docs repo publishes a release.

The API deploys the same way from an `api-v1.0.0` release, to api.nickmous.com
(`k8s/api/production`). Its secrets live in fleet-infra, not in this public repo.

## API

The Symfony app in `api/` needs PHP 8.5 (intl, pdo_pgsql) and Composer.
`compose.yaml` in `api/` starts a Postgres for local use.

```sh
cd api
composer install
docker compose up -d                 # Postgres; put its port (`docker compose port database 5432`)
                                     # in DATABASE_URL in .env.local
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --env=test -n
php bin/phpunit                      # unit + functional
vendor/bin/phpstan analyse
```

Endpoints so far:

- `POST /api/guestbook` (`name`, `message`): stored unapproved, and the
  moderator gets an email with signed approve/delete links (valid 30 days)
- `GET /api/guestbook`: approved entries, newest first, 20 per page
- `GET /api/steam`: game count, hours in the last two weeks and the six most
  recently played games; Steam is asked at most every 20 minutes
