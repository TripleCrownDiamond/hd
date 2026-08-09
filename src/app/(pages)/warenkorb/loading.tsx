import { CartPageLoading } from "@/components/ui/loading-states";

export default function Loading() {
  return (
    <div className="bg-elevated/40">
      <div className="container-site py-8 md:py-12">
        <CartPageLoading />
      </div>
    </div>
  );
}
