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
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Ellipsis, GripVertical, Pencil, Plus, X } from "lucide-react";
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
import { Input } from "@/app/components/ui/input";
import {
  CreateProjectColumnDocument,
  DeleteProjectColumnDocument,
  ReorderProjectColumnsDocument,
  UpdateProjectColumnDocument,
  UpdateTaskStatusDocument,
} from "@/app/lib/graphql/generated/documents";
import { projectHeaderRefetch, taskStatusForApi } from "@/app/lib/project-progress";
import { groupTasksByStatus, moveTask } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import { TaskCard } from "../task-card";
import { TaskSheet } from "../task-sheet";

const screenReaderInstructions = {
  draggable:
    "To pick up a task or a column, press space or enter. While dragging, use the arrow keys to move it, and press space or enter again to drop, or escape to cancel.",
};

/** Column drag ids share the same DndContext as task drag ids, so they're
 * namespaced to keep the two apart. */
const columnDragId = (id) => `col:${id}`;
const isColumnDragId = (id) => typeof id === "string" && id.startsWith("col:");

/** Columns and tasks live in one DndContext but must never collide as drop
 * targets — a column being dragged should only ever land on another column,
 * and a task should never treat a column's own sortable node as a target. */
function boardCollisionDetection(args) {
  const activeIsColumn = args.active?.data?.current?.type === "column";
  const droppableContainers = args.droppableContainers.filter((container) =>
    activeIsColumn
      ? container.data?.current?.type === "column"
      : container.data?.current?.type !== "column",
  );
  return closestCorners({ ...args, droppableContainers });
}

