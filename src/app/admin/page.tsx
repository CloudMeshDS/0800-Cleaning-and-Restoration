import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_PRICES } from "@/data/pricing";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminData, storageConnected } from "@/lib/live-data";
import { enquiryEmailOn, listEnquiries } from "@/lib/enquiries";
import { logout } from "./actions";
import { AdminApp } from "./AdminApp";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [{ overrides, catalogue }, enquiries] = await Promise.all([getAdminData(), listEnquiries()]);
  // Internal "uncertain" notes never leave the server.
  const defaults = Object.fromEntries(Object.entries(DEFAULT_PRICES).map(([id, { uncertain: _, ...item }]) => [id, item]));

  return (
    <div className="container-x pb-28 pt-32 md:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-forest">Website content</h1>
          <p className="mt-2 max-w-xl text-sm text-charcoal/65">See new enquiries, and add, edit, hide or delete services, categories and prices. Press Save to publish content changes; the website updates within a few seconds.</p>
        </div>
        <form action={logout}>
          <button className="btn-ghost !py-2.5 text-sm">Sign out</button>
        </form>
      </div>
      {!storageConnected() && (
        <p role="alert" className="mt-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Saving is switched off: add your Supabase <strong>secret key</strong> as a Secret named <code>SUPABASE_SECRET_KEY</code> in Cloudflare (Worker → Settings → Variables and Secrets).
        </p>
      )}
      {!enquiryEmailOn() && (
        <p className="mt-3 rounded-2xl bg-ivory px-5 py-3 text-sm text-charcoal/70 ring-1 ring-charcoal/10">
          Email notifications are off. Add your EmailJS keys (<code>EMAILJS_SERVICE_ID</code>, <code>EMAILJS_TEMPLATE_ID</code>, <code>EMAILJS_PUBLIC_KEY</code>, <code>EMAILJS_PRIVATE_KEY</code>) in Cloudflare (Worker → Settings → Variables and Secrets) to get an email for every new enquiry.
        </p>
      )}
      <AdminApp
        defaults={defaults}
        overrides={overrides}
        catalogue={catalogue}
        canSave={storageConnected()}
        enquiries={Array.isArray(enquiries) ? enquiries : []}
        enquiryError={Array.isArray(enquiries) ? undefined : enquiries.error}
      />
    </div>
  );
}
