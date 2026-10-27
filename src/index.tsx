import React from "react";
import ReactDOM from "react-dom/client";
import { notification } from "antd/lib";
import App from "./App";
import "antd/dist/reset.css";
import "./index.css";

notification.config({ duration: 4 });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
