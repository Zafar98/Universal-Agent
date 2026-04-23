import React from "react";
import type { HowItWorksStep } from "./types";

interface Props {
  howItWorks: HowItWorksStep[];
}

const HowItWorksSection: React.FC<Props> = ({ howItWorks }) => (
  <section
    className="py-16 px-5 bg-gradient-to-b from-[#030712] to-[#060d1a]"
    aria-labelledby="how-it-works-heading"
  >
    <h2 id="how-it-works-heading" className="sr-only">How It Works</h2>
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="uppercase tracking-widest font-extrabold text-purple-300 text-xs mb-2">How It Works</div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-sky-100 mb-2 tracking-tight">From setup to autonomous in days.</h2>
      </div>
      <div className="grid gap-4">
        {howItWorks.map((item) => (
          <div
            key={item.step}
            className="grid grid-cols-[56px_1fr] gap-5 items-start rounded-2xl border border-slate-400/20 bg-slate-900/70 p-5"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center font-extrabold text-lg text-white shadow">
              {item.step}
            </div>
            <div>
              <div className="text-sky-100 font-extrabold text-lg mb-1">{item.title}</div>
              <div className="text-slate-400 text-sm leading-relaxed">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
