import Link from "next/link";

export default function TrustCompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-blue-200">Trust, Security & Compliance</h1>
        <p className="mb-8 text-lg text-blue-100">
          We take your data and business security seriously. Here’s how we keep your information safe and our platform reliable.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-300">System Status & Reliability</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>99.99% uptime SLA, monitored 24/7</li>
            <li>Real-time status updates available on request</li>
            <li>Redundant infrastructure and automated failover</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-300">Compliance & Certifications</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>SOC 2 Type II (in progress or certified)</li>
            <li>GDPR & CCPA compliant data handling</li>
            <li>Data encrypted at rest and in transit (AES-256, TLS 1.2+)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-300">Security Practices</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Regular third-party penetration testing</li>
            <li>Role-based access controls (RBAC)</li>
            <li>Continuous vulnerability scanning and patching</li>
            <li>Strict employee access policies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-300">Privacy</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Customer data never sold or shared with third parties</li>
            <li>Data residency options for EU, US, and APAC</li>
            <li>Easy data export and deletion on request</li>
          </ul>
        </section>

        <div className="mt-10">
          <Link href="/" className="text-blue-400 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
