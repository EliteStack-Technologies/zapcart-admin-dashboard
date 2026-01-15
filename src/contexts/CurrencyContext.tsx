import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
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
  
  const isFetchingRef = useRef(false); // Prevent duplicate API calls

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", JSON.stringify(newCurrency));
  };

  const refreshCurrency = async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    try {
      const profile = await getClientProfile(false); // Use cached data if available
      if (profile.currency_id && typeof profile.currency_id === 'object') {
        setCurrency(profile.currency_id);
      }
    } catch (error) {
      console.error("Error refreshing currency:", error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Removed auto-fetch on mount. Call refreshCurrency after login is successful.

  // Listen for currency changes in localStorage (e.g., from login)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("currency");
      if (stored) {
        try {
          const parsedCurrency = JSON.parse(stored);
          setCurrencyState(parsedCurrency);
        } catch (error) {
          console.error("Error parsing currency from localStorage:", error);
        }
      }
    };

    // Listen for custom event triggered when currency is set during login
    window.addEventListener("currencyUpdated", handleStorageChange);
    
    // Also listen for storage events (for cross-tab updates)
    window.addEventListener("storage", (e) => {
      if (e.key === "currency") {
        handleStorageChange();
      }
    });

    return () => {
      window.removeEventListener("currencyUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
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
