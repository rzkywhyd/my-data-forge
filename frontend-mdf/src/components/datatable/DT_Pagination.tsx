import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  total: number;
  pageSize: number;

  setPage: (p: number) => void;
};

export default function DataTablePagination({
  page,
  total,
  pageSize,
  setPage,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Page {page} / {totalPages}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>

        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
