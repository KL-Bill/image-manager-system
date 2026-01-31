window.PAGE_LOADERS["schedules"] = async function () {
  const el = document.getElementById("page-schedules");
  const mk = monthKeyNow();
  const user = JSON.parse(localStorage.getItem("user")||"{}");

  const rows = await api(`/api/schedules?month=${mk}`);

  el.innerHTML = `
    <h2>Schedules (${mk})</h2>
    ${user.role==="admin" ? `
      <div class="row">
        <input id="pgid" placeholder="Post Group ID"/>
        <input id="dt" type="datetime-local"/>
        <input id="platform" placeholder="Platform (optional)"/>
        <input id="notes" placeholder="Notes (optional)"/>
        <button id="add">Add</button>
      </div>
    ` : `<p class="muted">Read-only calendar.</p>`}
    <div id="list"></div>
  `;

  const list = el.querySelector("#list");
  list.innerHTML = rows.map(s => `
    <div class="thumb">
      <b>${s.post_group_title}</b><br/>
      <span class="muted">${new Date(s.scheduled_at).toLocaleString()}</span><br/>
      <span class="muted">${s.platform || ""} ${s.notes || ""}</span>
    </div>
  `).join("") || `<p class="muted">No schedules yet.</p>`;

  if (user.role==="admin"){
    el.querySelector("#add").onclick = async ()=>{
      const post_group_id = el.querySelector("#pgid").value.trim();
      const scheduled_at = el.querySelector("#dt").value;
      const platform = el.querySelector("#platform").value.trim();
      const notes = el.querySelector("#notes").value.trim();
      if (!post_group_id || !scheduled_at) return alert("Post Group ID and datetime required");
      await api("/api/schedules", { method:"POST", body:{ post_group_id, scheduled_at, platform, notes }});
      await window.PAGE_LOADERS["schedules"]();
    };
  }
};
