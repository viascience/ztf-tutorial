"use client";

import { useEffect, useState } from "react";
import { getTodos } from "@/lib/actions/todos";
import { Todo } from "@/types/todo";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const loadTodos = async () => {
    try {
      setIsLoading(true);
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const completionRate = todos.length > 0 
    ? Math.round((completedCount / todos.length) * 100) 
    : 0;

  // Update stats in the DOM
  useEffect(() => {
    const activeEl = document.getElementById("active-count");
    const completedEl = document.getElementById("completed-count");
    const rateEl = document.getElementById("completion-rate");
    
    if (activeEl) activeEl.textContent = activeCount.toString();
    if (completedEl) completedEl.textContent = completedCount.toString();
    if (rateEl) rateEl.textContent = `${completionRate}%`;
  }, [activeCount, completedCount, completionRate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Security Control Tasks</CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="accent"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <TodoForm
            onSuccess={() => {
              setShowForm(false);
              loadTodos();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-b-none"
          >
            All ({todos.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("active")}
            className="rounded-b-none"
          >
            Active ({activeCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("completed")}
            className="rounded-b-none"
          >
            Completed ({completedCount})
          </Button>
        </div>

        {/* Todo Items */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks found.</p>
            <p className="text-sm mt-2">
              {filter === "all" ? "Add a new task to get started." : `No ${filter} tasks.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onUpdate={loadTodos} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



