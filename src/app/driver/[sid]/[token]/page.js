import DriverShare from "./DriverShare";

export const dynamic = "force-dynamic";

export default function DriverPage({ params }) {
  return <DriverShare sid={params.sid} token={params.token} />;
}
