#!/usr/bin/env node

/**
 * Emoji Word Generator
 *
 * This script:
 * 1. Takes a slice of 4 emoji from allEmoji.json based on an offset
 * 2. Uses Claude to generate 10-20 words for each emoji
 * 3. Stores the results in a file with offset information
 * 4. Updates the offset in a state file for the next run
 *
 * Usage:
 *   node generateEmojiWords.js [offset]
 *
 * Arguments:
 *   offset - Optional starting offset (defaults to value in state file or 0)
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
  EMOJI_JSON_PATH: path.join(__dirname, 'allEmoji.json'),
  STATE_FILE_PATH: path.join(__dirname, 'emoji_generator_state.json'),
  OUTPUT_DIR: path.join(__dirname, 'generated_words'),
  BATCH_SIZE: 4,
  MIN_WORDS: 10,
  MAX_WORDS: 20,
};

/**
 * Main function
 */
async function main() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    // Check if allEmoji.json exists
    if (!fs.existsSync(CONFIG.EMOJI_JSON_PATH)) {
      console.error(`Error: ${CONFIG.EMOJI_JSON_PATH} not found. Please run index.js first.`);
      process.exit(1);
    }

    // Load emoji data
    console.log(`Loading emoji from ${CONFIG.EMOJI_JSON_PATH}...`);
    const allEmojiData = JSON.parse(fs.readFileSync(CONFIG.EMOJI_JSON_PATH, 'utf8'));

    // Determine starting offset
    let currentOffset = determineOffset();
    console.log(`Starting from offset: ${currentOffset}`);

    // Check if we've reached the end
    if (currentOffset >= allEmojiData.length) {
      console.log('All emoji have been processed. Resetting offset to 0.');
      currentOffset = 0;
      saveState(currentOffset);
    }

    // Get the current batch
    const endOffset = Math.min(currentOffset + CONFIG.BATCH_SIZE, allEmojiData.length);
    const currentBatch = allEmojiData.slice(currentOffset, endOffset);

    console.log(`Processing emoji ${currentOffset + 1} to ${endOffset} of ${allEmojiData.length}`);
    console.log(
      'Emoji in this batch:',
      currentBatch.map(item => (typeof item === 'string' ? item : item.emoji)).join(' ')
    );

    // Generate words for each emoji in the batch
    const results = {};
    for (const emojiItem of currentBatch) {
      const emoji = typeof emojiItem === 'string' ? emojiItem : emojiItem.emoji;
      console.log(`\nGenerating words for emoji: ${emoji}`);

      const words = await generateWordsForEmoji(emoji);
      results[emoji] = words;

      console.log(`Generated ${words.length} words: ${words.join(', ')}`);
    }

    // Save results
    const outputFileName = `emoji_words_${currentOffset}_${endOffset - 1}.json`;
    const outputPath = path.join(CONFIG.OUTPUT_DIR, outputFileName);

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nSaved results to ${outputPath}`);

    // Update state with new offset
    saveState(endOffset);
    console.log(`Updated state file with new offset: ${endOffset}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Determine the starting offset from command line or state file
 */
function determineOffset() {
  // Check command line argument first
  const commandLineOffset = parseInt(process.argv[2]);
  if (!isNaN(commandLineOffset) && commandLineOffset >= 0) {
    return commandLineOffset;
  }

  // Otherwise check state file
  try {
    if (fs.existsSync(CONFIG.STATE_FILE_PATH)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.STATE_FILE_PATH, 'utf8'));
      return state.currentOffset || 0;
    }
  } catch (error) {
    console.warn(`Warning: Could not read state file: ${error.message}`);
  }

  // Default to 0
  return 0;
}

/**
 * Save the current state
 */
