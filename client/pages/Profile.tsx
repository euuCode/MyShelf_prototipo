import Placeholder from "@/components/Placeholder";
import { ProtectedRoute } from "@/context/AuthContext";

export default function Profile() {
  return (
    <ProtectedRoute>
      <div className="container pt-24 pb-10">
        <Placeholder
          title="Meu Perfil"
          description="Aqui você poderá editar seus dados pessoais, ver o histórico de leituras e excluir sua conta. Posso construir essa tela quando desejar."
        />
      </div>
    </ProtectedRoute>
  );
}
