import { MissingVehicleLayout } from "./missing-vehicle-layout";
import { SignalHeroReady } from "./signal-hero-ready";

export default function VdpNotFound() {
  return (
    <>
      <SignalHeroReady />
      <MissingVehicleLayout />
    </>
  );
}
