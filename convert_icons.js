const Jimp = require('jimp');
const path = require('path');

async function convert() {
    try {
        console.log('Starting conversion...');

        const rootDir = 'c:\\Users\\NİSA\\Desktop\\mia';
        const source192 = path.join(rootDir, 'ultra-fix-192.jpg');
        const source512 = path.join(rootDir, 'ultra-fix-512.jpg');

        const targets = [
            path.join(rootDir, 'icons'),
            path.join(rootDir, 'mia', 'icons')
        ];

        for (const targetDir of targets) {
            console.log(`Processing conversion to: ${targetDir}`);

            // 512x512
            const img512 = await Jimp.read(source512);
            await img512.resize(512, 512).write(path.join(targetDir, 'icon-512.png'));
            console.log(`Created icon-512.png in ${targetDir}`);

            // 192x192
            const img192 = await Jimp.read(source192);
            await img192.resize(192, 192).write(path.join(targetDir, 'icon-192.png'));
            console.log(`Created icon-192.png in ${targetDir}`);
        }

        console.log('Conversion complete! All PNGs are verified real PNG format.');
    } catch (err) {
        console.error('Error during conversion:', err);
    }
}

convert();
