import React from "react";
import type { MenuTree } from "./NavBar";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

type Props = {
  tree: MenuTree[];
  openMenu: number | null;
  setOpenMenu: (id: number | null) => void;
  menuRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  isActive: (href: string) => boolean;
  isParentActive: (item: MenuTree) => boolean;
  isSystem?: boolean;
};

export default function NavMenu({
  tree,
  openMenu,
  setOpenMenu,
  menuRefs,
  isActive,
  isParentActive,
}: Props) {
  const [openChild, setOpenChild] = React.useState<number | null>(null);
  return (
    <div className="hidden sm:flex sm:ml-6 space-x-2">
      {tree.map((item) =>
        item.children.length > 0 ? (
          // DROPDOWN LEVEL 1 (TETAP SAMA)
          <div
            key={item.menu_id}
            ref={(el) => {
              menuRefs.current[item.menu_id] = el;
            }}
            className="relative"
          >
            <button
              onClick={() =>
                setOpenMenu(openMenu === item.menu_id ? null : item.menu_id)
              }
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer ${
                isParentActive(item)
                  ? "bg-indigo-900 text-white shadow-md"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.menu_name}

              <svg
                className={`h-4 w-4 transition-transform duration-200 ${
                  openMenu === item.menu_id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openMenu === item.menu_id && (
              <div
                className="
                            absolute left-0 mt-3 w-60 z-9999
                            rounded-xl bg-white/90 backdrop-blur-xl
                            shadow-2xl ring-1 ring-black/5
                            overflow-hidden
                            animate-in fade-in slide-in-from-top-2 duration-200                                    
                            before:content-['']
                            before:absolute
                            before:-top-2
                            before:left-6

                            before:block
                            before:w-0
                            before:h-0

                            before:border-l-4
                            before:border-r-4
                            before:border-b-4
                            before:border-l-transparent
                            before:border-r-transparent
                            before:border-b-white/90
                            "
              >
                {/* ITEMS LEVEL 2 */}
                <div className="p-1 space-y-1">
                  {item.children.map((child) =>
                    child.children.length > 0 ? (
                      // LEVEL 2 WITH CHILDREN
                      <div className="" key={item.menu_id}>
                        {/* HEADER TOGGLE */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenChild(
                              openChild === child.menu_id
                                ? null
                                : child.menu_id,
                            );
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <span key={item.menu_id}>{child.menu_name}</span>

                          <ChevronRightIcon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              openChild === child.menu_id ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {/* SUB MENU LEVEL 3 */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            openChild === child.menu_id
                              ? "max-h-96 opacity-100 mt-1"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-3 border-l border-gray-200 pl-3 space-y-1">
                            {child.children.map((sub) => (
                              <a
                                key={sub.menu_id}
                                href={sub.href}
                                className={`block rounded-md px-3 py-2 text-sm transition ${
                                  isActive(sub.href)
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-600  hover:bg-indigo-900 hover:text-white"
                                }`}
                              >
                                {sub.menu_name}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // LEVEL 2 WITHOUT CHILD
                      <a
                        key={child.menu_id}
                        href={child.href}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          isActive(child.href)
                            ? "bg-indigo-900 text-white shadow-md"
                            : "text-gray-700 hover:bg-indigo-900 hover:text-white"
                        }`}
                      >
                        <span className="group-hover:translate-x-1 transition">
                          {child.menu_name}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition text-xs">
                          →
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <a
            key={item.menu_id}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            {item.menu_name}
          </a>
        ),
      )}
    </div>
  );
}
