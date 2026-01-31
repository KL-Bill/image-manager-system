window.PAGE_LOADERS = window.PAGE_LOADERS || {};
window.PAGE_LOADERS["albums"] = async function () {
  const el = document.getElementById("page-albums");
  const mk = monthKeyNow();

  const albums = await api(`/api/albums?month=${mk}`);

  el.innerHTML = `
    <h2>Albums (${mk})</h2>
    <div class="row">
      <input id="al-title" placeholder="Album title (e.g. Sunday Service Week 4)"/>
      <input id="al-date" type="date"/>
      <button id="al-create">Create</button>
      <select id="al-month"></select>
    </div>
    <div id="albums-list"></div>
    <hr/>
    <div id="album-detail"></div>
  `;

  // month dropdown (last 12 months)
  const sel = el.querySelector("#al-month");
  for (let i=0;i<12;i++){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0");
    const k=`${y}-${m}`;
    const opt=document.createElement("option");
    opt.value=k; opt.textContent=k;
    if (k===mk) opt.selected=true;
    sel.appendChild(opt);
  }

  async function refresh(monthKey){
    const rows = await api(`/api/albums?month=${monthKey}`);
    const list = el.querySelector("#albums-list");
    list.innerHTML = rows.map(a => `
      <div class="thumb">
        <b>${a.title}</b><br/>
        <span class="muted">${a.event_date} • ${a.month_key}</span><br/>
        <button data-open="${a.id}">Open</button>
      </div>
    `).join("") || `<p class="muted">No albums yet.</p>`;

    list.querySelectorAll("button[data-open]").forEach(btn=>{
      btn.onclick = () => openAlbum(btn.dataset.open);
    });
  }

  el.querySelector("#al-create").onclick = async () => {
    const title = el.querySelector("#al-title").value.trim();
    const date = el.querySelector("#al-date").value;
    if (!title || !date) return alert("Title and date required");
    await api("/api/albums", { method:"POST", body:{ title, event_date: date }});
    await refresh(sel.value);
  };

  sel.onchange = () => refresh(sel.value);

  async function openAlbum(albumId){
    const detail = el.querySelector("#album-detail");
    const images = await api(`/api/albums/${albumId}/images`);

    detail.innerHTML = `
      <h3>Album Images</h3>
      <div class="row">
        <input id="upload" type="file" multiple accept="image/*"/>
        <button id="btnUpload">Upload Selected</button>
      </div>
      <div class="grid" id="img-grid"></div>
    `;

    const grid = detail.querySelector("#img-grid");
    grid.innerHTML = images.map(i => `
      <div class="thumb">
        <div class="muted">${i.original_filename}</div>
        <div class="muted">${(i.size_bytes/1024/1024).toFixed(2)} MB</div>
      </div>
    `).join("") || `<p class="muted">No images yet.</p>`;

    detail.querySelector("#btnUpload").onclick = async () => {
      const input = detail.querySelector("#upload");
      if (!input.files.length) return alert("Select images first");
      const token = localStorage.getItem("token");

      const fd = new FormData();
      [...input.files].forEach(f => fd.append("images", f));

      const r = await fetch(window.APP_CONFIG.API_BASE + `/api/albums/${albumId}/images`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: fd
      });
      if (!r.ok) return alert("Upload failed");
      await openAlbum(albumId);
    };
  }

  await refresh(mk);
};
