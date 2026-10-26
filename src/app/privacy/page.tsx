import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PHONES, SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.legalName} collects, uses, stores and protects your personal information under the New Zealand Privacy Act 2020.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="26 October 2026"
      intro={
        <p>
          {SITE.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This policy explains what personal information we collect through this website, why we collect it, how we
          look after it and the choices you have. We handle personal information in line with the New Zealand <strong>Privacy Act 2020</strong> and its Information Privacy Principles.
        </p>
      }
    >
      <section>
        <h2>1. Information we collect</h2>
        <p>When you request a quote or booking, we collect the details you choose to give us:</p>
        <ul>
          <li>your name, email address and phone number, and how you prefer to be contacted</li>
          <li>your region and suburb, and the type of property</li>
          <li>the services you&apos;re interested in, quantities, your preferred date and time, and any notes you add</li>
        </ul>
        <p>
          When you visit the site, our hosting provider automatically processes technical information such as your IP address, browser type and the pages requested. We use this only to deliver
          the website, keep it secure (for example, to block spam and repeated failed sign-in attempts) and fix problems. We don&apos;t use analytics, advertising or tracking cookies.
        </p>
      </section>

      <section>
        <h2>2. How we use your information</h2>
        <ul>
          <li>to respond to your enquiry, prepare a quote and arrange or carry out the work</li>
          <li>to contact you about your enquiry or booking by your preferred method</li>
          <li>to keep records of the work we do and meet our legal and tax obligations</li>
          <li>to protect the website and our customers from misuse</li>
        </ul>
        <p>We don&apos;t sell or rent your personal information, and we won&apos;t send you marketing without your permission.</p>
      </section>

      <section>
        <h2>3. Who we share it with</h2>
        <p>We use a small number of trusted service providers to run the website and handle enquiries. They process information on our behalf and only as needed to provide their service:</p>
        <ul>
          <li>
            <strong>Cloudflare</strong> – hosts the website and protects it from attacks
          </li>
          <li>
            <strong>Supabase</strong> – securely stores enquiries and website settings
          </li>
          <li>
            <strong>EmailJS</strong> and <strong>Google (Gmail)</strong> – deliver enquiry notifications to our inbox, and the emails we exchange with you
          </li>
        </ul>
        <p>
          Some of these providers store or process information outside New Zealand (for example, in Australia, the United States or Europe). We choose providers with strong security and privacy
          protections and take reasonable steps to make sure your information is protected to a standard comparable to the Privacy Act. We may also disclose information where the law requires it.
        </p>
      </section>

      <section>
        <h2>4. How we keep it secure</h2>
        <p>
          All information sent to and from this website is encrypted (HTTPS). Enquiries are stored in a database that can only be read by our own server, and access to our systems is limited to
          authorised people and protected by passwords. No method of transmission or storage is completely secure, but we take reasonable steps to protect your information from loss, misuse and
          unauthorised access.
        </p>
      </section>

      <section>
        <h2>5. How long we keep it</h2>
        <p>
          We keep enquiries for as long as we need them to respond and follow up – generally up to two years if no work goes ahead. If we carry out work for you, we keep job and invoice records
          for as long as the law requires (for example, seven years for tax records). After that, we delete or anonymise the information.
        </p>
      </section>

      <section>
        <h2>6. Cookies and browser storage</h2>
        <p>
          This website doesn&apos;t use tracking or advertising cookies. It uses your browser&apos;s session storage only to remember that you&apos;ve seen the opening animation during your visit, and a
          secure sign-in cookie is used only by our staff in the private admin area.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          You can ask to see the personal information we hold about you and ask us to correct it. To make a request, contact us using the details below – we&apos;ll respond within 20 working days,
          as the Privacy Act requires. If you&apos;re not satisfied with how we&apos;ve handled your information, you can complain to the{" "}
          <a href="https://www.privacy.org.nz" target="_blank" rel="noreferrer">
            Office of the Privacy Commissioner
          </a>
          .
        </p>
      </section>

      <section>
        <h2>8. Contact us</h2>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call{" "}
          {PHONES.map((p, i) => (
            <span key={p.tel}>
              {i > 0 && " or "}
              <a href={p.tel}>{p.display}</a>
            </span>
          ))}
          .
        </p>
        <p>We may update this policy from time to time. The latest version is always on this page.</p>
      </section>
    </LegalPage>
  );
}
