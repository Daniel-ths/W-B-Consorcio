// ARQUIVO: app/configurador/page.tsx
import VehicleConfigurator from "@/components/VehicleConfigurator";

export default function ConfiguradorPage() {
  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Chamamos o componente que criamos acima */}
      <VehicleConfigurator />
    </div>
  );
}