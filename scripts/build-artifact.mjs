// Strips Vite's document skeleton so the page can be published as an Artifact fragment.
import { readFileSync, writeFileSync } from 'node:fs'
const html = readFileSync('dist/index.html', 'utf8')
const pick = (re) => (html.match(re) || []).join('\n')
const title = pick(/<title>[\s\S]*?<\/title>/gi)
const links = pick(/<link[^>]*rel="stylesheet"[^>]*>/gi)
const styles = pick(/<style[\s\S]*?<\/style>/gi)
const scripts = pick(/<script[\s\S]*?<\/script>/gi)
const body = (html.match(/<body>([\s\S]*?)<\/body>/i) || ['', ''])[1]
  .replace(/<script[\s\S]*?<\/script>/gi, '').trim()
writeFileSync('dist/artifact.html', [title, links, styles, body, scripts].filter(Boolean).join('\n') + '\n')
console.log('dist/artifact.html written,', Math.round(readFileSync('dist/artifact.html').length / 1024), 'KB')
