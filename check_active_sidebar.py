import os
from bs4 import BeautifulSoup

screens_dir = r"C:\Users\write\.gemini\antigravity\scratch\screens_html"

for filename in sorted(os.listdir(screens_dir)):
    if not filename.endswith(".html"):
        continue
    filepath = os.path.join(screens_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    aside = soup.find("aside")
    if aside:
        active_link = aside.find("a", class_=lambda c: c and ("text-primary" in c or "font-bold" in c))
        if active_link:
            text = active_link.get_text(strip=True)
            print(f"File: {filename} -> Active Sidebar Link: {text}")
        else:
            print(f"File: {filename} -> No active sidebar link found")
    else:
        print(f"File: {filename} -> No sidebar found")
