import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import MainPage from "../pages/MainPage";
import MainLayout from "../layouts/MainLayout";
import TableSettings from "../pages/TableSettings";
import UserPage from "@/pages/UserPage";
import PersonalPage from "@/pages/PersonalPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/main",
        element: <MainPage />,
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/table-settings",
        element: <TableSettings />,
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/table-settings/:slug",
        element: <TableSettings />,
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/users",
        element: <UserPage />,
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/personals",
        element: <PersonalPage />,
      },
    ],
  },
]);
