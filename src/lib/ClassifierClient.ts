import type {
  ClassificationResult,
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
} from './classifier.worker';

export class ClassifierClient {
  private worker: Worker;
  private isReady = false;

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath, { type: 'module' });
  }

  /**
   * Initializes the ONNX model session inside the worker thread.
   */
  public async initialize(modelUrl: string, labelsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleMessage = (e: MessageEvent<WorkerOutgoingMessage>) => {
        if (e.data.type === 'INIT_COMPLETE') {
          this.isReady = true;
          this.worker.removeEventListener('message', handleMessage);
          resolve();
        } else if (e.data.type === 'ERROR') {
          this.worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.payload.message));
        }
      };

      this.worker.addEventListener('message', handleMessage);

      const msg: WorkerIncomingMessage = {
        type: 'INIT',
        payload: { modelUrl, labelsUrl },
      };
      this.worker.postMessage(msg);
    });
  }

  /**
   * Classifies an offline field discovery image via Zero-Copy ImageBitmap transfer.
   */
  public async classifyImage(
    imageBlob: Blob,
    topK = 3
  ): Promise<ClassificationResult[]> {
    if (!this.isReady) {
      throw new Error('Classifier Client is not initialized.');
    }

    // Convert raw Blob/File to high-performance ImageBitmap
    const imageBitmap = await createImageBitmap(imageBlob);

    return new Promise((resolve, reject) => {
      const handleMessage = (e: MessageEvent<WorkerOutgoingMessage>) => {
        if (e.data.type === 'CLASSIFY_SUCCESS') {
          this.worker.removeEventListener('message', handleMessage);
          resolve(e.data.payload.predictions);
        } else if (e.data.type === 'ERROR') {
          this.worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.payload.message));
        }
      };

      this.worker.addEventListener('message', handleMessage);

      const msg: WorkerIncomingMessage = {
        type: 'CLASSIFY',
        payload: { imageBitmap, topK },
      };

      // Transfer ImageBitmap ownership zero-copy to worker thread
      this.worker.postMessage(msg, [imageBitmap]);
    });
  }

  /**
   * Terminates the background worker instance.
   */
  public terminate(): void {
    this.worker.terminate();
    this.isReady = false;
  }
}
