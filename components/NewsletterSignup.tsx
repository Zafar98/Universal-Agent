import React, { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 700);
  };

  if (submitted) {
    return (
      <div className="bg-green-900/80 text-green-100 rounded-xl px-6 py-4 text-center font-semibold shadow">
        Thank you for subscribing! Check your inbox for updates.
      </div>
    );
  }

  return (
    <form
      className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-8"
      onSubmit={handleSubmit}
      aria-label="Newsletter signup form"
    >
      <input
        type="email"
        className="rounded-lg px-4 py-3 text-base text-slate-900 bg-slate-100 focus:ring-2 focus:ring-blue-400 focus:outline-none min-w-[220px]"
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-label="Email address"
        required
      />
      <button
        type="submit"
        className="rounded-lg px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Subscribe to newsletter"
      >
        Subscribe
      </button>
      {error && <span className="text-red-400 ml-4">{error}</span>}
    </form>
  );
}
