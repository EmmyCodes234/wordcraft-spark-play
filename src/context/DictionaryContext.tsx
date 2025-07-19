import { createContext } from "react";

const DictionaryContext = createContext<Set<string> | null>(null);

export default DictionaryContext;
