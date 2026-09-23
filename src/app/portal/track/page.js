import { requireClient, Shell } from "@/lib/shell";
import TrackWidget from "@/app/TrackWidget";

export const dynamic = "force-dynamic";

export default async function ClientTrackPage() {
  const user = await requireClient();
  return (
    <Shell user={user} title="Track a delivery" currentHref="/portal/track">
      <TrackWidget title="Track a delivery" />
    </Shell>
  );
}
