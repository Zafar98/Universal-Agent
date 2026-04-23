import React from "react";

interface CapabilityCardProps {
  icon: string;
  title: string;
  colour: string;
  description: string;
  points: string[];
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({ icon, title, colour, description, points }) => (
  <div
    className="rounded-2xl p-6 backdrop-blur-md"
    style={{ border: `1px solid ${colour}33`, background: "rgba(15,23,42,0.62)" }}
  >
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3"
      style={{ background: `${colour}18`, border: `1px solid ${colour}44` }}
    >
      {icon}
    </div>
    <div className="font-extrabold text-lg mb-2" style={{ color: colour }}>{title}</div>
    <p className="text-sm text-slate-400 mb-3">{description}</p>
    <ul className="pl-4 text-xs text-slate-300 list-disc">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  </div>
);
