import { useParams, Navigate } from "react-router";

export default function RecordDetail() {
  const { type, source, id } = useParams();

  // Redirigir a la vista de detalle original
  if (source === "invoice") {
    return <Navigate to={`/invoices/${type}/${id}`} replace />;
  }

  if (source === "movement") {
    return <Navigate to={`/movements/${type}/${id}`} replace />;
  }

  return <Navigate to={`/records/${type}`} replace />;
}
