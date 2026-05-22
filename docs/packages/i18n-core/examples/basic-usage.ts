/**
 * @fileoverview Basic usage example for @yyc3/i18n-core
 * @description This example demonstrates the main features of the i18n core package
 */

// For development/testing, import from source
// In production, use: import { i18n, t, I18nEngine, createConsoleLogger, MissingKeyReporter } from '@yyc3/i18n-core';
import { i18n, t, I18nEngine, createConsoleLogger, MissingKeyReporter } from '../src/index.js';

// Example 1: Basic translation
async function basicExample() {
    console.log('=== Example 1: Basic Translation ===\n');

    console.log('Current locale:', i18n.getLocale());
    console.log('Translation:', t('welcome.message', { name: 'World' }));

    await i18n.setLocale('zh-CN');
    console.log('Switched to:', i18n.getLocale());
    console.log('Translation:', t('welcome.message', { name: '世界' }));
}

// Example 2: Custom engine instance
function customEngineExample() {
    console.log('\n=== Example 2: Custom Engine Instance ===\n');

    const myEngine = new I18nEngine({
        locale: 'en',
        debug: true,
        cache: {
            enabled: true,
            maxSize: 500,
            ttl: 5 * 60 * 1000 // 5 minutes
        }
    });

    console.log('Custom engine created with debug mode');
    console.log('Stats:', myEngine.getStats());
}

// Example 3: Plugin usage
function pluginExample() {
    console.log('\n=== Example 3: Plugin System ===\n');

    // Add console logger for development
    const logger = createConsoleLogger({
        logMissingKeys: true,
        logLocaleChanges: true
    });
    i18n.plugins.register(logger);

    // Add missing key reporter for production
    const reporter = new MissingKeyReporter({
        autoExport: false,
        maxEntries: 100
    });
    i18n.plugins.register(reporter.createPlugin());

    console.log('Registered plugins:', i18n.plugins.getRegisteredPlugins());
}

// Example 4: Batch translation and namespace
async function advancedExample() {
    console.log('\n=== Example 4: Batch Translation & Namespace ===\n');

    // Batch translate multiple keys
    const labels = i18n.batchTranslate([
        'common.save',
        'common.cancel',
        'nav.home',
        'nav.about'
    ]);
    console.log('Batch translations:', labels);

    // Create namespace for form validations
    const formI18n = i18n.createNamespace('form.validation');
    console.log('Namespace translation:', formI18n.t('required'));
}

// Run all examples
async function main() {
    try {
        await basicExample();
        customEngineExample();
        pluginExample();
        await advancedExample();

        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
        process.exit(1);
    }
}

main();
