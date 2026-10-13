import { requireAdmin, Shell } from "@/lib/shell";
import AccountSettings from "@/lib/AccountSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  return (
    <Shell user={user} title="Settings" eyebrow="ACCOUNT" subtitle="Manage your account settings." currentHref="/admin/settings">
      <AccountSettings user={user} />
    </Shell>
  );
}
