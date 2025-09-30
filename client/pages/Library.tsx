import Placeholder from "@/components/Placeholder";
import { ProtectedRoute } from "@/context/AuthContext";

export default function Library() {
  return (
    <ProtectedRoute>
      <div className="container pt-24 pb-10">
        <Placeholder
          title="Minha Biblioteca"
          description="Aqui você poderá ver todos os seus livros, adicionar novos, filtrar por título/autor/gênero e gerenciar sua lista de desejos. Diga-me se quer que eu implemente esta tela agora."
        />
      </div>
    </ProtectedRoute>
  );
}
