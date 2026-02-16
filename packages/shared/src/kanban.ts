// Kanban Board System for Agent Task Management
// Visual project management for AI agent workflows

import { EventEmitter } from 'events';

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string; // Agent ID
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  labels: string[];
  dependencies: string[]; // Task IDs this task depends on
  subtasks: string[];
  estimatedHours?: number;
  actualHours?: number;
  metadata: Record<string, any>;
}

interface KanbanColumn {
  id: string;
  name: string;
  status: KanbanTask['status'];
  tasks: KanbanTask[];
  wipLimit?: number; // Work in progress limit
}

interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  columns: KanbanColumn[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskFilter {
  status?: KanbanTask['status'];
  assignee?: string;
  priority?: KanbanTask['priority'];
  labels?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
}

class KanbanManager extends EventEmitter {
  private boards: Map<string, KanbanBoard> = new Map();
  private tasks: Map<string, KanbanTask> = new Map();
  
  /**
   * Create a new Kanban board
   */
  createBoard(name: string, description: string): KanbanBoard {
    const board: KanbanBoard = {
      id: this.generateId(),
      name,
      description,
      columns: [
        { id: 'backlog', name: 'Backlog', status: 'backlog', tasks: [], wipLimit: 100 },
        { id: 'todo', name: 'To Do', status: 'todo', tasks: [], wipLimit: 10 },
        { id: 'in_progress', name: 'In Progress', status: 'in_progress', tasks: [], wipLimit: 5 },
        { id: 'review', name: 'Review', status: 'review', tasks: [], wipLimit: 5 },
        { id: 'done', name: 'Done', status: 'done', tasks: [] },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.boards.set(board.id, board);
    this.emit('boardCreated', board);
    
    return board;
  }
  
  /**
   * Create a new task
   */
  createTask(
    boardId: string,
    title: string,
    description: string,
    options: Partial<Omit<KanbanTask, 'id' | 'title' | 'description' | 'status' | 'reporter' | 'createdAt' | 'updatedAt' | 'labels' | 'dependencies' | 'subtasks' | 'metadata'>> & { reporter: string }
  ): KanbanTask {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error(`Board ${boardId} not found`);
    }
    
    const task: KanbanTask = {
      id: this.generateId(),
      title,
      description,
      status: 'backlog',
      priority: options.priority || 'medium',
      assignee: options.assignee,
      reporter: options.reporter,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: options.dueDate,
      labels: options.labels || [],
      dependencies: options.dependencies || [],
      subtasks: [],
      estimatedHours: options.estimatedHours,
      actualHours: 0,
      metadata: options.metadata || {},
    };
    
    this.tasks.set(task.id, task);
    
    // Add to backlog column
    const backlogColumn = board.columns.find(c => c.status === 'backlog');
    if (backlogColumn) {
      backlogColumn.tasks.push(task);
    }
    
    board.updatedAt = new Date();
    
    this.emit('taskCreated', { task, boardId });
    
    return task;
  }
  
  /**
   * Move task to different column/status
   */
  moveTask(taskId: string, newStatus: KanbanTask['status']): KanbanTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const oldStatus = task.status;
    
    // Find the board containing this task
    const board = this.findBoardByTaskId(taskId);
    if (!board) {
      throw new Error(`Board not found for task ${taskId}`);
    }
    
    // Check WIP limit
    const targetColumn = board.columns.find(c => c.status === newStatus);
    if (targetColumn?.wipLimit && targetColumn.tasks.length >= targetColumn.wipLimit) {
      throw new Error(`WIP limit reached for column ${targetColumn.name}`);
    }
    
    // Remove from old column
    const oldColumn = board.columns.find(c => c.status === oldStatus);
    if (oldColumn) {
      oldColumn.tasks = oldColumn.tasks.filter(t => t.id !== taskId);
    }
    
    // Add to new column
    if (targetColumn) {
      targetColumn.tasks.push(task);
    }
    
    // Update task
    task.status = newStatus;
    task.updatedAt = new Date();
    
    // Track actual hours when moving to done
    if (newStatus === 'done' && task.estimatedHours) {
      task.actualHours = this.calculateActualHours(task);
    }
    
    board.updatedAt = new Date();
    
    this.emit('taskMoved', { task, oldStatus, newStatus });
    
    return task;
  }
  
  /**
   * Assign task to agent
   */
  assignTask(taskId: string, agentId: string): KanbanTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.assignee = agentId;
    task.updatedAt = new Date();
    
    this.emit('taskAssigned', { task, agentId });
    
    return task;
  }
  
  /**
   * Get tasks for a specific agent
   */
  getAgentTasks(agentId: string, filter?: TaskFilter): KanbanTask[] {
    const agentTasks = Array.from(this.tasks.values())
      .filter(t => t.assignee === agentId);
    
    return this.applyFilter(agentTasks, filter);
  }
  
  /**
   * Get board with all tasks
   */
  getBoard(boardId: string): KanbanBoard | undefined {
    return this.boards.get(boardId);
  }
  
  /**
   * Get tasks filtered by criteria
   */
  getTasks(filter?: TaskFilter): KanbanTask[] {
    const allTasks = Array.from(this.tasks.values());
    return this.applyFilter(allTasks, filter);
  }
  
  /**
   * Get task statistics
   */
  getStats(boardId: string): {
    total: number;
    byStatus: Record<KanbanTask['status'], number>;
    byPriority: Record<KanbanTask['priority'], number>;
    byAssignee: Record<string, number>;
    overdue: number;
    completedThisWeek: number;
  } {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error(`Board ${boardId} not found`);
    }
    
    const tasks = board.columns.flatMap(c => c.tasks);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total: tasks.length,
      byStatus: {
        backlog: tasks.filter(t => t.status === 'backlog').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length,
      },
      byAssignee: tasks.reduce((acc, t) => {
        const assignee = t.assignee || 'unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      overdue: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done').length,
      completedThisWeek: tasks.filter(t => 
        t.status === 'done' && 
        t.updatedAt > weekAgo
      ).length,
    };
  }
  
  /**
   * Check if task can be started (dependencies met)
   */
  canStartTask(taskId: string): { canStart: boolean; blockingTasks: string[] } {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const blockingTasks = task.dependencies.filter(depId => {
      const depTask = this.tasks.get(depId);
      return depTask?.status !== 'done';
    });
    
    return {
      canStart: blockingTasks.length === 0,
      blockingTasks,
    };
  }
  
  private applyFilter(tasks: KanbanTask[], filter?: TaskFilter): KanbanTask[] {
    if (!filter) return tasks;
    
    return tasks.filter(t => {
      if (filter.status && t.status !== filter.status) return false;
      if (filter.assignee && t.assignee !== filter.assignee) return false;
      if (filter.priority && t.priority !== filter.priority) return false;
      if (filter.labels && !filter.labels.some(l => t.labels.includes(l))) return false;
      if (filter.dueBefore && t.dueDate && t.dueDate > filter.dueBefore) return false;
      if (filter.dueAfter && t.dueDate && t.dueDate < filter.dueAfter) return false;
      return true;
    });
  }
  
  private findBoardByTaskId(taskId: string): KanbanBoard | undefined {
    for (const board of this.boards.values()) {
      for (const column of board.columns) {
        if (column.tasks.some(t => t.id === taskId)) {
          return board;
        }
      }
    }
    return undefined;
  }
  
  private calculateActualHours(task: KanbanTask): number {
    // Simple estimation - in real implementation, track time spent
    const hoursSinceCreation = 
      (task.updatedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
    return Math.round(hoursSinceCreation * 10) / 10;
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { KanbanManager, KanbanBoard, KanbanColumn, KanbanTask, TaskFilter };
