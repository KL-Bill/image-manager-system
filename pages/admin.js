window.PAGE_LOADERS["admin"] = async function () {
  const el = document.getElementById("page-admin");
  const mk = monthKeyNow();

  const groups = await api(`/api/post-groups?month=${mk}`);
  const albums = await api(`/api/albums?month=${mk}`);

  el.innerHTML = `
    <h2>Admin Review (${mk})</h2>
    <div class="row">
      <input id="gtitle" placeholder="New Post Group title"/>
      <button id="gcreate" class="primary">Create Group</button>
    </div>
    <hr/>
    <div class="row">
      <select id="albumSel"></select>
      <select id="groupSel"></select>
      <button id="assign" class="primary">Add selected images to group</button>
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
      <div class="row">
        <input id="search" placeholder="Search filename...">
        <button id="all" class="primary">Select all</button>
        <button id="none">Clear</button>
        <span class="muted">Selected: <b id="selCount">0</b></span>
      </div>

      <h3>Album Images</h3>
      <div class="grid" id="grid">
        ${imgs.map(i => `
          <div class="thumb">
            <img class="imgthumb" src="${authImgUrl(`/api/images/${i.id}/thumb`)}">
            <label>
              <input type="checkbox" class="pick" value="${i.id}" data-name="${i.original_filename.toLowerCase()}"/>
              ${i.original_filename}
            </label>
          </div>
        `).join("")}
      </div>
    `;

    function updateCount(){
      el.querySelector("#selCount").textContent = el.querySelectorAll(".pick:checked").length;
    }
    el.querySelectorAll(".pick").forEach(x => x.onchange = updateCount);

    el.querySelector("#all").onclick = () => { el.querySelectorAll(".pick").forEach(x => x.checked = true); updateCount(); };
    el.querySelector("#none").onclick = () => { el.querySelectorAll(".pick").forEach(x => x.checked = false); updateCount(); };

    el.querySelector("#search").oninput = (e) => {
      const q = e.target.value.toLowerCase();
      el.querySelectorAll(".pick").forEach(chk => {
        chk.closest(".thumb").style.display = chk.dataset.name.includes(q) ? "" : "none";
      });
      updateCount();
    };

    updateCount();
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
