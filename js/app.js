const RETENTION_MONTHS = 6;

const DEFAULT_USERS = {
  admin: { password: "admin123", name: "Admin ARC", role: "admin" },
  hasan: { password: "123456", name: "Hasan", role: "staff" },
  sani: { password: "123456", name: "Sani", role: "staff" },
  arfah: { password: "123456", name: "Arfah", role: "staff" },
  fuad: { password: "123456", name: "Fuad", role: "staff" }
};

let users = loadUsers();
let currentUser = null;
let jobs = [];

function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}

function setStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadUsers() {
  const saved = localStorage.getItem("arcUsers");

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }

  localStorage.setItem("arcUsers", JSON.stringify(DEFAULT_USERS));
  return JSON.parse(JSON.stringify(DEFAULT_USERS));
}

function persistUsers() {
  localStorage.setItem("arcUsers", JSON.stringify(users));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function now() {
  const d = new Date();

  return {
    iso: d.toISOString(),
    isoDate: isoDate(d),
    date: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }),
    time: d
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })
      .replace(".", ":")
  };
}

function fmtDate(v) {
  return new Date(v + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function cutoffDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - RETENTION_MONTHS);
  return d;
}

function isOlderThanRetention(iso) {
  return new Date(iso) < cutoffDate();
}

/* =========================
   NAVIGATION & LOGIN
========================= */

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
  });

  const page = document.getElementById(id);

  if (page) {
    page.classList.add("active");
  }

  refreshMeta();

  if (id === "adminPage") {
    renderAdminSummary();
    showAdminSection("staffSection");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function login() {
  users = loadUsers();

  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("password").value;

  if (users[username] && users[username].password === password) {
    currentUser = {
      username: username,
      ...users[username]
    };

    localStorage.setItem("arcUser", JSON.stringify(currentUser));

    if (currentUser.role === "admin") {
      showPage("adminPage");
    } else {
      showPage("dashboardPage");
    }
  } else {
    alert("Username atau password salah.");
  }
}

function logout() {
  localStorage.removeItem("arcUser");
  currentUser = null;

  document.getElementById("username").value = "";
  document.getElementById("password").value = "";

  showPage("loginPage");
}

/* =========================
   META
========================= */

function refreshMeta() {
  const n = now();
  const name = currentUser?.name || "-";

  ["staffName", "absenName", "cleanName", "reportName"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });

  ["absenDate", "cleanDate", "reportDate"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n.date;
  });

  ["absenTime", "cleanTime", "reportTime"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n.time;
  });

  const today = document.getElementById("todayText");
  if (today) today.textContent = n.date;

  const area = document.getElementById("areaSelect");
  const cleanArea = document.getElementById("cleanArea");

  if (area && cleanArea) {
    cleanArea.textContent = area.value;
  }
}

document.addEventListener("change", (e) => {
  if (e.target.id === "areaSelect") {
    refreshMeta();
  }
});

/* =========================
   FOTO
========================= */

function previewImage(input, id) {
  const file = input.files?.[0];

  if (!file) return;

  const img = document.getElementById(id);

  if (img) {
    img.src = URL.createObjectURL(file);
  }
}

function photoName(id) {
  return document.getElementById(id)?.files?.[0]?.name || "";
}

/* =========================
   PEKERJAAN
========================= */

function addJob() {
  const sel = document.getElementById("jobType");
  const qty = Number(document.getElementById("jobQty").value || 0);
  const note = document.getElementById("jobNote").value.trim();

  if (qty <= 0) {
    alert("Isi jumlah SL dulu.");
    return;
  }

  const pct = Number(sel.options[sel.selectedIndex].dataset.pct);

  jobs.push({
    type: sel.value,
    qty: qty,
    pct: pct,
    note: note,
    total: qty * pct
  });

  document.getElementById("jobQty").value = "";
  document.getElementById("jobNote").value = "";

  renderJobs();
}

