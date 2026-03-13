import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { dummyQuotes, type Quote } from "@/data/dummy-sales";

function deepClone(q: Quote): Quote {
  return JSON.parse(JSON.stringify(q));
}

interface QuoteContextValue {
  quotes: Quote[];
  updateQuote: (updated: Quote) => void;
  addQuote: (quote: Quote) => void;
  removeQuote: (id: string) => Quote | null;
  restoreQuote: (quote: Quote) => void;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>(() => dummyQuotes.map(deepClone));

  const updateQuote = useCallback((updated: Quote) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? deepClone(updated) : q)));
  }, []);

  const addQuote = useCallback((quote: Quote) => {
    setQuotes((prev) => [deepClone(quote), ...prev]);
  }, []);

  const removeQuote = useCallback((id: string): Quote | null => {
    let removed: Quote | null = null;
    setQuotes((prev) => {
      removed = prev.find((q) => q.id === id) ?? null;
      return prev.filter((q) => q.id !== id);
    });
    return removed;
  }, []);

  const restoreQuote = useCallback((quote: Quote) => {
    setQuotes((prev) => [deepClone(quote), ...prev]);
  }, []);

  return (
    <QuoteContext.Provider value={{ quotes, updateQuote, addQuote, removeQuote, restoreQuote }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}
