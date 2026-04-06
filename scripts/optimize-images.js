#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const WIDTHS = [400, 800, 1200, 1600];
const SOURCE_FOLDERS = [
    'assets/img/basements',
    'assets/img/additions',
    'assets/img/bathrooms',
    'assets/img/homes',
    'assets/img/kitchens',
    'assets/img/elias'
];
const OUTPUT_FOLDER = 'assets/img/optimized';

// Create output folder if it doesn't exist
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
    console.log(`✓ Created output folder: ${OUTPUT_FOLDER}`);
}

let totalProcessed = 0;
let totalError = 0;

// Process each source folder
const processFolder = async (folderPath) => {
    try {
        if (!fs.existsSync(folderPath)) {
            console.warn(`⚠ Folder not found: ${folderPath}`);
            return;
        }

        // Extract category name (basements, additions, etc.)
        const categoryName = path.basename(folderPath);
        const categoryOutputFolder = path.join(OUTPUT_FOLDER, categoryName);

        // Create category subfolder
        if (!fs.existsSync(categoryOutputFolder)) {
            fs.mkdirSync(categoryOutputFolder, { recursive: true });
        }

        const files = fs.readdirSync(folderPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        if (imageFiles.length === 0) {
            console.log(`ℹ No images found in: ${folderPath}`);
            return;
        }

        console.log(`\nProcessing ${imageFiles.length} images in ${folderPath}...`);

        for (const file of imageFiles) {
            const inputPath = path.join(folderPath, file);
            const nameWithoutExt = path.parse(file).name;

            try {
                for (const width of WIDTHS) {
                    const outputFileName = `${nameWithoutExt}-${width}w.webp`;
                    const outputPath = path.join(categoryOutputFolder, outputFileName);

                    await sharp(inputPath)
                        .resize(width, null, {
                            fit: 'inside'
                        })
                        .webp({ quality: 80 })
                        .toFile(outputPath);

                    console.log(`  ✓ Created: ${categoryName}/${outputFileName}`);
                }

                totalProcessed++;
            } catch (error) {
                console.error(`  ✗ Error processing ${file}: ${error.message}`);
                totalError++;
            }
        }
    } catch (error) {
        console.error(`Error reading folder ${folderPath}: ${error.message}`);
    }
};

// Main execution
const main = async () => {
    console.log('🖼  Image Optimization Script');
    console.log('=============================');
    console.log(`Target widths: ${WIDTHS.join('px, ')}px`);
    console.log(`Output format: WebP (quality: 80)`);
    console.log(`Output folder: ${OUTPUT_FOLDER}\n`);

    for (const folder of SOURCE_FOLDERS) {
        await processFolder(folder);
    }

    console.log('\n=============================');
    console.log(`✓ Completed: ${totalProcessed} images processed`);
    if (totalError > 0) {
        console.log(`✗ Errors: ${totalError} images failed`);
    }
    console.log('=============================\n');
};

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
