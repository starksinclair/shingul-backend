import json
import sys
from typing import Any
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def parse_pdf(pdf_path: str) -> list[dict[str, Any]]:
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=750,
        chunk_overlap=0,
        add_start_index=True,
    )

    chunks = splitter.split_documents(docs)

    # Keep only what you need (page_content + metadata)
    out = []
    for c in chunks:
        out.append({
            "text": c.page_content,
            "metadata": c.metadata,
        })
    return out

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing pdf path"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    result = parse_pdf(pdf_path)
    print(json.dumps({"chunks": result}))
