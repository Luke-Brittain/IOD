# Contributing

Thank you for contributing to OliveBranch. This file outlines the basic workflow and expectations for contributors.

Branching
- Use `main` as the protected release branch.
- Create feature branches using the pattern: `feature/<short-description>`.
- Bugfix branches use: `fix/<short-description>`.

Commits
- Use conventional commit style for clear history, e.g. `feat(ui): add details panel` or `docs: update stories`.

Pull Requests
- Open a PR from your feature branch into `main`.
- Include a short description and link to related issue or transcript notes if relevant.
- Use reviewers and assign at least one reviewer before merging.

Code Quality
- Run linters/formatters locally (if present) before committing.
- Add tests for new behaviour where applicable.

Environment
- Do not commit secrets or `.env` files. Use environment variables and `.env.local` which is ignored by `.gitignore`.

CI / Checks
- Commits and PRs should pass CI checks before merging.
