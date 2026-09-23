import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import ClientsPage from "./ClientsPage";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const user = await requireAdmin();

  const { data: clients } = await supabase
    .from("User")
    .select("id, name, email, company, phone, createdAt")
    .eq("role", "CLIENT")
    .order("createdAt", { ascending: false });

  return (
    <Shell user={user} title="Client profiles" currentHref="/admin/clients">
      <ClientsPage clients={JSON.parse(JSON.stringify(clients || []))} />
    </Shell>
  );
}
