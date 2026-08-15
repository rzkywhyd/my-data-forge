import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Props = {
  columnKey: string;
  setFilters: (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => void;
};

export default function ColumnFilterMenu({ columnKey, setFilters }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-xs text-gray-400 hover:text-black">⛃</button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => setFilters((prev) => ({ ...prev, [columnKey]: "" }))}
        >
          Clear
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            setFilters((prev) => ({ ...prev, [columnKey]: "contains" }))
          }
        >
          Contains
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            setFilters((prev) => ({ ...prev, [columnKey]: "equals" }))
          }
        >
          Equals
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
