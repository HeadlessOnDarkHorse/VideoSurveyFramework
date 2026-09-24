import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, Map, UploadCloud, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivateGallery: React.FC = () => {
  const findings = useLiveQuery(() => db.findings.orderBy('createdAt').reverse().toArray());

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/80 backdrop-blur-md z-10 p-4 flex items-center shadow-md">
        <Link to="/dashboard" className="p-2 mr-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Private Digital Gallery</h1>
        <Link to="/map" className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition">
          <Map className="w-5 h-5" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {findings === undefined ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center text-zinc-500">
            <Info className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Your gallery is empty.</p>
            <p className="text-sm mt-2 max-w-xs">Start a field discovery to identify and save interesting rocks, minerals, or fossils.</p>
            <Link to="/field" className="mt-6 px-6 py-2 bg-zinc-800 rounded-full text-zinc-200 hover:bg-zinc-700 transition">
              Open Camera
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {findings.map((item) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img
                  src={item.imageDataUrl}
                  alt={item.title}
                  className="w-full aspect-square object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />

                {/* Sync Badge */}
                <div className="absolute top-2 right-2">
                  <div className={`p-1.5 rounded-full backdrop-blur-md shadow-sm ${item.syncState === 'SYNCED' ? 'bg-green-500/80' : 'bg-zinc-500/80'}`}>
                    <UploadCloud className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-black to-transparent">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.classification && item.classification[0] && (
                       <span className="text-xs font-bold text-blue-400">
                         {(item.classification[0].confidence * 100).toFixed(0)}%
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateGallery;
