#!/usr/bin/env node
/**
 * process-images.js
 * Normalises source image filenames.
 */
(function (_, fs, fse) {
    'use strict';
    var processImages;

    // Generate "products.csv" based on the source data.
    processImages = function (sourcePath, targetPath) {
        console.log('Processing images with sourcePath="%s", targetPath="%s"', sourcePath, targetPath);
        fs.readdir(sourcePath, function (err, sourceImages) {
            var copyNextImage;
            if (err) {
                console.error('Could not read images path "%s", please check the path exists and try again', sourcePath);
                return;
            }
            copyNextImage = function () {
                var sourceImage;
                if (sourceImages.length === 0) {
                    return;
                }
                sourceImage = sourceImages.pop();
                fse.copySync(sourcePath + '/' + sourceImage, targetPath + '/' + sourceImage.replace(/[^-\w.\/]+/g, '_'));
                copyNextImage();
            };
            copyNextImage();
        });
    };

    // Bootstrap for command-line usage.
    if (require.main === module) {
        if (process.argv.length < 4) {
            console.error('Insufficient arguments provided. Usage: %s %s [source-images-path] [target-images-path]', process.argv[0], process.argv[1]);
            return process.exit(1);
        }
        processImages(process.argv[2], process.argv[3]);
    }

    // Export function.
    module.exports = processImages;
}(require('lodash'), require('fs'), require('fs-extra')));
