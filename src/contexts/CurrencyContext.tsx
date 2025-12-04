import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getClientProfile } from "@/services/profile";

interface Currency {
  _id: string;
  name: string;
  symbol: string;
  code: string;
}

interface CurrencyContextType {
  currency: Currency | null;
  setCurrency: (currency: Currency) => void;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency | null>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem("currency");
    return stored ? JSON.parse(stored) : null;
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", JSON.stringify(newCurrency));
  };

  const refreshCurrency = async () => {
    try {
      const profile = await getClientProfile();
      if (profile.currency_id && typeof profile.currency_id === 'object') {
        setCurrency(profile.currency_id);
      }
    } catch (error) {
      console.error("Error refreshing currency:", error);
    }
  };

  useEffect(() => {
    // Fetch currency on mount if not already set
    if (!currency) {
      refreshCurrency();
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, refreshCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
