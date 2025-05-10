#!/usr/bin/env node

/**
 * Emoji to JSON Converter
 * 
 * This script extracts all emoji from Unicode and saves them to a JSON file.
 * It includes multiple output formats and command-line options.
 * 
 * Usage:
 *   node emojiToJson.js [options]
 * 
 * Options:
 *   --output, -o    Output file name (default: allEmoji.json)
 *   --format, -f    Output format: full, simple, minimal (default: full)
 *   --compare, -c   Compare with dictionary (true/false)
 *   --help, -h      Show help
 */

const fs = require('fs');
const path = require('path');
const emojiExtractor = require('./emojiExtractor');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  output: 'allEmoji.json',
  format: 'full',
  compare: false
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  } else if (arg === '--output' || arg === '-o') {
    options.output = args[++i] || options.output;
  } else if (arg === '--format' || arg === '-f') {
    options.format = args[++i] || options.format;
    if (!['full', 'simple', 'minimal'].includes(options.format)) {
      console.error(`Invalid format: ${options.format}. Using 'full' instead.`);
      options.format = 'full';
    }
  } else if (arg === '--compare' || arg === '-c') {
    options.compare = (args[++i] || 'true') === 'true';
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Emoji to JSON Converter

Extract all emoji from Unicode planes and save them to a JSON file.

Usage:
  node emojiToJson.js [options]

Options:
  --output, -o    Output file name (default: allEmoji.json)
  --format, -f    Output format: full, simple, minimal (default: full)
  --compare, -c   Compare with dictionary (true/false)
  --help, -h      Show this help message

Examples:
  node emojiToJson.js
  node emojiToJson.js --output emoji.json --format minimal
  node emojiToJson.js -o categorized.json -f full -c true
  `);
}

/**
 * Main function to extract emoji and save to JSON
 */
async function main() {
  try {
    console.log('Extracting emoji from Unicode planes...');
    
    // Get all emoji
    const allEmoji = emojiExtractor.getAllEmoji();
    console.log(`Found ${allEmoji.length} emoji characters`);
    
    let outputData;
    
    // Format the data based on selected option
    switch (options.format) {
      case 'minimal':
        // Just an array of emoji characters
        outputData = allEmoji;
        break;
        
      case 'simple':
        // Array of objects with emoji and code point
        outputData = allEmoji.map(emoji => ({
          emoji: emoji,
          codePoint: `U+${emoji.codePointAt(0).toString(16).toUpperCase()}`
        }));
        break;
        
      case 'full':
      default:
        // Comprehensive information including categories
        const categoryMap = emojiExtractor.getEmojiByCategory();
        
        // Find category for each emoji
        outputData = allEmoji.map(emoji => {
          const category = Object.entries(categoryMap)
            .find(([_, emojiList]) => emojiList.includes(emoji))?.[0] || 'Other';
          
          return {
            emoji: emoji,
            codePoint: `U+${emoji.codePointAt(0).toString(16).toUpperCase()}`,
            category: category,
            inDictionary: false // Will be updated later if comparison is enabled
          };
        });
        
        // If comparison is enabled, check against dictionary
        if (options.compare) {
          console.log('Comparing with current emoji dictionary...');
          const dictionaryEmoji = emojiExtractor.getDictionaryEmoji();
          
          // Mark emoji that are in the dictionary
          outputData.forEach(item => {
            item.inDictionary = dictionaryEmoji.includes(item.emoji);
          });
          
          // Log statistics
          const inDictCount = outputData.filter(item => item.inDictionary).length;
          console.log(`Emoji in dictionary: ${inDictCount}`);
          console.log(`Emoji not in dictionary: ${outputData.length - inDictCount}`);
        }
        break;
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(options.output);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to JSON file
    const outputPath = path.resolve(options.output);
    console.log(`Writing emoji data to ${outputPath}...`);
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );
    
    console.log('Done! JSON file created successfully.');
    console.log(`Total emoji saved: ${outputData.length}`);
    
    // Show a sample
    if (Array.isArray(outputData) && outputData.length > 0) {
      console.log('\nSample of emoji (first 10):');
      
      if (typeof outputData[0] === 'string') {
        console.log(outputData.slice(0, 10).join(' '));
      } else {
        console.log(outputData.slice(0, 10)
          .map(e => `${e.emoji} (${e.codePoint})`)
          .join(' '));
      }
    }
    
  } catch (error) {
    console.error('Error processing emoji:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});