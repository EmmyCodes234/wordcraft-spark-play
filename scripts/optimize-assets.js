const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Optimizing assets...');

const distPath = path.join(__dirname, '../dist');

// Function to compress text files
function compressTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const compressed = content.replace(/\s+/g, ' ').trim();
    fs.writeFileSync(filePath, compressed);
    console.log(`✅ Compressed: ${path.basename(filePath)}`);
  } catch (error) {
    console.log(`❌ Failed to compress: ${path.basename(filePath)}`);
  }
}

// Function to optimize images
function optimizeImages() {
  try {
    // This would require additional tools like imagemin
    console.log('📸 Image optimization would run here (requires imagemin)');
  } catch (error) {
    console.log('❌ Image optimization failed');
  }
}

// Main optimization process
function optimizeAssets() {
  console.log('🚀 Starting asset optimization...');
  
  // Compress CSS files
  const cssFiles = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.css'))
    .map(file => path.join(distPath, file));
  
  cssFiles.forEach(compressTextFile);
  
  // Compress JS files (basic)
  const jsFiles = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(distPath, file));
  
  jsFiles.forEach(compressTextFile);
  
  // Optimize images
  optimizeImages();
  
  console.log('✅ Asset optimization complete!');
}

// Run optimization
optimizeAssets();
