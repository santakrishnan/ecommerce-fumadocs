import { Button } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";

interface AppointmentModalTriggerProps {
  onViewAll: () => void;
}

export function AppointmentModalTrigger({ onViewAll }: AppointmentModalTriggerProps) {
  return (
    <Button className="min-h-0 min-w-0 gap-1" onClick={onViewAll} type="button" variant="text">
      <span>View all</span>
      <IconArrowRight className="size-3" />
    </Button>
  );
}
