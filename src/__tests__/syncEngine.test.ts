import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncEngine } from '../lib/syncEngine';
import { db } from '../lib/db';
import { pb } from '../lib/pocketbase';

describe('Background Sync Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.authStore as any).isValid = true;
    (pb.authStore as any).record = { id: 'user123' };
  });

  it('should not sync if user is not authenticated', async () => {
    (pb.authStore as any).isValid = false;
    await syncEngine.triggerSync();
    expect(db.findings.where).not.toHaveBeenCalled();
  });

  it('should pick up DRAFT findings and upload them via FormData', async () => {
    // Mock the local findings query to return one draft
    const mockDraft = {
      id: 'find_1',
      title: 'Quartz',
      notes: '',
      lat: 12.3,
      lng: 45.6,
      classification: [{ label: 'Quartz', confidence: 0.9 }],
      syncState: 'DRAFT'
    };

    (db.findings.toArray as any).mockResolvedValueOnce([mockDraft]);

    // Mock the PocketBase collection create
    const mockCreate = vi.fn().mockResolvedValueOnce(true);
    (pb.collection as any).mockReturnValue({ create: mockCreate });

    await syncEngine.triggerSync();

    // It should mark it QUEUED
    expect(db.findings.update).toHaveBeenCalledWith('find_1', { syncState: 'QUEUED' });

    // It should hit pocketbase with form data
    expect(pb.collection).toHaveBeenCalledWith('findings');
    expect(mockCreate).toHaveBeenCalled();
    const formDataArg = mockCreate.mock.calls[0][0];
    expect(formDataArg).toBeInstanceOf(FormData);
    expect(formDataArg.get('title')).toBe('Quartz');

    // It should mark it SYNCED
    expect(db.findings.update).toHaveBeenCalledWith('find_1', { syncState: 'SYNCED' });
  });

  it('should revert to DRAFT if the upload fails', async () => {
     const mockDraft = { id: 'find_2', title: 'Error Rock' };
     (db.findings.toArray as any).mockResolvedValueOnce([mockDraft]);

     const mockCreate = vi.fn().mockRejectedValueOnce(new Error('Network error'));
     (pb.collection as any).mockReturnValue({ create: mockCreate });

     await syncEngine.triggerSync();

     // Starts queued
     expect(db.findings.update).toHaveBeenCalledWith('find_2', { syncState: 'QUEUED' });

     // Ends back in draft due to throw
     expect(db.findings.update).toHaveBeenCalledWith('find_2', { syncState: 'DRAFT' });
  });
});
