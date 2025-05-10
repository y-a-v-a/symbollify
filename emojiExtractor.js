/**
 * Emoji Extractor Utility
 * 
 * This script provides functions to extract all emoji characters from Unicode
 * and compare them with the current emoji dictionary.
 */

/**
 * Extract all emoji from Unicode character planes
 * 
 * @returns {Array} Array of all emoji characters
 */
function getAllEmoji() {
  const emojiArray = [];
  
  // Primary emoji Unicode blocks
  const emojiRanges = [
    // Emoticons (smileys, people, etc.)
    [0x1F600, 0x1F64F],
    
    // Miscellaneous Symbols and Pictographs (food, plants, etc.)
    [0x1F300, 0x1F5FF],
    
    // Transport and Map Symbols
    [0x1F680, 0x1F6FF],
    
    // Supplemental Symbols and Pictographs
    [0x1F900, 0x1F9FF],
    
    // Symbols and Pictographs Extended-A
    [0x1FA70, 0x1FAFF],
    
    // Basic symbols often used as emoji
    [0x2600, 0x26FF],   // Miscellaneous Symbols
    [0x2700, 0x27BF],   // Dingbats
    
    // Additional blocks with some emoji-like characters
    [0x2B00, 0x2BFF],   // Miscellaneous Symbols and Arrows
    [0x3000, 0x303F],   // CJK Symbols and Punctuation
    [0xFE00, 0xFE0F],   // Variation Selectors
  ];
  
  // Process each code point in the ranges
  for (const [start, end] of emojiRanges) {
    for (let codePoint = start; codePoint <= end; codePoint++) {
      try {
        const emoji = String.fromCodePoint(codePoint);
        emojiArray.push(emoji);
      } catch (error) {
        console.error(`Error at code point U+${codePoint.toString(16).toUpperCase()}: ${error.message}`);
      }
    }
  }
  
  return emojiArray;
}

/**
 * Get emoji from our dictionary
 * 
 * @returns {Array} Array of emoji from dictionary
 */
function getDictionaryEmoji() {
  try {
    // Import the emoji dictionary
    const emojiDictionary = require('./emojiDictionary').default;
    return Object.keys(emojiDictionary);
  } catch (error) {
    console.error('Failed to load emoji dictionary:', error.message);
    return [];
  }
}

/**
 * Find emoji that exist in Unicode but aren't in our dictionary
 * 
 * @returns {Array} Array of missing emoji
 */
function findMissingEmoji() {
  const allEmoji = getAllEmoji();
  const dictionaryEmoji = getDictionaryEmoji();
  
  return allEmoji.filter(emoji => !dictionaryEmoji.includes(emoji));
}

/**
 * Find the most common emoji by category
 * 
 * @returns {Object} Object with categories and their emoji
 */
function getEmojiByCategory() {
  // Categories mapping (simplified)
  const categories = {
    'Smileys & Emotion': [0x1F600, 0x1F64F],
    'People & Body': [0x1F90C, 0x1F9FF],
    'Animals & Nature': [0x1F400, 0x1F43F, 0x1F980, 0x1F9AF],
    'Food & Drink': [0x1F32D, 0x1F37F, 0x1F95F, 0x1F9AA],
    'Travel & Places': [0x1F30D, 0x1F320, 0x1F680, 0x1F6FF],
    'Activities': [0x1F380, 0x1F3FF, 0x1F93C, 0x1F93F],
    'Objects': [0x1F4A0, 0x1F4FF, 0x1F950, 0x1F95E],
    'Symbols': [0x1F300, 0x1F5FF, 0x1F500, 0x1F53D],
  };
  
  const result = {};
  const allEmoji = getAllEmoji();
  
  // Simple categorization
  for (const [category, ranges] of Object.entries(categories)) {
    result[category] = [];
    
    // Check each emoji against the ranges for this category
    for (const emoji of allEmoji) {
      const codePoint = emoji.codePointAt(0);
      
      // Check if the emoji falls within any range for this category
      for (let i = 0; i < ranges.length; i += 2) {
        if (codePoint >= ranges[i] && codePoint <= ranges[i+1]) {
          result[category].push(emoji);
          break;
        }
      }
    }
  }
  
  return result;
}

// Main function to run the emoji extractor
function main() {
  console.log("==== Emoji Extractor ====");
  
  const allEmoji = getAllEmoji();
  console.log(`Total emoji found in Unicode: ${allEmoji.length}`);
  
  const dictionaryEmoji = getDictionaryEmoji();
  console.log(`Emoji in current dictionary: ${dictionaryEmoji.length}`);
  
  const missingEmoji = findMissingEmoji();
  console.log(`Missing emoji (not in dictionary): ${missingEmoji.length}`);
  
  // Sample of missing emoji
  console.log("\nSample of missing emoji (first 20):");
  console.log(missingEmoji.slice(0, 20).join(' '));
  
  // Category breakdown
  console.log("\nEmoji by category:");
  const categorized = getEmojiByCategory();
  for (const [category, emoji] of Object.entries(categorized)) {
    console.log(`${category}: ${emoji.length} emoji`);
  }
}

// Export functions for module usage
module.exports = {
  getAllEmoji,
  getDictionaryEmoji,
  findMissingEmoji,
  getEmojiByCategory,
  main
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}