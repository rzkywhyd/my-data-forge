import { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import { Outlet } from "react-router-dom";

type Menu = {
  menu_id: number;
  menu_name: string;
  href: string;
  parent_id: number | null;
  permissions: string[];
  is_system_mode: number;
};

export default function MainLayout() {
  const [navigation, setNavigation] = useState<Menu[]>([]);
  const [sysNavigation, setSysNavigation] = useState<Menu[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/menus`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        const data: Menu[] = json.data || [];

        setNavigation(data.filter((i) => i.is_system_mode === 0));
        setSysNavigation(data.filter((i) => i.is_system_mode === 1));
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <NavBar navigation={navigation} sysNavigation={sysNavigation} />

      {/* Page Wrapper */}
      <main className="flex-1">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </>
  );
}
