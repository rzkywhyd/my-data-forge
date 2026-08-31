import { useEffect, useRef } from "react";

import type { IHeaderParams, IRowNode } from "ag-grid-community";

type SelectAllHeaderContext = {
  onSelectAllRows: (checked: boolean) => void;
};

export default function SelectAllHeader(
  props: IHeaderParams & {
    context?: SelectAllHeaderContext;
  },
) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateState = () => {
      const checkbox = checkboxRef.current;

      if (!checkbox) {
        return;
      }

      let total = 0;
      let selected = 0;

      props.api.forEachNode((node: IRowNode) => {
        total++;

        if (node.isSelected()) {
          selected++;
        }
      });

      checkbox.checked = total > 0 && selected === total;
      checkbox.indeterminate = selected > 0 && selected < total;
    };

    props.api.addEventListener("selectionChanged", updateState);
    props.api.addEventListener("rowSelected", updateState);

    updateState();

    return () => {
      props.api.removeEventListener("selectionChanged", updateState);
      props.api.removeEventListener("rowSelected", updateState);
    };
  }, [props.api]);

  const handleChange = () => {
    const checkbox = checkboxRef.current;

    if (!checkbox) {
      return;
    }

    const checked = checkbox.checked;

    // 🔥 UPDATE UI DULU
    props.context?.onSelectAllRows?.(checked);

    // 🔥 BARU SELECT ROW
    const nodes: IRowNode[] = [];

    props.api.forEachNode((node: IRowNode) => {
      nodes.push(node);
    });

    if (nodes.length > 0) {
      props.api.setNodesSelected({
        nodes,
        newValue: checked,
      });
    }
  };

  return (
    <div className="flex h-full items-center justify-start pl-[1px]">
      <input
        ref={checkboxRef}
        type="checkbox"
        onChange={handleChange}
        aria-label="Select all rows"
        className="
          h-[16px]
          w-[16px]
          cursor-pointer
          appearance-none
          rounded-[4px]
          border
          border-[#b8b8b8]
          bg-white
          transition-colors
          checked:border-[#2563eb]
          checked:bg-[#2563eb]
          indeterminate:border-[#2563eb]
          indeterminate:bg-[#2563eb]
        "
      />

      <style>
        {`
          input[type="checkbox"]:checked {
            position: relative;
          }

          input[type="checkbox"]:checked::after {
            content: "";
            position: absolute;
            left: 5px;
            top: 2px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }

          input[type="checkbox"]:indeterminate {
            position: relative;
          }

          input[type="checkbox"]:indeterminate::after {
            content: "";
            position: absolute;
            left: 3px;
            top: 6px;
            width: 8px;
            height: 2px;
            background: white;
          }
        `}
      </style>
    </div>
  );
}
