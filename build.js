#!/usr/bin/env node

/**
 * AMEC Hymnal Build Script
 * Minifies CSS and JS for production deployment
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

// Simple minification functions (for basic use - consider using proper minifiers for production)
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around selectors
        .replace(/;}/g, '}') // Remove trailing semicolons
        .trim();
}

function minifyJS(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*([{}:;,=+\-*/&|!<>?\(\)])\s*/g, '$1') // Remove spaces around operators
        .trim();
}

console.log('🏗️  Building AMEC Hymnal for production...\n');

// Minify CSS
try {
    const cssPath = path.join(__dirname, 'style.css');
    const originalCSS = fs.readFileSync(cssPath, 'utf8');
    const minifiedCSS = minifyCSS(originalCSS);

    const savingsCSS = ((originalCSS.length - minifiedCSS.length) / originalCSS.length * 100).toFixed(1);
    console.log(`✅ CSS minified: ${originalCSS.length} → ${minifiedCSS.length} bytes (${savingsCSS}% reduction)`);

    fs.writeFileSync(path.join(__dirname, 'style.min.css'), minifiedCSS);
} catch (error) {
    console.error('❌ CSS minification failed:', error.message);
}

// Minify JS
try {
    const jsPath = path.join(__dirname, 'app.js');
    const originalJS = fs.readFileSync(jsPath, 'utf8');
    const minifiedJS = minifyJS(originalJS);

    const savingsJS = ((originalJS.length - minifiedJS.length) / originalJS.length * 100).toFixed(1);
    console.log(`✅ JS minified: ${originalJS.length} → ${minifiedJS.length} bytes (${savingsJS}% reduction)`);

    fs.writeFileSync(path.join(__dirname, 'app.min.js'), minifiedJS);
} catch (error) {
    console.error('❌ JS minification failed:', error.message);
}

// Update HTML to use minified files (optional - uncomment to enable)
/*
try {
    const htmlPath = path.join(__dirname, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    html = html.replace('style.css', 'style.min.css');
    html = html.replace('app.js', 'app.min.js');

    fs.writeFileSync(path.join(__dirname, 'index.min.html'), html);
    console.log('✅ HTML updated to use minified assets');
} catch (error) {
    console.error('❌ HTML update failed:', error.message);
}
*/

console.log('\n🎉 Build complete!');
console.log('📁 Minified files created: style.min.css, app.min.js');
console.log('💡 For production deployment, use the .min files and update your HTML references');