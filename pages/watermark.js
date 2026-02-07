window.PAGE_LOADERS["watermark"] = async function () {
  const el = document.getElementById("page-watermark");
  const s = await api("/api/watermark/settings");
  const mk = monthKeyNow();
  const albums = await api(`/api/albums?month=${mk}`);

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

    <hr/>
    <h3>Preview</h3>
    <p class="muted">Pick any photo to see how the watermark will look before downloading.
    Tip: adjust Position/Opacity/Scale, click Save, then hit Refresh Preview.</p>
    <div class="toolbar">
      <div class="field" style="min-width:320px;">
        <label class="muted">Preview image</label>
        <select id="previewSel"></select>
      </div>
      <button id="refresh" class="primary">Refresh Preview</button>
    </div>

    <div class="previewGrid">
      <div class="previewCard">
        <div class="muted">Original</div>
        <img id="prevOriginal" class="previewImg" alt="Original preview" />
      </div>
      <div class="previewCard">
        <div class="muted">With watermark</div>
        <img id="prevWatermarked" class="previewImg" alt="Watermarked preview" />
      </div>
    </div>
  `;

  el.querySelector("#pos").value = s.position || "br";
  el.querySelector("#op").value = s.opacity ?? 0.4;
  el.querySelector("#sc").value = s.scale ?? 0.2;

  el.querySelector("#save").onclick = async ()=>{
    const position = el.querySelector("#pos").value;
    const opacity = Number(el.querySelector("#op").value);
    const scale = Number(el.querySelector("#sc").value);
    await api("/api/watermark/settings", { method:"PATCH", body:{ position, opacity, scale }});
    // keep UX fast: refresh preview automatically (if any)
    await refreshPreview();
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

  // Build preview options from first album in the selected month (simple + fast)
  const previewSel = el.querySelector("#previewSel");
  let previewImages = [];
  if (albums.length) {
    const imgs = await api(`/api/albums/${albums[0].id}/images`, { noLoading: true });
    previewImages = imgs || [];
  }

  previewSel.innerHTML = previewImages.map(i => `<option value="${i.id}">${i.original_filename}</option>`).join("")
    || `<option value="">No images available yet</option>`;

  el.querySelector("#refresh").onclick = refreshPreview;

  async function refreshPreview() {
    const id = previewSel.value;
    if (!id) return;
    const pos = el.querySelector("#pos").value;
    const op = el.querySelector("#op").value;
    const sc = el.querySelector("#sc").value;
    el.querySelector("#prevOriginal").src = authImgUrl(`/api/images/${id}/view`);
    el.querySelector("#prevWatermarked").src = authImgUrl(`/api/images/${id}/watermarked?position=${encodeURIComponent(pos)}&opacity=${encodeURIComponent(op)}&scale=${encodeURIComponent(sc)}`);
  }

  // auto render if we have at least one image
  if (previewImages.length) await refreshPreview();
};
