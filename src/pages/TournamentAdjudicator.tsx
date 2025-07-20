
import React, { useEffect, useRef, useState } from "react";

const wordSet = new Set<string>();
let wordListLoaded = false;

// Load dictionary once
async function loadDictionary() {
  if (wordListLoaded) return;
  const res = await fetch("/dictionaries/CSW24.txt");
  const text = await res.text();
  text.split("\n").forEach((word) => wordSet.add(word.trim().toUpperCase()));
  wordListLoaded = true;
}

type Stage = "start" | "judge";

export default function TournamentAdjudicator() {
  const [stage, setStage] = useState<Stage>("start");
  const [wordCount, setWordCount] = useState("");
  const [words, setWords] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDictionary();
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.close();

      if (stage === "start") {
        if (/\d/.test(e.key)) {
          setWordCount((prev) => prev + e.key);
        }
        if (e.key === "Backspace") {
          setWordCount((prev) => prev.slice(0, -1));
        }
        if (e.key === "Enter" && wordCount !== "") {
          setStage("judge");
          setWords("");
          setResult(null);
        }
      } else if (stage === "judge") {
        if (e.key === "Tab") {
          e.preventDefault();
          const inputWords = words.trim().toUpperCase().split(/\s+/);
          const allValid = inputWords.every((w) => wordSet.has(w));
          setResult(allValid ? "Yes, the play is VALID" : "No, the play is INVALID");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, wordCount, words, result]);

  return (
    <div style={{
      backgroundColor: "#f59e0b",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "black",
      fontFamily: "sans-serif",
      padding: "2rem",
      textAlign: "center"
    }}>
      {stage === "start" && (
        <>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>WELCOME TO TOURNAMENT ADJUDICATOR</h1>
          <p style={{ fontSize: "1.25rem", marginTop: "1rem" }}>How many words do you want to challenge?</p>
          <p style={{ fontSize: "6rem", marginTop: "2rem" }}>{wordCount}</p>
        </>
      )}

      {stage === "judge" && (
        <>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            1. CHALLENGER: Enter {wordCount} word{wordCount !== "1" ? "s" : ""}, separated by SPACE or ENTER.<br />
            2. OPPONENT: Press TAB to judge the play.<br />
            3. Press ESC to exit.
          </h2>
          <input
            ref={inputRef}
            style={{
              width: "80%",
              fontSize: "2rem",
              padding: "1rem",
              textAlign: "center",
              border: "2px solid black",
              borderRadius: "8px",
              backgroundColor: "white",
            }}
            value={words}
            onChange={(e) => setWords(e.target.value)}
          />
          {result && (
            <h1 style={{ fontSize: "3rem", marginTop: "2rem", color: result.includes("VALID") ? "green" : "red" }}>
              {result}
            </h1>
          )}
        </>
      )}
    </div>
  );
}