function removeJob(i) {
  jobs.splice(i, 1);
  renderJobs();
}

function renderJobs() {
  const box = document.getElementById("jobList");

  if (!box) return;

  box.innerHTML = jobs
    .map(
      (j, i) => `
        <div class="job-row">
          <div>
            <b>${esc(j.type)}</b>
            ${j.note ? `<br><small>${esc(j.note)}</small>` : ""}
          </div>

          <div>${j.qty} SL</div>

          <div>
            ${j.total.toFixed(2).replace(".", ",")}%
          </div>

          <button onclick="removeJob(${i})">✕</button>
        </div>
      `
    )
    .join("");

  const total = Math.min(
    jobs.reduce((a, b) => a + b.total, 0),
    100
  );

  const lack = Math.max(0, 100 - total);

  document.getElementById("totalPct").textContent =
    total.toFixed(2).replace(".", ",") + "%";

  document.getElementById("lackPct").textContent =
    lack.toFixed(2).replace(".", ",") + "%";
}

/* =========================
   SIMPAN DATA STAFF
========================= */

function saveAttendance() {
  if (!currentUser) return;

  const n = now();
  const rows = getStore("arcAttendance");

  rows.push({
    id: uid(),
    username: currentUser.username,
    name: currentUser.name,
    date: n.isoDate,
    time: n.time,
    createdAt: n.iso,
    photoName: photoName("absenPhoto")
  });

  setStore("arcAttendance", rows);

  alert("Absensi tersimpan.");
}

function saveCleaning() {
  if (!currentUser) return;

  const n = now();
  const rows = getStore("arcCleaning");
  const area = document.getElementById("areaSelect").value;

  rows.push({
    id: uid(),
    username: currentUser.username,
    name: currentUser.name,
    area: area,
    date: n.isoDate,
    time: n.time,
    createdAt: n.iso,
    photoName: photoName("cleanPhoto")
  });

  setStore("arcCleaning", rows);

  alert("Laporan kebersihan tersimpan.");
}

function saveDailyReport() {
  if (!currentUser) return;

  if (!jobs.length) {
    alert("Tambahkan pekerjaan dulu.");
    return;
  }

  const n = now();
  const rows = getStore("arcReports");

  const total = Math.min(
    jobs.reduce((a, b) => a + b.total, 0),
    100
  );

  const lack = Math.max(0, 100 - total);

  rows.push({
    id: uid(),
    username: currentUser.username,
    name: currentUser.name,
    date: n.isoDate,
    time: n.time,
    createdAt: n.iso,
    total: total,
    lack: lack,
    jobs: JSON.parse(JSON.stringify(jobs)),
    photoName: photoName("reportPhoto")
  });

  setStore("arcReports", rows);

  alert("Laporan harian tersimpan.");

  /*
   * Pekerjaan sengaja TIDAK langsung dihapus.
   * Jadi setelah klik Simpan, staff masih bisa menekan
   * tombol Bagikan ke WhatsApp.
   */
}

/* =========================
   SHARE FOTO + TEKS
========================= */

