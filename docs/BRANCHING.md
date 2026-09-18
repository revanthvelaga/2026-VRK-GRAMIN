# Gramin branch workflow

The repository uses three promotion branches:

- `development` — active feature and fix work.
- `sit` — a stable candidate for system-integration and user-acceptance testing.
- `main` — production-approved code and the deployment source.

## Promotion path

1. Make changes and run local tests on `development`.
2. Merge `development` into `sit` and verify the complete browser journey at the SIT environment.
3. After approval, merge `sit` into `main` and deploy from `main`.
4. Apply urgent production fixes on `development`, then promote them through the same path so the branches do not drift.

Use pull requests for both promotions after a GitHub repository remote is connected. Protect `sit` and `main` from direct pushes, require passing checks, and require at least one approval for `main`.
