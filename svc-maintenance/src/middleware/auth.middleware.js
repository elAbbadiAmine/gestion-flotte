const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, getKey, { algorithms: ['RS256'], issuerValidation: false }, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, error: 'Token invalide' });
    req.user = decoded;
    next();
  });
};

const authorize = (...roles) => (req, res, next) => {
  const userRoles = req.user?.realm_access?.roles || [];
  if (!roles.some(r => userRoles.includes(r))) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }
  next();
};

module.exports = { authenticate, authorize };
