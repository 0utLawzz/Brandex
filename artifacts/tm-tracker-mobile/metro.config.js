const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable CSS transformation to avoid lightningcss native module issues
config.transformer.css = false;

module.exports = config;
