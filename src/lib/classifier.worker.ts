import * as ORT from 'onnxruntime-web';

// Ensure WebAssembly binary locations are correctly configured
ORT.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

// --- Type Definitions ---
export type WorkerIncomingMessage =
  | { type: 'INIT'; payload: { modelUrl: string; labelsUrl: string } }
  | { type: 'CLASSIFY'; payload: { imageBitmap: ImageBitmap; topK?: number } };

export type ClassificationResult = {
  label: string;
  confidence: number;
  classIndex: number;
};

export type WorkerOutgoingMessage =
  | { type: 'INIT_COMPLETE' }
  | { type: 'CLASSIFY_SUCCESS'; payload: { predictions: ClassificationResult[] } }
  | { type: 'ERROR'; payload: { message: string } };

// --- State Variables ---
let session: ORT.InferenceSession | null = null;
let classLabels: string[] = [];

// Standard ImageNet Normalization Parameters
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];
const MODEL_INPUT_SIZE = 224;

// --- Helper Functions ---

/**
 * Preprocesses an ImageBitmap into a quantized/normalized Float32Tensor matching [1, 3, 224, 224] shape.
 */
function preprocessImage(bitmap: ImageBitmap): ORT.Tensor {
  // 1. Draw image onto an OffscreenCanvas scaled to 224x224
  const canvas = new OffscreenCanvas(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire OffscreenCanvas 2D context.');
  }

  ctx.drawImage(bitmap, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const { data } = imageData; // RGBA uint8 array

  // 2. Convert RGBA Planar (224x224x4) to NCHW Float32 Array (1x3x224x224)
  const float32Data = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  const imageSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;

  for (let i = 0; i < imageSize; i++) {
    const r = data[i * 4] / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    // Normalize using ImageNet mean & standard deviation and assign to NCHW channels
    float32Data[i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];                 // Red channel
    float32Data[imageSize + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];     // Green channel
    float32Data[2 * imageSize + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2]; // Blue channel
  }

  return new ORT.Tensor('float32', float32Data, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
}

/**
 * Applies Softmax to raw logits to compute probability distribution.
 */
function softmax(logits: Float32Array): Float32Array {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((val) => Math.exp(val - maxLogit));
  const sumExps = exps.reduce((acc, val) => acc + val, 0);
  return exps.map((val) => val / sumExps);
}

// --- Event Listener ---

self.onmessage = async (event: MessageEvent<WorkerIncomingMessage>) => {
  const { data } = event;

  try {
    if (data.type === 'INIT') {
      const { modelUrl, labelsUrl } = data.payload;

      // Configure execution providers (WebGL for GPU acceleration with fallback to WebAssembly)
      const options: ORT.InferenceSession.SessionOptions = {
        executionProviders: ['webgl', 'wasm'],
        graphOptimizationLevel: 'all',
      };

      // Load model and labels in parallel
      const [newSession, labelsResponse] = await Promise.all([
        ORT.InferenceSession.create(modelUrl, options),
        fetch(labelsUrl),
      ]);

      session = newSession;
      classLabels = await labelsResponse.json();

      self.postMessage({ type: 'INIT_COMPLETE' } satisfies WorkerOutgoingMessage);
      return;
    }

    if (data.type === 'CLASSIFY') {
      if (!session) {
        throw new Error('Worker not initialized. Call INIT before running classification.');
      }

      const { imageBitmap, topK = 3 } = data.payload;

      // 1. Preprocess
      const inputTensor = preprocessImage(imageBitmap);

      // 2. Identify model input node name dynamically
      const inputName = session.inputNames[0];

      // 3. Execute ONNX inference session
      const feeds: Record<string, ORT.Tensor> = { [inputName]: inputTensor };
      const results = await session.run(feeds);

      // 4. Extract output tensor
      const outputName = session.outputNames[0];
      const outputTensor = results[outputName];
      const logits = outputTensor.data as Float32Array;

      // 5. Calculate probabilities via Softmax
      const probabilities = softmax(logits);

      // 6. Sort and extract top K probabilities
      const indexedProbs = Array.from(probabilities).map((prob, idx) => ({
        classIndex: idx,
        confidence: prob,
        label: classLabels[idx] || `Unknown Class (${idx})`,
      }));

      indexedProbs.sort((a, b) => b.confidence - a.confidence);
      const topKPredictions = indexedProbs.slice(0, topK);

      // Cleanup ImageBitmap memory resources
      imageBitmap.close();

      self.postMessage({
        type: 'CLASSIFY_SUCCESS',
        payload: { predictions: topKPredictions },
      } satisfies WorkerOutgoingMessage);
      return;
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { message: error instanceof Error ? error.message : String(error) },
    } satisfies WorkerOutgoingMessage);
  }
};
