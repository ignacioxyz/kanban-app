import { useCallback } from "react";
import { DropResult, DragStart } from "@hello-pangea/dnd";
import {
  useMutation,
  useStorage,
  useBroadcastEvent,
  useEventListener,
  useUpdateMyPresence
} from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { Board } from "../types";
import { toast } from "sonner";
import { userStore } from "@/store/userStore";

type TaskMoveEvent = {
  type: "TASK_MOVED" | "TASK_ADDED" | "TASK_DELETED";
  data: {
    taskTitle?: string;
    sourceColumn?: string;
    destinationColumn?: string;
    isSameColumn?: boolean;
    droppedOutside?: boolean;
    userName: string;
    columnTitle?: string;
  };
};

export const useKanbanBoard = () => {
  const board = useStorage((root) => root.board);
  const broadcast = useBroadcastEvent();
  const updateMyPresence = useUpdateMyPresence();
  const { name } = userStore();

  useEventListener(({ event, connectionId }) => {
    if (connectionId === null) return;

    const e = event as TaskMoveEvent;
    if (e.type === "TASK_MOVED") {
      const { taskTitle, sourceColumn, destinationColumn, isSameColumn, droppedOutside, userName } = e.data;

      if (droppedOutside) {
        toast.info(`${userName} dropped task "${taskTitle}" outside of any column`);
        return;
      }

      if (isSameColumn) {
        toast.info(
          `${userName} reordered task "${taskTitle}" in "${sourceColumn}"`
        );
      } else {
        toast.info(
          `${userName} moved task "${taskTitle}" from "${sourceColumn}" to "${destinationColumn}"`
        );
      }
    } else if (e.type === "TASK_ADDED") {
      const { userName, columnTitle } = e.data;
      toast.info(`${userName} added a new task to "${columnTitle}"`);
    } else if (e.type === "TASK_DELETED") {
      const { userName, taskTitle, columnTitle } = e.data;
      toast.info(`${userName} deleted task "${taskTitle}" from "${columnTitle}"`);
    }
  });

  const updateBoard = useMutation(({ storage }, result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const boardStorage = storage.get("board") as LiveObject<Board>;
    const columns = boardStorage.get("columns");
    const tasks = boardStorage.get("tasks");

    const sourceColumn = columns.get(source.droppableId);
    const destinationColumn = columns.get(destination.droppableId);
    if (!sourceColumn || !destinationColumn) {
      console.error("Column not found", { source: source.droppableId, destination: destination.droppableId });
      toast.error("Failed to move task: Column not found");
      return;
    }

    const task = tasks.get(draggableId);
    if (!task) {
      console.error("Task not found", draggableId);
      toast.error("Failed to move task: Task not found");
      return;
    }

    const taskTitle = task.get("title");
    const sourceColumnTitle = sourceColumn.get("title");
    const destColumnTitle = destinationColumn.get("title");

    let currentSourceTaskIds = Array.from(sourceColumn.get("taskIds") || []);
    const currentDestTaskIds = Array.from(destinationColumn.get("taskIds") || []);

    currentSourceTaskIds = currentSourceTaskIds.filter(id => id !== draggableId);

    const isSameColumn = source.droppableId === destination.droppableId;
    
    if (isSameColumn) {
      currentSourceTaskIds.splice(destination.index, 0, draggableId);
      sourceColumn.set("taskIds", currentSourceTaskIds);
      
      toast.success(
        `Task "${taskTitle}" reordered in "${sourceColumnTitle}"`
      );

      broadcast({
        type: "TASK_MOVED",
        data: {
          taskTitle,
          sourceColumn: sourceColumnTitle,
          isSameColumn: true,
          userName: name
        }
      });
    } else {
      task.set("columnId", destination.droppableId);
      currentDestTaskIds.splice(destination.index, 0, draggableId);
      sourceColumn.set("taskIds", currentSourceTaskIds);
      destinationColumn.set("taskIds", currentDestTaskIds);

      toast.success(
        `Task "${taskTitle}" moved from "${sourceColumnTitle}" to "${destColumnTitle}"`
      );

      broadcast({
        type: "TASK_MOVED",
        data: {
          taskTitle,
          sourceColumn: sourceColumnTitle,
          destinationColumn: destColumnTitle,
          isSameColumn: false,
          userName: name
        }
      });
    }

    console.log("After update:", {
      sourceTaskIds: currentSourceTaskIds,
      destTaskIds: currentDestTaskIds,
      sourceColumnId: source.droppableId,
      destColumnId: destination.droppableId
    });
  }, [broadcast, name]);

  const onDragStart = useCallback((initial: DragStart) => {
    updateMyPresence({ draggingTask: initial.draggableId });
  }, [updateMyPresence]);

  const onDragEnd = useCallback((result: DropResult) => {
    updateMyPresence({ draggingTask: null });

    if (!result.destination) {
      if (!board) return;
      const tasks = board.tasks;
      if (!tasks) return;
      const task = tasks.get(result.draggableId);
      if (task) {
        const taskTitle = task.title;
        broadcast({
          type: "TASK_MOVED",
          data: {
            taskTitle,
            sourceColumn: "",
            droppedOutside: true,
            userName: name
          }
        });
      }
      return;
    }
    
    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) {
      toast.info("Task position unchanged");
      return;
    }

    updateBoard(result);
  }, [updateBoard, board, broadcast, updateMyPresence, name]);

  return {
    board,
    onDragStart,
    onDragEnd,
  };
};