export function ProjectBoard({
  projectId,
  tasks = [],
  phases = [],
  milestones = [],
  users = [],
  boardColumns = [],
  canManage = false,
  viewerId = null,
}) {
  const router = useRouter();
  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument);
  const [createColumn] = useMutation(CreateProjectColumnDocument);
  const [updateColumn] = useMutation(UpdateProjectColumnDocument);
  const [deleteColumn] = useMutation(DeleteProjectColumnDocument);
  const [reorderColumns] = useMutation(ReorderProjectColumnsDocument);
  const canMoveTask = (task) => canManage || task.assigneeId === viewerId;

  const statusKeys = [...boardColumns.map((column) => column.status), "_unknown"];

  const [columns, setColumns] = useState(() => groupTasksByStatus(tasks, boardColumns));
  const [activeId, setActiveId] = useState(null);
  const [panel, setPanel] = useState(null);
  const [addingColumnAfter, setAddingColumnAfter] = useState(undefined); // column id, or null for "append"
  const [columnBusy, setColumnBusy] = useState(false);

  // Re-seed from the server whenever the query returns new data. Adjusting
  // during render (rather than in an effect) means the board never paints one
  // frame of stale order after a refresh.
  const [serverTasks, setServerTasks] = useState(tasks);
  if (serverTasks !== tasks) {
    setServerTasks(tasks);
    setColumns(groupTasksByStatus(tasks, boardColumns));
  }

  // Snapshot taken when a drag starts, so a failed write can roll back to
  // exactly what was on screen before.
  const rollbackRef = useRef(null);

  const sensors = useSensors(
    // A small distance threshold keeps a click-to-open from registering as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask =
    activeId && !isColumnDragId(activeId)
      ? statusKeys.flatMap((status) => columns[status] ?? []).find((task) => task.id === activeId)
      : null;
  const activeColumn = activeId && isColumnDragId(activeId)
    ? boardColumns.find((column) => columnDragId(column.id) === activeId)
    : null;

  function columnOf(id) {
    if (statusKeys.includes(id)) return id;
    return statusKeys.find((status) => (columns[status] ?? []).some((task) => task.id === id));
  }

  function indexIn(status, id) {
    return (columns[status] ?? []).findIndex((task) => task.id === id);
  }

  function handleDragStart({ active }) {
    if (isColumnDragId(active.id)) {
      setActiveId(active.id);
      return;
    }
    const task = tasks.find((item) => item.id === active.id);
    if (task && !canMoveTask(task)) return;
    rollbackRef.current = columns;
    setActiveId(active.id);
  }

  /**
   * Cross-column movement happens during the drag, not on drop, so the card
   * visibly lives in the column it is hovering over. Column reordering needs
   * no equivalent here — the horizontal SortableContext previews that on its
   * own, purely from render order, without any state changes mid-drag.
   */
  function handleDragOver({ active, over }) {
    if (isColumnDragId(active.id)) return;
    if (!over) return;
    const from = columnOf(active.id);
    const to = columnOf(over.id);
    if (!from || !to || from === to) return;

    setColumns((current) => {
      const overIndex = statusKeys.includes(over.id)
        ? (current[to] ?? []).length
        : (current[to] ?? []).findIndex((task) => task.id === over.id);
      return moveTask(current, active.id, to, overIndex < 0 ? (current[to] ?? []).length : overIndex, boardColumns);
    });
  }

  async function handleDragEnd({ active, over }) {
    if (isColumnDragId(active.id)) {
      setActiveId(null);
      if (!over || over.id === active.id || !isColumnDragId(over.id)) return;
      const oldIndex = boardColumns.findIndex((column) => columnDragId(column.id) === active.id);
      const newIndex = boardColumns.findIndex((column) => columnDragId(column.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const orderedColumnIds = arrayMove(boardColumns, oldIndex, newIndex).map((column) => column.id);
      try {
        await reorderColumns({ variables: { projectId, orderedColumnIds } });
        router.refresh();
      } catch (error) {
        toast.error("Couldn't reorder columns", { description: error?.message });
      }
      return;
    }

    setActiveId(null);
    const snapshot = rollbackRef.current;
    rollbackRef.current = null;

    if (!over) {
      if (snapshot) setColumns(snapshot);
      return;
    }

    const to = columnOf(over.id);
    if (!to) return;

    const overIndex = statusKeys.includes(over.id) ? (columns[to] ?? []).length - 1 : indexIn(to, over.id);
    const next = moveTask(columns, active.id, to, overIndex < 0 ? (columns[to] ?? []).length : overIndex, boardColumns);
    const finalIndex = (next[to] ?? []).findIndex((task) => task.id === active.id);

    const original = snapshot
      ? statusKeys
          .flatMap((status) => (snapshot[status] ?? []).map((task) => ({ ...task, status })))
          .find((task) => task.id === active.id)
      : null;

    setColumns(next);

    // Nothing actually moved — don't spend a write on it.
    if (original && original.status === to && original.orderIndex === finalIndex) return;

    await persist(active.id, to, finalIndex, snapshot);
  }

  async function persist(taskId, status, orderIndex, snapshot) {
    try {
      await updateTaskStatus({
        variables: { id: taskId, status: taskStatusForApi(status), orderIndex },
        refetchQueries: projectHeaderRefetch(projectId),
        awaitRefetchQueries: true,
      });
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
    const next = moveTask(columns, taskId, toStatus, toIndex, boardColumns);
    const finalIndex = (next[toStatus] ?? []).findIndex((task) => task.id === taskId);
    setColumns(next);
    await persist(taskId, toStatus, finalIndex, snapshot);
  }

  const openTask = (task) => setPanel({ mode: "view", taskId: task.id });

  async function handleCreateColumn(label, insertAfterColumnId) {
    setColumnBusy(true);
    try {
      await createColumn({
        variables: { projectId, label, insertAfterColumnId: insertAfterColumnId ?? null },
        refetchQueries: projectHeaderRefetch(projectId),
      });
      toast.success("Column added");
      setAddingColumnAfter(undefined);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't add that column", { description: error?.message });
    } finally {
      setColumnBusy(false);
    }
  }

  async function handleRenameColumn(columnId, label) {
    try {
      await updateColumn({ variables: { id: columnId, label } });
      toast.success("Column renamed");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't rename that column", { description: error?.message });
    }
  }

  async function handleSetTerminal(columnId) {
    try {
      await updateColumn({ variables: { id: columnId, isTerminal: true } });
      toast.success("Marked as the done column");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't update that column", { description: error?.message });
    }
  }

  async function handleDeleteColumn(columnId) {
    try {
      await deleteColumn({ variables: { id: columnId } });
      toast.success("Column deleted");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't delete that column", { description: error?.message });
    }
  }

  async function handleMoveColumn(columnId, direction) {
    const index = boardColumns.findIndex((column) => column.id === columnId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= boardColumns.length) return;
    const ids = boardColumns.map((column) => column.id);
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
    try {
      await reorderColumns({ variables: { projectId, orderedColumnIds: ids } });
      router.refresh();
    } catch (error) {
      toast.error("Couldn't reorder columns", { description: error?.message });
    }
  }

  const unknownTasks = columns._unknown ?? [];

  return (
    <>
      <div className="mb-4 toolbar-row">
        <p className="text-caption text-muted-foreground">
          {canManage
            ? "Drag a card, or use its menu, to move it between columns."
            : "Drag your own cards, or use their menu, to move them between columns."}
        </p>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setAddingColumnAfter(null)}
              data-tour="board-add-column"
            >
              <Plus aria-hidden="true" />
              Add column
            </Button>
            <Button size="sm" onClick={() => setPanel({ mode: "create" })} data-tour="board-add-task">
              <Plus aria-hidden="true" />
              Add task
            </Button>
          </div>
        ) : null}
      </div>

      <DndContext
        // A stable id: without one, dnd-kit's generated `aria-describedby`
        // values differ between the server render and hydration.
        id="project-board"
        sensors={sensors}
        collisionDetection={boardCollisionDetection}
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
        <div className="flex items-start gap-3 overflow-x-auto pb-2" data-tour="board-columns">
          <SortableContext
            items={boardColumns.map((column) => columnDragId(column.id))}
            strategy={horizontalListSortingStrategy}
          >
            {boardColumns.map((column, index) => (
              <div key={column.id} className="flex shrink-0 items-stretch gap-1.5">
                {canManage && addingColumnAfter === column.id ? (
                  <NewColumnInline
                    onCancel={() => setAddingColumnAfter(undefined)}
                    onCreate={(label) => handleCreateColumn(label, column.id)}
                    busy={columnBusy}
                  />
                ) : null}
                <BoardColumn
                  column={column}
                  tasks={columns[column.status] ?? []}
                  onOpen={openTask}
                  onMove={moveVia}
                  canMoveTask={canMoveTask}
                  canManage={canManage}
                  onAdd={canManage ? () => setPanel({ mode: "create", defaults: { status: column.status } }) : null}
                  columnSizes={Object.fromEntries(
                    boardColumns.map((col) => [col.status, (columns[col.status] ?? []).length]),
                  )}
                  boardColumns={boardColumns}
                  onRename={(label) => handleRenameColumn(column.id, label)}
                  onSetTerminal={() => handleSetTerminal(column.id)}
                  onDelete={() => handleDeleteColumn(column.id)}
                  onMoveLeft={index > 0 ? () => handleMoveColumn(column.id, -1) : null}
                  onMoveRight={index < boardColumns.length - 1 ? () => handleMoveColumn(column.id, 1) : null}
                  onInsertAfter={() => setAddingColumnAfter(column.id)}
                />
              </div>
            ))}
          </SortableContext>

          {unknownTasks.length > 0 ? (
            <UnknownColumn
              tasks={unknownTasks}
              onOpen={openTask}
              onMove={moveVia}
              canMoveTask={canMoveTask}
              boardColumns={boardColumns}
              columnSizes={Object.fromEntries(
                boardColumns.map((col) => [col.status, (columns[col.status] ?? []).length]),
              )}
            />
          ) : null}

          {canManage && addingColumnAfter === null ? (
            <NewColumnInline
              onCancel={() => setAddingColumnAfter(undefined)}
              onCreate={(label) => handleCreateColumn(label, null)}
              busy={columnBusy}
            />
          ) : null}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeTask ? (
            <TaskCard task={activeTask} overlay boardColumns={boardColumns} />
          ) : activeColumn ? (
            <div className="flex h-10 w-72 items-center gap-2 rounded-xl border bg-card px-3 text-caption font-medium shadow-raised">
              <GripVertical aria-hidden="true" className="size-4 text-muted-foreground" />
              {activeColumn.label}
            </div>
          ) : null}
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
        boardColumns={boardColumns}
        canManage={canManage}
      />
    </>
  );
}

