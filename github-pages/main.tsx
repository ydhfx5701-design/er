import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WaggleTownPage from "../app/page";
import "../app/globals.css";
import "../app/ui-final.css";

const root = document.getElementById("root");

if (!root) throw new Error("Waggle Town root element was not found.");

createRoot(root).render(
  <StrictMode>
    <WaggleTownPage />
  </StrictMode>,
);
