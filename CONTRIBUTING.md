# Contributing

Thanks for your interest in contributing! 🎉
We welcome bug reports, feature requests, and pull requests from the community.

## Commit Messages

We use **Semantic Commit Messages** to keep our commit history readable and to enable automated tooling (like changelogs or releases).

Please follow this format:

```
<type>(optional scope): <description>
```

### Allowed types

- `feat` – A new feature
- `fix` – A bug fix
- `docs` – Documentation changes
- `style` – Code style changes (formatting, no logic change)
- `refactor` – Code refactoring
- `test` – Adding or updating tests
- `chore` – Maintenance tasks, tooling, or dependencies

### Examples

```
feat(router): add automatic menu generation
fix(auth): handle expired tokens correctly
docs: update contribution guidelines
chore: bump dependencies
```

## Pull Requests

- Keep pull requests focused and small
- Clearly describe **what** and **why** you changed something
- Make sure your commits follow the semantic commit convention
- Run `pnpm run lint` and `pnpm run build` before opening the pull request

## Releases

Releases are made by the [Publish workflow](.github/workflows/publish.yml). It sets the version in
`package.json`, commits it to `master` as `chore(release): vX.Y.Z`, tags that commit, publishes the
package to npm and creates the GitHub release.

- **Nightly:** the workflow derives the version from the commits since the last release — a
  breaking change (`!` or `BREAKING CHANGE:`) bumps major, `feat` bumps minor, `fix`/`perf` bump
  patch. Without any of them, nothing is released.
- **Manually:** run the workflow from the Actions tab and enter a version (e.g. `1.13.0`) to release
  exactly that one, or leave the field empty to derive it as above.

Never create release tags or GitHub releases by hand: the workflow treats the latest `vX.Y.Z` tag as
the last release, so a hand-made tag hides the commits before it.

By contributing, you agree that your contributions will be licensed under the same license as this project.

Thanks for helping improve this project 🚀
