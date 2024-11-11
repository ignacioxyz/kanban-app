import React, { useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task as TaskType } from "../app/types";
import { useMutation, useOthers, useUpdateMyPresence, useBroadcastEvent } from "@liveblocks/react";
import { Badge } from "./ui/badge";
import { Trash2, Text, Eye, Calendar, Flag } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "./ui/textarea";
import { useDebouncedCallback } from 'use-debounce';
import { LiveObject } from "@liveblocks/client";
import { format } from "date-fns";
import { userStore } from "@/store/userStore";
import { toast } from "sonner";

type TaskProps = {
  task: TaskType;
  index: number;
};

export const Task: React.FC<TaskProps> = ({ task, index }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const othersViewing = useOthers((others) =>
    others.filter((other) => other.presence?.viewingTaskId === task.id)
  );

  const updateMyPresence = useUpdateMyPresence();

  const broadcast = useBroadcastEvent();
  const { name } = userStore();

  const debouncedUpdateDescription = useDebouncedCallback(
    (newDescription: string) => {
      if (newDescription !== task.description) {
        updateDescription(newDescription);
      }
    },
    1000
  );

  const debouncedUpdateTitle = useDebouncedCallback(
    (newTitle: string) => {
      if (newTitle !== task.title) {
        updateTitle(newTitle);
      }
    },
    1000
  );

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
  }, [task.title, task.description]);

  useEffect(() => {
    updateMyPresence({ viewingTaskId: isDialogOpen ? task.id : null });
  }, [isDialogOpen, task.id, updateMyPresence]);

  const handleDelete = useMutation(({ storage }) => {
    const boardStorage = storage.get("board");
    if (!boardStorage) return;
    
    const existingTasks = boardStorage.get("tasks");
    if (!existingTasks || !existingTasks.has(task.id)) return;
    
    const columns = boardStorage.get("columns");
    const column = columns.get(task.columnId);
    const columnTitle = column?.get("title");
    
    existingTasks.delete(task.id);

    toast.success(`Deleted task "${task.title}" from "${columnTitle}"`);

    broadcast({
      type: "TASK_DELETED",
      data: {
        taskTitle: task.title,
        columnTitle,
        userName: name
      }
    });
  }, [broadcast, name, task.title, task.columnId]);

  const updateDescription = useMutation(({ storage }, newDescription: string) => {
    const boardStorage = storage.get("board");
    if (!boardStorage) return;
    
    const existingTasks = boardStorage.get("tasks");
    if (!existingTasks) return;

    const taskLiveObject = existingTasks.get(task.id);
    if (!taskLiveObject) return;
  
    const updatedTaskLiveObject = new LiveObject({
      ...taskLiveObject.toObject(),
      description: newDescription,
    });
  
    existingTasks.set(task.id, updatedTaskLiveObject);
  }, []);

  const updateTitle = useMutation(({ storage }, newTitle: string) => {
    const boardStorage = storage.get("board");
    if (!boardStorage) return;

    const existingTasks = boardStorage.get("tasks");
    if (!existingTasks) return;

    const taskLiveObject = existingTasks.get(task.id);
    if (!taskLiveObject) return;

    const updatedTaskLiveObject = new LiveObject({
      ...taskLiveObject.toObject(),
      title: newTitle,
    });

    existingTasks.set(task.id, updatedTaskLiveObject);
  }, []);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    debouncedUpdateDescription(newDescription);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdateTitle(newTitle);
  };
  const TaskContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >((props, ref) => (
    <div
      ref={ref}
      {...props}
      className={`group bg-white p-3 mb-2 rounded-lg cursor-pointer border select-none relative hover:bg-gray-50 ${
        othersViewing.length > 0 ? 'ring-2 ring-offset-2 ring-blue-400' : ''
      } ${props.className || ""}`}
    >
      <div className="relative">
        <p className="text-sm font-[560] line-clamp-2">{task.title}</p>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>
      
      <div className="relative">
        <p className="text-sm text-[#888] line-clamp-3">{task.description}</p>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>

      <div className="flex items-center justify-between mt-2">
        <Badge className="text-xs" variant={"default"}>
          {task.priority}
        </Badge>
        {othersViewing.length > 0 && (
          <div className="flex items-center gap-1 text-blue-500">
            <Eye size={14} />
            <span className="text-xs">{othersViewing.length}</span>
          </div>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Trash2
            className="absolute top-2 right-2 text-gray-400 transition-[opacity,color] duration-200 
    opacity-0 group-hover:opacity-100 hover:text-gray-600 cursor-pointer"
            size={16}
            onClick={(e) => e.stopPropagation()}
          />
        </AlertDialogTrigger>
        <div onClick={(e) => e.stopPropagation()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{title}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:bg-transparent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-700 border"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>
      </AlertDialog>
    </div>
  ));

  // Add display name
  TaskContent.displayName = "TaskContent";

  return (
    <Draggable draggableId={task.id} index={index} >
      {(provided, snapshot) => (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="focus: outline-none"
            >
              <TaskContent
                className={snapshot.isDragging ? "shadow-solid" : ""}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  className="text-lg font-semibold focus:outline-none w-full pr-8"
                />
                <div className="absolute inset-y-0 right-12 w-8 h-7 top-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Text size={16}/>
                    <h4 className="text-sm font-medium">Description</h4>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={description}
                      onChange={handleDescriptionChange}
                      className="min-h-[100px] pr-16"
                      placeholder="Add a description..."
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Flag size={16} />
                    <h4 className="text-sm font-medium">Priority</h4>
                  </div>
                  <Badge variant="default">{task.priority}</Badge>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} />
                    <h4 className="text-sm font-medium">Created</h4>
                  </div>
                  <p className="text-sm text-gray-500 font-mono">{format(task.createdAt, "PPpp")}</p>
                </div>
                {othersViewing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Currently Viewing</h4>
                    <div className="flex items-center gap-1 text-blue-500">
                      <Eye size={14} />
                      <span className="text-sm">{othersViewing.length} user{othersViewing.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Draggable>
  );
};

export default Task;
