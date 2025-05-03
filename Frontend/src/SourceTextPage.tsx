export default function SourceTextPage({ sourceText, setSourceText }) {
  return (
    <>
      <h1>Input source text</h1>
      <textarea
        rows={5}
        cols={40}
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}></textarea>
    </>
  );
}
