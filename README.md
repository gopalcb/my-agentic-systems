# My Agent Systems

An Angular article site about the local Codex-powered agent control plane:
messaging, UI debugging, collaboration, memory, feedback, logging, controller
plane design, and future memory integrations.

## Local Development

```bash
npm install
npm start
```

The local development server defaults to:

```text
http://localhost:4220/
```

## Build for GitHub Pages

```bash
npm run build:pages
```

The published bundle is copied to `docs/` for GitHub Pages. The Angular base
href is `/my-agentic-systems/`, matching:

```text
https://gopalcb.github.io/my-agentic-systems/
```
