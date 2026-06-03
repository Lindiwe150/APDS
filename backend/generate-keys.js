const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir);

const keyPath = path.join(keysDir, 'server.key');
const certPath = path.join(keysDir, 'server.cert');

console.log('Generating self-signed SSL certificate...');
execSync(
  `openssl req -x509 -nodes -days 365 -newkey rsa:2048 ` +
  `-keyout "${keyPath}" -out "${certPath}" ` +
  `-subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=Chauke Ndlovu Bank/CN=localhost"`,
  { stdio: 'inherit' }
);
console.log('SSL keys generated in backend/keys/');
