import Placeholder from "@/components/Placeholder";
import { ProtectedRoute } from "@/context/AuthContext";

export default function Recommendations() {
  return (
    <ProtectedRoute>
      <div className="container pt-24 pb-10">
        <Placeholder
          title="Recomendações"
          description="Em breve: recomendações personalizadas com base no seu histórico e preferências."
        />
      </div>
    </ProtectedRoute>
  );
}
