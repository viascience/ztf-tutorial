import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: "https://auth.solvewithvia.com/auth",
  realm: "ztf_demo",
  clientId: "localhost-app",
});