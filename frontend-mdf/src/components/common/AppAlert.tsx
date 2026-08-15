import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AlertType = "success" | "error" | "warning" | "info";

type Props = {
  type?: AlertType;
  title: string;
  description?: string;
};

export default function AppAlert({ type = "info", title, description }: Props) {
  const styles = {
    success: "border-green-500 text-green-700",
    error: "border-red-500 text-red-700",
    warning: "border-yellow-500 text-yellow-700",
    info: "border-blue-500 text-blue-700",
  };

  return (
    <Alert className={cn(styles[type])}>
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  );
}
