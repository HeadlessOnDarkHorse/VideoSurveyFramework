import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Page</h1>
      <Link
        to="/field"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block"
      >
        Open Field Discovery (Camera)
      </Link>
    </div>
  );
};

export default Dashboard;
