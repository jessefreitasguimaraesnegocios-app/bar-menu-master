import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOwner?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin, requireOwner }: ProtectedRouteProps) => {
  const { isAdmin, isOwner, user, barId } = useAuth();

  // Se não há usuário logado
  if (!user) {
    // Para rotas admin, permitir acesso para mostrar tela de login do AdminPortal
    // Para rotas owner, redirecionar para /login (tem tela de login separada)
    if (requireOwner) {
      return <Navigate to="/login" replace />;
    }
    // requireAdmin: permitir que o AdminPortal mostre sua tela de login
    return <>{children}</>;
  }

  // Se há usuário logado, verificar permissões

  // Validação para admin - usuário logado mas não é admin
  if (requireAdmin && !isAdmin) {
    // Se for owner tentando acessar admin, redirecionar para /owner
    if (isOwner) {
      return <Navigate to="/owner" replace />;
    }
    // Caso contrário (usuário sem role ou role diferente), redirecionar para home
    return <Navigate to="/" replace />;
  }

  // Validação para owner - usuário logado mas não é owner ou não tem barId
  if (requireOwner) {
    // Verificar se é owner primeiro
    if (!isOwner) {
      // Se for admin tentando acessar owner, redirecionar para /admin
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      // Caso contrário, redirecionar para home
      return <Navigate to="/" replace />;
    }
    
    // Se é owner mas não tem barId, ainda permitir acesso
    // (o OwnerPortal vai verificar e mostrar mensagem apropriada)
    // O barId pode estar sendo carregado ainda
    if (!barId) {
      // Permitir acesso mas o OwnerPortal vai verificar
      console.warn('Owner sem bar_id - permitindo acesso mas verificando no componente');
    }
  }

  // Tudo OK, renderizar children
  return <>{children}</>;
};
