/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type UniqueIdentifier,
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface KanbanContextProps<T> {
  columns: Record<string, T[]>;
  setColumns: (columns: Record<string, T[]>) => void;
  getItemId: (item: T) => string;
  columnIds: string[];
  activeId: UniqueIdentifier | null;
  setActiveId: (id: UniqueIdentifier | null) => void;
  findContainer: (id: UniqueIdentifier) => string | undefined;
  isColumn: (id: UniqueIdentifier) => boolean;
}

const KanbanContext = React.createContext<KanbanContextProps<any>>({
  columns: {},
  setColumns: () => undefined,
  getItemId: () => "",
  columnIds: [],
  activeId: null,
  setActiveId: () => undefined,
  findContainer: () => undefined,
  isColumn: () => false,
});

const ColumnContext = React.createContext<{
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
  disabled?: boolean;
}>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const ItemContext = React.createContext<{
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
  disabled?: boolean;
}>({
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const dropAnimationConfig: DropAnimation = {
  ...defaultDropAnimation,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export interface KanbanMoveEvent {
  event: DragEndEvent;
  activeContainer: string;
  activeIndex: number;
  overContainer: string;
  overIndex: number;
}

export interface KanbanRootProps<T> {
  value: Record<string, T[]>;
  onValueChange: (value: Record<string, T[]>) => void;
  getItemValue: (item: T) => string;
  children: React.ReactNode;
  className?: string;
  onMove?: (event: KanbanMoveEvent) => void;
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
  onMove,
}: KanbanRootProps<T>) {
  const columns = value;
  const setColumns = onValueChange;
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = React.useMemo(() => Object.keys(columns), [columns]);

  const isColumn = React.useCallback(
    (id: UniqueIdentifier) => columnIds.includes(id as string),
    [columnIds],
  );

  const findContainer = React.useCallback(
    (id: UniqueIdentifier) => {
      if (isColumn(id)) {
        return id as string;
      }

      return columnIds.find((key) =>
        (columns[key] ?? []).some((item) => getItemValue(item) === id),
      );
    },
    [columns, columnIds, getItemValue, isColumn],
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      if (onMove) {
        return;
      }

      const { active, over } = event;
      if (!over || isColumn(active.id)) {
        return;
      }

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return;
      }

      const activeItems = [...(columns[activeContainer] ?? [])];
      const overItems = [...(columns[overContainer] ?? [])];
      const activeIndex = activeItems.findIndex(
        (item: T) => getItemValue(item) === active.id,
      );

      if (activeIndex === -1) {
        return;
      }

      let overIndex = overItems.findIndex((item: T) => getItemValue(item) === over.id);
      if (isColumn(over.id)) {
        overIndex = overItems.length;
      }

      const [movedItem] = activeItems.splice(activeIndex, 1);
      const safeOverIndex = overIndex < 0 ? overItems.length : overIndex;
      overItems.splice(safeOverIndex, 0, movedItem);

      setColumns({
        ...columns,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      });
    },
    [columns, findContainer, getItemValue, isColumn, onMove, setColumns],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        return;
      }

      if (onMove && !isColumn(active.id)) {
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer) {
          return;
        }

        const activeIndex = (columns[activeContainer] ?? []).findIndex(
          (item: T) => getItemValue(item) === active.id,
        );
        const overIndex = isColumn(over.id)
          ? (columns[overContainer] ?? []).length
          : (columns[overContainer] ?? []).findIndex(
              (item: T) => getItemValue(item) === over.id,
            );

        if (activeIndex === -1) {
          return;
        }

        onMove({
          event,
          activeContainer,
          activeIndex,
          overContainer,
          overIndex: overIndex < 0 ? (columns[overContainer] ?? []).length : overIndex,
        });
        return;
      }

      if (isColumn(active.id) && isColumn(over.id)) {
        const activeIndex = columnIds.indexOf(active.id as string);
        const overIndex = columnIds.indexOf(over.id as string);

        if (activeIndex !== overIndex) {
          const newOrder = arrayMove(columnIds, activeIndex, overIndex);
          const newColumns: Record<string, T[]> = {};
          newOrder.forEach((key) => {
            newColumns[key] = columns[key] ?? [];
          });
          setColumns(newColumns);
        }

        return;
      }

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer || activeContainer !== overContainer) {
        return;
      }

      const containerItems = columns[activeContainer] ?? [];
      const activeIndex = containerItems.findIndex(
        (item: T) => getItemValue(item) === active.id,
      );
      const overIndex = containerItems.findIndex(
        (item: T) => getItemValue(item) === over.id,
      );

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setColumns({
          ...columns,
          [activeContainer]: arrayMove(containerItems, activeIndex, overIndex),
        });
      }
    },
    [columnIds, columns, findContainer, getItemValue, isColumn, onMove, setColumns],
  );

  const contextValue = React.useMemo(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnIds,
      activeId,
      setActiveId,
      findContainer,
      isColumn,
    }),
    [activeId, columnIds, columns, findContainer, getItemValue, isColumn, setColumns],
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          data-slot="kanban"
          data-dragging={activeId !== null}
          className={cn(className)}
        >
          {children}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  );
}

