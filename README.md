# Emojifier - Emoji Dictionary Generator

This project provides tools for building a comprehensive emoji dictionary.

## Components

- `emojiDictionary.js` - Main dictionary mapping emoji to words
- `index.js` - Extracts all emoji from Unicode and saves to JSON
- `emojiExtractor.js` - Core utility for extracting emoji from Unicode planes
- `extractEmoji.js` - Alternative emoji extraction implementation
- `emojiToJson.js` - Advanced CLI tool for emoji extraction with various options
- `generateEmojiWords.js` - Uses Claude AI to generate words for emoji in batches
- `mergeEmojiWords.js` - Merges generated emoji words into the main dictionary

## Quick Start

All tools are available as npm scripts:

```bash
# Complete workflow: extract emoji, generate words, and merge into dictionary
npm run workflow:full

# Extract emoji with custom options
npm run extract:minimal
npm run extract:compare

# Generate words for emoji
npm run generate

# Merge generated words into dictionary
npm run merge
npm run merge:overwrite
```

## Generate All Emoji

Extract all emoji from Unicode and save to JSON:

```bash
npm run extract
# or
node index.js
```

This creates `allEmoji.json` with all emoji characters, code points, and estimated Unicode versions.

## Generate Words for Emoji

The `generateEmojiWords.js` script processes emoji in batches of 4, asking Claude AI to generate 10-20 relevant words for each emoji:

```bash
# Start from the beginning (or where the state file indicates)
npm run generate
# or with a specific offset
npm run generate:offset 20
```

### How the Word Generator Works

1. Reads emoji from `allEmoji.json` in batches of 4
2. Uses Claude AI to generate 10-20 descriptive words for each emoji
3. Saves results in `generated_words/emoji_words_START_END.json` files
4. Maintains a state file to track progress between runs

The state is saved in `emoji_generator_state.json` after each batch.

## Merge Generated Words into Dictionary

After generating words, merge them into the main dictionary:

```bash
# Add new emoji without overwriting existing ones
npm run merge

# Overwrite existing emoji entries
npm run merge:overwrite

# Add under a specific category
npm run merge:category "Food & Drink"
```

## Advanced Emoji Extraction

For more control over emoji extraction, use the `emojiToJson.js` script:

```bash
# Basic usage
npm run extract:advanced

# Custom output file with minimal format
node emojiToJson.js --output emoji.json --format minimal

# Compare with dictionary
npm run extract:compare

# Get help
node emojiToJson.js --help
```

## Complete Workflows

These scripts run the entire process from start to finish:

```bash
# Extract all emoji, generate words, and merge (preserving existing entries)
npm run workflow:full

# Extract, generate, and merge (overwriting existing entries)
npm run workflow:overwrite
```

## Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run extract` | Extract all emoji from Unicode planes |
| `npm run extract:advanced` | Advanced extraction with more options |
| `npm run extract:minimal` | Extract emoji in minimal format |
| `npm run extract:compare` | Compare extracted emoji with dictionary |
| `npm run generate` | Generate words for emoji batches |
| `npm run generate:offset [n]` | Generate words starting from offset n |
| `npm run merge` | Merge generated words into dictionary |
| `npm run merge:overwrite` | Merge words, overwriting existing entries |
| `npm run merge:category [name]` | Merge words under specific category |
| `npm run workflow:full` | Run the complete workflow |
| `npm run workflow:overwrite` | Run workflow with overwrite option |

## Requirements

- Node.js 12.0 or higher
- Claude CLI (optional, for AI-generated words)