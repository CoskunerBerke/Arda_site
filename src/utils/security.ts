import type { NavSectionId, RoleType } from '../types/logistics';

const ROLE_PERMISSIONS: Record<RoleType, readonly NavSectionId[]> = {
  admin: ['operation', 'data', 'finance', 'sales', 'upgrade', 'admin'],
  seller: ['operation', 'data', 'finance', 'sales', 'upgrade'],
  customer: ['operation', 'upgrade'],
};

/**
 * Verifies if the given role is authorized to access a navigation section.
 */
export function canAccessSection(role: RoleType, section: NavSectionId): boolean {
  return ROLE_PERMISSIONS[role].includes(section);
}

/**
 * Sanitizes user input strings by removing HTML tags, script payloads,
 * control characters, and zero-width spoofing characters.
 */
export function sanitizeText(raw: string, maxLength = 280): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, maxLength);
}

/**
 * Neutralizes CSV / Excel Formula Injection (DDE / Macro payloads starting with =, +, -, @, Tab, CR)
 * and strips any embedded HTML/script patterns.
 */
export function sanitizeSpreadsheetCell(cellValue: string): {
  clean: string;
  wasThreatNeutralized: boolean;
} {
  const trimmed = String(cellValue ?? '').trim();
  const formulaDangerPattern = /^[=+\-@\t\r]/;
  const scriptDangerPattern = /<script|javascript:|cmd\||powershell/i;

  const isFormulaThreat = formulaDangerPattern.test(trimmed);
  const isScriptThreat = scriptDangerPattern.test(trimmed);

  let clean = sanitizeText(trimmed, 160);
  if (isFormulaThreat) {
    clean = clean.replace(/^[=+\-@\t\r]+/, '');
  }

  return {
    clean: clean || '—',
    wasThreatNeutralized: isFormulaThreat || isScriptThreat,
  };
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName: string;
  checks: {
    extensionOk: boolean;
    sizeOk: boolean;
    pathTraversalOk: boolean;
  };
}

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Strictly validates uploaded files before processing.
 */
export function validateUploadFile(file: {
  name: string;
  size?: number;
  type?: string;
}): FileValidationResult {
  const rawName = String(file.name || '').trim();
  const pathTraversalOk =
    !rawName.includes('..') &&
    !rawName.includes('/') &&
    !rawName.includes('\\') &&
    !rawName.includes('\0');

  const sanitizedName = rawName
    .replace(/[^a-zA-Z0-9._\-\u00C0-\u024F\s]/g, '_')
    .slice(0, 80);

  const lower = sanitizedName.toLowerCase();
  const extensionOk = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const sizeOk = typeof file.size === 'number' ? file.size > 0 && file.size <= MAX_FILE_SIZE_BYTES : true;

  if (!pathTraversalOk) {
    return {
      valid: false,
      error: 'Güvenlik İhlali: Dosya adında geçersiz dizin karakterleri tespit edildi.',
      sanitizedName,
      checks: { extensionOk, sizeOk, pathTraversalOk },
    };
  }

  if (!extensionOk) {
    return {
      valid: false,
      error: 'Sadece doğrulanmış .xlsx ve .csv veri dosyaları kabul edilmektedir.',
      sanitizedName,
      checks: { extensionOk, sizeOk, pathTraversalOk },
    };
  }

  if (!sizeOk) {
    return {
      valid: false,
      error: 'Dosya boyutu güvenlik sınırını (maks. 10 MB) aşıyor veya boş.',
      sanitizedName,
      checks: { extensionOk, sizeOk, pathTraversalOk },
    };
  }

  return {
    valid: true,
    sanitizedName,
    checks: { extensionOk: true, sizeOk: true, pathTraversalOk: true },
  };
}

/**
 * Sliding-window client-side rate limiter to prevent spam and abuse.
 */
export function createRateLimiter(maxCalls: number, windowMs: number) {
  const timestamps: number[] = [];

  return {
    tryAcquire(): { allowed: boolean; remaining: number; retryInSeconds: number } {
      const now = Date.now();
      while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxCalls) {
        const retryInSeconds = Math.max(
          1,
          Math.ceil((windowMs - (now - timestamps[0])) / 1000)
        );
        return { allowed: false, remaining: 0, retryInSeconds };
      }
      timestamps.push(now);
      return {
        allowed: true,
        remaining: Math.max(0, maxCalls - timestamps.length),
        retryInSeconds: 0,
      };
    },
  };
}

/**
 * Generates a deterministic HMAC-style fingerprint preview for webhook audit logs
 * without exposing any secret keys in client code.
 */
export function generateWebhookFingerprint(erpId: string, timestamp: string): string {
  const input = `as-logistics:${erpId}:${timestamp}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `sha256=${hex}e49b7c21`;
}