function saveState(newOffset) {
  const state = {
    currentOffset: newOffset,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG.STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Generate words for a single emoji using Claude
 */
async function generateWordsForEmoji(emoji) {
  return new Promise((resolve, reject) => {
    // Simple validation to ensure we have an emoji
    if (!emoji || emoji.trim() === '') {
      reject(new Error('Empty emoji provided'));
      return;
    }

    // Create a single-line prompt for Claude CLI
    const prompt = `I need ${CONFIG.MIN_WORDS}-${CONFIG.MAX_WORDS} relevant words or phrases that correspond to the emoji: ${emoji}. The words should be: Common English words or phrases; A mix of nouns, verbs, adjectives, and common expressions; Relevant to what the emoji visually represents or is commonly used for; Lowercase and without punctuation; One to three words each (for phrases). Please respond in this exact format, with just a JavaScript array of strings, NOTHING ELSE: ["word1", "word2", "word3", ...]. Do not consume more context.`;

    console.log(prompt);
    try {
      // If claude-cli is available, use it
      console.log('Calling Claude to generate words...');

      // Call claude directly with no arguments
      // Claude CLI appears to read from stdin without needing a specific flag
      console.log('Using standard input method');
      const claude = spawn('claude', ['-p']);

      // Write the prompt to stdin and close it
      claude.stdin.write(prompt);
      claude.stdin.end();

      let output = '';
      let errorOutput = '';

      // Set a timeout to prevent hanging indefinitely
      const timeout = setTimeout(() => {
        console.warn('Claude request timed out after 30 seconds');
        try {
          // Attempt to kill the process gracefully
          claude.kill('SIGTERM');
          setTimeout(() => {
            // Force kill if still running after 2 seconds
            if (!claude.killed) claude.kill('SIGKILL');
          }, 2000);
        } catch (err) {
          console.warn('Error killing Claude process:', err.message);
        }

        const fallbackWords = generateFallbackWords(emoji);
        resolve(fallbackWords);
      }, 30000);

      // Handle process errors
      claude.on('error', err => {
        clearTimeout(timeout);
        console.warn(`Claude process error: ${err.message}`);
        const fallbackWords = generateFallbackWords(emoji);
        resolve(fallbackWords);
      });

      claude.stdout.on('data', data => {
        output += data.toString();
      });

      claude.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      claude.on('close', code => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.warn(`Claude CLI exited with code ${code}`);
          console.warn(`Error output: ${errorOutput}`);

          // If Claude CLI fails, fall back to mock implementation
          const fallbackWords = generateFallbackWords(emoji);
          resolve(fallbackWords);
          return;
        }

        try {
          // Extract the array from the response
          let jsonString = output.trim();

          // If the response is wrapped in backticks, extract just the JSON
          const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            jsonString = match[1].trim();
          }

          // Parse the array
          const words = JSON.parse(jsonString);

          // Validate
          if (!Array.isArray(words)) {
            throw new Error('Response is not an array');
          }

          // Ensure we have enough words
          if (words.length < CONFIG.MIN_WORDS) {
            console.warn(
              `Warning: Only got ${words.length} words, expected at least ${CONFIG.MIN_WORDS}`
            );
            // Add some fallback words if needed
            while (words.length < CONFIG.MIN_WORDS) {
              words.push(`word${words.length + 1}`);
            }
          }

          // Limit to MAX_WORDS if we got too many
          resolve(words.slice(0, CONFIG.MAX_WORDS));
        } catch (error) {
          console.warn(`Error parsing Claude response: ${error.message}`);
          console.warn(`Raw response: ${output}`);

          // Fall back to generating mock words
          const fallbackWords = generateFallbackWords(emoji);
          resolve(fallbackWords);
        }
      });
    } catch (error) {
      console.warn(`Error calling Claude: ${error.message}`);

      // Fall back to generating mock words
      const fallbackWords = generateFallbackWords(emoji);
      resolve(fallbackWords);
    }
  });
}

/**
 * Generate fallback words if Claude is not available
 */
function generateFallbackWords(emoji) {
  console.warn('Using fallback word generation');

  // Create mock words - in production, you would replace this with a real implementation
  const wordCount =
    Math.floor(Math.random() * (CONFIG.MAX_WORDS - CONFIG.MIN_WORDS + 1)) + CONFIG.MIN_WORDS;

  const mockWords = [];
  for (let i = 0; i < wordCount; i++) {
    mockWords.push(`word${i + 1}_for_${emoji.codePointAt(0).toString(16)}`);
  }

  return mockWords;
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
