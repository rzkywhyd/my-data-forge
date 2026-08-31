import DynamicTable from "@/features/dynamic-table/components/DynamicTable";

export default function PersonalPage() {
  const ENTITY_ID = 2;

  return (
    <div className="p-4 space-y-4">
      <DynamicTable entityId={ENTITY_ID} />
    </div>
  );
}
