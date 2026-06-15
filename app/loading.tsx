// app/loading.tsx
import Loader from "@/app/components/Loader";

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader size="lg" />
    </div>
  );
}
