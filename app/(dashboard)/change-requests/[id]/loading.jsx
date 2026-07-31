import { CardGridSkeleton } from "@/app/components/domain/states";

export default function ChangeRequestDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <CardGridSkeleton cards={4} />
    </div>
  );
}
