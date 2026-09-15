export const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const STEP_ORDER = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
export const STEP_LABELS = { BOOKED: "Booked", IN_TRANSIT: "In Transit", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered" };

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export function ShipmentResult({ result }) {
  const { shipment, events } = result;
  const currentStep = STEP_ORDER.indexOf(shipment.status);
  const cancelled = shipment.status === "ON_HOLD" || shipment.status === "CANCELLED";

  return (
    <div className="mt-8 space-y-6">
      {/* Summary card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-navy-400">Tracking Number</div>
            <div className="font-mono text-2xl font-bold text-navy-800">{shipment.trackingNumber}</div>
          </div>
          <span className={`badge px-3 py-1 text-sm ${statusStyles[shipment.status]}`}>
            {shipment.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Origin" value={shipment.origin} />
          <Detail label="Destination" value={shipment.destination} />
          <Detail label="Carrier" value={shipment.carrier || "—"} />
          <Detail label="Service" value={shipment.service || "—"} />
          <Detail label="Pieces" value={shipment.pieces || "—"} />
          <Detail label="Weight" value={shipment.weight || "—"} />
          <Detail label="ETA" value={fmtDate(shipment.eta)} />
          <Detail label="Created" value={fmtDate(shipment.createdAt)} />
        </div>
      </div>

      {/* Progress timeline */}
      {!cancelled ? (
        <div className="card p-6">
          <h3 className="mb-6 font-semibold text-navy-800">Shipment Progress</h3>
          <div className="flex items-center">
            {STEP_ORDER.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                      done ? "border-teal-500 bg-teal-500 text-white" : "border-navy-200 bg-white text-navy-300"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={`mt-2 text-xs font-medium ${active ? "text-teal-600" : done ? "text-navy-700" : "text-navy-300"}`}>
                      {STEP_LABELS[step]}
                    </div>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-teal-500" : "bg-navy-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">!</div>
            <div>
              <div className="font-semibold text-navy-800">This shipment is {shipment.status.replace(/_/g, " ").toLowerCase()}</div>
              <div className="text-sm text-navy-400">Contact Horizon Lida Green for more information.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking history */}
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-navy-800">Tracking History</h3>
        <div className="space-y-0">
          {events.map((ev, i) => (
            <div key={ev.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-teal-500" : "bg-navy-200"}`} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-navy-100" />}
              </div>
              <div className="pb-6">
                <div className="text-sm font-semibold text-navy-800">{ev.status.replace(/_/g, " ")}</div>
                {ev.location && <div className="text-xs text-navy-500">{ev.location}</div>}
                {ev.description && <div className="text-sm text-navy-400">{ev.description}</div>}
                <div className="text-xs text-navy-300">{fmtDateTime(ev.occurredAt)}</div>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-navy-300">No tracking events yet.</p>}
        </div>
      </div>
    </div>
  );
}

export function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-navy-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-navy-800">{value}</div>
    </div>
  );
}
