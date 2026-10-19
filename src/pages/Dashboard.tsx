import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="p-8 max-w-lg mx-auto mt-20">
      <h1 className="text-3xl font-bold mb-8 text-center text-zinc-900">Eon Base Modules</h1>
      <div className="flex flex-col space-y-4">
        <Link
          to="/field"
          className="px-6 py-4 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors shadow-lg flex items-center justify-center"
        >
          Open Field Discovery (Camera)
        </Link>
        <Link
          to="/gallery"
          className="px-6 py-4 bg-zinc-100 border border-zinc-300 text-zinc-900 font-medium rounded-xl hover:bg-zinc-200 transition-colors shadow flex items-center justify-center"
        >
          Private Digital Gallery
        </Link>
        <Link
          to="/map"
          className="px-6 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center"
        >
          Interactive Social Map
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
