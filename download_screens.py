import os
import json
import urllib.request

output_path = r"C:\Users\write\.gemini\antigravity\brain\c6286e77-b7ea-4f83-a15a-87f5dcf783a1\.system_generated\steps\56\output.txt"
dest_dir = r"C:\Users\write\.gemini\antigravity\scratch\screens_html"

os.makedirs(dest_dir, exist_ok=True)

with open(output_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for screen in data["screens"]:
    title = screen["title"]
    # Clean title for filename
    filename = title.replace(" | ", "_").replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_") + ".html"
    download_url = screen["htmlCode"]["downloadUrl"]
    dest_path = os.path.join(dest_dir, filename)
    print(f"Downloading {title} to {filename}...")
    try:
        urllib.request.urlretrieve(download_url, dest_path)
    except Exception as e:
        print(f"Failed to download {title}: {e}")

print("Done!")
