window.PAGE_LOADERS["watermark"] = async function () {
  const el = document.getElementById("page-watermark");
  const s = await api("/api/watermark/settings");

  el.innerHTML = `
    <h2>Watermark Settings</h2>
    <p class="muted">Watermark is applied on download only (no duplicate stored files).</p>

    <div class="row">
      <label>Position</label>
      <select id="pos">
        <option value="tl">Top-left</option>
        <option value="tr">Top-right</option>
        <option value="bl">Bottom-left</option>
        <option value="br">Bottom-right</option>
        <option value="c">Center</option>
      </select>

      <label>Opacity (0..1)</label>
      <input id="op" type="number" step="0.1" min="0" max="1"/>

      <label>Scale (0..1)</label>
      <input id="sc" type="number" step="0.05" min="0.05" max="1"/>
      <button id="save">Save</button>
    </div>

    <hr/>
    <div class="row">
      <input id="wmfile" type="file" accept="image/png,image/*"/>
      <button id="upload">Upload Watermark Image</button>
    </div>

    <p class="muted">Current watermark path: ${s.watermark_image_path || "(none yet)"}</p>
  `;

  el.querySelector("#pos").value = s.position || "br";
  el.querySelector("#op").value = s.opacity ?? 0.4;
  el.querySelector("#sc").value = s.scale ?? 0.2;

  el.querySelector("#save").onclick = async ()=>{
    const position = el.querySelector("#pos").value;
    const opacity = Number(el.querySelector("#op").value);
    const scale = Number(el.querySelector("#sc").value);
    await api("/api/watermark/settings", { method:"PATCH", body:{ position, opacity, scale }});
    alert("Saved.");
  };

  el.querySelector("#upload").onclick = async ()=>{
    const f = el.querySelector("#wmfile").files[0];
    if (!f) return alert("Choose a file first");
    const token = localStorage.getItem("token");

    const fd = new FormData();
    fd.append("watermark", f);

    const r = await fetch(window.APP_CONFIG.API_BASE + "/api/watermark/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: fd
    });
    if (!r.ok) return alert("Upload failed");
    alert("Watermark uploaded!");
    await window.PAGE_LOADERS["watermark"]();
  };
};
