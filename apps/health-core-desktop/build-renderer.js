const { execSync } = require('child_process');
const path = require('path');

console.log('Building frontend React application for Electron...');
try {
  const env = {
    ...process.env,
    ELECTRON_BUILD: 'true',
  };

  env.VITE_API_BASE_URL ||= 'http://localhost/api/v1';
  env.VITE_IDENTITY_SERVICE_URL ||= 'http://localhost:8082';

  console.log(`Using API base URL: ${env.VITE_API_BASE_URL}`);
  console.log(`Using identity service URL: ${env.VITE_IDENTITY_SERVICE_URL}`);

  execSync('npm run build', {
    cwd: path.resolve(__dirname, '../health-core'),
    stdio: 'inherit',
    env,
  });
  console.log('Frontend React application built successfully!');
} catch (error) {
  console.error('Failed to build frontend React application:', error);
  process.exit(1);
}
