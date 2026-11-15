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
npm run a11y             # accessibility audit of the built sites (after npm run build)
npm run favicons -w @portfolio/ui-kit  # regenerate every site's favicons
```

### Languages

Each site is built once per locale: `LOCALE=en` (served on `.com`) and
`LOCALE=nl` (served on `.nl`), into `dist/en` and `dist/nl`. Paths are the
same on both domains. Strings live in `src/i18n/{en,nl}.ts` per site, with
shared strings in `packages/ui-kit/src/i18n`. A typo in a key is a type
error, and a key missing in Dutch fails the build.

### nickmous and the API

nickmous's "Now playing" reads `https://api.nickmous.com` at build time and
again in the browser. Point it elsewhere with `PUBLIC_API_URL`, e.g.
`PUBLIC_API_URL=http://localhost:8000 npm run dev:nickmous`. When the API
can't be reached the build still succeeds; the section fills in once it can.

### imlostincode docs

imlostincode reads its docs from GitHub at build time (public repos with the
`imlostincode-docs` topic). Set `GITHUB_TOKEN` for the API rate limit, e.g.
`GITHUB_TOKEN=$(gh auth token) npm run dev:imlostincode`. How to add a repo,
its `imlostincode.json` and the rebuild-on-release workflow:
[docs/imlostincode-docs-repo.md](docs/imlostincode-docs-repo.md).

### Meta, sitemap and social previews

`portfolioSite()` from `@portfolio/ui-kit/integration` (in every
`astro.config.mjs`) adds `/og.png`, the site's poster-style social preview, and
writes `sitemap.xml` and `robots.txt` for the domain after the build. Pages
marked `noindex` stay out of the sitemap. A page can pass its own `ogImage`;
webenjoyer renders one per case page with `renderOgImage()` from
`@portfolio/ui-kit/og`.

### Analytics

Every page loads Umami (analytics.nickmous.nl) through the shared
`BaseLayout`: one Umami website per site, covering its .com and .nl domains.
The ids live in `packages/ui-kit/src/analytics.ts`. The scripts only load on
the site's own domains, so dev servers and local builds are never counted.

Events: a link or button gets `data-umami-event` (and `data-umami-event-*`
for data); anything only the code knows goes through `track()` from
`@portfolio/ui-kit/analytics`, which does nothing when the tracker is blocked.
Links to other sites are tracked as `outbound-link` automatically. Never put
personal data in an event (the guestbook sends only the result).

## Deploying

Each site deploys when a GitHub release with its tag prefix is published
(`sanderdh-v1.0.0`, `webenjoyer-v1.0.0`, `imlostincode-v1.0.0`,
`nickmous-v1.0.0`). That builds one
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
- `GET /api/switch`: Switch 2 games entered by hand, most recently played first

The backoffice is at `/admin` (user `admin`; locally the password is `admin`).
It edits the Switch games and approves or deletes guestbook entries. In
production the password hash comes from `ADMIN_PASSWORD_HASH`; make one with
`php bin/console security:hash-password`.
