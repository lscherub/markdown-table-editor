import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  plugins: [react()],
  // Auto-set base path for GitHub Pages builds in CI
  base: isGitHubActions && repoName ? `/${repoName}/` : '/',
})
