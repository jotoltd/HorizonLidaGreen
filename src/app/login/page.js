import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/lib/logo";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/portal");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Faded logistics backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/brand/bg-logistics.jpg')" }}
      />
      <div className="absolute inset-0 bg-white/80" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-12">
        <Logo />
        <Link
          href="/contact"
          className="text-sm font-semibold text-charcoal underline decoration-green-600 underline-offset-4 hover:text-green-700"
        >
          Contact us
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-12 px-6 py-10 lg:flex-row lg:justify-between lg:px-24">
        <div className="max-w-md text-center lg:text-left">
          <h1 className="text-4xl font-bold leading-tight text-charcoal sm:text-5xl">
            Your next <span className="text-green-600">delivery.</span>
            <br />
            All in one place.
          </h1>
          <div className="mx-auto mt-5 h-1 w-14 bg-green-500 lg:mx-0" />
          <p className="mt-6 text-sm text-stone-600">
            Manage bookings, follow your deliveries and access your shipment documents.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-stone-200">
          <h2 className="text-2xl font-bold text-charcoal">Welcome back</h2>
          <p className="mt-1 text-sm text-stone-500">Sign in to your delivery portal.</p>

          <LoginForm />

          <div className="mt-6 border-t border-stone-200 pt-5">
            <p className="text-sm text-stone-500">Just checking a delivery?</p>
            <Link
              href="/track"
              className="mt-1 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
            >
              Track by tracking number →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-6 pb-6 text-xs text-stone-500 sm:px-12">
        <p>© {new Date().getFullYear()} Horizon Lida Green Ltd</p>
        <p>Vehicle transport &amp; logistics</p>
      </footer>
    </div>
  );
}
