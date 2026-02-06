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
