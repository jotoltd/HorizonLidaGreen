import { requireAdmin, Shell } from "@/lib/shell";
import ContactCard from "./ContactCard";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const user = await requireAdmin();
  return (
    <Shell user={user} title="Contact" currentHref="/admin/contact">
      <ContactCard />
    </Shell>
  );
}
