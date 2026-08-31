import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-8 animate-fade-in">
        <div className="text-9xl font-bold font-fraunces">
          <span className="text-sky-600">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 font-fraunces">Page Not Found</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
