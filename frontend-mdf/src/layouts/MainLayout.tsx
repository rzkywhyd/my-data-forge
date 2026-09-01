import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import NavBar from "./components/NavBar";

type Menu = {
  menu_id: number;
  menu_name: string;
  href: string;
  parent_id: number | null;
  permissions: string[];
  is_system_mode: number;
};

type MenuResponse = {
  message?: string;
  data?: Menu[];
};

export default function MainLayout() {
  const navigate = useNavigate();

  const [navigation, setNavigation] = useState<Menu[]>([]);
  const [sysNavigation, setSysNavigation] = useState<Menu[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // =========================
    // NO TOKEN
    // =========================
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const loadMenus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/menus`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        // =========================
        // TOKEN INVALID / EXPIRED
        // =========================
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
          return;
        }

        // =========================
        // USER DOES NOT HAVE ACCESS
        // =========================
        if (response.status === 403) {
          const json: MenuResponse = await response.json();

          console.error("Menu access denied:", json.message ?? "No access");

          setNavigation([]);
          setSysNavigation([]);

          return;
        }

        // =========================
        // OTHER HTTP ERROR
        // =========================
        if (!response.ok) {
          throw new Error(`Failed load menus: ${response.status}`);
        }

        // =========================
        // RESPONSE
        // =========================
        const json: MenuResponse = await response.json();

        const data = Array.isArray(json.data) ? json.data : [];

        // =========================
        // NORMAL MENU
        // =========================
        setNavigation(data.filter((item) => item.is_system_mode === 0));

        // =========================
        // SYSTEM MENU
        // =========================
        setSysNavigation(data.filter((item) => item.is_system_mode === 1));
      } catch (error) {
        console.error("LOAD MENU ERROR:", error);
      }
    };

    loadMenus();
  }, [navigate]);

  return (
    <>
      <NavBar navigation={navigation} sysNavigation={sysNavigation} />

      <main className="flex-1">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </>
  );
}
