from pathlib import Path
import re

cc = Path(r"C:\Users\sandr\Projects\CodeCraft-Solutions\index.html").read_text(encoding="utf-8")
url = re.search(r"SUPABASE_URL = '([^']+)'", cc).group(1)
key = re.search(r"SUPABASE_ANON_KEY = '([^']+)'", cc).group(1)
print("url_host", url.split("//")[1].split(".")[0])
print("key_len", len(key), "prefix", key[:16])
Path(r"C:\Users\sandr\Projects\finora\.env.local").write_text(
    f"NEXT_PUBLIC_SUPABASE_URL={url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY={key}\n",
    encoding="utf-8",
)
print("env updated")
