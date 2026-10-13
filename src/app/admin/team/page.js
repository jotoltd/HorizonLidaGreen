import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import TeamPage from "./TeamPage";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage({ searchParams }) {
  const user = await requireAdmin();

  const { data: admins } = await supabase
    .from("User")
    .select("id, name, email, company, phone, role, createdAt")
    .eq("role", "ADMIN")
    .order("createdAt", { ascending: false });

  return (
    <Shell
      user={user}
      title="Team"
      eyebrow="ADMINISTRATOR"
      subtitle="Administrator accounts with full workspace access."
      currentHref="/admin/team"
      actions={<Link href="/admin/team?new=1" className="btn-pill btn-pill-primary">+ Create administrator</Link>}
    >
      <TeamPage
        admins={JSON.parse(JSON.stringify(admins || []))}
        startNew={searchParams?.new === "1"}
      />
    </Shell>
  );
}
