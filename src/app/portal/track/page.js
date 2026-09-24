import { requireClient, Shell } from "@/lib/shell";
import TrackWidget from "@/app/TrackWidget";

export const dynamic = "force-dynamic";

export default async function ClientTrackPage() {
  const user = await requireClient();
  return (
    <Shell user={user} title="Track Delivery" eyebrow="FOLLOW THE JOURNEY" subtitle="See the latest transporter status at a glance." currentHref="/portal/track">
      <TrackWidget />
    </Shell>
  );
}
