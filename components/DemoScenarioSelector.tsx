import React, { useState } from "react";

const SCENARIOS = [
  {
    label: "General Inbound Call",
    value: "general",
    description: "A typical customer call for information or support."
  },
  {
    label: "Billing Query",
    value: "billing",
    description: "A customer with a question about their bill or payment."
  },
  {
    label: "Book a Service Appointment",
    value: "booking",
    description: "A customer wants to book a repair or service."
  },
  {
    label: "Complaint Escalation",
    value: "complaint",
    description: "A customer is unhappy and wants to escalate an issue."
  },
  {
    label: "Demo: Outage Report",
    value: "outage",
    description: "A customer reports a service outage or technical problem."
  }
];

export function DemoScenarioSelector({ onSelect }: { onSelect: (value: string) => void }) {
  const [selected, setSelected] = useState(SCENARIOS[0].value);

  return (
    <div className="mb-6">
      <label className="block font-bold mb-2 text-slate-200" htmlFor="demo-scenario-select">
        Choose a demo scenario:
      </label>
      <select
        id="demo-scenario-select"
        className="rounded-lg px-4 py-3 text-base text-slate-900 bg-slate-100 focus:ring-2 focus:ring-blue-400 focus:outline-none w-full max-w-md"
        value={selected}
        onChange={e => {
          setSelected(e.target.value);
          onSelect(e.target.value);
        }}
        aria-label="Demo scenario selector"
      >
        {SCENARIOS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <div className="mt-2 text-blue-200 text-sm min-h-[24px]">
        {SCENARIOS.find(s => s.value === selected)?.description}
      </div>
    </div>
  );
}
