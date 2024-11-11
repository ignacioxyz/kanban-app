import {
  JsonObject,
  LiveMap,
  LiveObject,
} from "@liveblocks/client";

export interface Task extends JsonObject {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assigneeId?: string;
  labels: string[];
  createdAt: number;
  columnId: string;
}

export interface Column extends JsonObject {
  id: string;
  title: string;
  color: string;
  wipLimit?: number;
  createdAt: number;
  order: number;
  taskIds: string[];
}

export type Board = {
  tasks: LiveMap<string, LiveObject<Task>>;
  columns: LiveMap<string, LiveObject<Column>>;
};

export type TaskMovedEvent = {
  taskTitle: string;
  sourceColumn: string;
  destinationColumn?: string;
  isSameColumn: boolean;
  droppedOutside?: boolean;
};

export type RoomEvent = {
  type: "task-moved";
  event: TaskMovedEvent;
};