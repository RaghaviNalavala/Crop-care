# CropKind

A responsive crop-care storefront demo with a local, Ollama-powered farm assistant. It uses Python's standard library; no package installation or third-party chat service is required.

## Run locally

1. Make sure Ollama is running and `qwen2.5:3b` is installed (`ollama list`).
2. From this folder, run:

   ```powershell
   python server.py
   ```

3. Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

The server serves the website and sends chat requests from `/api/chat` to Ollama's local API at `http://127.0.0.1:11434/api/chat`. Set `OLLAMA_MODEL`, `OLLAMA_URL`, or `PORT` in the environment to override those defaults.

## Notes

This is a front-end/catalog prototype. Product names, availability, prices, and matches are examples; the bag does not place orders or process payments. Pesticide approvals and crop uses vary by location. Always identify the problem carefully, consult qualified local guidance, and follow the exact registered product label.
