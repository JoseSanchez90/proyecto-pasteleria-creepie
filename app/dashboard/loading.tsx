import RingLoader from "@/components/loaders/ringLoader";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col justify-center items-center gap-2 h-full">
      <RingLoader
        size="50"
        stroke="6"
        bgOpacity="0.1"
        speed="1.68"
        color="#3b82f6"
      />
      <p className="text-gray-500">Cargando Resumen...</p>
    </div>
  );
}
