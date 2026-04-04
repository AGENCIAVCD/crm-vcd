"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge-2";
import { Button } from "@/components/ui/button-1";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  description?: string;
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
}

const COLUMN_TITLES: Record<string, string> = {
  backlog: "Backlog",
  inProgress: "In Progress",
  review: "Review",
  done: "Done",
};

const ASSIGNEE_IMAGES = {
  john: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  jane: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  bob: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
  alice: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  charlie: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80",
  eve: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80",
  frank: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=120&q=80",
} as const;

interface TaskCardProps
  extends Omit<React.ComponentProps<typeof KanbanItem>, "value" | "children"> {
  task: Task;
  asHandle?: boolean;
}

function TaskCard({ task, asHandle, ...props }: TaskCardProps) {
  const cardContent = (
    <div className="rounded-md border border-border bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="line-clamp-1 text-sm font-medium">{task.title}</span>
          <Badge
            variant={
              task.priority === "high"
                ? "destructive"
                : task.priority === "medium"
                  ? "primary"
                  : "warning"
            }
            appearance="outline"
            className="pointer-events-none h-5 shrink-0 rounded-sm px-1.5 text-[11px] capitalize"
          >
            {task.priority}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.assignee ? (
            <div className="flex items-center gap-1">
              <Avatar className="size-4">
                <AvatarImage src={task.assigneeAvatar} />
                <AvatarFallback>{task.assignee.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="line-clamp-1">{task.assignee}</span>
            </div>
          ) : null}
          {task.dueDate ? (
            <time className="text-[10px] tabular-nums whitespace-nowrap">
              {task.dueDate}
            </time>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {asHandle ? <KanbanItemHandle>{cardContent}</KanbanItemHandle> : cardContent}
    </KanbanItem>
  );
}

interface TaskColumnProps
  extends Omit<React.ComponentProps<typeof KanbanColumn>, "children"> {
  tasks: Task[];
  isOverlay?: boolean;
}

function TaskColumn({ value, tasks, isOverlay, ...props }: TaskColumnProps) {
  return (
    <KanbanColumn
      value={value}
      {...props}
      className="rounded-md border border-border bg-card p-2.5 shadow-xs"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <KanbanColumnHandle asChild>
          <Button variant="dim" size="sm" mode="icon">
            <GripVertical />
          </Button>
        </KanbanColumnHandle>
      </div>
      <KanbanColumnContent value={value} className="flex flex-col gap-2.5 p-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle={!isOverlay} />
        ))}
      </KanbanColumnContent>
    </KanbanColumn>
  );
}

export default function Component() {
  const [columns, setColumns] = React.useState<Record<string, Task[]>>({
    backlog: [
      {
        id: "1",
        title: "Add authentication",
        priority: "high",
        assignee: "John Doe",
        assigneeAvatar: ASSIGNEE_IMAGES.john,
        dueDate: "Jan 10, 2025",
      },
      {
        id: "2",
        title: "Create API endpoints",
        priority: "medium",
        assignee: "Jane Smith",
        assigneeAvatar: ASSIGNEE_IMAGES.jane,
        dueDate: "Jan 15, 2025",
      },
      {
        id: "3",
        title: "Write documentation",
        priority: "low",
        assignee: "Bob Johnson",
        assigneeAvatar: ASSIGNEE_IMAGES.bob,
        dueDate: "Jan 20, 2025",
      },
    ],
    inProgress: [
      {
        id: "4",
        title: "Design system updates",
        priority: "high",
        assignee: "Alice Brown",
        assigneeAvatar: ASSIGNEE_IMAGES.alice,
        dueDate: "Aug 25, 2025",
      },
      {
        id: "5",
        title: "Implement dark mode",
        priority: "medium",
        assignee: "Charlie Wilson",
        assigneeAvatar: ASSIGNEE_IMAGES.charlie,
        dueDate: "Aug 25, 2025",
      },
    ],
    review: [
      {
        id: "6",
        title: "Review onboarding copy",
        priority: "medium",
        assignee: "Eve Davis",
        assigneeAvatar: ASSIGNEE_IMAGES.eve,
        dueDate: "Sep 02, 2025",
      },
    ],
    done: [
      {
        id: "7",
        title: "Setup project",
        priority: "high",
        assignee: "Eve Davis",
        assigneeAvatar: ASSIGNEE_IMAGES.eve,
        dueDate: "Sep 25, 2025",
      },
      {
        id: "8",
        title: "Initial commit",
        priority: "low",
        assignee: "Frank White",
        assigneeAvatar: ASSIGNEE_IMAGES.frank,
        dueDate: "Sep 20, 2025",
      },
    ],
  });

  return (
    <div className="p-5">
      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item.id}
      >
        <KanbanBoard className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {Object.entries(columns).map(([columnValue, tasks]) => (
            <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
          ))}
        </KanbanBoard>
        <KanbanOverlay>
          <div className="size-full rounded-md bg-muted/60" />
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
