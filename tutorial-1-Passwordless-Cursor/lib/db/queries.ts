import { supabaseServer } from "./supabase";
import { Todo } from "@/types/todo";

export async function getUserByKeycloakSub(keycloakSub: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("keycloak_sub", keycloakSub)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw error;
  }

  return data;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw error;
  }

  return data;
}

export async function createUser(keycloakSub: string, email: string, name?: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .insert({
      keycloak_sub: keycloakSub,
      email,
      name,
      last_login: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserLastLogin(userId: string) {
  const { error } = await supabaseServer
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function getTodosByUserId(userId: string): Promise<Todo[]> {
  const { data, error } = await supabaseServer
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}



