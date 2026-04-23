import React from "react";
import type { UseCase } from "./types";

interface Props {
  useCases: UseCase[];
}

const IndustryUseCasesSection: React.FC<Props> = ({ useCases }) => (
  <section
    className="py-16 px-5 bg-gradient-to-b from-green-900/10 to-[#030712]"
    aria-labelledby="industry-coverage-heading"
  >
    <h2 id="industry-coverage-heading" className="sr-only">Industry Coverage</h2>
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <div className="uppercase tracking-widest font-extrabold text-green-300 text-xs mb-2">Industry Coverage</div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-sky-100 mb-2 tracking-tight">Built for the sectors that never stop.</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {useCases.map((item) => (
          <div
            key={item.sector}
            className="rounded-2xl border border-slate-400/20 bg-slate-900/70 p-5"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-sky-100 font-extrabold text-base mb-1">{item.sector}</div>
            <div className="text-slate-400 text-xs leading-relaxed">{item.example}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default IndustryUseCasesSection;
