const { execSync } = require('child_process');

const name = process.argv[2];

if (!name) {
  console.error('migration name is required!');
  process.exit(1);
}

execSync(`npm run typeorm -- migration:generate src/migrations/${name}`, {
  stdio: 'inherit',
});
