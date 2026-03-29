const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = config;

config.resolver.sourceExts = [...sourceExts, "mjs"]; // Adaugă suport pentru .mjs

module.exports = config;
