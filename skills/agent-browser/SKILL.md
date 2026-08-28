---
name: agent-browser
description: Use when navigating or interacting with web pages in the browser — opening URLs, clicking elements, filling forms, taking screenshots, scraping data, or automating any browser task.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*)
---

# agent-browser

Fast browser automation CLI using Chrome/Chromium via CDP with accessibility-tree snapshots and compact `@eN` element refs.

Install: `npm i -g agent-browser && agent-browser install`

## Core workflow

```bash
agent-browser open <url>          # Navigate to page
agent-browser snapshot -i         # Get interactive elements with refs (@e1, @e2, ...)
agent-browser click @e1           # Click element by ref
agent-browser fill @e2 "text"     # Fill input by ref
agent-browser snapshot -i         # Re-snapshot after page changes
```

Always re-snapshot after any interaction — refs change when the DOM updates.

## Full reference

```bash
agent-browser skills get core             # Workflows, patterns, troubleshooting
agent-browser skills get core --full      # Full command reference and templates
agent-browser skills list                 # All available skills
```

## Specialized skills

```bash
agent-browser skills get electron         # Electron desktop apps (VS Code, Slack, Figma, ...)
agent-browser skills get slack            # Slack workspace automation
agent-browser skills get dogfood          # Exploratory testing / QA / bug hunts
agent-browser skills get vercel-sandbox   # Inside Vercel Sandbox microVMs
agent-browser skills get agentcore        # AWS Bedrock AgentCore cloud browsers
```
