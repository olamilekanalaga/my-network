"use client";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
export default function FAQ({
  items,
}: {
  items: { id: string; question: string; answer: ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const prefix = useId();
  return (
    <div className="faq">
      {items.map((item) => (
        <section key={item.id} className="faq-item">
          <button
            type="button"
            aria-expanded={open === item.id}
            aria-controls={`${prefix}-${item.id}`}
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            {item.question}
            <ChevronDown size={17} />
          </button>
          <div
            className="faq-answer"
            id={`${prefix}-${item.id}`}
            hidden={open !== item.id}
          >
            {item.answer}
          </div>
        </section>
      ))}
    </div>
  );
}
