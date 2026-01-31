window.PAGE_LOADERS["admin"] = async function () {
  const el = document.getElementById("page-admin");
  const mk = monthKeyNow();

  const groups = await api(`/api/post-groups?month=${mk}`);
  const albums = await api(`/api/albums?month=${mk}`);

  el.innerHTML = `
    <h2>Admin Review (${mk})</h2>
    <div class="row">
      <input id="gtitle" placeholder="New Post Group title"/>
      <button id="gcreate">Create Group</button>
    </div>
    <hr/>
    <div class="row">
      <select id="albumSel"></select>
      <select id="groupSel"></select>
      <button id="assign">Add selected images to group</button>
    </div>
    <div id="imgs"></div>
  `;

  const albumSel = el.querySelector("#albumSel");
  albums.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.title;
    albumSel.appendChild(opt);
  });

  const groupSel = el.querySelector("#groupSel");
  groups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.title;
    groupSel.appendChild(opt);
  });

  el.querySelector("#gcreate").onclick = async ()=>{
    const title = el.querySelector("#gtitle").value.trim();
    if (!title) return alert("Title required");
    await api("/api/post-groups", { method:"POST", body:{ title, month_key: mk }});
    await window.PAGE_LOADERS["admin"]();
  };

  async function loadAlbumImages(){
    const albumId = albumSel.value;
    const imgs = await api(`/api/albums/${albumId}/images`);
    const wrap = el.querySelector("#imgs");
    wrap.innerHTML = `
      <h3>Album Images</h3>
      <div class="grid">
        ${imgs.map(i => `
          <div class="thumb">
            <label>
              <input type="checkbox" class="pick" value="${i.id}"/>
              ${i.original_filename}
            </label>
          </div>
        `).join("")}
      </div>
    `;
  }

  albumSel.onchange = loadAlbumImages;

  el.querySelector("#assign").onclick = async ()=>{
    const groupId = groupSel.value;
    const ids = [...el.querySelectorAll(".pick:checked")].map(x => x.value);
    if (!ids.length) return alert("Select images first");
    await api(`/api/post-groups/${groupId}/images`, { method:"POST", body:{ image_ids: ids }});
    alert("Added to group!");
  };

  if (albums.length) await loadAlbumImages();
};
