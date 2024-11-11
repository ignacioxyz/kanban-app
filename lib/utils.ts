import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { LiveMap, LiveObject } from "@liveblocks/client";
import { Board, Column, Task } from "../app/types";

export const generateId = () => {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
};

export const initialStorage = () => {
  const tasks = new LiveMap<string, LiveObject<Task>>();
  const columns = new LiveMap<string, LiveObject<Column>>();

  const initialColumns: Column[] = [
    {
      id: "column-1",
      title: "To Do",
      color: "#f0f0f0",
      createdAt: Date.now(),
      order: 1,
      taskIds: ["task-1"]
    },
    {
      id: "column-2",
      title: "In Progress",
      color: "#ffd700",
      createdAt: Date.now(),
      order: 2,
      taskIds: ["task-2"]
    },
    {
      id: "column-3",
      title: "Done",
      color: "#90ee90",
      createdAt: Date.now(),
      order: 3,
      taskIds: ["task-3"]
    },
  ];

  initialColumns.forEach((column) => {
    columns.set(column.id, new LiveObject(column));
  });

  const initialTasks: Task[] = [
    {
      id: "task-1",
      title: "Task 1",
      description: "Description for Task 1",
      priority: "medium",
      createdAt: Date.now(),
      columnId: "column-1",
      labels: [],
    },
    {
      id: "task-2",
      title: "Task 2",
      description: "Description for Task 2",
      priority: "high",
      createdAt: Date.now(),
      columnId: "column-2",
      labels: [],
    },
    {
      id: "task-3",
      title: "Task 3",
      description: "Description for Task 3",
      priority: "low",
      createdAt: Date.now(),
      columnId: "column-3",
      labels: [],
    },
  ];

  initialTasks.forEach((task) => {
    tasks.set(task.id, new LiveObject(task));
  });

  const board: LiveObject<Board> = new LiveObject({
    tasks,
    columns,
  });

  return {
    board,
  };
};
