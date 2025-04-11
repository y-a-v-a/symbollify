document.addEventListener('DOMContentLoaded', function () {
  // Select elements
  const textInput = document.getElementById('textInput');
  const emojiOutput = document.getElementById('emojiOutput');

  // Import the emoji dictionary
  import('./emojiDictionary.js')
    .then(module => {
      const emojiDictionary = module.default;
      
      // Function to transform text to emojis
      function transformTextToEmoji(text) {
        if (!text) return '';
    
        // Split text into words
        const words = text.split(/\s+/);
    
        // Transform each word
        const transformedWords = words.map(word => {
          // Remove punctuation for matching
          const cleanWord = word.toLowerCase().replace(/[^\w\s]|_/g, '');
    
          // Check if the word is in our dictionary
          if (emojiDictionary[cleanWord]) {
            return emojiDictionary[cleanWord];
          }
    
          // If not found, return the original word
          return word;
        });
    
        // Join and return the transformed text
        return transformedWords.join(' ');
      }
    
      // Event listener for input changes
      textInput.addEventListener('input', function () {
        const inputText = textInput.value;
        const transformedText = transformTextToEmoji(inputText);
        emojiOutput.textContent = transformedText;
      });
    })
    .catch(error => {
      console.error('Error loading emoji dictionary:', error);
      emojiOutput.textContent = 'Error loading emoji dictionary. Please refresh the page.';
    });
});
