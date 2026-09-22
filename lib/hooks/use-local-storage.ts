"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook personnalisé pour persister l'état dans localStorage.
 * Évite la perte de l'historique de chat au rafraîchissement.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Charger au montage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Erreur de lecture de localStorage[${key}] :`, error);
    }
  }, [key]);

  // Sauvegarder à chaque modification
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const newValue = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(newValue));
          return newValue;
        });
      } catch (error) {
        console.error(`Erreur d'écriture de localStorage[${key}] :`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}