async function copyAndOpenWA(type) {
  refreshMeta();

  const n = now();
  const name = currentUser?.name || "-";

  let text = "";
  let photoInputId = "";

  if (type === "absen") {
    photoInputId = "absenPhoto";

    text = `✅ ABSENSI MASUK

👤 Nama: ${name}
📅 Tanggal: ${n.date}
🕐 Jam: ${n.time}

📸 Foto kedatangan terlampir`;
  }

  if (type === "clean") {
    photoInputId = "cleanPhoto";

    const area = document.getElementById("areaSelect").value;

    text = `🧹 LAPORAN KEBERSIHAN LAB

👤 Nama: ${name}
📍 Area: ${area}
📅 Tanggal: ${n.date}
🕐 Jam: ${n.time}

📸 Foto area terlampir`;
  }

  if (type === "report") {
    photoInputId = "reportPhoto";

    if (!jobs.length) {
      alert("Tambahkan pekerjaan dulu.");
      return;
    }

    const total = Math.min(
      jobs.reduce((a, b) => a + b.total, 0),
      100
    );

    const kurang = Math.max(0, 100 - total);

    const detail = jobs
      .map((j) => {
        let hasil =
          `${j.type}\n` +
          `${j.qty} SL = ${j.total
            .toFixed(2)
            .replace(".", ",")}%`;

        if (j.note) {
          hasil += `\n${j.note}`;
        }

        return hasil;
      })
      .join("\n\n");

    text = `📝 LAPORAN HARIAN

👤 Nama: ${name}
📅 Tanggal: ${n.date}
🕐 Jam: ${n.time}

${detail}

📊 TOTAL: ${total.toFixed(2).replace(".", ",")}%
⚠️ KURANG: ${kurang.toFixed(2).replace(".", ",")}%

📸 Foto lembar kerja terlampir`;
  }

  const input = document.getElementById(photoInputId);
  const file = input?.files?.[0];

  if (!file) {
    alert("Ambil atau pilih foto terlebih dahulu.");
    return;
  }

  /*
   * Web Share API.
   * Jika HP mendukung berbagi file,
   * foto + teks dikirim ke menu Share HP.
   */
  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({
      files: [file]
    })
  ) {
    try {
      await navigator.share({
        title: "ARC - Admin Reporting and Certification",
        text: text,
        files: [file]
      });

      return;
    } catch (err) {
      if (err && err.name === "AbortError") {
        return;
      }

      console.error("Share foto gagal:", err);
    }
  }

  /*
   * Jika browser bisa Share tetapi tidak mendukung file,
   * jangan pura-pura mengirim foto.
   * Gunakan fallback WhatsApp.
   */

  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }

  alert(
    "HP atau browser ini belum mendukung pengiriman foto + teks langsung. " +
    "Teks laporan sudah disalin. WhatsApp akan dibuka, lalu lampirkan foto secara manual."
  );

  window.open("https://wa.me/", "_blank");
}

/* =========================
   ADMIN
========================= */

function showAdminSection(id) {
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  if (id === "staffSection") renderStaff();
  if (id === "attendanceSection") renderAttendance();
  if (id === "cleaningSection") renderCleaning();
  if (id === "reportSection") renderReports();
  if (id === "achievementSection") renderAchievement();
  if (id === "archiveSection") renderRetentionInfo();
}

function renderAdminSummary() {
  users = loadUsers();

  document.getElementById("totalStaff").textContent =
    Object.values(users).filter((u) => u.role === "staff").length;

  const today = isoDate();

  document.getElementById("todayAttendance").textContent =
    getStore("arcAttendance").filter((r) => r.date === today).length;

  document.getElementById("todayCleaning").textContent =
    getStore("arcCleaning").filter((r) => r.date === today).length;

  document.getElementById("todayReport").textContent =
    getStore("arcReports").filter((r) => r.date === today).length;
}

/* =========================
   DATA STAFF
========================= */

function renderStaff() {
  users = loadUsers();

  renderAdminSummary();

  const search = document.getElementById("staffSearch");
  const kw = (search?.value || "").toLowerCase();

  const box = document.getElementById("staffList");

  const rows = Object.entries(users)
    .filter(([username, u]) => {
      if (username === "admin") return false;

      return (
        !kw ||
        username.includes(kw) ||
        u.name.toLowerCase().includes(kw)
      );
    })
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  if (!rows.length) {
    box.innerHTML =
      '<p class="hint">Data staff tidak ditemukan.</p>';
    return;
  }

  box.innerHTML = rows
    .map(
      ([username, u]) => `
        <div class="staff-item">

          <div class="staff-meta">
            <b>${esc(u.name)}</b>
            <small>@${esc(username)}</small>
            <span class="role-badge">
              ${u.role === "admin" ? "Admin" : "Staff"}
            </span>
          </div>

          <div class="staff-actions">
            <button
              class="edit-btn"
              onclick="editStaff('${username}')">
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="deleteStaff('${username}')">
              Hapus
            </button>
          </div>

        </div>
      `
    )
    .join("");
}

