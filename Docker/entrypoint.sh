#!/bin/bash

# Start Ollama in the background.
/bin/ollama serve &
# Record Process ID.
pid=$!

# Pause for Ollama to start.
sleep 5

echo "Retrieving model (llama-3-taiwan)..."
ollama pull kenneth85/llama-3-taiwan:latest
echo "Done."

# Wait for Ollama process to finish.
wait $pid