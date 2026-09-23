import { requireAdmin, Shell } from "@/lib/shell";
import TrackWidget from "@/app/TrackWidget";

export const dynamic = "force-dynamic";

export default async function AdminTrackPage() {
  const user = await requireAdmin();
  return (
    <Shell user={user} title="Track a delivery" currentHref="/admin/track">
      <TrackWidget title="Track a delivery" admin />
    </Shell>
  );
}
