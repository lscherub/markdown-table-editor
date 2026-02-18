# Deploy to GitHub Pages (Beginner Guide)

This project is now set up for **automatic GitHub Pages deployment** using **GitHub Actions**.
When you push to the `main` branch, it will build and deploy automatically.
git add
## 1) Push your project to GitHub

Make sure your code is in a GitHub repository, for example:

- `https://github.com/your-username/markdown-table-editor`

## 2) Confirm workflow file exists

This file should exist in your repo:

- `.github/workflows/deploy-pages.yml`

It runs on every push to `main`.

## 3) Enable GitHub Pages in repository settings

1. Open your repo on GitHub
2. Go to **Settings → Pages**
3. Under **Build and deployment**, set **Source** to **GitHub Actions**
4. Save

## 4) Deploy

Push your code to `main`:

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

GitHub Actions will automatically build and deploy your site.

## 5) Open your live site

Your app will be available at:

- `https://your-username.github.io/your-repo-name/`

---

## Quick troubleshooting

- **404 after deploy**: wait 1–2 minutes and refresh
- **Workflow did not run**: confirm you pushed to `main`
- **Build failed**: open the **Actions** tab in GitHub to see the exact error
