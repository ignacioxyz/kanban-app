import React, { useEffect, useRef, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Column as ColumnType, Task } from "@/app/types";
import { Button } from "./ui/button";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { Task as TaskCard } from "./Task";
import { useMutation, useBroadcastEvent } from "@liveblocks/react/suspense";
import { userStore } from "@/store/userStore";
import { toast } from "sonner";

type ColumnProps = {
  column: ColumnType;
  tasks?: Task[];
};

export const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const [isTopShadowVisible, setIsTopShadowVisible] = useState(false);
  const [isBottomShadowVisible, setIsBottomShadowVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const broadcast = useBroadcastEvent();
  const { name } = userStore();

  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const hasOverflow = scrollHeight > clientHeight;
      
      setIsTopShadowVisible(scrollTop > 0);
      setIsBottomShadowVisible(
        hasOverflow && scrollTop < scrollHeight - clientHeight - 1
      );
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    handleScroll();
  }, [tasks]);

  const handleClickOnAdd = useMutation(({ storage }) => {
    const boardStorage = storage.get("board");

    if (!boardStorage) {
      console.error("Board storage is not initialized.");
      return;
    }

    const newTaskId = crypto.randomUUID();
    const newTask: Task = {
      id: newTaskId,
      title: "New Task",
      description: "Description for new task",
      priority: "medium",
      createdAt: Date.now(),
      columnId: column.id,
      labels: [],
      order: 0,
    };
    
    const existingTasks =
      boardStorage.get("tasks") || new LiveMap<string, LiveObject<Task>>();
    existingTasks.set(newTaskId, new LiveObject(newTask))
    
    const currentColumn = boardStorage.get("columns").get(column.id);
    if (currentColumn) {
      const currentTaskIds = currentColumn.get("taskIds") || [];
      currentColumn.set("taskIds", [...currentTaskIds, newTaskId]);
      
      toast.success(`New task added to "${column.title}"`);

      broadcast({
        type: "TASK_ADDED",
        data: {
          columnTitle: column.title,
          userName: name
        }
      });
    }
  }, [broadcast, name, column.title]);

  return (
    <div className="p-4 rounded-lg w-72 bg-gray-100 relative flex flex-col max-h-full">
      <h2 className="flex justify-between text-lg font-extrabold mb-2">
        <span>{column.title}</span>
        <span className="text-gray-500">{tasks?.length}</span>
      </h2>
      <div className="flex-1 min-h-0">
        <Droppable droppableId={column.id}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={(el) => {
                provided.innerRef(el);
                scrollRef.current = el;
              }}
              className="h-full max-h-[calc(100vh-12rem)] overflow-y-auto px-2 -mx-2"
            >
              {isTopShadowVisible && (
                <div className="sticky top-0 h-4 bg-gradient-to-b from-black/10 to-transparent z-10 pointer-events-none" />
              )}
              {tasks &&
                tasks.map((item, index) => (
                  <TaskCard key={item.id} task={item} index={index} />
                ))}
              {provided.placeholder}
              {isBottomShadowVisible && (
                <div className="sticky bottom-0 h-4 bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none" />
              )}
            </div>
          )}
        </Droppable>
      </div>
      <Button
        onClick={handleClickOnAdd}
        className="w-full mt-4 bg-gradient-to-b from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-600 transition-all"
      >
        + Add Task
      </Button>
    </div>
  );
};
