import { db, type LocalFinding } from './db';
import { pb } from './pocketbase';

export class SyncEngine {
  private isSyncing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId) return;

    // Listen for OS/Browser online events to trigger immediate sync
    window.addEventListener('online', this.triggerSync.bind(this));

    // Also poll every 30 seconds as a fallback in case events are missed
    this.intervalId = setInterval(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, 30000);

    // Initial check
    if (navigator.onLine) {
      this.triggerSync();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    window.removeEventListener('online', this.triggerSync.bind(this));
  }

  public async triggerSync() {
    if (this.isSyncing) return;
    if (!pb.authStore.isValid) return; // Must be logged in to sync

    this.isSyncing = true;
    try {
      const pendingFindings = await db.findings.where('syncState').equals('DRAFT').toArray();

      for (const finding of pendingFindings) {
        await this.syncFinding(finding);
      }
    } catch (err) {
      console.error('Sync Engine Error:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncFinding(finding: LocalFinding) {
    try {
      // 1. Mark as QUEUED locally
      await db.findings.update(finding.id, { syncState: 'QUEUED' });

      // 2. Prepare Multipart Form Data for PocketBase
      const formData = new FormData();
      formData.append('id', finding.id);
      formData.append('user_id', pb.authStore.record!.id);
      formData.append('title', finding.title);
      formData.append('notes', finding.notes);
      formData.append('exact_lat', finding.lat?.toString() || '0');
      formData.append('exact_lng', finding.lng?.toString() || '0');
      formData.append('is_public', 'false'); // Default to private initially

      if (finding.classification) {
        formData.append('ai_classification', JSON.stringify(finding.classification));
      }

      // Convert Base64 data URL to a real Blob for file upload
      if (finding.imageDataUrl) {
        const response = await fetch(finding.imageDataUrl);
        const blob = await response.blob();
        formData.append('media', blob, `finding_${finding.id}.jpg`);
      }

      // 3. Perform the REST Upload (Handles the chunking/multipart underneath via XHR/fetch)
      await pb.collection('findings').create(formData);

      // 4. On success, mark SYNCED locally
      await db.findings.update(finding.id, { syncState: 'SYNCED' });

    } catch (err) {
      console.error(`Failed to sync finding ${finding.id}`, err);
      // Revert to DRAFT so it gets picked up on the next pass
      await db.findings.update(finding.id, { syncState: 'DRAFT' });
    }
  }
}

export const syncEngine = new SyncEngine();
