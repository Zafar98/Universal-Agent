"use client";

import { useState } from "react";

export default function ApiPlayground() {
  const [endpoint, setEndpoint] = useState("/api/business-models");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        ...(method !== "GET" && body ? { body } : {}),
      });
      const text = await res.text();
      setResponse(text);
    } catch (e: any) {
      setResponse(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 mt-10 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">API Playground</h2>
      <div className="flex gap-2 mb-4">
        <select
          className="bg-gray-900 text-white rounded px-3 py-2 border border-white/10"
          value={method}
          onChange={e => setMethod(e.target.value)}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input
          className="flex-1 bg-gray-900 text-white rounded px-3 py-2 border border-white/10"
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          placeholder="/api/endpoint"
        />
      </div>
      {method !== "GET" && (
        <textarea
          className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-white/10 mb-4"
          rows={4}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="JSON body (optional)"
        />
      )}
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded disabled:opacity-60"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Request"}
      </button>
      {response && (
        <pre className="mt-6 bg-black/60 text-green-300 rounded p-4 overflow-x-auto text-sm whitespace-pre-wrap max-h-96">
          {response}
        </pre>
      )}
    </div>
  );
}
