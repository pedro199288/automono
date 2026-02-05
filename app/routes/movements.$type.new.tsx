import { useParams, useNavigate } from "react-router";
import { MovementForm, type MovementFormData } from "~/components/MovementForm";
import { useCreateMovement } from "~/hooks/use-movements";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function NewMovement() {
  const { type } = useParams();
  const navigate = useNavigate();
  const movementType = type as "ingresos" | "gastos";

  const createMovement = useCreateMovement();

  const handleSubmit = (data: MovementFormData) => {
    createMovement.mutate(data, {
      onSuccess: () => {
        navigate(`/movements/${movementType}`);
      },
    });
  };

  const handleCancel = () => {
    navigate(`/movements/${movementType}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            Nuevo {movementType === "ingresos" ? "ingreso" : "gasto"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MovementForm
            type={movementType}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMovement.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
