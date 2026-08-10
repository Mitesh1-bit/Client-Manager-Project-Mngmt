"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { UpdateTaskStatusDocument } from "@/app/lib/graphql/generated/documents";
import { TASK_COLUMNS, TASK_STATUSES, groupTasksByStatus, moveTask } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import { TaskCard } from "../task-card";
import { TaskSheet } from "../task-sheet";

const screenReaderInstructions = {
  draggable:
    "To pick up a task, press space or enter. While dragging, use the arrow keys to move it between positions and columns. Press space or enter again to drop, or escape to cancel.",
};

export function ProjectBoard({
  projectId,
  tasks = [],
  phases = [],
  milestones = [],
  users = [],
  canManage = false,
  viewerId = null,
}) {
  const router = useRouter();
  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument);
  const canMoveTask = (task) => canManage || task.assigneeId === viewerId;

  const [columns, setColumns] = useState(() => groupTasksByStatus(tasks));
  const [activeId, setActiveId] = useState(null);
  const [panel, setPanel] = useState(null);

  // Re-seed from the server whenever the query returns new data. Adjusting
  // during render (rather than in an effect) means the board never paints one
  // frame of stale order after a refresh.
  const [serverTasks, setServerTasks] = useState(tasks);
  if (serverTasks !== tasks) {
    setServerTasks(tasks);
    setColumns(groupTasksByStatus(tasks));
  }

  // Snapshot taken when a drag starts, so a failed write can roll back to
  // exactly what was on screen before.
  const rollbackRef = useRef(null);

  const sensors = useSensors(
    // A small distance threshold keeps a click-to-open from registering as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = activeId
    ? TASK_STATUSES.flatMap((status) => columns[status]).find((task) => task.id === activeId)
    : null;

  function columnOf(id) {
    if (TASK_STATUSES.includes(id)) return id;
    return TASK_STATUSES.find((status) => columns[status].some((task) => task.id === id));
  }

  function indexIn(status, id) {
    return columns[status].findIndex((task) => task.id === id);
  }

  function handleDragStart({ active }) {
    const task = tasks.find((item) => item.id === active.id);
    if (task && !canMoveTask(task)) return;
    rollbackRef.current = columns;
    setActiveId(active.id);
  }

  /**
   * Cross-column movement happens during the drag, not on drop, so the card
   * visibly lives in the column it is hovering over.
   */
  function handleDragOver({ active, over }) {
    if (!over) return;
    const from = columnOf(active.id);
    const to = columnOf(over.id);
    if (!from || !to || from === to) return;

    setColumns((current) => {
      const overIndex = TASK_STATUSES.includes(over.id)
        ? current[to].length
        : current[to].findIndex((task) => task.id === over.id);
      return moveTask(current, active.id, to, overIndex < 0 ? current[to].length : overIndex);
    });
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    const snapshot = rollbackRef.current;
    rollbackRef.current = null;

    if (!over) {
      if (snapshot) setColumns(snapshot);
      return;
    }

    const to = columnOf(over.id);
    if (!to) return;

    const overIndex = TASK_STATUSES.includes(over.id) ? columns[to].length - 1 : indexIn(to, over.id);
    const next = moveTask(columns, active.id, to, overIndex < 0 ? columns[to].length : overIndex);
    const finalIndex = next[to].findIndex((task) => task.id === active.id);

    const original = snapshot
      ? TASK_STATUSES.flatMap((status) =>
          snapshot[status].map((task) => ({ ...task, status })),
        ).find((task) => task.id === active.id)
      : null;

    setColumns(next);

    // Nothing actually moved — don't spend a write on it.
    if (original && original.status === to && original.orderIndex === finalIndex) return;

    await persist(active.id, to, finalIndex, snapshot);
  }

  async function persist(taskId, status, orderIndex, snapshot) {
    try {
      await updateTaskStatus({ variables: { id: taskId, status, orderIndex } });
      router.refresh();
    } catch (error) {
      if (snapshot) setColumns(snapshot);
      toast.error("Couldn't move that task", {
        description: error?.message ?? "The board was put back the way it was.",
      });
    }
  }

  /** Keyboard/menu equivalent of a drag, for people who don't use a pointer. */
  async function moveVia(taskId, toStatus, toIndex) {
    const snapshot = columns;
    const next = moveTask(columns, taskId, toStatus, toIndex);
    const finalIndex = next[toStatus].findIndex((task) => task.id === taskId);
    setColumns(next);
    await persist(taskId, toStatus, finalIndex, snapshot);
  }

  const openTask = (task) => setPanel({ mode: "view", taskId: task.id });

  return (
    <>
      <div className="mb-4 toolbar-row">
        <p className="text-caption text-muted-foreground">
          {canManage
            ? "Drag a card, or use its menu, to move it between columns."
            : "Drag your own cards, or use their menu, to move them between columns."}
        </p>
        {canManage ? (
          <Button size="sm" onClick={() => setPanel({ mode: "create" })} data-tour="board-add-task">
            <Plus aria-hidden="true" />
            Add task
          </Button>
        ) : null}
      </div>

      <DndContext
        // A stable id: without one, dnd-kit's generated `aria-describedby`
        // values differ between the server render and hydration.
        id="project-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{ screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          if (rollbackRef.current) setColumns(rollbackRef.current);
          rollbackRef.current = null;
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour="board-columns">
          {TASK_COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              column={column}
              tasks={columns[column.status]}
              onOpen={openTask}
              onMove={moveVia}
              canMoveTask={canMoveTask}
              onAdd={canManage ? () => setPanel({ mode: "create", defaults: { status: column.status } }) : null}
              columnSizes={Object.fromEntries(
                TASK_STATUSES.map((status) => [status, columns[status].length]),
              )}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskSheet
        projectId={projectId}
        panel={panel}
        onPanelChange={setPanel}
        tasks={tasks}
        phases={phases}
        milestones={milestones}
        users={users}
        canManage={canManage}
      />
    </>
  );
}

function BoardColumn({ column, tasks, onOpen, onMove, canMoveTask, onAdd, columnSizes }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section
      aria-labelledby={`column-${column.status}`}
      className="flex min-w-0 flex-col rounded-xl border bg-muted/40"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 id={`column-${column.status}`} className="text-caption font-medium">
          {column.label}
          <span className="tabular ml-2 rounded-full bg-background px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
            {tasks.length}
          </span>
        </h2>
        {onAdd ? (
          <Button variant="ghost" size="icon-sm" onClick={onAdd}>
            <Plus aria-hidden="true" />
            <span className="sr-only">Add a task to {column.label}</span>
          </Button>
        ) : null}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30",
        )}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, index) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              index={index}
              columnStatus={column.status}
              columnLength={tasks.length}
              columnSizes={columnSizes}
              onOpen={onOpen}
              onMove={onMove}
              movable={canMoveTask(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            Nothing here
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SortableTaskCard({ task, index, columnStatus, columnLength, columnSizes, onOpen, onMove, movable }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !movable,
  });

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      onOpen={onOpen}
      dragging={isDragging}
      movable={movable}
      attributes={movable ? attributes : undefined}
      listeners={movable ? listeners : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      actions={
        movable ? (
          <TaskCardMenu
            task={task}
            index={index}
            columnStatus={columnStatus}
            columnLength={columnLength}
            columnSizes={columnSizes}
            onMove={onMove}
          />
        ) : null
      }
    />
  );
}

/**
 * The pointer-free route to everything drag-and-drop does. Sits above the
 * card's drag listeners, so opening it never starts a drag.
 */
function TaskCardMenu({ task, index, columnStatus, columnLength, columnSizes, onMove }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative z-10 -mt-1 -mr-1 shrink-0"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Ellipsis aria-hidden="true" />
          <span className="sr-only">Move “{task.title}”</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Move within column</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={index === 0}
          onSelect={() => onMove(task.id, columnStatus, index - 1)}
        >
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index >= columnLength - 1}
          onSelect={() => onMove(task.id, columnStatus, index + 1)}
        >
          Move down
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to column</DropdownMenuLabel>
        {TASK_COLUMNS.filter((column) => column.status !== columnStatus).map((column) => (
          <DropdownMenuItem
            key={column.status}
            onSelect={() => onMove(task.id, column.status, columnSizes[column.status])}
          >
            {column.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
