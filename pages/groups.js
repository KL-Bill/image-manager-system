window.PAGE_LOADERS["groups"] = async function () {
  const el = document.getElementById("page-groups");
  const mk = monthKeyNow();

  const groups = await api(`/api/post-groups?month=${mk}`);

  el.innerHTML = `
    <h2>Post Groups (${mk})</h2>
    <div class="row">
      <label><input type="checkbox" id="wm" checked/> Include watermark</label>
      <select id="pos">
        <option value="">Default position</option>
        <option value="tl">Top-left</option>
        <option value="tr">Top-right</option>
        <option value="bl">Bottom-left</option>
        <option value="br">Bottom-right</option>
        <option value="c">Center</option>
      </select>
    </div>
    <div id="groups-list"></div>
    <hr/>
    <div id="group-detail"></div>
  `;

  const list = el.querySelector("#groups-list");
  list.innerHTML = groups.map(g => `
    <div class="thumb">
      <b>${g.title}</b><br/>
      <span class="muted">${g.status} • ${g.month_key}</span><br/>
      <button data-open="${g.id}">Open</button>
      <a href="#" data-zip="${g.id}">Download ZIP</a>
    </div>
  `).join("") || `<p class="muted">No post groups yet (admin creates them).</p>`;

  list.querySelectorAll("button[data-open]").forEach(b => {
    b.onclick = () => openGroup(b.dataset.open);
  });

  list.querySelectorAll("a[data-zip]").forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      const groupId = a.dataset.zip;
      const wm = el.querySelector("#wm").checked ? "1" : "0";
      const pos = el.querySelector("#pos").value;
      const url = `${window.APP_CONFIG.API_BASE}/api/download/post-group/${groupId}.zip?watermark=${wm}${pos?`&position=${pos}`:""}`;
      // open download with auth header isn't possible via normal link; simplest: fetch blob
      downloadWithToken(url, `post_group_${groupId}.zip`);
    };
  });

  async function openGroup(groupId){
    const detail = el.querySelector("#group-detail");
    const imgs = await api(`/api/post-groups/${groupId}/images`);

    detail.innerHTML = `
      <h3>Group Images</h3>
      <div class="grid">
        ${imgs.map(i => `
          <div class="thumb">
            <div class="muted">${i.original_filename}</div>
            <button data-dl="${i.id}">Download</button>
          </div>
        `).join("")}
      </div>
    `;

    detail.querySelectorAll("button[data-dl]").forEach(btn=>{
      btn.onclick = () => {
        const imgId = btn.dataset.dl;
        const wm = el.querySelector("#wm").checked ? "1" : "0";
        const pos = el.querySelector("#pos").value;
        const url = `${window.APP_CONFIG.API_BASE}/api/download/image/${imgId}?watermark=${wm}${pos?`&position=${pos}`:""}`;
        downloadWithToken(url, `image_${imgId}`);
      };
    });
  }

  async function downloadWithToken(url, filename){
    const token = localStorage.getItem("token");
    const r = await fetch(url, { headers: { Authorization: "Bearer " + token }});
    if (!r.ok) return alert("Download failed");
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};
