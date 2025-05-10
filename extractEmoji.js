/**
 * Extract all emoji from Unicode character planes
 * 
 * This function extracts all Unicode emoji characters from their 
 * designated planes in the UTF-16 encoding space.
 * 
 * @returns {Array} Array of all emoji characters
 */
function extractAllEmoji() {
  const emojiArray = [];
  
  // Unicode ranges containing emoji
  const emojiRanges = [
    // Basic emoji
    [0x1F600, 0x1F64F], // Emoticons
    [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
    [0x1F680, 0x1F6FF], // Transport and Map
    [0x1F700, 0x1F77F], // Alchemical Symbols
    [0x1F780, 0x1F7FF], // Geometric Shapes
    [0x1F800, 0x1F8FF], // Supplemental Arrows-C
    [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
    [0x1FA00, 0x1FA6F], // Chess Symbols
    [0x1FA70, 0x1FAFF], // Symbols and Pictographs Extended-A
    
    // Additional emoji-related ranges
    [0x2600, 0x26FF],   // Misc symbols
    [0x2700, 0x27BF],   // Dingbats
    [0x2B00, 0x2BFF],   // Misc symbols and arrows
    [0x3000, 0x303F],   // CJK Symbols and Punctuation
    [0xFE00, 0xFE0F],   // Variation Selectors
  ];
  
  // Loop through all ranges
  for (const [start, end] of emojiRanges) {
    for (let codePoint = start; codePoint <= end; codePoint++) {
      try {
        // Convert code point to UTF-16 and then to a character
        const emoji = String.fromCodePoint(codePoint);
        
        // Basic check to ensure it's an emoji-like character
        // This is a simple heuristic - not all characters in these ranges are emoji
        const isLikelyEmoji = emoji.length > 0 && 
          !(/[\p{L}\p{N}\p{P}\p{Z}]/u.test(emoji)) && 
          emoji.trim() !== '';
        
        if (isLikelyEmoji) {
          emojiArray.push(emoji);
        }
      } catch (error) {
        console.error(`Error processing code point ${codePoint.toString(16)}: ${error.message}`);
      }
    }
  }
  
  // Filter out duplicate emoji
  const uniqueEmoji = [...new Set(emojiArray)];
  
  return uniqueEmoji;
}

/**
 * Get the current emoji supported in this project
 * 
 * This function extracts all emoji keys from the emoji dictionary
 * 
 * @returns {Array} Array of all emoji characters from the dictionary
 */
function getCurrentEmoji() {
  try {
    // Dynamic import to get the emoji dictionary
    const emojiDictionary = require('./emojiDictionary').default;
    
    // Extract keys (emoji) from the dictionary
    return Object.keys(emojiDictionary);
  } catch (error) {
    console.error('Error loading emoji dictionary:', error.message);
    return [];
  }
}

/**
 * Get emoji that are supported by Unicode but not in our dictionary
 * 
 * @returns {Array} Array of emoji not currently in the dictionary
 */
function getMissingEmoji() {
  const allEmoji = extractAllEmoji();
  const currentEmoji = getCurrentEmoji();
  
  return allEmoji.filter(emoji => !currentEmoji.includes(emoji));
}

module.exports = {
  extractAllEmoji,
  getCurrentEmoji,
  getMissingEmoji
};

// Example usage:
// const { extractAllEmoji, getCurrentEmoji, getMissingEmoji } = require('./extractEmoji');
// 
// console.log('All emoji count:', extractAllEmoji().length);
// console.log('Current emoji count:', getCurrentEmoji().length);
// console.log('Missing emoji count:', getMissingEmoji().length);