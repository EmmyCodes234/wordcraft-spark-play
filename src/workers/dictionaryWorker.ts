// This code runs in a separate thread. `self` refers to the worker's global scope.
self.onmessage = async (event: MessageEvent) => {
    // We expect a message to tell us to 'loadDictionary'
    if (event.data === 'loadDictionary') {
        try {
            // Fetch the dictionary file. This happens in the worker thread.
            const response = await fetch("/dictionaries/CSW24.txt");
            const text = await response.text();

            // Process the text: split into words, trim, uppercase.
            // This computationally intensive part now runs off the main UI thread.
            const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());

            // Create a Set for efficient lookups.
            // We convert it to an Array before sending back, as Set objects aren't directly transferable.
            const wordSetArray = Array.from(new Set(wordsArray));

            // Send the processed data back to the main thread.
            self.postMessage({ type: 'dictionaryLoaded', wordSet: wordSetArray });
        } catch (error) {
            console.error("Failed to load CSW24 word list in worker:", error);
            // Send an error message back to the main thread.
            self.postMessage({ type: 'error', message: 'Failed to load dictionary' });
        }
    }
};