import { useState } from "react";
import SourceTextPage from "./SourceTextPage";

function App() {
  const [sourceText, setSourceText] = useState("");

  return (
    <>
      <SourceTextPage sourceText={sourceText} setSourceText={setSourceText}/>
      <p>Settings</p>
      <p>Quiz page</p>
    </>
  )
}

export default App;
