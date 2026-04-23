import React, { useState } from "react";

export function DemoFeedbackPrompt({ onSubmit }: { onSubmit: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating !== null) {
      onSubmit(rating, comment);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center mt-4">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-4 mt-4 flex flex-col items-center gap-2 shadow">
      <div className="font-semibold text-slate-700 mb-1">How was your demo experience?</div>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            className={
              (rating && rating >= star ? "text-yellow-400" : "text-slate-300") +
              " text-2xl focus:outline-none"
            }
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded border border-slate-200 p-2 text-sm"
        rows={2}
        placeholder="Any comments? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-1 mt-2 font-semibold text-sm"
        disabled={rating === null}
      >
        Submit Feedback
      </button>
    </form>
  );
}
