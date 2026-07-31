import { CardGridSkeleton } from "@/app/components/domain/states";

export default function SequenceDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <CardGridSkeleton cards={2} />
    </div>
  );
}
