import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconsDir = './public/icons';

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG for icon
function createIconSVG(size, text) {
    const fontSize = size * 0.5;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="#374151" rx="${size * 0.1}"/>
        <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
}

// Create screenshot SVGs
function createWideScreenshot() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <rect width="1280" height="720" fill="#f3f4f6"/>
        <rect x="440" y="210" width="400" height="300" rx="20" fill="#374151"/>
        <text x="640" y="100" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#374151" text-anchor="middle">My App</text>
        <text x="640" y="150" font-family="Arial, sans-serif" font-size="20" fill="#6b7280" text-anchor="middle">Login Screen</text>
    </svg>`;
}

function createNarrowScreenshot() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">
        <rect width="750" height="1334" fill="#f3f4f6"/>
        <rect x="75" y="467" width="600" height="400" rx="20" fill="#374151"/>
        <text x="375" y="200" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="#374151" text-anchor="middle">My App</text>
        <text x="375" y="280" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">Mobile Login</text>
    </svg>`;
}

async function convertSVGtoPNG(svgString, outputPath, width, height) {
    try {
        await sharp(Buffer.from(svgString))
            .resize(width, height)
            .png()
            .toFile(outputPath);
        console.log(`✅ Created: ${outputPath}`);
    } catch (err) {
        console.error(`❌ Error creating ${outputPath}:`, err.message);
    }
}

async function main() {
    console.log('🎨 Creating PWA Icons and Screenshots...\n');

    // Create Icon 192x192
    const icon192SVG = createIconSVG(192, 'A');
    await convertSVGtoPNG(icon192SVG, path.join(iconsDir, 'icon-192x192.png'), 192, 192);

    // Create Icon 512x512
    const icon512SVG = createIconSVG(512, 'A');
    await convertSVGtoPNG(icon512SVG, path.join(iconsDir, 'icon-512x512.png'), 512, 512);

    // Create Wide Screenshot
    const wideSVG = createWideScreenshot();
    await convertSVGtoPNG(wideSVG, path.join(iconsDir, 'screenshot-wide.png'), 1280, 720);

    // Create Narrow Screenshot
    const narrowSVG = createNarrowScreenshot();
    await convertSVGtoPNG(narrowSVG, path.join(iconsDir, 'screenshot-narrow.png'), 750, 1334);

    console.log('\n✨ All files created successfully!');
}

main();
