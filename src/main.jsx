import React from "react";
import { createRoot } from "react-dom/client";
import MechanicHome from "./modules/home/MechanicHome.jsx";
import "./style.css";
createRoot(document.getElementById("root")).render(<React.StrictMode><MechanicHome /></React.StrictMode>);
