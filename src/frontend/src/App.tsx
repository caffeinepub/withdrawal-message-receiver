import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPanel from "./AdminPanel";
import SubmissionForm from "./SubmissionForm";

export default function App() {
  const [view, setView] = useState<"form" | "admin">("form");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      {view === "form" ? (
        <SubmissionForm onAdminClick={() => setView("admin")} />
      ) : (
        <AdminPanel onBack={() => setView("form")} />
      )}
    </div>
  );
}
