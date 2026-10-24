import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[80vh] flex-col items-start justify-center pt-24">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-6xl text-forest">This room is empty.</h1>
      <p className="mt-4 text-charcoal/65">The page you&apos;re looking for has moved or doesn&apos;t exist.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/services" className="btn-ghost">Browse services</Link>
      </div>
    </div>
  );
}
