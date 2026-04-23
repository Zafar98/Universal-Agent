import React from "react";

const INTEGRATIONS = [
  { name: "Slack", logo: "/integrations/slack.svg", url: "https://slack.com/" },
  { name: "Salesforce", logo: "/integrations/salesforce.svg", url: "https://salesforce.com/" },
  { name: "Zapier", logo: "/integrations/zapier.svg", url: "https://zapier.com/" },
  { name: "Twilio", logo: "/integrations/twilio.svg", url: "https://twilio.com/" },
  { name: "Microsoft Teams", logo: "/integrations/teams.svg", url: "https://teams.microsoft.com/" },
  { name: "Google Workspace", logo: "/integrations/google-workspace.svg", url: "https://workspace.google.com/" },
];

export function IntegrationsSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Integrates with your favorite tools</h2>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          {INTEGRATIONS.map((integration) => (
            <a
              key={integration.name}
              href={integration.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group"
              style={{ width: 110 }}
            >
              <img
                src={integration.logo}
                alt={integration.name + " logo"}
                className="h-12 mb-2 grayscale group-hover:grayscale-0 transition"
                style={{ maxWidth: 80 }}
              />
              <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium transition">
                {integration.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
