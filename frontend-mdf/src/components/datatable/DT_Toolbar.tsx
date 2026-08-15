import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  search: string;
  setSearch: (v: string) => void;

  pageSize: number;
  setPageSize: (v: number) => void;
};

export default function DataTableToolbar({
  search,
  setSearch,
  pageSize,
  setPageSize,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Input
        className="w-72"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Select
        value={String(pageSize)}
        onValueChange={(v) => setPageSize(Number(v))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {[5, 10, 20, 50].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
