import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

token = os.getenv('FRIENDLI_API_TOKEN')
if not token:
    raise ValueError("FRIENDLI_API_TOKEN environment variable is not set")

url = "https://api.friendli.ai/dedicated/v1/chat/completions"

headers = {
  "Authorization": "Bearer " + token,
  "Content-Type": "application/json"
}

payload = {
  "model": "deprysc58e0mlvj",
  "messages": [
    {
      "role": "user",
      "content": input(":")
    }
  ],
  "max_tokens": 16384,
  "top_p": 0.8,
}

response = requests.request("POST", url, json=payload, headers=headers)

string_resp = (response.json())["choices"][0]["message"]["content"]

split_text = string_resp.split("</think>")

# Assign to variables
thoughts = split_text[0].strip()
response = split_text[1].strip()

# Output to verify
print("Thoughts:\n", thoughts)
print("\nResponse:\n", response)