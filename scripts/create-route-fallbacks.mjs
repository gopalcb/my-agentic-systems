import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, 'docs');
const indexFile = join(docs, 'index.html');

const routes = [
  'codex-agent-system',
  'codex-agent-system/articles/why-i-built-my-agent-systems',
  'codex-agent-system/articles/internal-messaging',
  'codex-agent-system/articles/ui-debugger-message-passing',
  'codex-agent-system/articles/agentic-collaboration-patterns',
  'codex-agent-system/articles/memory-over-time',
  'codex-agent-system/articles/feedback-loop-memory',
  'codex-agent-system/articles/logging-systems',
  'codex-agent-system/articles/controller-plane',
  'codex-agent-system/articles/future-memory-integrations',
  'memory-expansion-plan',
  'memory-expansion-plan/articles/aws-memory-architecture-plan',
  'memory-expansion-plan/articles/memory-expansion-roadmap',
  'diagram-builder',
  'diagram-builder/articles/core-diagram-builder-approach',
  'articles/why-i-built-my-agent-systems',
  'articles/aws-memory-architecture-plan',
  'articles/memory-expansion-roadmap',
  'articles/core-diagram-builder-approach',
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
