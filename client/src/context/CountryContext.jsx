import { createContext, useContext, useState, useEffect } from 'react';
import { detectCountryName } from '../utils/geolocateCountry';

const CountryContext = createContext(null);

// The pricing model is deliberately binary now: a visitor is either in Sri
// Lanka (the domestic rate) or anywhere else (the international rate).
// There is no manual country picker any more — IP-based detection is the
// only input, and it can only ever resolve to one of these two values.
export const SRI_LANKA = 'Sri Lanka';
export const INTERNATIONAL = 'International';

export function CountryProvider({ children }) {
  const [country, setCountry] = useState(INTERNATIONAL);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    detectCountryName().then((detectedName) => {
      if (cancelled) return;
      const isSriLanka = detectedName?.toLowerCase() === SRI_LANKA.toLowerCase();
      setCountry(isSriLanka ? SRI_LANKA : INTERNATIONAL);
      setDetecting(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CountryContext.Provider value={{ country, detecting }}>
      {children}
    </CountryContext.Provider>
  );
}

export const useCountry = () => useContext(CountryContext);