export interface KanbanBoardProps {
  className?: string;
  children: React.ReactNode;
}

function KanbanBoard({ children, className }: KanbanBoardProps) {
  const { columnIds } = React.useContext(KanbanContext);

  return (
    <SortableContext items={columnIds} strategy={rectSortingStrategy}>
      <div
        data-slot="kanban-board"
        className={cn("grid auto-rows-fr gap-4 sm:grid-cols-3", className)}
      >
        {children}
      </div>
    </SortableContext>
  );
}

export interface KanbanColumnProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function KanbanColumn({
  value,
  className,
  children,
  disabled,
}: KanbanColumnProps) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
  });

  const { activeId, isColumn } = React.useContext(KanbanContext);
  const isColumnDragging = activeId ? isColumn(activeId) : false;

  return (
    <ColumnContext.Provider
      value={{ attributes, listeners, isDragging: isColumnDragging, disabled }}
    >
      <div
        ref={setNodeRef}
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        style={{
          transition,
          transform: CSS.Translate.toString(transform),
        }}
        className={cn(
          "group/kanban-column flex flex-col",
          isSortableDragging && "opacity-50",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </div>
    </ColumnContext.Provider>
  );
}

export interface KanbanColumnHandleProps {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  cursor?: boolean;
}

function KanbanColumnHandle({
  asChild,
  className,
  children,
  cursor = true,
}: KanbanColumnHandleProps) {
  const { attributes, listeners, isDragging, disabled } = React.useContext(ColumnContext);
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...listeners}
      className={cn(
        "opacity-0 transition-opacity group-hover/kanban-column:opacity-100",
        cursor && (isDragging ? "!cursor-grabbing" : "!cursor-grab"),
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export interface KanbanItemProps {
  value: string;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function KanbanItem({
  value,
  asChild = false,
  className,
  children,
  disabled,
}: KanbanItemProps) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
  });

  const { activeId, isColumn } = React.useContext(KanbanContext);
  const isItemDragging = activeId ? !isColumn(activeId) : false;
  const Comp = asChild ? Slot : "div";

  return (
    <ItemContext.Provider value={{ listeners, isDragging: isItemDragging, disabled }}>
      <Comp
        ref={setNodeRef}
        data-slot="kanban-item"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        style={{
          transition,
          transform: CSS.Translate.toString(transform),
        }}
        {...attributes}
        className={cn(
          isSortableDragging && "opacity-50",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </Comp>
    </ItemContext.Provider>
  );
}

export interface KanbanItemHandleProps {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  cursor?: boolean;
}

function KanbanItemHandle({
  asChild,
  className,
  children,
  cursor = true,
}: KanbanItemHandleProps) {
  const { listeners, isDragging, disabled } = React.useContext(ItemContext);
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...listeners}
      className={cn(
        cursor && (isDragging ? "!cursor-grabbing" : "!cursor-grab"),
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export interface KanbanColumnContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function KanbanColumnContent({
  value,
  className,
  children,
}: KanbanColumnContentProps) {
  const { columns, getItemId } = React.useContext(KanbanContext);
  const itemIds = React.useMemo(
    () => (columns[value] ?? []).map(getItemId),
    [columns, getItemId, value],
  );

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div
        data-slot="kanban-column-content"
        className={cn("flex flex-col gap-2", className)}
      >
        {children}
      </div>
    </SortableContext>
  );
}

export interface KanbanOverlayProps {
  className?: string;
  children?:
    | React.ReactNode
    | ((params: { value: UniqueIdentifier; variant: "column" | "item" }) => React.ReactNode);
}

function KanbanOverlay({ children, className }: KanbanOverlayProps) {
  const { activeId, isColumn } = React.useContext(KanbanContext);
  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!activeId) {
      setDimensions(null);
      return;
    }

    const element = document.querySelector(
      `[data-slot="kanban-${isColumn(activeId) ? "column" : "item"}"][data-value="${activeId}"]`,
    );

    if (!element) {
      setDimensions(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setDimensions({
      width: rect.width,
      height: rect.height,
    });
  }, [activeId, isColumn]);

  const content = React.useMemo(() => {
    if (!activeId) {
      return null;
    }

    if (typeof children === "function") {
      return children({
        value: activeId,
        variant: isColumn(activeId) ? "column" : "item",
      });
    }

    return children;
  }, [activeId, children, isColumn]);

  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>
      <div
        data-slot="kanban-overlay"
        data-dragging={true}
        style={{
          width: dimensions?.width,
          height: dimensions?.height,
        }}
        className={cn(
          "pointer-events-none",
          className,
          activeId ? "!cursor-grabbing" : "",
        )}
      >
        {content}
      </div>
    </DragOverlay>
  );
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
};
