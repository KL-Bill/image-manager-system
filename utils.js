function setLoading(isLoading, text="Loading...") {
  const el = document.getElementById("loadingOverlay");
  if (!el) return;
  el.classList.toggle("hidden", !isLoading);
  const t = el.querySelector(".overlayText");
  if (t) t.textContent = text;
}

async function api(path, { method="GET", body=null, loadingText=null, noLoading=false } = {}) {
  const token = localStorage.getItem("token");

  if (!noLoading) setLoading(true, loadingText || "Loading...");

  try {
    const r = await fetch(window.APP_CONFIG.API_BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {})
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!r.ok) {
      let msg = "Request failed";
      try { msg = (await r.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  } finally {
    if (!noLoading) setLoading(false);
  }
}

function monthKeyNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  return `${y}-${m}`;
}

// For <img> tags (cannot set Authorization header) we pass token in query string.
function authImgUrl(path) {
  const token = localStorage.getItem("token") || "";
  const sep = path.includes("?") ? "&" : "?";
  return window.APP_CONFIG.API_BASE + path + sep + "token=" + encodeURIComponent(token);
}

// Download helper with a visible "working" state and optional percent progress.
// Uses streaming when supported to show progress in the global overlay.
async function downloadWithProgress(url, filename, label = "Downloading...") {
  const token = localStorage.getItem("token");
  setLoading(true, label);
  try {
    const r = await fetch(url, { headers: { Authorization: "Bearer " + token }});
    if (!r.ok) throw new Error("Download failed");

    const total = Number(r.headers.get("content-length") || 0);
    // If streaming isn't available, fall back to blob.
    if (!r.body || !r.body.getReader) {
      const blob = await r.blob();
      triggerDownload(blob, filename);
      return;
    }

    const reader = r.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) {
        const pct = Math.min(99, Math.round((received / total) * 100));
        setLoading(true, `${label} ${pct}%`);
      } else {
        setLoading(true, `${label} ${Math.round(received / 1024 / 1024)} MB`);
      }
    }

    const blob = new Blob(chunks);
    triggerDownload(blob, filename);
  } finally {
    setLoading(false);
  }
}

function triggerDownload(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
