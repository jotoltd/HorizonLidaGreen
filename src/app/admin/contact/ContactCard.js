import { Logo } from "@/lib/logo";

export default function ContactCard() {
  return (
    <div className="card overflow-hidden">
      {/* Logo banner */}
      <div className="flex items-center justify-center bg-navy-100 px-6 py-10">
        <div className="scale-150">
          <Logo />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="mb-6 text-xl font-bold text-navy-800">Horizon Lida Green Ltd</h3>
        <div className="grid gap-8 sm:grid-cols-3">
          <ContactItem label="Email" value="Company email to be supplied" />
          <ContactItem label="Phone" value="Company phone to be supplied" />
          <ContactItem label="Address" value="Company address to be supplied" />
        </div>
      </div>

      <div className="h-1.5 bg-green-500" />
    </div>
  );
}

function ContactItem({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold text-navy-800">{label}</div>
      <div className="mt-1 text-sm text-navy-500">{value}</div>
    </div>
  );
}
