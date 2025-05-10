#!/usr/bin/env node

/**
 * Emoji Dictionary Merger
 * 
 * This script merges generated emoji word files from the 'generated_words' directory
 * into the main emojiDictionary.js file. It will add new emoji entries without
 * overwriting existing ones.
 * 
 * Usage:
 *   node mergeEmojiWords.js [--overwrite] [--category CATEGORY]
 * 
 * Options:
 *   --overwrite      Overwrite existing emoji entries if they exist (default: false)
 *   --category       Add new emoji under this category (default: "Generated Emoji")
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  DICTIONARY_PATH: path.join(__dirname, 'emojiDictionary.js'),
  GENERATED_DIR: path.join(__dirname, 'generated_words'),
  BACKUP_PATH: path.join(__dirname, 'emojiDictionary.backup.js'),
  DEFAULT_CATEGORY: 'Generated Emoji',
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    overwrite: false,
    category: CONFIG.DEFAULT_CATEGORY,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--overwrite') {
      options.overwrite = true;
    } else if (args[i] === '--category' && i + 1 < args.length) {
      options.category = args[++i];
    }
  }

  return options;
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();
    console.log('Options:', options);

    // Make sure required paths exist
    if (!fs.existsSync(CONFIG.DICTIONARY_PATH)) {
      console.error(`Error: Dictionary file not found at ${CONFIG.DICTIONARY_PATH}`);
      process.exit(1);
    }

    if (!fs.existsSync(CONFIG.GENERATED_DIR)) {
      console.error(`Error: Generated words directory not found at ${CONFIG.GENERATED_DIR}`);
      process.exit(1);
    }

    // Create a backup of the original dictionary
    fs.copyFileSync(CONFIG.DICTIONARY_PATH, CONFIG.BACKUP_PATH);
    console.log(`Created backup at ${CONFIG.BACKUP_PATH}`);

    // Read the original dictionary file
    console.log(`Reading dictionary from ${CONFIG.DICTIONARY_PATH}...`);
    const dictionaryContent = fs.readFileSync(CONFIG.DICTIONARY_PATH, 'utf8');

    // Parse the emoji dictionary
    const emojiDictionary = parseDictionary(dictionaryContent);
    console.log(`Found ${Object.keys(emojiDictionary).length} emoji in dictionary`);

    // Get all generated word files
    const generatedFiles = fs.readdirSync(CONFIG.GENERATED_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(CONFIG.GENERATED_DIR, file));

    console.log(`Found ${generatedFiles.length} generated word files`);

    let newEmojiCount = 0;
    let updatedEmojiCount = 0;
    let skippedEmojiCount = 0;

    // Process each generated file
    for (const filePath of generatedFiles) {
      console.log(`Processing ${path.basename(filePath)}...`);
      
      try {
        const generatedWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const emojiKeys = Object.keys(generatedWords);
        
        for (const emoji of emojiKeys) {
          const words = generatedWords[emoji];
          
          if (!Array.isArray(words) || words.length === 0) {
            console.warn(`Skipping emoji ${emoji}: Invalid or empty word list`);
            skippedEmojiCount++;
            continue;
          }
          
          if (emoji in emojiDictionary) {
            if (options.overwrite) {
              emojiDictionary[emoji] = words;
              updatedEmojiCount++;
              console.log(`Updated existing emoji: ${emoji} with ${words.length} words`);
            } else {
              console.log(`Skipping existing emoji: ${emoji}`);
              skippedEmojiCount++;
            }
          } else {
            emojiDictionary[emoji] = words;
            newEmojiCount++;
            console.log(`Added new emoji: ${emoji} with ${words.length} words`);
          }
        }
      } catch (error) {
        console.warn(`Error processing ${filePath}: ${error.message}`);
      }
    }

    // Generate the new dictionary content
    const newDictionaryContent = generateDictionaryContent(
      emojiDictionary, 
      dictionaryContent,
      options.category
    );

    // Write the updated dictionary
    fs.writeFileSync(CONFIG.DICTIONARY_PATH, newDictionaryContent, 'utf8');

    console.log('\nMerge Summary:');
    console.log(`  New emoji added: ${newEmojiCount}`);
    console.log(`  Existing emoji updated: ${updatedEmojiCount}`);
    console.log(`  Emoji skipped: ${skippedEmojiCount}`);
    console.log(`  Total emoji in dictionary: ${Object.keys(emojiDictionary).length}`);
    console.log(`\nUpdated dictionary saved to ${CONFIG.DICTIONARY_PATH}`);
    console.log(`Original dictionary backed up to ${CONFIG.BACKUP_PATH}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Parse the emoji dictionary from the file content
 */
function parseDictionary(fileContent) {
  // Extract just the dictionary object from the file
  const dictionaryMatch = fileContent.match(/const\s+emojiDictionary\s*=\s*{[\s\S]*?};/);
  
  if (!dictionaryMatch) {
    throw new Error('Could not find emoji dictionary object in file');
  }
  
  // Extract the dictionary content
  let dictionaryCode = dictionaryMatch[0];
  
  // Remove the const declaration part
  dictionaryCode = dictionaryCode.replace(/const\s+emojiDictionary\s*=\s*/, '');
  // Remove the trailing semicolon
  dictionaryCode = dictionaryCode.replace(/};$/, '}');

  // Parse the dictionary using a safer approach than eval
  const dictionary = {};
  
  // Use regex to extract each emoji and its array
  const emojiEntryPattern = /'([^']+)':\s*\[([\s\S]*?)(?=\],\s*'|},)/g;
  let match;
  
  while ((match = emojiEntryPattern.exec(dictionaryCode + "},")) !== null) {
    const emoji = match[1];
    const wordsStr = match[2];
    
    // Parse the words array
    const words = wordsStr
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .map(word => {
        // Extract the string content from quotes
        const wordMatch = word.match(/^'([^']*)'$/);
        return wordMatch ? wordMatch[1] : word;
      });
    
    dictionary[emoji] = words;
  }
  
  return dictionary;
}

/**
 * Generate new dictionary file content
 */
function generateDictionaryContent(dictionary, originalContent, category) {
  // Find the position to insert new emoji
  const lastIndex = originalContent.lastIndexOf('};');
  
  if (lastIndex === -1) {
    throw new Error('Could not find end of dictionary object');
  }
  
  // Split the content at the insertion point
  const beforeContent = originalContent.substring(0, lastIndex);
  const afterContent = originalContent.substring(lastIndex);
  
  // Generate the new emoji entries
  const newEmojiEntries = [];
  
  // Add category comment if needed
  newEmojiEntries.push(`\n  // ${category}`);
  
  // Add entries for new emoji
  Object.entries(dictionary).forEach(([emoji, words]) => {
    // Skip emoji already in the original content
    if (originalContent.includes(`'${emoji}': [`)) {
      return;
    }
    
    // Format the words array
    const formattedWords = words
      .map(word => `    '${word}'`)
      .join(',\n');
    
    // Add the new entry
    newEmojiEntries.push(`  '${emoji}': [\n${formattedWords}\n  ],`);
  });
  
  // Combine everything
  return beforeContent + newEmojiEntries.join('\n') + afterContent;
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});