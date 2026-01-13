const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function updateLogos() {
    try {
        console.log('Starting logo update...');

        // Source image (The new generated clean logo)
        // Note: I need to copy the artifact to a local path first or reference it if I can.
        // Since I can't directly read the artifact path in this environment usually without it being in the workspace, 
        // I will assume I need to handle the file copy first or if the tool allows direct access.
        // Wait, the previous turn `generate_image` saved it to a path that might be accessible if I use absolute path.
        // Let's try reading from the absolute path provided in the previous turn.
        const sourcePath = 'C:/Users/NİSA/.gemini/antigravity/brain/9d7e5d13-2579-4d19-ab3b-e14c96396f1d/mia_logo_clean_1767884383415.png';

        if (!fs.existsSync(sourcePath)) {
            console.error('Source image not found at:', sourcePath);
            // Fallback: If for some reason the artifact path isn't readable, I'll have to ask the user or fail gracefully.
            // But let's assume it works for this agent environment.
            return;
        }

        const img = await Jimp.read(sourcePath);
        const rootDir = 'c:\\Users\\NİSA\\Desktop\\mia';

        // Define targets
        const targets = [
            // Splash screen icon
            { path: path.join(rootDir, 'final-icon-192.png'), w: 192, h: 192 },
            { path: path.join(rootDir, 'mia', 'final-icon-192.png'), w: 192, h: 192 },

            // Manifest icons (root)
            { path: path.join(rootDir, 'icons', 'icon-512.png'), w: 512, h: 512 },
            { path: path.join(rootDir, 'icons', 'icon-256.png'), w: 256, h: 256 },
            { path: path.join(rootDir, 'icons', 'icon-192.png'), w: 192, h: 192 },

            // Manifest icons (subfolder)
            { path: path.join(rootDir, 'mia', 'icons', 'icon-512.png'), w: 512, h: 512 },
            { path: path.join(rootDir, 'mia', 'icons', 'icon-192.png'), w: 192, h: 192 }
        ];

        for (const t of targets) {
            // Clone to avoid resizing the same object multiple times destructively if order matters
            // (resize modifies the object)
            await img.clone().resize(t.w, t.h).writeAsync(t.path);
            console.log(`Updated: ${t.path}`);
        }

        console.log('All logos updated successfully!');

    } catch (err) {
        console.error('Error updating logos:', err);
    }
}

updateLogos();
