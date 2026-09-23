import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/lib/logo";
import LoginForm from "./login/LoginForm";

export default async function Home() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/portal");

  return (
    <div className="relative flex min-h-screen items-stretch bg-white">
      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(31,61,46,0.7), rgba(31,61,46,0.4)), url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"%3E%3Cg fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath opacity=\".5\" d=\"M96 95h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-8-8h8v1h-8v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-8-8h8v1h-8v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1zm-4-4h4v1h-4v-1z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
              backgroundColor: "#2a4f2f",
            }}
          />
        </div>
        <div className="relative z-10">
          <Logo variant="dark" />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-4xl font-bold leading-tight">
            Your next <span className="text-white">delivery.</span>
            <br />
            All in one place.
          </h1>
          <div className="mt-4 h-1 w-16 bg-green-400" />
          <p className="mt-6 text-sm text-white/80">
            Manage bookings, follow your deliveries and access your shipment documents.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} Horizon Lida Green Ltd</p>
      </div>

      <div className="flex w-full flex-col justify-center bg-stone-50 px-6 py-12 lg:w-1/2 lg:bg-white lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link href="/contact" className="text-xs font-semibold text-green-700 hover:text-green-800">Contact us</Link>
          </div>
          <h2 className="text-2xl font-bold text-charcoal">Welcome back</h2>
          <p className="mt-1 text-sm text-stone-500">Sign in to your delivery portal.</p>

          <LoginForm />

          <div className="mt-6 border-t border-stone-200 pt-5">
            <p className="text-sm text-stone-500">Just checking a delivery?</p>
            <Link href="/track" className="mt-1 inline-block text-sm font-semibold text-green-700 hover:text-green-800">
              Track by tracking number →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