function openStaffForm() {
  document.getElementById("staffFormTitle").textContent =
    "Tambah Staff";

  document.getElementById("editUsername").value = "";
  document.getElementById("staffFullName").value = "";
  document.getElementById("staffUsername").value = "";
  document.getElementById("staffPassword").value = "";
  document.getElementById("staffRole").value = "staff";

  document.getElementById("staffUsername").disabled = false;

  showPage("staffFormPage");
}

function editStaff(username) {
  users = loadUsers();

  const u = users[username];

  if (!u) return;

  document.getElementById("staffFormTitle").textContent =
    "Edit Staff";

  document.getElementById("editUsername").value = username;
  document.getElementById("staffFullName").value = u.name;
  document.getElementById("staffUsername").value = username;
  document.getElementById("staffPassword").value = u.password;
  document.getElementById("staffRole").value =
    u.role || "staff";

  document.getElementById("staffUsername").disabled = true;

  showPage("staffFormPage");
}

function saveStaff() {
  users = loadUsers();

  const editUsername =
    document.getElementById("editUsername").value;

  const name =
    document.getElementById("staffFullName").value.trim();

  const username =
    document
      .getElementById("staffUsername")
      .value.trim()
      .toLowerCase();

  const password =
    document.getElementById("staffPassword").value;

  const role =
    document.getElementById("staffRole").value;

  if (!name || !username || !password) {
    alert("Nama, username, dan password wajib diisi.");
    return;
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    alert(
      "Username hanya boleh huruf kecil, angka, titik, garis bawah, atau strip."
    );
    return;
  }

  if (!editUsername && users[username]) {
    alert("Username sudah digunakan.");
    return;
  }

  users[editUsername || username] = {
    name: name,
    password: password,
    role: role
  };

  persistUsers();

  alert("Data staff berhasil disimpan.");

  document.getElementById("staffUsername").disabled = false;

  showPage("adminPage");
}

function deleteStaff(username) {
  if (!confirm(`Hapus staff @${username}?`)) {
    return;
  }

  users = loadUsers();

  delete users[username];

  persistUsers();

  renderStaff();
}

/* =========================
   REKAP
========================= */

function filterRows(rows, dateId, nameId) {
  const date =
    document.getElementById(dateId)?.value || "";

  const name =
    (
      document.getElementById(nameId)?.value || ""
    ).toLowerCase();

  return rows
    .filter(
      (r) =>
        (!date || r.date === date) &&
        (!name || r.name.toLowerCase().includes(name))
    )
    .sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
}

function renderAttendance() {
  const rows = filterRows(
    getStore("arcAttendance"),
    "attDate",
    "attName"
  );

  const tb = document.getElementById("attendanceRows");

  if (!rows.length) {
    tb.innerHTML =
      '<tr><td class="empty" colspan="4">Belum ada data.</td></tr>';
    return;
  }

  tb.innerHTML = rows
    .map(
      (r) => `
        <tr>
          <td>${fmtDate(r.date)}</td>
          <td>${esc(r.name)}</td>
          <td>${r.time}</td>
          <td>${r.photoName ? "Ada" : "-"}</td>
        </tr>
      `
    )
    .join("");
}

function renderCleaning() {
  const rows = filterRows(
    getStore("arcCleaning"),
    "cleanDateFilter",
    "cleanNameFilter"
  );

  const tb = document.getElementById("cleaningRows");

  if (!rows.length) {
    tb.innerHTML =
      '<tr><td class="empty" colspan="4">Belum ada data.</td></tr>';
    return;
  }

  tb.innerHTML = rows
    .map(
      (r) => `
        <tr>
          <td>${fmtDate(r.date)}</td>
          <td>${esc(r.name)}</td>
          <td>${esc(r.area)}</td>
          <td>${r.time}</td>
        </tr>
      `
    )
    .join("");
}

