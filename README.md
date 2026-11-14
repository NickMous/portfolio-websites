# portfolio-websites

Monorepo for four sites sharing one "poster wall" design system:

| Site                 | Domains                | Purpose                                             |
| -------------------- | ---------------------- | --------------------------------------------------- |
| `sites/sanderdh`     | sanderdh.com / .nl     | Hub: three doors to the other sites                 |
| `sites/webenjoyer`   | webenjoyer.com / .nl   | Client work, open source, school projects           |
| `sites/imlostincode` | imlostincode.com / .nl | Public tools with versioned docs pulled from GitHub |
| `sites/nickmous`     | nickmous.com / .nl     | Personal side: games, side projects, guestbook      |

- `packages/ui-kit`: shared tokens (Tailwind preset), fonts, layout and components
- `api/`: Symfony API for nickmous (guestbook, Steam proxy, Nintendo backoffice)

Built with Astro (static output) and npm workspaces. `.com` serves English and `.nl` serves Dutch.

Work is tracked in [milestones](https://github.com/NickMous/portfolio-websites/milestones).

## Development

Requires Node 24+ (see `.nvmrc`).

```sh
npm install
npm run dev:sanderdh     # dev server for one site
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
