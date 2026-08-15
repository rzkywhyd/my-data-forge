import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AllCommunityModule } from "ag-grid-community";
import { AgGridProvider } from "ag-grid-react";
import { router } from "./routes/router";
import "./index.css";

const modules = [AllCommunityModule];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AgGridProvider modules={modules}>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </AgGridProvider>
  </StrictMode>,
);
