"use client";

import React, { useMemo } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Column } from "./Column";
import { useKanbanBoard } from "@/app/hooks/useKanvanBoard";
import { Task } from "@/app/types";
import Image from "next/image";
import { Copy } from "lucide-react";

export const KanbanBoard: React.FC<{roomId: string}> = ({roomId}) => {
  const { board, onDragEnd } = useKanbanBoard();

  const sortedColumnsWithTasks = useMemo(() => {
    if (!board) return [];
    
    return Array.from(board.columns.entries())
      .sort(([, columnA], [, columnB]) => columnA.order - columnB.order)
      .map(([id, column]) => {
        const tasksInColumn = column.taskIds?.map(taskId => board.tasks.get(taskId))
          .filter((task): task is Task => task !== undefined) ?? [];

        return {
          id,
          column,
          tasks: tasksInColumn
        };
      });
  }, [board]);

  if (board == null) {
    return (
      <Image
      src="/hands.svg"
      width={500}
      height={500}
      alt="Picture of the author"
    />
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Kanban Board</h1>
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-gray-500 text-xl">Room ID: {decodeURIComponent(roomId)}</h2>
        <button
          onClick={() => navigator.clipboard.writeText(decodeURIComponent(roomId))}
          className="flex gap-2 items-center px-4 py-2 hover:bg-gray-100 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
          title="Copy room ID"
        >
          <Copy size={15}/> Copy
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 max-h-[512px]">
          {sortedColumnsWithTasks.map(({ id, column, tasks }) => (
            <Column key={id} column={column} tasks={tasks} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
