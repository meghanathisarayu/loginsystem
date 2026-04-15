import fs from 'fs';

// Create SVG icons
function createIconSVG(width, height, color, text) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${color}" rx="${width * 0.1}"/>
        <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="${width * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
}

// Create screenshots
const wideScreenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#f3f4f6"/>
    <rect x="440" y="210" width="400" height="300" rx="20" fill="#374151"/>
    <text x="640" y="100" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#374151" text-anchor="middle">My App</text>
    <text x="640" y="150" font-family="Arial, sans-serif" font-size="20" fill="#6b7280" text-anchor="middle">Login Screen</text>
</svg>`;

const narrowScreenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">
    <rect width="750" height="1334" fill="#f3f4f6"/>
    <rect x="75" y="467" width="600" height="400" rx="20" fill="#374151"/>
    <text x="375" y="200" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="#374151" text-anchor="middle">My App</text>
    <text x="375" y="280" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">Mobile Login</text>
</svg>`;

// Create icons
fs.writeFileSync('icon-192x192.svg', createIconSVG(192, 192, '#374151', 'A'));
fs.writeFileSync('icon-512x512.svg', createIconSVG(512, 512, '#374151', 'A'));
fs.writeFileSync('screenshot-wide.svg', wideScreenshot);
fs.writeFileSync('screenshot-narrow.svg', narrowScreenshot);

console.log('✅ SVG files created successfully!');
console.log('');
console.log('Files created:');
console.log('  - icon-192x192.svg');
console.log('  - icon-512x512.svg');
console.log('  - screenshot-wide.svg');
console.log('  - screenshot-narrow.svg');
console.log('');
console.log('Note: Chrome supports SVG icons in manifest. If PNG needed, use:');
console.log('  https://cloudconvert.com/svg-to-png');
