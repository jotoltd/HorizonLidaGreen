import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default function Home() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/portal");
  redirect("/track");
}
