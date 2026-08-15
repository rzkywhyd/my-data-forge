// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import type { TableSetting } from "../types/table-setting.types";

// type Props = {
//   config: TableSetting;
//   setConfig: React.Dispatch<React.SetStateAction<TableSetting>>;
// };

// const themes = ["default", "blue", "green", "dark", "purple"] as const;

// type Theme = (typeof themes)[number];

// export default function GeneralTab({ config, setConfig }: Props) {
//   return (
//     <div className="space-y-6">
//       {/* MENU NAME */}
//       <div>
//         <label className="text-sm font-medium">Menu Name</label>
//         <Input
//           value={config.menu_name}
//           onChange={(e) =>
//             setConfig((prev) => ({
//               ...prev,
//               menu_name: e.target.value,
//             }))
//           }
//         />
//       </div>

//       {/* PAGE SIZE */}
//       <div>
//         <label className="text-sm font-medium">Page Size</label>
//         <Input
//           type="number"
//           value={config.pagination.pageSize}
//           onChange={(e) =>
//             setConfig((prev) => ({
//               ...prev,
//               pagination: {
//                 ...prev.pagination,
//                 pageSize: Number(e.target.value) || 10,
//               },
//             }))
//           }
//         />
//       </div>

//       {/* ======================
//           COLOR THEME
//       ====================== */}
//       <div>
//         <label className="text-sm font-medium">Table Theme (Color)</label>

//         <div className="flex flex-wrap gap-2 mt-2">
//           {themes.map((theme) => {
//             const active = config.theme === theme;

//             return (
//               <Button
//                 key={theme}
//                 type="button"
//                 variant={active ? "default" : "outline"}
//                 className="capitalize"
//                 onClick={() =>
//                   setConfig((prev) => ({
//                     ...prev,
//                     theme: theme as Theme,
//                   }))
//                 }
//               >
//                 {theme}
//               </Button>
//             );
//           })}
//         </div>
//       </div>

//       {/* ENTITY */}
//       <div>
//         <label className="text-sm font-medium text-gray-500">Entity</label>

//         <div className="p-2 border rounded bg-gray-50 text-gray-600">
//           {config.entityId}
//         </div>
//       </div>
//     </div>
//   );
// }

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TableSetting } from "../types/table-setting.types";

type Props = {
  config: TableSetting;
  setConfig: React.Dispatch<React.SetStateAction<TableSetting>>;
};

const themes = ["default", "blue", "green", "dark", "purple"] as const;

type Theme = (typeof themes)[number];

export default function GeneralTab({ config, setConfig }: Props) {
  return (
    <div className="space-y-6">
      {/* MENU NAME */}
      <div>
        <label className="text-sm font-medium">Menu Name</label>
        <Input
          value={config.menu_name}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              menu_name: e.target.value,
            }))
          }
        />
      </div>

      {/* PAGE SIZE */}
      <div>
        <label className="text-sm font-medium">Page Size</label>
        <Input
          type="number"
          value={config.pagination.pageSize}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              pagination: {
                ...prev.pagination,
                pageSize: Number(e.target.value) || 10,
              },
            }))
          }
        />
      </div>

      {/* PAGE SIZE OPTIONS */}
      <div>
        <label className="text-sm font-medium">Page Size Options</label>

        <Input
          type="text"
          value={config.pagination.pageSizeOptions.join(",")}
          placeholder="10,25,50,100"
          onChange={(e) => {
            const parsed = Array.from(
              new Set(
                e.target.value
                  .split(",")
                  .map((v) => Number(v.trim()))
                  .filter((v) => Number.isFinite(v) && v > 0),
              ),
            ).sort((a, b) => a - b);

            setConfig((prev) => ({
              ...prev,
              pagination: {
                ...prev.pagination,
                pageSizeOptions: parsed,
              },
            }));
          }}
        />

        <div className="text-xs text-gray-500 mt-1">Example: 10,25,50,100</div>
      </div>

      {/* THEME */}
      <div>
        <label className="text-sm font-medium">Table Theme (Color)</label>

        <div className="flex flex-wrap gap-2 mt-2">
          {themes.map((theme) => (
            <Button
              key={theme}
              type="button"
              variant={config.theme === theme ? "default" : "outline"}
              className="capitalize"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  theme: theme as Theme,
                }))
              }
            >
              {theme}
            </Button>
          ))}
        </div>
      </div>

      {/* ENTITY */}
      <div>
        <label className="text-sm font-medium text-gray-500">Entity</label>

        <div className="p-2 border rounded bg-gray-50 text-gray-600">
          {config.entityId}
        </div>
      </div>
    </div>
  );
}