function renderReports() {
  const rows = filterRows(
    getStore("arcReports"),
    "reportDateFilter",
    "reportNameFilter"
  );

  const tb = document.getElementById("reportRows");

  if (!rows.length) {
    tb.innerHTML =
      '<tr><td class="empty" colspan="5">Belum ada data.</td></tr>';
    return;
  }

  tb.innerHTML = rows
    .map(
      (r) => `
        <tr>
          <td>${fmtDate(r.date)}</td>
          <td>${esc(r.name)}</td>

          <td>
            ${r.jobs
              .map(
                (j) =>
                  `${esc(j.type)} (${j.qty} SL)`
              )
              .join("<br>")}
          </td>

          <td>
            ${r.total.toFixed(2).replace(".", ",")}%
          </td>

          <td>
            ${r.lack.toFixed(2).replace(".", ",")}%
          </td>
        </tr>
      `
    )
    .join("");
}

/* =========================
   STATUS HARIAN
========================= */

function getDailyStatus() {
  return getStore("arcDailyStatus");
}

function setDailyStatus(rows) {
  setStore("arcDailyStatus", rows);
}

function setOffStatus(username, date, isOff = true) {
  let rows = getDailyStatus().filter(
    (r) =>
      !(
        r.username === username &&
        r.date === date
      )
  );

  if (isOff) {
    const u = loadUsers()[username];

    rows.push({
      id: uid(),
      username: username,
      name: u?.name || username,
      date: date,
      status: "OFF",
      createdAt: new Date().toISOString()
    });
  }

  setDailyStatus(rows);

  renderAchievement();
}

/* =========================
   PENCAPAIAN HARIAN
========================= */

