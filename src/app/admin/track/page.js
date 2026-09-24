import { requireAdmin, Shell } from "@/lib/shell";
import TrackWidget from "@/app/TrackWidget";

export const dynamic = "force-dynamic";

export default async function AdminTrackPage() {
  const user = await requireAdmin();
  return (
    <Shell user={user} title="Track Delivery" eyebrow="FOLLOW THE JOURNEY" subtitle="See the latest transporter status at a glance." currentHref="/admin/track">
      <TrackWidget admin />
    </Shell>
  );
}
