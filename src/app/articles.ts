export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Article = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  diagram: string;
  diagramAlt: string;
  readingTime: string;
  sections: ArticleSection[];
  example?: {
    title: string;
    code: string;
  };
};

export const ARTICLES: Article[] = [
  {
    slug: 'internal-messaging',
    title: 'Inside the Agent Internal Messaging System',
    kicker: 'Messaging foundation',
    readingTime: '14 min read',
    diagram: 'diagrams/internal-messaging.html',
    diagramAlt: 'Data flow from user request to controller, message records, runtime, replies, task records, and operational errors.',
    summary:
      'A practical tour of how agents coordinate through durable messages, why compact replies matter, and how the same message shape supports tool calls, task creation, UI debugging, error handling, and recovery.',
    sections: [
      {
        heading: 'Why messages are the center of the system',
        paragraphs: [
          'The most important design choice in this agent system is that agents do not have to behave like a pile of direct function calls. They can communicate by writing durable messages. That sounds simple, but it changes the shape of the whole platform. A message gives the sender a clear contract, gives the receiver a bounded job, and gives the operator a trail that can be inspected after the process that created it has already exited.',
          'There are two layers worth separating. The current cross-component control path is the FastAPI MQ server, which accepts topics such as workflow execution, file actions, system errors, and todo requests, then persists state transitions as YAML under `.agent-state/messages/`. Beside it, the file-backed agent bus under `.agent-state/agents-messaging/` remains the transparent agent-to-agent work surface for controller tasks, debugger requests, replies, task records, active errors, and debug artifacts. The site you are reading about leans on both ideas: command topics for system coordination, and rich durable agent messages for work that needs human visibility.',
          'The reason this is effective is not novelty. It is the discipline of making every handoff explicit. A message records who asked, who should act, what type of work is requested, what payload is needed, and whether it is a reply to an earlier message. Once that record exists, the system can queue it, display it, process it, retry it, mark it failed, or archive it without losing the thread.'
        ],
      },
      {
        heading: 'The shape of one message',
        paragraphs: [
          'A normal agent message is deliberately small. It carries `id`, `created_at`, `sender`, `recipient`, `type`, `payload`, and optional `reply_to`. That is enough to represent a task request, a UI debugger request, a tool request, an error alert, a cleanup request, or a result. The payload can be specific to the message type while the lifecycle stays common.',
          'The bus writes the pending file into the recipient inbox and also creates an indexed record under `records/messages/`. That second copy is important for dashboards. The controller UI should not scrape inbox folders and infer meaning from filenames. It asks the backend for a structured messaging snapshot, and the backend reads the durable records, events, tasks, and errors into one view.',
          'When a handler accepts the message, the file moves from `inbox/<agent-id>/` to `processed/<agent-id>/`. If the handler cannot run it, the file moves to `failed/<agent-id>/` and receives a sibling error note. Either way, the message record changes status and a lifecycle event is appended to `records/events.jsonl`. The visible audit trail is not an afterthought; it is part of the message write.'
        ],
      },
      {
        heading: 'Task creation as a message flow',
        paragraphs: [
          'Controller-created work is a clean example. The user creates a task in the controller. The backend writes a `task_request` message addressed to the selected agent, writes a task record under `records/tasks/`, and marks the task as awaiting implementation. That waiting state is intentional. It keeps the controller honest: task creation and task execution are different moments, and the user explicitly approves the launch.',
          'After approval, the task runner reads the queued message, marks the task as implementing, and delegates the actual work to the normal runtime gateway. The runtime still owns agent selection, workflow execution, events, finalization, and memory candidates. When the run completes, the task runner updates the task to complete or need rework and sends a `task_request.result` reply. That reply is a normal message with `reply_to` pointing back to the original task request.',
          'This pattern is what lets the controller show a task thread instead of a vague job spinner. The operator can inspect the original request, the launch event, the runtime result, and any follow-up reply. If a task needs rework, that status belongs in the record rather than in someone’s memory of a terminal log.'
        ],
      },
      {
        heading: 'Tool calls without hidden side effects',
        paragraphs: [
          'Message passing also makes tool use easier to reason about. An agent can request a deterministic tool by message instead of embedding a large tool transcript inside its own conversation. The UI debugger is the clearest case, but the same style works for cleanup, health checks, log analysis, and future tools that produce large evidence. The message says what is needed. The handler runs the tool. The reply returns the compact result and paths to the full artifacts.',
          'That separation protects model context. A screenshot, browser console dump, or long network log does not belong inline in every message. The durable artifact belongs on disk, and the reply should say where it is, whether the run succeeded, and which failures matter. Agents get the information needed to decide the next step without dragging a whole debug session through every prompt.',
          'The same idea applies to file and workflow actions in the MQ server. Cross-component callers can use topics such as `read-file`, `write-file`, `update-file`, `run-workflow`, and `system-error`. The MQ server persists pending, processing, and processed transitions so the caller can inspect what happened even when the action is deterministic and quick.'
        ],
      },
      {
        heading: 'Error handling as operational state',
        paragraphs: [
          'Error handling is another place where message-first design pays off. An error should not be a line that scrolls away. When the runtime emits an error event, or when the log analyzer sees a fresh `ERROR` line, the exact error object can be recorded through the message bus. The bus writes or updates `current-error.json`, sends an `error.detected` message, and appends the error lifecycle event.',
          'That gives the system one active operational error pointer. If a different error appears while one is already active, the older record is archived as superseded. If the current error is fixed and confirmed, it is archived as fixed. This is more useful than dumping every error into permanent memory. Active error state answers: what needs attention now? Long-term memory answers: what lesson should future agents remember?',
          'The distinction keeps the agent from over-learning from temporary incidents. A failed port bind, a malformed record, or a browser startup issue may need immediate visibility, but it should become memory only if it teaches a reusable project lesson.'
        ],
      },
      {
        heading: 'Why the system feels efficient',
        paragraphs: [
          'The efficiency comes from boring guarantees. Every message has a recipient. Every handled message has a status. Every large artifact has a path. Every reply can point back to its request. The controller reads structured snapshots rather than asking the browser to parse raw files. The runtime owns execution rather than letting the UI become a second workflow engine.',
          'Because messages are durable, agents can collaborate asynchronously. A planner can create tasks. A debugger can inspect a URL. A log analyzer can report an operational error. A system engineer can read the current inbox count before starting a step. None of those participants needs a private, invisible side channel.',
          'That is the real value of the internal messaging system: it makes agent work inspectable at the same level where it is coordinated. The message is not just transport. It is the unit of accountability.'
        ],
        bullets: [
          'Use compact payloads for requests and compact summaries for replies.',
          'Put large evidence in artifacts and return paths, not blobs of text.',
          'Treat active errors as operational state until a verified fix exists.',
          'Keep runtime execution in the runtime and controller visibility in the controller.',
          'Prefer explicit `reply_to` threads over disconnected status comments.'
        ],
      },
    ],
    example: {
      title: 'Example message event',
      code: `{
  "id": "8f4a0d0c8f7a4f3fa5e0b1c88d3a72fb",
  "created_at": "2026-09-13T06:20:18Z",
  "sender": "controller-api",
  "recipient": "agent-ui-debugger",
  "type": "ui_debug_request",
  "reply_to": null,
  "payload": {
    "url": "http://localhost:4220/articles/internal-messaging",
    "request_id": "article-site-visual-check",
    "wait_seconds": 1,
    "viewport_width": 1440,
    "viewport_height": 1100,
    "full_page_screenshot": true
  }
}`,
    },
  },
  {
    slug: 'ui-debugger-message-passing',
    title: 'Debugging the UI by Sending a Message',
    kicker: 'Browser evidence',
    readingTime: '10 min read',
    diagram: 'diagrams/ui-debugger.html',
    diagramAlt: 'Message path from an agent or controller to the UI debugger, Selenium capture, artifacts, and compact reply.',
    summary:
      'The UI debugger works best when it behaves like an agent-facing service: request by message, inspect through Selenium, store artifacts, and reply with only the useful evidence.',
    sections: [
      {
        heading: 'The debugger is a participant, not a side errand',
        paragraphs: [
          'A UI bug is rarely proven by a successful build. Builds tell us the code can compile. They do not tell us whether a page is blank, whether a button is covered, whether a route crashes after navigation, or whether a data fetch failed in the browser. The UI debugger exists to close that gap with real browser evidence.',
          'In this system, agents can call the debugger through the same message fabric used for other work. A requester sends a `ui_debug_request` to `agent-ui-debugger`. The message payload stays small: URL, request id, viewport, wait time, full-page preference, and any notes. The hub receives it, invokes the Selenium runner, writes artifacts, then sends a `ui_debug_request.result` reply back to the requester.',
          'That message path matters because it turns debugging into a repeatable workflow. The agent that changed the UI does not need to invent a one-off browser script. It asks the debugger for evidence, reads the result, and decides what to fix next.'
        ],
      },
      {
        heading: 'What the debugger captures',
        paragraphs: [
          'The runner opens the supplied URL in headless Chrome with browser and performance logging enabled. It waits for the document to load, captures a screenshot, records console output, filters Chrome DevTools network events, and writes a manifest. The important part is the filter. The system does not want every image, font, and successful request. It wants actionable failed XHR, fetch, document, and network-loading failures.',
          'The artifacts are stored under `.agent-state/agents-messaging/debug-sessions/<request-id>/`. The reply includes paths to `manifest.json`, screenshot output, console logs, and network error records. It also includes counts and first errors so the receiving agent can understand the situation without reading several large files every time.',
          'This gives the operator and the agent the same evidence. A human can open the screenshot. An agent can parse the compact reply. The controller can show the message thread and artifact paths. The browser session becomes part of the durable task story.'
        ],
      },
      {
        heading: 'Why message passing is the right call surface',
        paragraphs: [
          'The debugger launches a browser, and browser automation can fail for environmental reasons. Chrome might not start. A page may not respond. A local server may not be running. The message bus gives those failures a place to land. The message can be marked failed, the reply can include the exception, and the controller can keep the failure visible.',
          'Directly invoking the debugger from inside every agent would make each workflow responsible for the same setup, failure handling, artifact naming, and result compaction. The message-handler boundary centralizes that logic. Agents learn one request shape and one result shape.',
          'The pattern also encourages better UI work habits. After changing a route, an agent can request a desktop and mobile check. The debugger returns screenshot and network evidence. If the result shows overlap, console errors, or failed API calls, the agent can patch the component and send another request. The final claim is then backed by observed browser behavior instead of confidence.'
        ],
      },
      {
        heading: 'A useful debugging strategy',
        paragraphs: [
          'The best strategy is to ask narrow questions. Instead of “check the app,” request the route that changed, the viewport that matters, and the condition that might break. For an article site, that might mean checking a long article page at desktop width and a route refresh at the GitHub Pages base path. For a controller workflow, it might mean checking the messaging portal after creating a debugger request.',
          'The result should guide action. A screenshot answers layout. Console logs answer runtime errors. Network failures answer whether the UI actually reached the backend. The manifest ties those files to the request. When an agent reports that a UI is ready, it should say which evidence was captured and which failures, if any, remain.',
          'This is how the debugger becomes more than a test utility. It becomes a shared inspection service for agents and operators.'
        ],
      },
    ],
  },
  {
    slug: 'agentic-collaboration-patterns',
    title: 'Agentic Collaboration Patterns That Stay Understandable',
    kicker: 'System design',
    readingTime: '11 min read',
    diagram: 'diagrams/collaboration.html',
    diagramAlt: 'Planner, system engineer, debugger, validator, memory, and operator feedback connected through shared runtime events.',
    summary:
      'Good agent collaboration is not about having more agents. It is about giving each participant a clean boundary, a useful handoff, and a durable record of what happened.',
    sections: [
      {
        heading: 'Collaboration starts with ownership',
        paragraphs: [
          'The system works because the default owner is clear. Normal repository work resolves to the system engineer agent. The root agent is reserved for bootstrap, recovery, project attachment, and platform drift. That one rule prevents a surprising amount of confusion. Most work needs a capable default engineer, not a committee.',
          'Specialists still matter. A planner can shape implementation tasks. A UI debugger can provide browser evidence. A log analyzer can surface operational failures. A strategy-memory analyzer can turn feedback into reusable guidance. The useful pattern is not “ask everyone.” It is “bring in the specialist when the boundary is real.”',
          'The workflow path reinforces this. Normal work runs analysis, context resolution, optional web research when current external facts matter, and planning before execution. Execution then moves through work, validation, feedback, and finalization. The structure gives agents a rhythm that is easy to inspect and improve.'
        ],
      },
      {
        heading: 'Tools become safer when they are part of the pattern',
        paragraphs: [
          'Tools are most helpful when they are predictable. File reads collect context. Tests validate behavior. The UI debugger produces browser evidence. The message bus handles handoffs. The controller plane exposes task, message, workflow, memory, and work-log state. Each tool has a narrow job and a known output.',
          'That is more efficient than asking one model prompt to solve everything inside a single invisible transcript. The agent can use the terminal for source facts, the diagram builder for article diagrams, the debugger for UI evidence, and the controller for durable task visibility. The common thread is that artifacts survive after the step finishes.',
          'The system also avoids premature custom code. New agents should remain declarative unless deterministic Python is truly needed. That keeps behavior discoverable in `agent.yaml`, instructions, workflow YAML, and source maps. When custom code is added, it has to earn its place by handling a repeatable system behavior.'
        ],
      },
      {
        heading: 'Handoffs and gates keep the work honest',
        paragraphs: [
          'The controller-created task flow is a useful example of a gate. Creating the task writes a durable record, but starting the task requires explicit approval. This lets the operator plan and inspect work before execution. Planned task identifiers can be carried into runtime prompts and later updated from final status lines.',
          'Validation is another gate. A compile check proves syntax. Unit tests prove known behavior. Browser evidence proves the UI actually rendered and loaded what it needed. A good collaboration pattern does not collapse these into one vague “done.” It records which claims were verified and which were not.',
          'Feedback closes the loop. After work, strategy feedback can ask whether the result needs rework and whether the lesson should become durable memory. That makes collaboration adaptive without letting every passing opinion become permanent instruction.'
        ],
      },
      {
        heading: 'Why this is efficient',
        paragraphs: [
          'The system is efficient because it reduces repeated interpretation. Agents are not constantly rediscovering where messages live, how tasks are started, where logs are written, or how memory is injected. Those contracts are stable enough to be reused but transparent enough to be inspected.',
          'It also keeps control local. The runtime owns execution and events. The controller owns visibility and task launch. The MQ server owns cross-component message processing. Memory owns retrieval and extraction policy. When those boundaries are respected, changes are smaller and failures are easier to locate.',
          'That kind of efficiency is not flashy. It is the efficiency of fewer hidden side effects, fewer mystery states, and fewer “it worked in the transcript” claims.'
        ],
      },
    ],
  },
  {
    slug: 'memory-over-time',
    title: 'Memory Over Time: From Runtime Events to Useful Recall',
    kicker: 'Project memory',
    readingTime: '11 min read',
    diagram: 'diagrams/memory.html',
    diagramAlt: 'Runtime events becoming final artifacts, memory candidates, durable records, and retrieved context in future runs.',
    summary:
      'Memory improves agents when it is derived from real work, bounded during retrieval, and treated as guidance rather than a replacement for current source and user instructions.',
    sections: [
      {
        heading: 'Memory should be earned',
        paragraphs: [
          'A productive memory system does not save everything. Saving everything creates noise, stale advice, and a quiet pressure to trust old context more than current code. This system takes a more careful path: it derives memory candidates from persisted runtime events after a run reaches a terminal state.',
          'The runtime emits `RuntimeEvent` records throughout a run. EventHub persists them under `.agent-state/logs/<session-id>/<run-id>/events.jsonl`. After completion, finalization reads that event stream once and writes `run.json`, `summary.md`, `metrics.json`, `artifacts.json`, and `memory_candidates.json`. Memory candidates come from that evidence, not from a model trying to remember its own conversation.',
          'The current candidate kinds are practical: run summary, failure summary, and change summary. A run summary captures prompt, status, resolved agent, workflow, changed files, artifacts, failures, and final message. A failure summary collects unique failed step, tool, background, and error messages. A change summary records changed files and created artifacts.'
        ],
      },
      {
        heading: 'Retrieval is intentionally bounded',
        paragraphs: [
          'When a future agent step begins, the runtime can ask the memory service for context relevant to the current prompt. Retrieval loads stored records, skips superseded or rejected records, ranks active records, and injects a compact block into developer instructions. The default shape is deliberately small: a handful of hits, each truncated before it can dominate the prompt.',
          'The current implementation uses local lexical scoring with metadata and recency weights. There is no vector store in the runtime today, and that is a reasonable first stage. Lexical retrieval is simple, inspectable, cheap, and good enough for many project-memory cases, especially when records include filenames, agent ids, workflow ids, tags, and concrete failure text.',
          'The system also keeps authority clear. Retrieved memory can help, but current user instructions, current source, and current repository state remain more authoritative. That prevents memory from becoming a ghost architecture.'
        ],
      },
      {
        heading: 'What belongs in memory',
        paragraphs: [
          'The best memory records are hard to rediscover and likely to matter again. Examples include a known environment failure, a recurring validation command, a directory ownership boundary, a migration decision, or a verified workflow contract. These are the things that save future agents time without telling them to ignore the present.',
          'The worst memory records are generic advice. “Be careful,” “write good tests,” and “check the UI” do not need durable storage. They are habits, not project knowledge. Memory should carry specific evidence: paths, commands, outcomes, and conditions.',
          'A good rule is simple: if the next agent could cheaply rediscover it with one targeted search, it may not need memory. If rediscovering it would require reading old logs, remembering a previous incident, or re-running a fragile scenario, it is a better candidate.'
        ],
      },
      {
        heading: 'Memory as compounding system quality',
        paragraphs: [
          'Over time, this kind of memory changes the first five minutes of work. Instead of starting cold, the agent can see that a build crash may be environment-level, that a controller path moved from an older location, or that browser evidence is expected for UI claims. The agent still verifies current files, but it begins with better hypotheses.',
          'That compounding quality is the point. Memory is not there to make the agent sound confident. It is there to reduce repeated waste, keep local conventions alive, and carry verified lessons forward.'
        ],
      },
    ],
  },
  {
    slug: 'feedback-loop-memory',
    title: 'The Feedback Loop That Makes Memory Better',
    kicker: 'Operator learning',
    readingTime: '10 min read',
    diagram: 'diagrams/feedback.html',
    diagramAlt: 'Work result, human feedback, analyzer, strategy memory, rework, and future agent planning loop.',
    summary:
      'Feedback turns memory from passive recall into a living strategy layer, especially when rework, analyzer decisions, and superseded guidance are handled explicitly.',
    sections: [
      {
        heading: 'Completion is not always the end',
        paragraphs: [
          'Agent work often reaches a point where tests pass and the final answer is written, but the operator still has a better strategy in mind. Maybe the agent validated the wrong thing. Maybe it wrote too much documentation. Maybe it should have used a local tool earlier. The feedback loop gives that judgment a structured place to go.',
          'The runtime includes a strategy feedback coordinator that can run after work and validation and before finalization when that path is enabled or invoked. The hook can collect operator feedback, ask whether rework is needed, and ask whether the guidance should be stored as durable strategy memory. That timing is useful because the run still has enough context to act on the feedback, but the final artifacts have not yet been sealed.',
          'If rework is requested, the runtime can run a bounded rework turn and ask for feedback again. This avoids the trap where feedback becomes a note for next time while the current result remains unsatisfying.'
        ],
      },
      {
        heading: 'From human note to strategy memory',
        paragraphs: [
          'Submitted feedback is written as a run artifact. Then the strategy-memory analyzer classifies it and proposes memory actions. Those actions can add, update, supersede, or skip records. The memory service validates the actions before writing records under `.agent-state/cache/memory/records/strategy/`.',
          'There is also a practical fallback. If the user requested storage but the analyzer produces no memory action, the runtime can create a local feedback-derived memory action. That protects the operator from losing useful guidance because an analyzer was too conservative.',
          'Older strategy records are not simply deleted. They can be marked superseded. That keeps history while preventing stale guidance from being injected into future prompts.'
        ],
      },
      {
        heading: 'Why feedback improves the memory system',
        paragraphs: [
          'Event-derived memory tells the system what happened. Strategy feedback tells it how the user wants future work to be done. Both are needed. A run summary might say which files changed and which tests passed. Feedback might say that browser validation should include mobile screenshots for this UI, or that agent-created controller tasks must wait for explicit approval.',
          'This makes memory more personal and more operational. It captures the user’s standards, not just the runtime’s facts. Over time, agents can become more aligned with the way the project is actually run.',
          'The key is restraint. Not every comment should become durable strategy. Good feedback memory is reusable, project-specific, and connected to observed work. The system should remember the lesson, not the mood of the moment.'
        ],
      },
      {
        heading: 'A healthier loop',
        paragraphs: [
          'The loop is healthiest when each stage has a job. Work produces evidence. Feedback evaluates the evidence. The analyzer converts reusable guidance into memory actions. Rework applies urgent corrections. Future retrieval brings the active guidance back when it is relevant.',
          'That creates a calm improvement cycle. Agents do not need to be perfect on the first pass to become better. They need to listen, revise, and preserve the lessons that are worth carrying forward.'
        ],
      },
    ],
  },
  {
    slug: 'logging-systems',
    title: 'Logging Systems That Help Instead of Haunting the Project',
    kicker: 'Observability',
    readingTime: '10 min read',
    diagram: 'diagrams/logging.html',
    diagramAlt: 'Browser logs, backend logs, Python runtime logs, runtime events, log analyzer, and operational error message flow.',
    summary:
      'Useful logging separates diagnostics, runtime events, browser evidence, and operational errors so each one answers a different question.',
    sections: [
      {
        heading: 'Logs are not the same as events',
        paragraphs: [
          'The system keeps a clean distinction between runtime events and diagnostic logs. Runtime events are the durable state contract for a run: started, resolved, workflow events, file changes, artifacts, failures, and terminal status. Diagnostic logs are there for application behavior around the runtime: backend requests, Python package diagnostics, browser errors, and health checks.',
          'That separation prevents logs from becoming the only source of truth. A client should not parse a JSONL log file from the browser and try to reconstruct runtime state. It should consume structured snapshots or event streams. Logs remain valuable, but they answer a different question: what did the application observe while trying to do its job?',
          'This design makes finalization cleaner. Memory candidates and run artifacts come from persisted runtime events, while log analyzer findings become operational error messages when they require attention.'
        ],
      },
      {
        heading: 'Daily logs with bounded detail',
        paragraphs: [
          'The controller API writes daily logs under `.agent-state/logs/system/controller/`. Entries include timestamp, source, level, message, and bounded details. Browser logging uses a backend endpoint so console errors, rejected promises, failed fetch calls, and failed XHR calls can be captured without asking the operator to copy from DevTools.',
          'The runtime has its own Python diagnostics under `.agent-state/logs/system/runtime/`, and messaging has system logs under `.agent-state/logs/system/messaging/`. Health checks write their latest state under `.agent-state/logs/system/health/latest.json`. Each stream has a location and a purpose.',
          'The important habit is to log what will help root-cause analysis. A useful log line has a source, a level, and enough details to connect it to a request or file. A noisy log line just teaches everyone to stop reading.'
        ],
      },
      {
        heading: 'The log analyzer closes the visibility gap',
        paragraphs: [
          'The optional log analyzer watches fresh system log lines for `ERROR` entries. When it finds one, it builds an exact error object with type, source, observed timestamp, relative path, line number, exact log line, and nearby context. That object is passed into the messaging system as an operational error.',
          'This is a strong pattern because logs become actionable without becoming memory by default. The controller can show the current active error. Agents can see an `error.detected` message. Once the fix is verified, the error can be resolved and archived.',
          'The system therefore does not depend on someone remembering that a scary line appeared in a terminal. If it matters, it becomes visible state.'
        ],
      },
      {
        heading: 'Evidence belongs in layers',
        paragraphs: [
          'Different evidence answers different questions. A build log answers whether the compiler accepted the code. A unit test log answers whether known behavior still holds. A runtime event stream answers what the agent workflow did. A browser screenshot answers what a user would see. Network errors answer which requests failed in the browser.',
          'Good observability lets those layers support each other without mixing them into one blob. The article site itself follows that habit: build output verifies production compilation, while a browser check should verify rendered layout and route behavior.',
          'The result is a logging system that helps rather than haunts. It keeps enough detail to debug, enough structure to display, and enough restraint to stay readable.'
        ],
      },
    ],
  },
  {
    slug: 'controller-plane',
    title: 'The Controller Plane: A Window Into Agent Work',
    kicker: 'Control surface',
    readingTime: '11 min read',
    diagram: 'diagrams/controller-plane.html',
    diagramAlt: 'Angular controller UI, Nest controller API, MQ server, runtime, workflows, memory, messages, logs, and artifacts.',
    summary:
      'The controller plane is most useful when it stays a control and visibility layer, while the runtime remains the owner of workflow execution.',
    sections: [
      {
        heading: 'A controller should not become a second runtime',
        paragraphs: [
          'The controller exists to make agent work visible and operable. It should show tasks, agents, workflows, messages, memory, logs, and active errors. It should let the user create and approve work. It should expose details without asking the browser to understand raw repository files. But it should not quietly become the place where workflow logic lives.',
          'In this system, the Nest controller API reads repository-backed state and launches task runner processes. The Python runtime owns execution. That boundary matters. If the UI starts duplicating workflow resolution, finalization, or memory behavior, the platform becomes harder to reason about. One run could mean different things depending on where it started.',
          'The controller is therefore a window and a set of safe controls. It is not the engine.'
        ],
      },
      {
        heading: 'What the controller plane owns',
        paragraphs: [
          'The controller plane owns path discovery, safe file persistence, health checks, and Git-driven change-impact evaluation. Its path map is a source of truth for important runtime, state, and controller paths. Its data store conventions describe messages, tasks, plans, sessions, and work logs.',
          'The API exposes structured endpoints for snapshots, agents, skills, workflows, tasks, memory, work logs, messaging, message threads, and browser/backend logs. The Angular UI consumes those endpoints and renders operator views. The browser receives structured JSON, not a filesystem scavenger hunt.',
          'That design lets the UI stay responsive and inspectable. A malformed memory record can be skipped with a warning instead of breaking the whole page. A task record can show its message id and events. A messaging snapshot can include totals, pending records, task statuses, active errors, and recent lifecycle events.'
        ],
      },
      {
        heading: 'Task launch is intentionally explicit',
        paragraphs: [
          'One of the controller’s best design choices is separating task creation from task launch. Creating a task writes the `task_request` message and a task record with status awaiting implementation. Starting it requires an explicit approval call. That approval appends a task event and then launches the task runner.',
          'This is practical operator design. Users can queue work, review it, and start it when they are ready. Agents do not begin expensive or risky work just because a card was created. The task thread reflects the real lifecycle.',
          'When the task runner replies, the controller can show the result as part of the same message thread. The UI stays close to the facts.'
        ],
      },
      {
        heading: 'Why the controller plane makes the system calmer',
        paragraphs: [
          'Agent systems can feel chaotic when everything happens inside invisible transcripts. The controller plane calms that down. It gives the operator a place to see who is available, what is queued, which workflow ran, what memory exists, what logs say, and which operational error is active.',
          'The calmer experience comes from respecting the boundary. The runtime can evolve. The MQ server can handle deterministic actions. The memory service can improve retrieval. The UI can refine its views. Each piece gets better without taking ownership from the others.',
          'That is the controller plane’s real job: make the work legible while keeping the system’s authority in the right place.'
        ],
      },
    ],
  },
  {
    slug: 'future-memory-integrations',
    title: 'Future Memory and Integrations for Smarter Agent Systems',
    kicker: 'Roadmap',
    readingTime: '10 min read',
    diagram: 'diagrams/future-memory.html',
    diagramAlt: 'Current event-derived memory expanding into lexical recall, vector memory, external integrations, provenance checks, and bounded prompt injection.',
    summary:
      'Vector memory and external integrations can make agents smarter, but only if provenance, authority, and bounded retrieval remain first-class design rules.',
    sections: [
      {
        heading: 'Start from what already works',
        paragraphs: [
          'The current memory system has a strong base: durable runtime events, deterministic candidates, local records, lexical retrieval, strategy feedback, and clear prompt injection boundaries. That base should stay. Future memory should extend it, not replace it with a black box.',
          'The reason is trust. An agent should be able to say where a memory came from. Was it derived from a completed run? Was it submitted through operator feedback? Was it pulled from a design doc, issue tracker, chat thread, or code review? Without provenance, memory becomes a confident rumor.',
          'Good future integration begins with a simple promise: every retrieved memory has a source, a timestamp, a status, and a reason it was selected.'
        ],
      },
      {
        heading: 'Where vector memory fits',
        paragraphs: [
          'Vector memory is useful when exact words are not enough. Lexical retrieval is good at matching paths, symbols, errors, and explicit tags. Vector retrieval can help with conceptual similarity: a past decision about “operator approval before execution” may be relevant even when the new prompt says “do not auto-run user-created tasks.”',
          'The right design is probably hybrid. Lexical retrieval should remain the precise layer. Vector search can propose semantically related records. A reranker or policy layer can then enforce status, recency, source boundaries, and injection limits. The final prompt should still receive a compact explanation, not a heap of loosely related notes.',
          'Vector memory should also be scoped. Project memory, strategy memory, documentation memory, and external-ticket memory may have different freshness and authority. A codebase fact from yesterday should outrank a six-month-old chat summary unless the older item is explicitly marked as durable policy.'
        ],
      },
      {
        heading: 'Different memory types deserve different rules',
        paragraphs: [
          'Run memory records what happened. Failure memory records what broke and how it presented. Change memory records files and artifacts. Strategy memory records how the user wants agents to work. Architecture memory records decisions and boundaries. External memory could summarize issues, pull requests, docs, incident notes, design systems, and support threads.',
          'Those should not all be thrown into one ranking bucket. A future system can improve by giving each type a policy: how it is created, how it expires, how it is superseded, who can approve it, and how much of it can enter a prompt.',
          'This is especially important for public or team-facing integrations. A GitHub issue may contain speculation. A design doc may be authoritative. A Slack message may be useful but informal. The retrieval layer has to preserve those differences.'
        ],
      },
      {
        heading: 'Integration without losing control',
        paragraphs: [
          'The most promising integrations are the ones that fit the existing control-plane pattern. External sources can be ingested into candidate records. Candidate records can be reviewed, tagged, ranked, and bounded. Agents can retrieve them through the same context assembly path rather than gaining uncontrolled access to every connected system.',
          'The controller can help here. It can show memory sources, active and superseded records, candidate status, and retrieval previews. Feedback can correct bad memories and preserve good strategy. Logging can show when retrieval fails or when an external source is unavailable.',
          'Future memory will make the system smarter only if it keeps the current discipline: durable evidence, clear provenance, bounded injection, and current source as the final authority. That is how the system can grow more capable without becoming mysterious.'
        ],
      },
    ],
  },
];
