import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Loader2, X, AlertTriangle } from 'lucide-react';
import { ClassifierClient } from '../lib/ClassifierClient';
import type { ClassificationResult } from '../lib/classifier.worker';
import { useNavigate } from 'react-router-dom';

const FieldCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ClassificationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize ClassifierClient
  const classifierClient = useRef<ClassifierClient | null>(null);

  useEffect(() => {
    // In a real environment, we would load actual model/label URLs here.
    // For MVP UI dev, we initialize the client, but handle the lack of models via try/catch mock below.
    try {
      classifierClient.current = new ClassifierClient(
        new URL('../lib/classifier.worker.ts', import.meta.url).href
      );
      // We don't call .initialize() yet because we don't have a model URL.
    } catch (e) {
      console.warn('Failed to initialize ClassifierClient', e);
    }

    return () => {
      classifierClient.current?.terminate();
    };
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const processImage = async (imageSrc: string) => {
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Simulate network/processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Attempt actual classification if models exist, otherwise mock
      // (Since we don't have models hosted in the MVP yet, we force a mock result)
      const mockSuccess = true;

      if (mockSuccess) {
        setResults([
          { label: 'Quartz (SiO2)', confidence: 0.92, classIndex: 42 },
          { label: 'Calcite (CaCO3)', confidence: 0.05, classIndex: 12 },
          { label: 'Feldspar', confidence: 0.02, classIndex: 8 },
        ]);
      } else {
         // Example of how we would call the real client:
         // const blob = await (await fetch(imageSrc)).blob();
         // const res = await classifierClient.current?.classifyImage(blob);
         // setResults(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to classify finding.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResults(null);
    setError(null);
  };

  const videoConstraints = {
    width: { ideal: 1080 },
    height: { ideal: 1920 },
    facingMode: 'environment', // Request back camera on mobile
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
      {/* Top Header / Nav */}
      <div className="absolute top-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium text-lg drop-shadow-md">Field Discovery</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Main Viewfinder Area */}
      <div className="flex-1 relative">
        {!capturedImage ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={capturedImage} alt="Captured Finding" className="w-full h-full object-cover" />
        )}

        {/* Reticle / Target overlay */}
        {!capturedImage && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-white"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-1 bg-white"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 bg-white"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1 h-8 bg-white"></div>
             </div>
           </div>
        )}
      </div>

      {/* Bottom Controls / Results Sheet */}
      <div className={`absolute bottom-0 w-full bg-zinc-900 rounded-t-3xl transition-transform duration-300 ease-in-out ${capturedImage ? 'translate-y-0' : 'translate-y-[60%]'}`}>

        {!capturedImage ? (
           <div className="p-8 flex justify-center items-center h-40">
             {/* Capture Shutter Button */}
             <button
                onClick={capture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-white/50 transition-transform active:scale-95 group"
                aria-label="Capture Finding"
             >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-zinc-900 group-hover:bg-zinc-200 transition-colors">
                  <Camera className="w-8 h-8" />
                </div>
             </button>
           </div>
        ) : (
          <div className="p-6 h-64 flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-4">Analysis Results</h3>

            {isProcessing ? (
               <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                 <p className="text-zinc-400">Running on-device NPU...</p>
               </div>
            ) : error ? (
               <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-red-400">
                 <AlertTriangle className="w-10 h-10" />
                 <p>{error}</p>
                 <button onClick={resetCapture} className="mt-4 px-4 py-2 bg-red-500/20 rounded-full text-white text-sm hover:bg-red-500/40">Try Again</button>
               </div>
            ) : results ? (
               <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                 {results.map((res, i) => (
                   <div key={res.classIndex} className="bg-zinc-800 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-white font-medium">
                        {i === 0 && '✨ '} {res.label}
                      </span>
                      <span className={`text-sm font-bold ${i === 0 ? 'text-green-400' : 'text-zinc-400'}`}>
                        {(res.confidence * 100).toFixed(1)}%
                      </span>
                   </div>
                 ))}
               </div>
            ) : null}

            {/* Action Bar */}
            {!isProcessing && !error && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={resetCapture}
                  className="flex-1 py-3 px-4 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save to Gallery
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldCapture;
