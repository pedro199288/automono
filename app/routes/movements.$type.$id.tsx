import { useParams, useNavigate } from "react-router";
import { MovementForm, type MovementFormData } from "~/components/MovementForm";
import { useMovement, useUpdateMovement } from "~/hooks/use-movements";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function EditMovement() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const movementType = type as "ingresos" | "gastos";
  const movementId = Number(id);

  const { data, isLoading, error } = useMovement(movementId);
  const updateMovement = useUpdateMovement();

  const handleSubmit = (formData: MovementFormData) => {
    updateMovement.mutate(
      { id: movementId, ...formData },
      {
        onSuccess: () => {
          navigate(`/movements/${movementType}`);
        },
      }
    );
  };

  const handleCancel = () => {
    navigate(`/movements/${movementType}`);
  };

  if (isLoading) {
    return <p className="text-zinc-400">Cargando...</p>;
  }

  if (error || !data?.movement) {
    return <p className="text-red-500">Error al cargar el movimiento</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            Editar {movementType === "ingresos" ? "ingreso" : "gasto"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MovementForm
            type={movementType}
            movement={data.movement}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMovement.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
