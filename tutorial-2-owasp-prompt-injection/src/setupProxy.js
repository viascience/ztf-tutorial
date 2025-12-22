// src/setupProxy.js

module.exports = function(app) {
  // Add CORS headers to allow Keycloak communication during authentication
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://auth.solvewithvia.com');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
};