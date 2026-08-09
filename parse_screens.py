import os
from bs4 import BeautifulSoup

screens_dir = r"C:\Users\write\.gemini\antigravity\scratch\screens_html"
output_file = r"C:\Users\write\.gemini\antigravity\scratch\screens_summary.txt"

summary = []

for filename in sorted(os.listdir(screens_dir)):
    if not filename.endswith(".html"):
        continue
    filepath = os.path.join(screens_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string if soup.title else filename
    
    # Extract some key elements to see what is on the page
    headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3", "h4"])][:15]
    
    # Extract nav links or major actions
    links = []
    for a in soup.find_all("a"):
        text = a.get_text(strip=True)
        href = a.get("href", "")
        if text:
            links.append(f"{text} ({href})")
    links = links[:10]
    
    # Extract buttons
    buttons = [b.get_text(strip=True) for b in soup.find_all("button") if b.get_text(strip=True)][:10]
    
    # Extract inputs and placeholders
    inputs = []
    for inp in soup.find_all("input"):
        placeholder = inp.get("placeholder", "")
        inp_type = inp.get("type", "text")
        inputs.append(f"{inp_type}: {placeholder}")
    
    summary.append(f"=== SCREEN: {filename} (Title: {title}) ===")
    summary.append("HEADINGS:")
    for h in headings:
        summary.append(f"  - {h}")
    summary.append("NAV LINKS:")
    for l in links:
        summary.append(f"  - {l}")
    summary.append("BUTTONS:")
    for b in buttons:
        summary.append(f"  - {b}")
    summary.append("INPUTS:")
    for i in inputs:
        summary.append(f"  - {i}")
    summary.append("\n" + "="*50 + "\n")

with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(summary))

print(f"Summary written to {output_file}")
