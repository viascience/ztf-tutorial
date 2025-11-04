"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/db/supabase";
import { TodoSchema } from "@/lib/utils/validation";
import { TodoCreateInput, TodoUpdateInput } from "@/types/todo";

export async function getTodos() {
  const session = await getServerSession();
  
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const { data, error } = await supabaseServer
      .from("todos")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      // Return empty array if Supabase not available
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Database error:", error);
    // Return empty array if database not available
    return [];
  }
}

export async function createTodo(input: TodoCreateInput) {
  const session = await getServerSession();
  
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validated = TodoSchema.parse(input);

  try {
    const { data, error } = await supabaseServer
      .from("todos")
      .insert({
        user_id: session.userId,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        category: validated.category,
        due_date: validated.dueDate && validated.dueDate.trim() !== "" ? validated.dueDate : null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating todo:", error);
      throw new Error(`Database error: ${error.message}. Please start Supabase with 'npx supabase start'`);
    }

    revalidatePath("/dashboard");
    return data;
  } catch (error) {
    console.error("Failed to create todo:", error);
    if (error instanceof Error && error.message.includes("Database error")) {
      throw error;
    }
    throw new Error("Database unavailable. Please start Supabase with 'npx supabase start'");
  }
}

export async function updateTodo(id: string, input: TodoUpdateInput) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const { data: existing } = await supabaseServer
    .from("todos")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== session.userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabaseServer
    .from("todos")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update todo: ${error.message}`);
  }

  revalidatePath("/dashboard");
  return data;
}

export async function deleteTodo(id: string) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const { data: existing } = await supabaseServer
    .from("todos")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== session.userId) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabaseServer
    .from("todos")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete todo: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

export async function toggleTodo(id: string) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get current state
  const { data: existing } = await supabaseServer
    .from("todos")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== session.userId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabaseServer
    .from("todos")
    .update({
      completed: !existing.completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle todo: ${error.message}`);
  }

  revalidatePath("/dashboard");
  return data;
}

