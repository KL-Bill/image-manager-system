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
    <div id="calendarHost"></div>
    <hr/>
    <div id="list"></div>
  `;

  function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
  function startDow(y,m){ return new Date(y, m, 1).getDay(); } // 0 Sun

  function renderCalendar(host, year, monthIndex, schedules) {
    const total = daysInMonth(year, monthIndex);
    const start = startDow(year, monthIndex);

    const byDay = {};
    schedules.forEach(s => {
      const d = new Date(s.scheduled_at);
      const day = d.getDate();
      byDay[day] = byDay[day] || [];
      byDay[day].push(s);
    });

    const heads = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(h => `<div class="calhead">${h}</div>`).join("");

    let cells = [];
    for (let i=0;i<start;i++) cells.push(`<div class="calcell empty"></div>`);
    for (let day=1; day<=total; day++) {
      const items = (byDay[day] || []).slice(0,3).map(x =>
        `<div class="calitem" title="${x.post_group_title}">${x.post_group_title}</div>`
      ).join("");
      const more = (byDay[day] && byDay[day].length>3) ? `<div class="muted">+${byDay[day].length-3} more</div>` : "";
      cells.push(`
        <div class="calcell">
          <div class="calday">${day}</div>
          ${items}${more}
        </div>
      `);
    }

    host.innerHTML = `<div class="calgrid">${heads}${cells.join("")}</div>`;
  }

  // render calendar for current month_key
  const [yy, mm] = mk.split("-").map(Number);
  renderCalendar(el.querySelector("#calendarHost"), yy, mm-1, rows);

  // list view below
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