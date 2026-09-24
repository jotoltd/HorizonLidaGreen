import { requireClient, Shell } from "@/lib/shell";
import ContactCard from "@/app/admin/contact/ContactCard";

export const dynamic = "force-dynamic";

export default async function ClientContactPage() {
  const user = await requireClient();
  return (
    <Shell user={user} title="Contact" eyebrow="HERE TO HELP" subtitle="Get in touch with Horizon Lida Green." currentHref="/portal/contact">
      <ContactCard />
    </Shell>
  );
}
