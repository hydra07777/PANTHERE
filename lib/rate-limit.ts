// ──────────────────────────────────────────────
// Rate limiting — Protection de l'API
// Stockage en mémoire (suffisant pour Phase 1)
// ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;   // Nombre max de requêtes
  windowMs: number;      // Fenêtre de temps en ms
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,       // 60 requêtes par minute
  windowMs: 60 * 1000,   // 1 minute
};

/**
 * Vérifie si une requête est dans les limites.
 * Incrémente le compteur de manière atomique et retourne l'état.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  // Pas d'entrée ou fenêtre expirée → nouvelle fenêtre
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  // Dans la fenêtre : incrémenter puis juger
  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Construit les en-têtes RateLimit pour une réponse HTTP.
 * Lecture seule : n'incrémente pas le compteur (sinon, double-comptage
 * à chaque requête HTTP qui passe par checkRateLimit + rateLimitHeaders).
 */
export function rateLimitHeaders(key: string): Record<string, string> {
  const now = Date.now();
  const entry = store.get(key);
  let remaining = DEFAULT_CONFIG.maxRequests;
  let resetInSeconds = Math.ceil(DEFAULT_CONFIG.windowMs / 1000);

  if (entry && entry.resetAt > now) {
    remaining = Math.max(0, DEFAULT_CONFIG.maxRequests - entry.count);
    resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
  }

  return {
    "X-RateLimit-Limit": String(DEFAULT_CONFIG.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetInSeconds),
  };
}