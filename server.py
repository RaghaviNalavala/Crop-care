"""Serve the CropKind demo and proxy chat requests to the local Ollama model."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")
SYSTEM_PROMPT = """You are CropKind's careful, friendly crop-care information assistant.
Help growers reason about possible crop problems and explain pesticide categories in plain language. Ask what crop is affected, where it is growing, and what symptoms the grower sees when important context is missing. Clearly distinguish an observed symptom from a confirmed diagnosis; do not claim certainty from text alone.
Never invent product approvals, registrations, efficacy, application rates, mixing instructions, harvest intervals, or label directions. Do not prescribe a pesticide or dosage. Explain that permitted crops, target pests, timing, protective equipment, re-entry and pre-harvest intervals vary by the exact local product label and region; that label and local agricultural guidance always control. Mention non-chemical checks or integrated pest-management options when relevant.
Keep answers practical and concise. For severe crop loss, uncertain diagnosis, or urgent exposure/poisoning, direct the user to a qualified local agricultural extension professional; for suspected exposure, follow the product label's emergency instructions and contact local emergency/poison-control services. You are AI, not a licensed agronomist."""
MAX_REQUEST_BYTES = 32_000


class CropKindHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_json(404, {"error": "Endpoint not found."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "Invalid request length."})
            return
        if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
            self.send_json(413, {"error": "Request must contain at most 32 KB of chat history."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "Request body must be valid JSON."})
            return

        messages = payload.get("messages") if isinstance(payload, dict) else None
        if not isinstance(messages, list) or not messages or len(messages) > 12:
            self.send_json(400, {"error": "Send between 1 and 12 chat messages."})
            return

        validated_messages = []
        for message in messages:
            if not isinstance(message, dict) or message.get("role") not in ("user", "assistant"):
                self.send_json(400, {"error": "Each message must have a user or assistant role."})
                return
            content = message.get("content")
            if not isinstance(content, str) or not content.strip() or len(content) > 2_000:
                self.send_json(400, {"error": "Each message must contain 1 to 2,000 characters."})
                return
            validated_messages.append({"role": message["role"], "content": content.strip()})

        request_body = json.dumps({
            "model": OLLAMA_MODEL,
            "stream": False,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *validated_messages],
        }).encode("utf-8")
        request = Request(
            OLLAMA_URL,
            data=request_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=120) as response:
                result = json.loads(response.read())
            model_message = result.get("message") if isinstance(result, dict) else None
            reply = model_message.get("content") if isinstance(model_message, dict) else None
            if not isinstance(reply, str) or not reply.strip():
                self.send_json(502, {"error": "The local model returned an empty reply."})
                return
            self.send_json(200, {"reply": reply.strip(), "model": OLLAMA_MODEL})
        except HTTPError as error:
            detail = error.read(1_000).decode("utf-8", errors="replace").strip()
            self.send_json(502, {
                "error": f"Ollama returned HTTP {error.code}."
                + (f" {detail}" if detail else "")
            })
        except URLError as error:
            self.send_json(503, {
                "error": f"Could not reach Ollama at {OLLAMA_URL}: {error.reason}. "
                f"Check that Ollama is running and the {OLLAMA_MODEL} model is available."
            })
        except TimeoutError:
            self.send_json(504, {"error": "Ollama took too long to respond. Please try again."})
        except (json.JSONDecodeError, OSError) as error:
            self.send_json(502, {"error": f"Could not read a valid response from Ollama: {error}."})

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("PORT", "8000"))), CropKindHandler)
    print(f"CropKind is ready at http://127.0.0.1:{server.server_port}")
    print(f"Chat model: {OLLAMA_MODEL} via {OLLAMA_URL}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping CropKind.")
        server.server_close()
