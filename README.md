# portfolio-websites

Monorepo for four sites sharing one "poster wall" design system:

| Site | Domains | Purpose |
|---|---|---|
| `sites/sanderdh` | sanderdh.com / .nl | Hub: three doors to the other sites |
| `sites/webenjoyer` | webenjoyer.com / .nl | Client work, open source, school projects |
| `sites/imlostincode` | imlostincode.com / .nl | Public tools with versioned docs pulled from GitHub |
| `sites/nickmous` | nickmous.com / .nl | Personal side: games, side projects, guestbook |

- `packages/ui-kit`: shared tokens (Tailwind preset), fonts, layout and components
- `api/`: Symfony API for nickmous (guestbook, Steam proxy, Nintendo backoffice)

Built with Astro (static output) and npm workspaces. `.com` serves English and `.nl` serves Dutch.

Work is tracked in [milestones](https://github.com/NickMous/portfolio-websites/milestones).
