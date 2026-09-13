import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { MOCK_CONTROLLER_SNAPSHOT } from '../mock-controller-data';
import { Agent, CreateMessageRequest, CreateSkillRequest, CreateTaskRequest, MemoryEntry, MessagingSnapshot, Skill, Task, Workflow, WorkLog } from './interfaces';

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly tasks = signal<Task[]>(MOCK_CONTROLLER_SNAPSHOT.tasks);
  readonly agents = signal<Agent[]>(MOCK_CONTROLLER_SNAPSHOT.agents);
  readonly skills = signal<Skill[]>(MOCK_CONTROLLER_SNAPSHOT.skills);
  readonly workflows = signal<Workflow[]>(MOCK_CONTROLLER_SNAPSHOT.workflows);
  readonly memory = signal<MemoryEntry[]>(MOCK_CONTROLLER_SNAPSHOT.memory);
  readonly workLogs = signal<WorkLog[]>(MOCK_CONTROLLER_SNAPSHOT.workLogs);
  readonly messaging = signal<MessagingSnapshot | null>(MOCK_CONTROLLER_SNAPSHOT.messaging);
  readonly selectedTaskId = signal('');
  readonly selectedAgentId = signal('');
  readonly selectedSkillId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.selectedTaskId.set(this.tasks()[0]?.id ?? '');
    this.selectedAgentId.set(this.agents()[0]?.id ?? '');
    this.selectedSkillId.set(this.skills()[0]?.id ?? '');
  }

  selectTask(id: string): void { this.selectedTaskId.set(id); }
  selectAgent(id: string): void { this.selectedAgentId.set(id); }
  selectSkill(id: string): void { this.selectedSkillId.set(id); }

  refresh(showLoading = true): void {
    this.loading.set(false);
    if (showLoading) this.error.set(null);
  }

  createTask(payload: CreateTaskRequest): Observable<Task> {
    this.saving.set(true);
    const now = new Date().toISOString();
    const task: Task = {
      id: `demo-task-${Date.now()}`,
      title: payload.title?.trim() || 'New controller task',
      summary: payload.prompt.slice(0, 130) || 'Task queued from the static controller demo.',
      status: 'awaiting implementation',
      label: 'demo',
      date: 'Just now',
      tokens: 0,
      plan: 'This public demo stores the task in browser memory only. In the live controller, this action writes a durable task_request message.',
      owner: payload.agentId || 'system-engineer-agent',
      agentId: payload.agentId || 'system-engineer-agent',
      duration: 'queued',
      prompt: payload.prompt,
      messageId: `demo-msg-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      source: 'controller',
      planId: payload.planId,
      planTitle: payload.planTitle,
      plannedTaskId: payload.plannedTaskId,
      events: [
        {
          ts: now,
          type: 'task.created',
          status: 'awaiting implementation',
          message: 'Demo task added to mock controller state.',
        },
      ],
    };
    this.upsertTask(task);
    this.selectedTaskId.set(task.id);
    this.saving.set(false);
    this.addWorkLog('runtime-demo-task-created', 'task.created', task.agentId, `Demo task "${task.title}" was added to the local mock state.`);
    return of(task);
  }

  startTask(taskId: string): Observable<Task | null> {
    this.saving.set(true);
    const now = new Date().toISOString();
    const task = this.tasks().find((item) => item.id === taskId);
    if (!task) {
      this.saving.set(false);
      return of(null);
    }
    const updated: Task = {
      ...task,
      status: 'implementing',
      updatedAt: now,
      duration: 'running',
      events: [
        ...task.events,
        {
          ts: now,
          type: 'task.started',
          status: 'implementing',
          message: 'Demo start moved this task into an implementing state.',
        },
      ],
    };
    this.upsertTask(updated);
    this.selectedTaskId.set(updated.id);
    this.saving.set(false);
    this.addWorkLog('runtime-demo-task-started', 'task.started', updated.agentId, `Demo task "${updated.title}" moved to implementing.`);
    return of(updated);
  }

  addSkill(payload: CreateSkillRequest): Observable<Skill> {
    this.saving.set(true);
    const skill: Skill = {
      id: payload.id,
      name: payload.name || payload.id,
      category: payload.category || 'custom',
      summary: payload.summary || 'Demo skill added in the public controller plane UI.',
      content: payload.content || 'This skill exists only in the mock demo state.',
      path: `agent-config/skills/${payload.id}/SKILL.md`,
      assignedAgents: payload.assignToAgentIds ?? [],
    };
    this.skills.update((skills) => [skill, ...skills.filter((item) => item.id !== skill.id)]);
    this.selectedSkillId.set(skill.id);
    this.saving.set(false);
    this.addWorkLog('runtime-demo-skill-added', 'skill.created', 'controller-plane', `Demo skill "${skill.name}" was added.`);
    return of(skill);
  }

  sendMessage(payload: CreateMessageRequest): Observable<unknown> {
    this.saving.set(true);
    const now = new Date().toISOString();
    const message = {
      id: `demo-msg-${Date.now()}`,
      created_at: now,
      updated_at: now,
      sender: payload.sender || 'controller-plane',
      recipient: payload.recipient,
      type: payload.type,
      reply_to: payload.replyTo,
      status: 'pending',
      path: `.agent-state/messages/events-demo/${payload.type}.yaml`,
      folder_agent_id: payload.recipient,
      payload: payload.payload,
    };
    this.messaging.update((current) => {
      if (!current) return current;
      const messages = [message, ...current.messages];
      return {
        ...current,
        summary: {
          ...current.summary,
          total: messages.length,
          unresolved: messages.filter((item) => item.status === 'pending').length,
          byStatus: {
            ...current.summary.byStatus,
            pending: (current.summary.byStatus['pending'] ?? 0) + 1,
          },
          byType: {
            ...current.summary.byType,
            [message.type]: (current.summary.byType[message.type] ?? 0) + 1,
          },
        },
        messages,
        events: [
          {
            event_at: now,
            event: 'message.created',
            message_id: message.id,
            sender: message.sender,
            recipient: message.recipient,
          },
          ...current.events,
        ],
      };
    });
    this.saving.set(false);
    this.addWorkLog('message-demo-created', 'message.created', payload.recipient, `Demo message "${payload.type}" was queued.`);
    return of(message);
  }

  private upsertTask(task: Task): void {
    this.tasks.update((tasks) => [task, ...tasks.filter((item) => item.id !== task.id)]);
  }

  private addWorkLog(idPrefix: string, event: string, agent: string, detail: string): void {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    this.workLogs.update((logs) => [
      {
        id: `${idPrefix}-${now.getTime()}`,
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        event,
        agent,
        detail,
        status: 'pending',
        path: '.agent-state/messages/events-demo/',
      },
      ...logs,
    ]);
  }
}
