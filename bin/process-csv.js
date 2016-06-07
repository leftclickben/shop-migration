#!/usr/bin/env node
/**
 * process-csv.js
 * Converts source database derived CSV data into CSV data compatible with the Magento2 importer.
 */
(function (_, fs, csv, slug) {
    'use strict';
    var categoryMap, processProducts;

    // Set RFC mode for slug generation.
    slug.defaults.mode = 'rfc3986';

    // Map for category values
    categoryMap = {
        'AUTOBIOGRAPHY / BIOGRAPHY': 'Default Category/Books/Biographical',
        'EXPLORATION AND TRAVEL': 'Default Category/Books/Travel',
        'GOLD': 'Default Category/Books/Gold',
        'HISTORICAL NOVEL': 'Default Category/Books/Historical Novel',
        'INDIGENOUS HISTORY   [ABORIGINES]': 'Default Category/Books/Indigenous History',
        'INDIGENOUS HISTORY (Aborigines)': 'Default Category/Books/Indigenous History',
        'LOCAL AND REGIONAL HISTORY': 'Default Category/Books/Local History',
        'MARITIME HISTORY': 'Default Category/Books/Maritime',
        'MILITARY': 'Default Category/Books/Military',
        'RAILWAYS AND TRANSPORT': 'Default Category/Books/Railways & Transport',
        'SOCIAL HISTORY': 'Default Category/Books/Social History',
        'STATEWIDE': 'Default Category/Books/State History',
        'STUDIES IN WESTERN AUSTRALIAN HISTORY': 'Default Category/Books/State History',
        'WA HISTORY - STATEWIDE': 'Default Category/Books/State History',
        'YOUTH AND CHILDREN': 'Default Category/Books/Youth & Children'
    };

    // Generate "products.csv" based on the source data.
    processProducts = function (workPath, targetPath) {
        console.log('Processing CSV data with workPath="%s", targetPath="%s"', workPath, targetPath);
        fs.readdir(targetPath + '/images', function (err, imageFilenames) {
            if (err) {
                console.error('Could not read images path "%s", please check the path exists and try again', targetPath + '/images');
                return;
            }
            fs.createReadStream(workPath + '/Books.csv')
                .pipe(csv.parse({ columns: true }))
                .pipe(csv.transform(function (record) {
                    var title, imageFilename;

                    if (!record.RRP) {
                        return undefined;
                    }

                    title = record.Title.trim()
                        .replace(/\s*[-(]\s*out\s+of\s+(?:stock|print|order).*$/i, '')
                        .replace(/\s*[-(]\s*special\s+orders?\s+only.*$/i, '');

                    imageFilename = _.find(imageFilenames, (filename) => filename.match(new RegExp('^' + record.BookCode + '_')));

                    return {
                        sku: 'BOOK-' + record.BookCode,
                        store_view_code: '',
                        attribute_set_code: 'Default',
                        product_type: 'simple',
                        categories: categoryMap[record.Category.trim()] || 'Default Category/Books/Other',
                        product_websites: 'base',
                        name: title,
                        description: record.Description,
                        short_description: '',
                        weight: 1,
                        product_online: 1,
                        tax_class_name: 'Taxable Goods',
                        visibility: 'Catalog, Search',
                        price: record.RRP,
                        special_price: '',
                        special_price_from_date: '',
                        special_price_to_date: '',
                        url_key: slug(title) + '-' + record.BookCode,
                        meta_title: title,
                        meta_keywords: [ 'Western Australia', 'History', record.Category.toLowerCase() ].join(', '), // TODO Others? Author?
                        meta_description: record.Description,
                        base_image: imageFilename,
                        base_image_label: imageFilename ? 'Cover of ' + title : '',
                        small_image: imageFilename,
                        small_image_label: imageFilename ? 'Cover of ' + title : '',
                        thumbnail_image: imageFilename,
                        thumbnail_image_label: imageFilename ? 'Cover of ' + title : '',
                        created_at: (new Date(Math.min(
                            record.FirstOrderDate ? Date.parse(record.FirstOrderDate) : Date.now(),
                            record.LastSaleDate ? Date.parse(record.LastSaleDate) : Date.now(),
                            record.LastUpdate ? Date.parse(record.LastUpdate) : Date.now(),
                            record.StocktakeDate ? Date.parse(record.StocktakeDate) : Date.now()
                        ))).toISOString(),
                        updated_at: record.LastUpdate ? (new Date(record.LastUpdate)).toISOString() : Date.now(),
                        new_from_date: '',
                        new_to_date: '',
                        display_product_options_in: 'Block after Info Column',
                        map_price: '',
                        msrp_price: record.RRP,
                        map_enabled: '',
                        gift_message_available: '',
                        custom_design: '',
                        custom_design_from: '',
                        custom_design_to: '',
                        custom_layout_update: '',
                        page_layout: '',
                        product_options_container: '',
                        msrp_display_actual_price_type: 'Use config',
                        // TODO Can we assume this? Or should it be blank?
                        country_of_manufacture: 'Australia',
                        // TODO Derive correct value for `quantity_and_stock_status`
                        additional_attributes: [ 'has_options=0', 'is_returnable=Use config', 'quantity_and_stock_status=In stock', 'required_options=0' ].join(','),
                        // TODO Do negative numbers in `NoInStock` mean something in particular?
                        qty: Math.max(0, record.NoInStock),
                        out_of_stock_qty: 0,
                        use_config_min_qty: 1,
                        is_qty_decimal: 0,
                        // TODO Determine a better value for this?
                        allow_backorders: 0,
                        use_config_backorders: 1,
                        min_cart_qty: 1,
                        use_config_min_sale_qty: 1,
                        max_cart_qty: 0,
                        use_config_max_sale_qty: 1,
                        is_in_stock: Math.min(1, record.NoInStock),
                        notify_on_stock_below: '',
                        use_config_notify_stock_qty: 1,
                        // TODO Find out what this does
                        manage_stock: 1,
                        use_config_manage_stock: 1,
                        qty_increments: 0,
                        use_config_qty_increments: 1,
                        enable_qty_increments: 0,
                        use_config_enable_qty_inc: 1,
                        // TODO Find out what this does
                        is_decimal_divided: 0,
                        website_id: 1,
                        deferred_stock_update: 0,
                        use_config_deferred_stock_update: 1,
                        // TODO Can we determine related / cross-sell / up-sell products? e.g. By common Author, or subject?
                        related_skus: '',
                        crosssell_skus: '',
                        upsell_skus: '',
                        additional_images: '',
                        additional_image_labels: '',
                        hide_from_product_page: '',
                        // TODO Custom options?
                        custom_options: ''
                    };
                }))
                .on('error', console.error)
                .pipe(csv.stringify({ header: true }))
                .pipe(fs.createWriteStream(targetPath + '/products.csv'));
        });
    };

    // Bootstrap for command-line usage.
    if (require.main === module) {
        if (process.argv.length < 4) {
            console.error('Insufficient arguments provided. Usage: %s %s [work-path] [target-path]', process.argv[0], process.argv[1]);
            return process.exit(1);
        }
        processProducts(process.argv[2], process.argv[3]);
    }

    // Export function.
    module.exports = processProducts;
}(require('lodash'), require('fs'), require('csv'), require('slug')));
