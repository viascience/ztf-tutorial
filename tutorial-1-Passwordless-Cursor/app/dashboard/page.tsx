import { TodoList } from "@/components/todo/todo-list";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Security Controls Dashboard</h2>
        </div>
        <p className="text-white/90">
          Manage your security compliance tasks and track your organization&apos;s security posture.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Tasks</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <span id="active-count">0</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Tasks</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span id="completed-count">0</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              <span id="completion-rate">0%</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Todo List */}
      <TodoList />
    </div>
  );
}

