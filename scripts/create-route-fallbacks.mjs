import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, 'docs');
const indexFile = join(docs, 'index.html');

const routes = [
  'articles/why-i-built-my-agent-systems',
  'articles/internal-messaging',
  'articles/ui-debugger-message-passing',
  'articles/agentic-collaboration-patterns',
  'articles/memory-over-time',
  'articles/feedback-loop-memory',
  'articles/logging-systems',
  'articles/controller-plane',
  'articles/future-memory-integrations',
  'controller-plane-ui-demo',
  'controller-plane-ui-demo/task-thread',
  'controller-plane-ui-demo/agents',
  'controller-plane-ui-demo/skills',
  'controller-plane-ui-demo/workflows',
  'controller-plane-ui-demo/memory',
  'controller-plane-ui-demo/work-logs',
  'controller-plane-ui-demo/messaging',
];

for (const route of routes) {
  const routeDir = join(docs, route);
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(indexFile, join(routeDir, 'index.html'));
}
