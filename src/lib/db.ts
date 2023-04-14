// db.ts
import Dexie, { type Table } from 'dexie';
import type { Task, TaskGroup } from './Task';

export class TaskDexie extends Dexie {
  tasks!: Table<Task>; 
  taskGroups!: Table<TaskGroup>; 

  constructor() {
    super('Tasks');
    this.version(2).stores({
      tasks: '++id, title, currentVal, maxVal, consumeVal, recoveryVal, recoveryInterval, nextRecoveryDateTime, cronSchedule, sortOrder, groupId',
      taskGroups: '++id, title, sortOrder'
    });
  }
}

export const db = new TaskDexie();

db.on("ready", async() => {
  if (await db.taskGroups.count() === 0) {
    let group: TaskGroup = {
      id: 0,
      title: "デフォルト",
      sortOrder: 0
    };
    await db.taskGroups.put(group);
  }
});