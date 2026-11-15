# Adding a repo to imlostincode

imlostincode builds a docs section for every **public** NickMous repo with the
**`imlostincode-docs`** topic. Private repos never appear, even with the topic.

## What it reads

At each docs version (the highest patch of every `major.minor` release, plus
`main` as "unreleased"):

| Path in the repo | Becomes                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`      | Overview tab (a leading `# <repo name>` is dropped; the header shows it)                                                          |
| `docs/*.md`      | Docs pages. Number them for order: `01-introduction.md` → `/docs/<v>/introduction/`. The sidebar title is the first `# ` heading. |
| `examples/**`    | Examples tab, one highlighted file per section (`.md` files are rendered)                                                         |

Relative links to other docs, the README or examples point at the site;
anything else links to GitHub at the same ref. GitHub alerts (`> [!NOTE]`,
`> [!WARNING]`…) become callouts.

## Card settings: `imlostincode.json`

Optional, on the default branch:

```json
{
  "kind": "Ansible collection",
  "color": "blue",
  "status": "in-testing",
  "oneLiner": {
    "en": "Turns a Debian server into the place thin clients boot from.",
    "nl": "Maakt van een Debian-server de plek waar thin clients van opstarten."
  }
}
```

- `color`: `yellow`, `white`, `blue` or `green` (the section is red). Default `white`.
- `status`: `available` or `in-testing`. Default `available`.
- `oneLiner`: what it does. Defaults to the GitHub description; `nl` falls back to `en`.
- `kind`: the small label on the card. Default `Project`.

An invalid file fails the imlostincode build rather than guessing.

## Rebuilding on release

1. Create a fine-grained token (once): repository access **only
   NickMous/portfolio-websites**, permission **Contents: read and write**.
2. In the docs repo, add it as the Actions secret `IMLOSTINCODE_DISPATCH_TOKEN`.
3. Copy [`templates/imlostincode-docs.yaml`](../templates/imlostincode-docs.yaml)
   to `.github/workflows/imlostincode-docs.yaml` in the docs repo.

A published release (or a docs change on `main`) then sends a `docs-updated`
dispatch, and `deploy-imlostincode.yaml` here rebuilds and redeploys both
locales.