function renderAchievement() {
  const dateInput =
    document.getElementById("achievementDate");

  if (dateInput && !dateInput.value) {
    dateInput.value = isoDate();
  }

  const date =
    dateInput?.value || isoDate();

  const keyword =
    (
      document.getElementById("achievementName")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const allUsers = loadUsers();

  const staff = Object.entries(allUsers)
    .filter(([username, u]) => {
      return (
        u.role === "staff" &&
        (
          !keyword ||
          u.name.toLowerCase().includes(keyword) ||
          username.includes(keyword)
        )
      );
    })
    .sort((a, b) =>
      a[1].name.localeCompare(b[1].name)
    );

  const reports =
    getStore("arcReports").filter(
      (r) => r.date === date
    );

  const statusRows =
    getDailyStatus().filter(
      (r) => r.date === date
    );

  const tb =
    document.getElementById("achievementRows");

  if (!staff.length) {
    tb.innerHTML =
      '<tr><td class="empty" colspan="6">Staff tidak ditemukan.</td></tr>';
    return;
  }

  tb.innerHTML = staff
    .map(([username, u]) => {
      const dailyReports =
        reports.filter(
          (r) => r.username === username
        );

      const off =
        statusRows.find(
          (r) =>
            r.username === username &&
            r.status === "OFF"
        );

      if (dailyReports.length) {
        const report =
          dailyReports.sort(
            (a, b) =>
              b.createdAt.localeCompare(a.createdAt)
          )[0];

        const total =
          Math.min(
            Number(report.total || 0),
            100
          );

        const kurang =
          Math.max(0, 100 - total);

        const status =
          total >= 100
            ? "✅ 100%"
            : "⚠️ Kurang";

        return `
          <tr>
            <td>${esc(u.name)}</td>
            <td>${status}</td>

            <td>
              <b>
                ${total
                  .toFixed(2)
                  .replace(".", ",")}%
              </b>
            </td>

            <td>
              ${
                kurang <= 0
                  ? "-"
                  : kurang
                      .toFixed(2)
                      .replace(".", ",") + "%"
              }
            </td>

            <td>${report.time || "-"}</td>
            <td>-</td>
          </tr>
        `;
      }

      if (off) {
        return `
          <tr>
            <td>${esc(u.name)}</td>
            <td><b>OFF</b></td>
            <td>-</td>
            <td>-</td>
            <td>-</td>

            <td>
              <button
                class="edit-btn"
                onclick="setOffStatus('${username}','${date}',false)">
                Batalkan OFF
              </button>
            </td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${esc(u.name)}</td>
          <td>Belum Lapor</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>

          <td>
            <button
              class="mini-btn"
              onclick="setOffStatus('${username}','${date}',true)">
              Tandai OFF
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================
   CSV
========================= */

function csvEscape(v) {
  const s =
    String(v ?? "").replace(/"/g, '""');

  return `"${s}"`;
}

function downloadCSV(filename, rows) {
  const csv =
    "\ufeff" +
    rows
      .map((r) =>
        r.map(csvEscape).join(",")
      )
      .join("\n");

  const blob =
    new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function exportCSV(type) {
  if (type === "attendance") {
    const d =
      filterRows(
        getStore("arcAttendance"),
        "attDate",
        "attName"
      );

    downloadCSV(
      "ARC_Rekap_Absensi.csv",
      [
        [
          "Tanggal",
          "Nama",
          "Username",
          "Jam",
          "Foto"
        ],
        ...d.map((r) => [
          r.date,
          r.name,
          r.username,
          r.time,
          r.photoName || ""
        ])
      ]
    );
  }

  if (type === "cleaning") {
    const d =
      filterRows(
        getStore("arcCleaning"),
        "cleanDateFilter",
        "cleanNameFilter"
      );

    downloadCSV(
      "ARC_Rekap_Kebersihan.csv",
      [
        [
          "Tanggal",
          "Nama",
          "Username",
          "Area",
          "Jam"
        ],
        ...d.map((r) => [
          r.date,
          r.name,
          r.username,
          r.area,
          r.time
        ])
      ]
    );
  }

  if (type === "reports") {
    const d =
      filterRows(
        getStore("arcReports"),
        "reportDateFilter",
        "reportNameFilter"
      );

    downloadCSV(
      "ARC_Rekap_Laporan_Harian.csv",
      [
        [
          "Tanggal",
          "Nama",
          "Username",
          "Pekerjaan",
          "Total %",
          "Kurang %"
        ],
        ...d.map((r) => [
          r.date,
          r.name,
          r.username,

          r.jobs
            .map(
              (j) =>
                `${j.type} ${j.qty} SL ${j.note || ""}`
            )
            .join(" | "),

          r.total.toFixed(2),
          r.lack.toFixed(2)
        ])
      ]
    );
  }

  if (type === "achievement") {
    const date =
      document.getElementById("achievementDate")
        ?.value || isoDate();

    const keyword =
      (
        document.getElementById("achievementName")
          ?.value || ""
      )
        .trim()
        .toLowerCase();

    const allUsers = loadUsers();

    const reports =
      getStore("arcReports").filter(
        (r) => r.date === date
      );

    const statusRows =
      getDailyStatus().filter(
        (r) => r.date === date
      );

    const out = [
      [
        "Tanggal",
        "Nama",
        "Username",
        "Status",
        "Pencapaian %",
        "Kurang %",
        "Jam Lapor"
      ]
    ];

    Object.entries(allUsers)
      .filter(([username, u]) => {
        return (
          u.role === "staff" &&
          (
            !keyword ||
            u.name
              .toLowerCase()
              .includes(keyword) ||
            username.includes(keyword)
          )
        );
      })
      .sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
      )
      .forEach(([username, u]) => {
        const dailyReports =
          reports.filter(
            (r) =>
              r.username === username
          );

        const off =
          statusRows.find(
            (r) =>
              r.username === username &&
              r.status === "OFF"
          );

        if (dailyReports.length) {
          const report =
            dailyReports.sort(
              (a, b) =>
                b.createdAt.localeCompare(
                  a.createdAt
                )
            )[0];

          const total =
            Math.min(
              Number(report.total || 0),
              100
            );

          const kurang =
            Math.max(0, 100 - total);

          out.push([
            date,
            u.name,
            username,
            total >= 100
              ? "100%"
              : "Kurang",
            total.toFixed(2),
            kurang.toFixed(2),
            report.time || ""
          ]);
        } else if (off) {
          out.push([
            date,
            u.name,
            username,
            "OFF",
            "",
            "",
            ""
          ]);
        } else {
          out.push([
            date,
            u.name,
            username,
            "Belum Lapor",
            "",
            "",
            ""
          ]);
        }
      });

    downloadCSV(
      `ARC_Rekap_Pencapaian_${date}.csv`,
      out
    );
  }
}

/* =========================
   ARSIP
========================= */

function exportAll() {
  exportRaw("ARC_Arsip_Semua_Data.csv");
}

function exportRaw(filename) {
  const all = [
    [
      "Jenis",
      "Tanggal",
      "Nama",
      "Detail",
      "Jam",
      "Total %",
      "Kurang %"
    ]
  ];

  getStore("arcAttendance").forEach((r) => {
    all.push([
      "Absensi",
      r.date,
      r.name,
      "Masuk",
      r.time,
      "",
      ""
    ]);
  });

  getStore("arcCleaning").forEach((r) => {
    all.push([
      "Kebersihan",
      r.date,
      r.name,
      r.area,
      r.time,
      "",
      ""
    ]);
  });

  getStore("arcReports").forEach((r) => {
    all.push([
      "Laporan",
      r.date,
      r.name,

      r.jobs
        .map(
          (j) =>
            `${j.type} ${j.qty} SL ${j.note || ""}`
        )
        .join(" | "),

      r.time,
      r.total.toFixed(2),
      r.lack.toFixed(2)
    ]);
  });

  getDailyStatus().forEach((r) => {
    all.push([
      "Status Harian",
      r.date,
      r.name,
      r.status,
      "",
      "",
      ""
    ]);
  });

  downloadCSV(filename, all);
}

function purgeOldData() {
  const keys = [
    "arcAttendance",
    "arcCleaning",
    "arcReports",
    "arcDailyStatus"
  ];

  let deleted = 0;

  keys.forEach((key) => {
    const before = getStore(key);

    const keep =
      before.filter(
        (r) =>
          !isOlderThanRetention(
            r.createdAt
          )
      );

    deleted +=
      before.length - keep.length;

    setStore(key, keep);
  });

  alert(
    `${deleted} data lebih dari ${RETENTION_MONTHS} bulan dihapus. Data staff tetap aman.`
  );

  renderAdminSummary();
  renderRetentionInfo();
}

function renderRetentionInfo() {
  const d = cutoffDate();

  const info =
    document.getElementById(
      "retentionInfo"
    );

  if (info) {
    info.textContent =
      `Batas saat ini: data sebelum ${
        d.toLocaleDateString(
          "id-ID",
          {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        )
      } dapat dihapus.`;
  }
}

/* =========================
   SECURITY DISPLAY
========================= */

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[m]
  );
}

/* =========================
   START APP
========================= */

(function () {
  users = loadUsers();

  const saved =
    localStorage.getItem("arcUser");

  if (saved) {
    try {
      currentUser =
        JSON.parse(saved);

      if (currentUser.role === "admin") {
        showPage("adminPage");
      } else {
        showPage("dashboardPage");
      }
    } catch (e) {
      showPage("loginPage");
    }
  } else {
    showPage("loginPage");
  }
})();

setInterval(refreshMeta, 30000);
