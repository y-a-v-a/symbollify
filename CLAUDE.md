# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Emojifier - Text to Emoji Transformer

### Project Structure
- `index.html` - Main HTML interface
- `script.js` - Core transformation logic and emoji dictionary
- `styles.css` - Responsive styling

### Development
- No build process required - pure HTML/CSS/JS
- Open `index.html` in a browser to test changes

### Code Style Guidelines
- Use 2-space indentation for all files
- Prefer single quotes for JavaScript strings
- Use camelCase for variable and function names
- Document functions with clear comments
- Keep code clean and modular with clear function responsibilities
- Add error handling for corner cases
- Follow existing naming conventions in the codebase
- For CSS, group related properties and use a consistent order (positioning, box model, typography, visual)

### Emoji Dictionary
When extending the emoji dictionary in `script.js`, follow these conventions:
- Group entries by category with comments (e.g., // Emotions, // Food)
- Use lowercase keys without spaces
- Keep emojis semantically accurate
- `'😃': ['smile', 'grin', 'smiling', 'beaming'],` each entry in the dictionary is an object key with an array of words that apply to the emoji.