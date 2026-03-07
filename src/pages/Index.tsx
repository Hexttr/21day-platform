import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginForm />;
  if (user?.role === 'ai_user') return <Navigate to="/chatgpt" replace />;
  return <Dashboard />;
};

export default Index;
