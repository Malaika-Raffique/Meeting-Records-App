import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const root = createRoot(document.getElementById("root"));

function showStartupError(error) {
  const message = error?.message || String(error);
  root.render(
    <main className="startup-error">
      <div>
        <span className="eyebrow">WEEKLY MEETING RECORDS</span>
        <h1>The app could not start</h1>
        <p>Please copy this message and share it with the developer.</p>
        <pre>{message}</pre>
      </div>
    </main>,
  );
}

window.addEventListener("error", (event) => showStartupError(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => showStartupError(event.reason));

import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch(showStartupError);