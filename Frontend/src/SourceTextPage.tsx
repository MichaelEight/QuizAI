export default function SourceTextPage({sourceText, setSourceText}){
    // set value of textarea to sourceText
    // on change modify sourceText using setSourceText
    
    return(
        <>
            <h1>Input source text</h1>
            <textarea rows={5} cols={40}></textarea>
        </>
    )
}