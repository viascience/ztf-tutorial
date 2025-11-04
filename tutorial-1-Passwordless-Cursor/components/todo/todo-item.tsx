"use client";

import { useState } from "react";
import { Todo } from "@/types/todo";
import { toggleTodo, deleteTodo } from "@/lib/actions/todos";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TodoItemProps {
  todo: Todo;
  onUpdate: () => void;
}

const priorityColors = {
  low: "text-blue-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await toggleTodo(todo.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTodo(todo.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className={`p-4 transition-colors ${todo.completed ? "bg-gray-50" : ""}`}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            className="mt-1"
          />

          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`font-medium ${
                  todo.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {todo.title}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {todo.description && (
              <p className="text-sm text-muted-foreground">{todo.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className={`flex items-center gap-1 ${priorityColors[todo.priority]}`}>
                {todo.priority === "critical" ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {todo.priority.toUpperCase()}
              </span>

              <span className="text-muted-foreground">
                Category: {todo.category}
              </span>

              {todo.due_date && (
                <span className="text-muted-foreground">
                  Due: {new Date(todo.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{todo.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

