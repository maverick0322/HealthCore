const { execSync } = require('child_process');
const path = require('path');

console.log('Building frontend React application for Electron...');
try {
  execSync('npm run build', {
    cwd: path.resolve(__dirname, '../health-core'),
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_BUILD: 'true'
    }
  });
  console.log('Frontend React application built successfully!');
} catch (error) {
  console.error('Failed to build frontend React application:', error);
  process.exit(1);
}
