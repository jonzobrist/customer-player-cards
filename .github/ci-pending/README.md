# Pending CI workflow

`ci.yml` here is the repository's CI workflow. It is parked outside `.github/workflows/` only because the initial push was made with a token that lacked GitHub's `workflow` scope. To activate it, move it into place:

```sh
git mv .github/ci-pending/ci.yml .github/workflows/ci.yml
git rm .github/ci-pending/README.md
git commit -m "ci: activate docs CI workflow"
git push
```
