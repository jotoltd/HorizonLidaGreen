import { requireClient, Shell } from "@/lib/shell";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireClient();

  return (
    <Shell
      user={user}
      title="Notifications"
      eyebrow="YOUR SETTINGS"
      subtitle="Choose how you want to be notified about bookings, deliveries, and claims."
      currentHref="/portal/notifications"
    >
      <NotificationsClient />
    </Shell>
  );
}
