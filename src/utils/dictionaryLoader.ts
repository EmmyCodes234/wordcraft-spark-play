export async function loadCSWDictionary(): Promise<Set<string>> {
  const response = await fetch('/dictionaries/CSW24.txt');
  const text = await response.text();

  // Split by line, remove extra spaces, and uppercase
  const words = text.split('\n').map(word => word.trim().toUpperCase()).filter(Boolean);

  // Create a Set for fast lookup
  const wordSet = new Set(words);

  return wordSet;
}
