
import React from "react";
import { Sparkles } from "lucide-react";

export function Celebration() {
  const icon = Sparkles; // fallback icon
  return (
    <div className="mt-4 flex justify-center items-center">
      <div className="text-yellow-500 animate-bounce">
        <Sparkles size={48} />
      </div>
    </div>
  );
}
