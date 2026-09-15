import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/lib/logo";
import LoginForm from "./login/LoginForm";
import TrackSection from "./TrackSection";

export default function Home() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/portal");

  return (
    <div className="flex min-h-screen flex-col bg-navy-800">
      <div className="flex flex-1">
        {/* Left brand panel */}
        <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-12 text-white lg:flex">
          <Logo variant="dark" />
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Your freight,<br />
              <span className="text-teal-400">in full view.</span>
            </h1>
            <p className="mt-4 max-w-md text-navy-100">
              Track shipments in real time, manage clients, and keep your supply chain transparent — all from one fast portal.
            </p>
            <div className="mt-10 flex gap-8">
              <div>
                <div className="text-3xl font-bold text-teal-400">24/7</div>
                <div className="text-sm text-navy-100">Live tracking</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-400">End-to-end</div>
                <div className="text-sm text-navy-100">Visibility</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-navy-200">© {new Date().getFullYear()} Horizon Lida Green</p>
        </div>

        {/* Right form panel */}
        <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <h2 className="text-2xl font-bold text-navy-800">Welcome back</h2>
            <p className="mt-1 text-sm text-navy-400">Sign in to your shipping portal.</p>

            <LoginForm />

            <TrackSection />
          </div>
        </div>
      </div>
    </div>
  );
}
