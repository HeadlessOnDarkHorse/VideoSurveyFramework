import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PocketBase
vi.mock('@/lib/pocketbase', () => {
  return {
    pb: {
      authStore: {
        isValid: false,
        onChange: vi.fn(() => vi.fn())
      },
      collection: vi.fn()
    }
  };
});

// Mock window.HTMLElement.prototype.scrollIntoView since jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Dexie
vi.mock('@/lib/db', () => {
  return {
    db: {
      findings: {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(true)
      }
    },
    requestPersistentStorage: vi.fn()
  };
});
