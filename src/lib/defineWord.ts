
export async function defineWord(word: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_WORDNIK_API_KEY;
  const apiUrl = `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=1&includeRelated=false&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error("Wordnik error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data?.[0]?.text || "No definition found.";
  } catch (err) {
    console.error("Wordnik fetch error:", err);
    return null;
  }
}
