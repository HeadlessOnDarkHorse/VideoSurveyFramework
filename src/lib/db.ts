import Dexie, { type EntityTable } from 'dexie';

export interface LocalFinding {
  id: string; // UUIDv4
  title: string;
  notes: string;
  imageDataUrl: string; // Base64 image
  classification: any; // Result from ONNX
  lat: number | null;
  lng: number | null;
  syncState: 'DRAFT' | 'QUEUED' | 'SYNCED';
  createdAt: number;
}

const db = new Dexie('EonLocalDatabase') as Dexie & {
  findings: EntityTable<LocalFinding, 'id'>;
};

// Schema version 1
db.version(1).stores({
  findings: 'id, syncState, createdAt'
});

export { db };
