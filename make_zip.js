const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = 'd:/Sem 3/WSOA/CampusConnect';
const zipPath = 'd:/Sem 3/WSOA/Lab6_202512062.zip';
const targetDir = 'd:/Sem 3/WSOA/Lab6_202512062';

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });

fs.mkdirSync(targetDir, { recursive: true });

// Allowed top-level files & folders for Lab 6 Microservices Assignment
const allowedLab6Items = new Set([
  'user-service',
  'product-service',
  'order-service',
  'Lab6_Screenshots',
  'screenshots',
  'compose.yaml',
  'docker-compose.yml',
  'Dockerfile',
  '.dockerignore',
  '.env',
  '.env.example',
  'RESTful_Web_Services_Lab_6.postman_collection.json',
  'README.md',
  'LAB6_README.md'
]);

function copyRecursive(src, dest, isTopLevel = false) {
  const stats = fs.statSync(src);
  const baseName = path.basename(src);

  if (isTopLevel && !allowedLab6Items.has(baseName)) {
    return;
  }

  if (stats.isDirectory()) {
    if (['node_modules', '.git', '.gradle', 'build', '.idea', 'temp_lab5', 'Lab6_Staging'].includes(baseName)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file), false);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log("Copying Lab 6 microservice files...");
for (const item of fs.readdirSync(projectDir)) {
  copyRecursive(path.join(projectDir, item), path.join(targetDir, item), true);
}

console.log("Zipping into Lab6_202512062.zip...");
execSync(`powershell -Command "Add-Type -Assembly System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${targetDir}', '${zipPath}')"`);

console.log("Cleaning up target directory...");
fs.rmSync(targetDir, { recursive: true, force: true });

console.log("✅ Final clean Lab6_202512062.zip created successfully!");

