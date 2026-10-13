import { requireClient, Shell } from "@/lib/shell";
import AccountSettings from "@/lib/AccountSettings";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const user = await requireClient();
  return (
    <Shell user={user} title="Settings" eyebrow="ACCOUNT" subtitle="Manage your account settings." currentHref="/portal/settings">
      <AccountSettings user={user} />
    </Shell>
  );
}
