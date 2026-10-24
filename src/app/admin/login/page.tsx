import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="container-x flex min-h-[80vh] items-center justify-center pb-20 pt-36">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-8 shadow-(--shadow-lux)">
        <p className="eyebrow">Admin</p>
        <h1 className="display mt-3 text-3xl text-forest">Sign in</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-charcoal/70">
            The admin area isn&apos;t switched on yet. Add an <code>ADMIN_PASSWORD</code> (10+ characters) in the Vercel project&apos;s environment variables, then redeploy.
          </p>
        )}
      </div>
    </div>
  );
}
