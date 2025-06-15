import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import DropSelector from "./components/DropSelector.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DropSelector />
  </StrictMode>,
);
