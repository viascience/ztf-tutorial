export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export type TodoCreateInput = Omit<Todo, "id" | "user_id" | "created_at" | "updated_at" | "completed">;
export type TodoUpdateInput = Partial<Omit<Todo, "id" | "user_id" | "created_at" | "updated_at">>;

