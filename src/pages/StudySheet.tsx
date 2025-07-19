import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

export default function StudySheet() {
  const location = useLocation();
  const words = location.state?.words || [];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("WordSmith Study Sheet", 20, 20);

    doc.setFontSize(12);
    words.forEach((w: string, i: number) => {
      doc.text(`${i + 1}. ${w}`, 20, 40 + i * 10);
    });

    doc.save("study-sheet.pdf");
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">📝 Study Sheet</h1>
      <p className="mb-4">Your selected words, beautifully formatted for printing or PDF export.</p>

      <div className="bg-muted/30 p-6 rounded-lg shadow-card mb-6">
        {words.length ? (
          <ul className="space-y-2 text-left">
            {words.map((w: string, i: number) => (
              <li key={i} className="border-b py-1">{i + 1}. {w}</li>
            ))}
          </ul>
        ) : (
          <p>No words found.</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => window.print()}>🖨️ Print</Button>
        <Button onClick={exportPDF}>📄 Download PDF</Button>
      </div>
    </div>
  );
}
