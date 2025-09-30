import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import keycloak from "./App";

const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; color: #333; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; text-align: center; }
    .container { background: white; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 600px; }
    h1 { color: #2c3e50; margin-bottom: 0.5rem; }
    p { color: #7f8c8d; line-height: 1.6; }
    button { background-color: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background-color 0.3s ease; margin-top: 1rem; }
    button:hover { background-color: #2980b9; }
    button.logout { background-color: #e74c3c; }
    button.logout:hover { background-color: #c0392b; }
    pre { background-color: #ecf0f1; padding: 1rem; border-radius: 8px; text-align: left; white-space: pre-wrap; word-break: break-all; font-size: 12px; color: #2c3e50; }
`;



const root = ReactDOM.createRoot(document.getElementById("root")!);

  /**
   * Popup Handler Component
   */
  function PopupHandler() {
      useEffect(() => {
          keycloak.init({ onLoad: 'login-required' }).then(() => {
              window.close();
          }).catch((error: any) => {
              console.error("Popup login failed:", error);
              window.close();
          });
      }, []);

      return (
          <div className="container">
              <h1>Authenticating...</h1>
              <p>Please follow the instructions in the login window. This pop-up will close automatically.</p>
          </div>
      );
  }
  
/**
 * Simple Router
 */
function Main() {
    const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';

    return (
        <>
            <style>{styles}</style>
            {isPopup ? <PopupHandler /> : <App />}
        </>
    );
}

// This part would typically be in an index.js file
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<Main />);
}
