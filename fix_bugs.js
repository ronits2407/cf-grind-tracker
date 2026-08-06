const fs = require('fs');
const path = require('path');
const dir = 'c:/Dev/projects/web/cp_practice extention/src/dashboard/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

// 1. Fix overview.js rating bug
const overviewPath = path.join(dir, 'overview.js');
let overviewContent = fs.readFileSync(overviewPath, 'utf8');
overviewContent = overviewContent.replace(
  "const currentRating = settings.get('rating') || 1200;",
  "const currentRating = (await settings.get('rating')) || 1200;"
);
fs.writeFileSync(overviewPath, overviewContent);

// 2. Fix button classes in all files
for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/class="val-btn"/g, 'class="btn btn-primary"');
  content = content.replace(/class="val-btn-outline/g, 'class="btn btn-secondary');
  fs.writeFileSync(filepath, content);
}

// 3. Remove Import from CF button from friends.js
const friendsPath = path.join(dir, 'friends.js');
let friendsContent = fs.readFileSync(friendsPath, 'utf8');
// Replace the button line with empty string
friendsContent = friendsContent.replace(/<button id="import-cf-friends".*?<\/button>/, '');
fs.writeFileSync(friendsPath, friendsContent);

console.log('Done fixing bugs');
