/**
 * Emoji Extractor CLI
 * 
 * This script extracts all emoji from Unicode and outputs them to a JSON file.
 * Run with: node index.js
 */

const fs = require('fs');
const path = require('path');
const { getAllEmoji } = require('./emojiExtractor'); // Using the more comprehensive implementation

// Output file path
const OUTPUT_FILE = path.join(__dirname, 'allEmoji.json');

/**
 * Main function to extract emoji and save to JSON
 */
async function main() {
  try {
    console.log('Extracting emoji from Unicode planes...');
    
    // Get all emoji
    const allEmoji = getAllEmoji();
    console.log(`Found ${allEmoji.length} emoji characters`);
    
    // Create a more useful structure with code points
    const emojiData = allEmoji.map(emoji => ({
      emoji: emoji,
      codePoint: `U+${emoji.codePointAt(0).toString(16).toUpperCase()}`,
      unicodeVersion: getUnicodeVersion(emoji.codePointAt(0))
    }));
    
    // Write to JSON file
    console.log(`Writing emoji data to ${OUTPUT_FILE}...`);
    fs.writeFileSync(
      OUTPUT_FILE, 
      JSON.stringify(emojiData, null, 2), 
      'utf8'
    );
    
    console.log('Done! JSON file created successfully.');
    console.log(`Total emoji saved: ${emojiData.length}`);
    
    // Show a sample
    console.log('\nSample of emoji (first 10):');
    console.log(emojiData.slice(0, 10).map(e => `${e.emoji} (${e.codePoint})`).join(' '));
    
  } catch (error) {
    console.error('Error processing emoji:', error);
    process.exit(1);
  }
}

/**
 * Estimate Unicode version based on code point
 * This is a simplified approach - accurate version would require a mapping table
 * 
 * @param {Number} codePoint - Unicode code point
 * @returns {String} Estimated Unicode version
 */
function getUnicodeVersion(codePoint) {
  // Very simplified version estimation based on code point ranges
  if (codePoint < 0x1F300) return "1.1 - 4.0";
  if (codePoint < 0x1F600) return "6.0";
  if (codePoint < 0x1F900) return "7.0 - 8.0";
  if (codePoint < 0x1FA00) return "10.0 - 11.0";
  return "12.0+";
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});