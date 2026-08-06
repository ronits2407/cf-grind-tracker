const fs = require('fs');
const path = require('path');
const dir = 'c:/Dev/projects/web/cp_practice extention/src/dashboard/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$\{/g, '${');
  fs.writeFileSync(filepath, content);
  console.log('Fixed ' + file);
}