function NewColumnInline({ onCancel, onCreate, busy }) {
  const [label, setLabel] = useState("");

  function submit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  }

  return (
    <div className="flex h-10 min-w-52 shrink-0 items-center gap-1.5 rounded-xl border bg-muted/40 p-1.5">
      <Input
        autoFocus
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") onCancel();
        }}
        placeholder="Column name"
        className="h-7"
        disabled={busy}
      />
      <Button size="icon-sm" onClick={submit} disabled={busy || !label.trim()}>
        <Plus aria-hidden="true" />
        <span className="sr-only">Add column</span>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={busy}>
        <X aria-hidden="true" />
        <span className="sr-only">Cancel</span>
      </Button>
    </div>
  );
}

function BoardColumn({
  column,
  tasks,
  onOpen,
  onMove,
  canMoveTask,
  canManage,
  onAdd,
  columnSizes,
  boardColumns,
  onRename,
  onSetTerminal,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onInsertAfter,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnDragId(column.id),
    data: { type: "column" },
    disabled: !canManage,
  });
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(column.label);

  function submitRename() {
    const trimmed = label.trim();
    setRenaming(false);
    if (!trimmed || trimmed === column.label) {
      setLabel(column.label);
      return;
    }
    onRename(trimmed);
  }

  return (
    <section
      ref={setSortableRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-labelledby={`column-${column.status}`}
      className={cn(
        "flex min-h-32 w-72 min-w-72 flex-col rounded-xl border bg-muted/40",
        isDragging && "opacity-50",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {canManage ? (
            <button
              type="button"
              {...dragAttributes}
              {...dragListeners}
              className="-ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-ring active:cursor-grabbing"
              aria-label={`Reorder "${column.label}"`}
            >
              <GripVertical aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          {renaming ? (
            <Input
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              onBlur={submitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitRename();
                if (event.key === "Escape") {
                  setLabel(column.label);
                  setRenaming(false);
                }
              }}
              className="h-7"
            />
          ) : (
            <h2 id={`column-${column.status}`} className="truncate text-caption font-medium">
              {column.label}
              <span className="tabular ml-2 rounded-full bg-background px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
                {tasks.length}
              </span>
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onAdd ? (
            <Button variant="ghost" size="icon-sm" onClick={onAdd}>
              <Plus aria-hidden="true" />
              <span className="sr-only">Add a task to {column.label}</span>
            </Button>
          ) : null}
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Ellipsis aria-hidden="true" />
                  <span className="sr-only">Column settings for {column.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setRenaming(true)}>
                  <Pencil aria-hidden="true" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onInsertAfter}>
                  <Plus aria-hidden="true" />
                  Insert column after
                </DropdownMenuItem>
                {onMoveLeft ? (
                  <DropdownMenuItem onSelect={onMoveLeft}>
                    <ChevronLeft aria-hidden="true" />
                    Move left
                  </DropdownMenuItem>
                ) : null}
                {onMoveRight ? (
                  <DropdownMenuItem onSelect={onMoveRight}>
                    <ChevronRight aria-hidden="true" />
                    Move right
                  </DropdownMenuItem>
                ) : null}
                {!column.isTerminal ? (
                  <DropdownMenuItem onSelect={onSetTerminal}>Mark as the done column</DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={column.isTerminal || boardColumns.length <= 1}
                  onSelect={onDelete}
                >
                  Delete column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
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
              boardColumns={boardColumns}
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

/** A read-only landing spot for tasks whose status matches no configured
 * column — recoverable via the same "move to column" menu as any other
 * card, instead of silently disappearing from the board. */
function UnknownColumn({ tasks, onOpen, onMove, canMoveTask, boardColumns, columnSizes }) {
  return (
    <section
      aria-labelledby="column-unknown"
      className="flex min-h-32 w-72 min-w-72 flex-col rounded-xl border border-dashed bg-tone-caution-bg/40"
    >
      <header className="px-3 py-2.5">
        <h2 id="column-unknown" className="truncate text-caption font-medium">
          Unrecognized status
          <span className="tabular ml-2 rounded-full bg-background px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
            {tasks.length}
          </span>
        </h2>
      </header>
      <div className="flex min-h-32 flex-1 flex-col gap-2 rounded-b-xl p-2">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            onOpen={onOpen}
            movable={canMoveTask(task)}
            boardColumns={boardColumns}
            actions={
              canMoveTask(task) ? (
                <TaskCardMenu
                  task={task}
                  index={index}
                  columnStatus="_unknown"
                  columnLength={tasks.length}
                  columnSizes={columnSizes}
                  boardColumns={boardColumns}
                  onMove={onMove}
                />
              ) : null
            }
          />
        ))}
      </div>
    </section>
  );
}

function SortableTaskCard({ task, index, columnStatus, columnLength, columnSizes, boardColumns, onOpen, onMove, movable }) {
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
      boardColumns={boardColumns}
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
            boardColumns={boardColumns}
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
function TaskCardMenu({ task, index, columnStatus, columnLength, columnSizes, boardColumns, onMove }) {
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
        {boardColumns
          .filter((column) => column.status !== columnStatus)
          .map((column) => (
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
