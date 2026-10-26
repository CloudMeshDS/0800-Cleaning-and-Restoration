import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { PHONES, SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms for using the ${SITE.legalName} website and for our quotes, bookings and services in New Zealand.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="26 October 2026"
      intro={
        <p>
          These terms apply to your use of this website and to quotes, bookings and services provided by {SITE.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the website or booking
          with us, you agree to them. Your written quote or booking confirmation may include further details specific to your job; if it differs from these terms, the quote or confirmation applies.
        </p>
      }
    >
      <section>
        <h2>1. Prices on this website</h2>
        <p>
          Prices shown on this website, including online estimates, are <strong>indicative only</strong>. They are a guide, not an offer, and are subject to confirmation once we understand your
          property, access, condition and location. Quote-only services are priced after an assessment. GST treatment is shown where confirmed; otherwise please check your quote.
        </p>
      </section>

      <section>
        <h2>2. Quotes and bookings</h2>
        <ul>
          <li>A booking is confirmed only when we confirm it to you in writing (for example, by email or text).</li>
          <li>Quotes are based on the information you give us. If the job is materially different on the day – for example larger, more heavily soiled or harder to access – we&apos;ll discuss any change in price with you before continuing.</li>
          <li>Please make sure we have safe access, power and water where needed, and let us know about pets, parking and anything fragile or valuable.</li>
          <li>If you need to change or cancel a booking, please give us as much notice as possible – at least 24 hours where you can. Any cancellation charge will be set out in your quote or confirmation.</li>
        </ul>
      </section>

      <section>
        <h2>3. Our work</h2>
        <p>
          We carry out our services with reasonable care and skill and choose methods to suit each surface and fabric. Some marks, stains, wear, sun damage, shrinkage or existing damage can&apos;t be
          removed or reversed by cleaning, and some materials react unpredictably; where we can see a risk, we&apos;ll explain it before we start. If you&apos;re not happy with any part of our work,
          please tell us as soon as possible – ideally within 48 hours – so we can put it right.
        </p>
      </section>

      <section>
        <h2>4. Payment</h2>
        <p>Payment terms will be set out in your quote or invoice. Unless agreed otherwise, invoices are payable on completion of the work.</p>
      </section>

      <section>
        <h2>5. Your rights under New Zealand law</h2>
        <p>
          Nothing in these terms limits any rights you have under the <strong>Consumer Guarantees Act 1993</strong>, the <strong>Fair Trading Act 1986</strong> or other laws that can&apos;t be
          excluded. Where those laws allow us to limit our liability, our liability for a service is limited to performing the service again or refunding the price paid for the affected part of
          it.
        </p>
      </section>

      <section>
        <h2>6. Using this website</h2>
        <ul>
          <li>We aim to keep the information on this website accurate and up to date, but it&apos;s general information and may change without notice.</li>
          <li>The content, design, images and 3D tour on this website belong to us or our licensors. Please don&apos;t copy or reuse them without permission.</li>
          <li>Please don&apos;t misuse the website – for example by sending spam or false enquiries or trying to access areas that aren&apos;t public.</li>
          <li>Links to other websites are provided for convenience; we aren&apos;t responsible for their content.</li>
        </ul>
      </section>

      <section>
        <h2>7. Privacy</h2>
        <p>
          We handle your personal information as described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>8. General</h2>
        <p>These terms are governed by New Zealand law. We may update them from time to time; the version on this page applies from the date shown above.</p>
        <p>
          Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call{" "}
          {PHONES.map((p, i) => (
            <span key={p.tel}>
              {i > 0 && " or "}
              <a href={p.tel}>{p.display}</a>
            </span>
          ))}
          .
        </p>
      </section>
    </LegalPage>
  );
}
