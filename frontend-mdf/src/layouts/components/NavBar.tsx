import * as react from "@headlessui/react";
import {
  Bars3Icon,
  // Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import NavMenu from "./NavMenu";

type NavMenu = {
  menu_id: number;
  menu_name: string;
  href: string;
  parent_id: number | null;
  permissions: string[];
};

export type MenuTree = {
  menu_id: number;
  menu_name: string;
  href: string;
  children: MenuTree[];
};

type NavBarProps = {
  navigation: NavMenu[];
  sysNavigation?: NavMenu[]; // opsional, untuk menu system
};

export default function NavBar({ navigation, sysNavigation }: NavBarProps) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const pathname = window.location.pathname;
  const isActive = (href: string) => pathname === href;

  const isChildActive = (item: MenuTree) =>
    item.children.some((child) => child.href === pathname);

  const isParentActive = (item: MenuTree) =>
    isActive(item.href) || isChildActive(item);

  // FIX: multi ref dropdown (important)
  const menuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const getUserFromStorage = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const user = getUserFromStorage();

  // close when click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedInside = Object.values(menuRefs.current).some((ref) =>
        ref?.contains(e.target as Node),
      );

      if (!clickedInside) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // build tree
  const buildTree = (
    data: NavMenu[],
    parentId: number | null = null,
  ): MenuTree[] => {
    return data
      .filter((item) => (item.parent_id ?? null) === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(data, item.menu_id),
      }));
  };

  const tree = buildTree(navigation);
  const sysTree = sysNavigation ? buildTree(sysNavigation) : [];

  // mobile render
  const renderMobile = (items: MenuTree[]) => {
    return items.map((item) => {
      if (item.children.length > 0) {
        return (
          <react.Disclosure key={item.menu_id} as="div">
            {({ open }) => (
              <>
                <react.DisclosureButton className="flex w-full justify-between rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition cursor-pointer">
                  {item.menu_name}
                  <span
                    className={`transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </react.DisclosureButton>

                <react.DisclosurePanel className="pl-5 space-y-1">
                  {renderMobile(item.children)}
                </react.DisclosurePanel>
              </>
            )}
          </react.Disclosure>
        );
      }

      return (
        <react.DisclosureButton
          key={item.menu_id}
          as="a"
          href={item.href}
          className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          {item.menu_name}
        </react.DisclosureButton>
      );
    });
  };

  return (
    <react.Disclosure as="nav" className="bg-indigo-950 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* MOBILE BUTTON */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <react.DisclosureButton className="p-2 text-gray-400 hover:text-white cursor-pointer">
              <Bars3Icon className="h-6 w-6 group-data-open:hidden" />
              <XMarkIcon className="h-6 w-6 hidden group-data-open:block" />
            </react.DisclosureButton>
          </div>

          {/* LOGO + DESKTOP MENU */}
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <img
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg"
              className="h-8 w-auto"
              alt="logo"
            />

            <NavMenu
              tree={tree}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              menuRefs={menuRefs}
              isActive={isActive}
              isParentActive={isParentActive}
              isSystem={false}
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer p-2 rounded hover:text-white">
              {/* {sysTree?.length > 0 && (
                <Cog6ToothIcon className="h-6 w-6 text-gray-200" />
              )} */}
              {/* <span className="text-sm text-white">System</span> */}

              <NavMenu
                tree={sysTree}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                menuRefs={menuRefs}
                isActive={isActive}
                isParentActive={isParentActive}
                isSystem={true}
              />
            </div>

            <div className="flex items-center gap-2">
              <react.Menu as="div" className="relative">
                <react.MenuButton className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded-full transition">
                  {/* AVATAR */}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-900 text-white font-semibold text-xs">
                    {user?.name ? getInitials(user.name) : "U"}
                  </div>

                  {/* NAME */}
                  <span className="text-sm text-gray-200 font-medium hidden sm:block">
                    {user?.name ?? "User"}
                  </span>
                </react.MenuButton>

                <react.MenuItems
                  className="
                              absolute right-0 mt-3 w-56 origin-top-right
                              rounded-xl bg-white/90 backdrop-blur-xl
                              shadow-xl ring-1 ring-black/5
                              p-2
                              transition
                              data-closed:scale-95 data-closed:opacity-0
                              data-enter:duration-200 data-leave:duration-150
                            "
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800">
                      My Account
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <div className="my-1 border-t border-gray-200" />

                  <react.MenuItem>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          active
                            ? "bg-indigo-900 text-white shadow-md"
                            : "text-gray-700"
                        }`}
                      >
                        Profile
                      </a>
                    )}
                  </react.MenuItem>

                  <react.MenuItem>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          active
                            ? "bg-indigo-900 text-white shadow-md"
                            : "text-gray-700"
                        }`}
                      >
                        Settings
                      </a>
                    )}
                  </react.MenuItem>

                  <div className="my-1 border-t border-gray-200" />

                  <react.MenuItem>
                    {({ active }) => (
                      <button
                        className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          active
                            ? "bg-red-500 text-white shadow-md"
                            : "text-red-500"
                        }`}
                      >
                        Logout
                      </button>
                    )}
                  </react.MenuItem>
                </react.MenuItems>
              </react.Menu>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <react.DisclosurePanel className="sm:hidden px-2 pb-3 space-y-1">
        {renderMobile(tree)}
      </react.DisclosurePanel>
    </react.Disclosure>
  );
}
