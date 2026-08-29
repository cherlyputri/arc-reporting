const RETENTION_MONTHS = 6;

const DEFAULT_USERS = {
  admin: { password: "admin123", name: "Admin ARC", role: "admin" },
  hasan: { password: "123456", name: "Hasanudin", role: "staff" },
  sani: { password: "123456", name: "Muh Tohir Arsyani", role: "staff" },
  arfah: { password: "123456", name: "Muh Arfah", role: "staff" },
  fuad: { password: "123456", name: "Muh Fuad Aprilamsyah", role: "staff" },
  irsan: { password: "123456", name: "Irsan", role: "staff" },
  fathur: { password: "123456", name: "Muhammad Fathurrahman", role: "staff" },
  atok: { password: "123456", name: "Rizky Arianto", role: "staff" }
};

let users = loadUsers();
let currentUser = null;
let jobs = [];

/* =========================
   LOCAL STORAGE
========================= */

function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadUsers() {
  let savedUsers = {};

  try {
    savedUsers = JSON.parse(localStorage.getItem("arcUsers") || "{}");
  } catch (e) {
    savedUsers = {};
  }

  /*
   * Gabungkan user bawaan dengan user yang sudah pernah
   * ditambahkan lewat Admin.
   *
   * Dengan cara ini user baru di DEFAULT_USERS ikut muncul
   * tanpa perlu menghapus localStorage lama.
   */
  const mergedUsers = {
    ...DEFAULT_USERS,
    ...savedUsers
  };

  localStorage.setItem("arcUsers", JSON.stringify(mergedUsers));

  return mergedUsers;
}

function persistUsers() {
  localStorage.setItem("arcUsers", JSON.stringify(users));
}

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

/* =========================
   TANGGAL & WAKTU
========================= */

function isoDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function fmtDate(value) {
  if (!value) return "-";

  return new Date(value + "T00:00:00").toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function cutoffDate() {
  const d = new Date();

  d.setMonth(d.getMonth() - RETENTION_MONTHS);

  return d;
}

function isOlderThanRetention(createdAt) {
  if (!createdAt) return false;

  return new Date(createdAt) < cutoffDate();
}

/* =========================
   NAVIGASI
========================= */

function showPage(id) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add("active");
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

/* =========================
   LOGIN
========================= */

function login() {
  users = loadUsers();

  const usernameInput =
    document.getElementById("username");

  const passwordInput =
    document.getElementById("password");

  const username =
    usernameInput.value.trim().toLowerCase();

  const password =
    passwordInput.value;

  if (!username || !password) {
    alert("Masukkan username dan password.");
    return;
  }

  const account = users[username];

  if (!account) {
    alert("Username tidak ditemukan.");
    return;
  }

  if (account.password !== password) {
    alert("Password salah.");
    return;
  }

  currentUser = {
    username: username,
    ...account
  };

  localStorage.setItem(
    "arcUser",
    JSON.stringify(currentUser)
  );

  if (currentUser.role === "admin") {
    showPage("adminPage");
  } else {
    showPage("dashboardPage");
  }
}

function logout() {
  localStorage.removeItem("arcUser");

  currentUser = null;

  const username =
    document.getElementById("username");

  const password =
    document.getElementById("password");

  if (username) username.value = "";
  if (password) password.value = "";

  showPage("loginPage");
}

/* =========================
   INFORMASI NAMA/TANGGAL
========================= */

function refreshMeta() {
  const n = now();
  const name = currentUser?.name || "-";

  [
    "staffName",
    "absenName",
    "cleanName",
    "reportName"
  ].forEach((id) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = name;
    }
  });

  [
    "absenDate",
    "cleanDate",
    "reportDate"
  ].forEach((id) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = n.date;
    }
  });

  [
    "absenTime",
    "cleanTime",
    "reportTime"
  ].forEach((id) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = n.time;
    }
  });

  const todayText =
    document.getElementById("todayText");

  if (todayText) {
    todayText.textContent = n.date;
  }

  const areaSelect =
    document.getElementById("areaSelect");

  const cleanArea =
    document.getElementById("cleanArea");

  if (areaSelect && cleanArea) {
    cleanArea.textContent = areaSelect.value;
  }
}

document.addEventListener("change", function (event) {
  if (event.target.id === "areaSelect") {
    refreshMeta();
  }
});

/* =========================
   FOTO
========================= */

function previewImage(input, id) {
  const file = input.files && input.files[0];

  if (!file) return;

  const img = document.getElementById(id);

  if (!img) return;

  img.src = URL.createObjectURL(file);
  img.style.display = "block";
}

function photoName(id) {
  const input = document.getElementById(id);

  if (!input || !input.files || !input.files[0]) {
    return "";
  }

  return input.files[0].name;
}

/* =========================
   PEKERJAAN HARIAN
========================= */

function addJob() {
  const jobType =
    document.getElementById("jobType");

  const jobQty =
    document.getElementById("jobQty");

  const jobNote =
    document.getElementById("jobNote");

  const qty = Number(jobQty.value || 0);
  const note = jobNote.value.trim();

  if (qty <= 0) {
    alert("Isi jumlah SL terlebih dahulu.");
    return;
  }

  const selected =
    jobType.options[jobType.selectedIndex];

  const pct =
    Number(selected.dataset.pct || 0);

  jobs.push({
    type: jobType.value,
    qty: qty,
    pct: pct,
    note: note,
    total: qty * pct
  });

  jobQty.value = "";
  jobNote.value = "";

  renderJobs();
}

function removeJob(index) {
  jobs.splice(index, 1);

  renderJobs();
}

function renderJobs() {
  const box =
    document.getElementById("jobList");

  if (!box) return;

  box.innerHTML = jobs
    .map((job, index) => {
      return `
        <div class="job-row">
          <div>
            <b>${esc(job.type)}</b>
            ${
              job.note
                ? `<br><small>${esc(job.note)}</small>`
                : ""
            }
          </div>

          <div>
            ${job.qty} SL
          </div>

          <div>
            ${job.total.toFixed(2).replace(".", ",")}%
          </div>

          <button
            type="button"
            onclick="removeJob(${index})">
            ✕
          </button>
        </div>
      `;
    })
    .join("");

  const total = Math.min(
    jobs.reduce(
      (sum, job) => sum + job.total,
      0
    ),
    100
  );

  const lack =
    Math.max(0, 100 - total);

  const totalElement =
    document.getElementById("totalPct");

  const lackElement =
    document.getElementById("lackPct");

  if (totalElement) {
    totalElement.textContent =
      total.toFixed(2).replace(".", ",") + "%";
  }

  if (lackElement) {
    lackElement.textContent =
      lack.toFixed(2).replace(".", ",") + "%";
  }
}

/* =========================
   SIMPAN ABSENSI
========================= */

function saveAttendance() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const n = now();

  const rows =
    getStore("arcAttendance");

  rows.push({
    id: uid(),
    username: currentUser.username,
    name: currentUser.name,
    date: n.isoDate,
    time: n.time,
    createdAt: n.iso,
    photoName: photoName("absenPhoto")
  });

  setStore(
    "arcAttendance",
    rows
  );

  alert("Absensi berhasil disimpan.");
}

/* =========================
   SIMPAN KEBERSIHAN
========================= */

function saveCleaning() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const area =
    document.getElementById("areaSelect").value;

  const n = now();

  const rows =
    getStore("arcCleaning");

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

  setStore(
    "arcCleaning",
    rows
  );

  alert(
    "Laporan kebersihan berhasil disimpan."
  );
}

/* =========================
   SIMPAN LAPORAN HARIAN
========================= */

function saveDailyReport() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  if (!jobs.length) {
    alert("Tambahkan pekerjaan terlebih dahulu.");
    return;
  }

  const n = now();

  const rows =
    getStore("arcReports");

  const total = Math.min(
    jobs.reduce(
      (sum, job) => sum + job.total,
      0
    ),
    100
  );

  const lack =
    Math.max(0, 100 - total);

  rows.push({
    id: uid(),
    username: currentUser.username,
    name: currentUser.name,
    date: n.isoDate,
    time: n.time,
    createdAt: n.iso,
    total: total,
    lack: lack,
    jobs: JSON.parse(
      JSON.stringify(jobs)
    ),
    photoName: photoName("reportPhoto")
  });

  setStore(
    "arcReports",
    rows
  );

  alert(
    "Laporan harian berhasil disimpan."
  );

  /*
   * Jangan kosongkan jobs di sini.
   * Data masih diperlukan ketika staff
   * menekan Bagikan ke WhatsApp.
   */
}

/* =========================
   SHARE FOTO + TEKS
========================= */

async function copyAndOpenWA(type) {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  refreshMeta();

  const n = now();
  const name = currentUser.name;

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

    const area =
      document.getElementById("areaSelect").value;

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
      alert(
        "Tambahkan pekerjaan terlebih dahulu."
      );
      return;
    }

    const total = Math.min(
      jobs.reduce(
        (sum, job) =>
          sum + job.total,
        0
      ),
      100
    );

    const kurang =
      Math.max(0, 100 - total);

    const detail = jobs
      .map((job) => {
        let line =
          `${job.type}\n` +
          `${job.qty} SL = ` +
          `${job.total.toFixed(2).replace(".", ",")}%`;

        if (job.note) {
          line += `\n${job.note}`;
        }

        return line;
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

  const input =
    document.getElementById(photoInputId);

  const file =
    input &&
    input.files &&
    input.files[0];

  if (!file) {
    alert(
      "Ambil atau pilih foto terlebih dahulu."
    );
    return;
  }

  /*
   * Coba share FOTO + TEKS melalui
   * menu Share bawaan HP.
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
        title:
          "ARC - Admin Reporting and Certification",
        text: text,
        files: [file]
      });

      return;
    } catch (error) {
      if (
        error &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Share gagal:",
        error
      );
    }
  }

  /*
   * Fallback jika HP/browser tidak
   * mendukung share file.
   */
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea =
      document.createElement("textarea");

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
    "Browser ini belum mendukung berbagi foto + teks sekaligus. " +
    "Teks laporan sudah disalin. WhatsApp akan dibuka dan foto dapat dilampirkan secara manual."
  );

  window.open(
    "https://wa.me/",
    "_blank"
  );
}

/* =========================
   ADMIN - MENU
========================= */

function showAdminSection(id) {
  document
    .querySelectorAll(".admin-section")
    .forEach((section) => {
      section.classList.add("hidden");
    });

  const target =
    document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  if (id === "staffSection") {
    renderStaff();
  }

  if (id === "attendanceSection") {
    renderAttendance();
  }

  if (id === "cleaningSection") {
    renderCleaning();
  }

  if (id === "reportSection") {
    renderReports();
  }

  if (id === "achievementSection") {
    renderAchievement();
  }

  if (id === "archiveSection") {
    renderRetentionInfo();
  }
}

function renderAdminSummary() {
  users = loadUsers();

  const staff =
    Object.values(users).filter(
      (user) =>
        user.role === "staff"
    );

  const today = isoDate();

  const totalStaff =
    document.getElementById("totalStaff");

  const todayAttendance =
    document.getElementById("todayAttendance");

  const todayCleaning =
    document.getElementById("todayCleaning");

  const todayReport =
    document.getElementById("todayReport");

  if (totalStaff) {
    totalStaff.textContent =
      staff.length;
  }

  if (todayAttendance) {
    todayAttendance.textContent =
      getStore("arcAttendance").filter(
        (row) =>
          row.date === today
      ).length;
  }

  if (todayCleaning) {
    todayCleaning.textContent =
      getStore("arcCleaning").filter(
        (row) =>
          row.date === today
      ).length;
  }

  if (todayReport) {
    todayReport.textContent =
      getStore("arcReports").filter(
        (row) =>
          row.date === today
      ).length;
  }
}

/* =========================
   ADMIN - DATA STAFF
========================= */

function renderStaff() {
  users = loadUsers();

  renderAdminSummary();

  const search =
    document.getElementById("staffSearch");

  const keyword =
    (search?.value || "")
      .trim()
      .toLowerCase();

  const box =
    document.getElementById("staffList");

  if (!box) return;

  const rows =
    Object.entries(users)
      .filter(
        ([username, user]) => {
          if (username === "admin") {
            return false;
          }

          return (
            !keyword ||
            username.includes(keyword) ||
            user.name
              .toLowerCase()
              .includes(keyword)
          );
        }
      )
      .sort(
        (a, b) =>
          a[1].name.localeCompare(
            b[1].name
          )
      );

  if (!rows.length) {
    box.innerHTML =
      '<p class="hint">Data staff tidak ditemukan.</p>';

    return;
  }

  box.innerHTML = rows
    .map(([username, user]) => {
      return `
        <div class="staff-item">

          <div class="staff-meta">
            <b>${esc(user.name)}</b>
            <small>@${esc(username)}</small>

            <span class="role-badge">
              ${
                user.role === "admin"
                  ? "Admin"
                  : "Staff"
              }
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
      `;
    })
    .join("");
}

function openStaffForm() {
  document.getElementById(
    "staffFormTitle"
  ).textContent = "Tambah Staff";

  document.getElementById(
    "editUsername"
  ).value = "";

  document.getElementById(
    "staffFullName"
  ).value = "";

  document.getElementById(
    "staffUsername"
  ).value = "";

  document.getElementById(
    "staffPassword"
  ).value = "";

  document.getElementById(
    "staffRole"
  ).value = "staff";

  document.getElementById(
    "staffUsername"
  ).disabled = false;

  showPage("staffFormPage");
}

function editStaff(username) {
  users = loadUsers();

  const user = users[username];

  if (!user) return;

  document.getElementById(
    "staffFormTitle"
  ).textContent = "Edit Staff";

  document.getElementById(
    "editUsername"
  ).value = username;

  document.getElementById(
    "staffFullName"
  ).value = user.name;

  document.getElementById(
    "staffUsername"
  ).value = username;

  document.getElementById(
    "staffPassword"
  ).value = user.password;

  document.getElementById(
    "staffRole"
  ).value = user.role || "staff";

  document.getElementById(
    "staffUsername"
  ).disabled = true;

  showPage("staffFormPage");
}

function saveStaff() {
  users = loadUsers();

  const editUsername =
    document.getElementById(
      "editUsername"
    ).value;

  const name =
    document.getElementById(
      "staffFullName"
    ).value.trim();

  const username =
    document.getElementById(
      "staffUsername"
    ).value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById(
      "staffPassword"
    ).value;

  const role =
    document.getElementById(
      "staffRole"
    ).value;

  if (
    !name ||
    !username ||
    !password
  ) {
    alert(
      "Nama, username, dan password wajib diisi."
    );

    return;
  }

  if (
    !/^[a-z0-9._-]+$/.test(
      username
    )
  ) {
    alert(
      "Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau strip."
    );

    return;
  }

  if (
    !editUsername &&
    users[username]
  ) {
    alert(
      "Username sudah digunakan."
    );

    return;
  }

  /*
   * Jika username sedang diedit,
   * hapus key lama terlebih dahulu.
   */
  if (
    editUsername &&
    editUsername !== username
  ) {
    delete users[editUsername];
  }

  users[username] = {
    name: name,
    password: password,
    role: role
  };

  persistUsers();

  alert(
    "Data staff berhasil disimpan."
  );

  document.getElementById(
    "staffUsername"
  ).disabled = false;

  showPage("adminPage");
}

function deleteStaff(username) {
  if (
    !confirm(
      `Hapus staff @${username}?`
    )
  ) {
    return;
  }

  users = loadUsers();

  delete users[username];

  persistUsers();

  renderStaff();
}

/* =========================
   FILTER REKAP
========================= */

function filterRows(
  rows,
  dateId,
  nameId
) {
  const date =
    document.getElementById(dateId)
      ?.value || "";

  const name =
    (
      document.getElementById(nameId)
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  return rows
    .filter((row) => {
      const matchDate =
        !date ||
        row.date === date;

      const matchName =
        !name ||
        String(row.name || "")
          .toLowerCase()
          .includes(name);

      return (
        matchDate &&
        matchName
      );
    })
    .sort((a, b) => {
      return String(
        b.createdAt || ""
      ).localeCompare(
        String(
          a.createdAt || ""
        )
      );
    });
}

/* =========================
   REKAP ABSENSI
========================= */

function renderAttendance() {
  const rows =
    filterRows(
      getStore("arcAttendance"),
      "attDate",
      "attName"
    );

  const table =
    document.getElementById(
      "attendanceRows"
    );

  if (!table) return;

  if (!rows.length) {
    table.innerHTML =
      '<tr><td class="empty" colspan="4">Belum ada data.</td></tr>';

    return;
  }

  table.innerHTML = rows
    .map((row) => {
      return `
        <tr>
          <td>${fmtDate(row.date)}</td>
          <td>${esc(row.name)}</td>
          <td>${esc(row.time)}</td>
          <td>${row.photoName ? "Ada" : "-"}</td>
        </tr>
      `;
    })
    .join("");
}

/* =========================
   REKAP KEBERSIHAN
========================= */

function renderCleaning() {
  const rows =
    filterRows(
      getStore("arcCleaning"),
      "cleanDateFilter",
      "cleanNameFilter"
    );

  const table =
    document.getElementById(
      "cleaningRows"
    );

  if (!table) return;

  if (!rows.length) {
    table.innerHTML =
      '<tr><td class="empty" colspan="4">Belum ada data.</td></tr>';

    return;
  }

  table.innerHTML = rows
    .map((row) => {
      return `
        <tr>
          <td>${fmtDate(row.date)}</td>
          <td>${esc(row.name)}</td>
          <td>${esc(row.area)}</td>
          <td>${esc(row.time)}</td>
        </tr>
      `;
    })
    .join("");
}

/* =========================
   REKAP LAPORAN
========================= */

function renderReports() {
  const rows =
    filterRows(
      getStore("arcReports"),
      "reportDateFilter",
      "reportNameFilter"
    );

  const table =
    document.getElementById(
      "reportRows"
    );

  if (!table) return;

  if (!rows.length) {
    table.innerHTML =
      '<tr><td class="empty" colspan="5">Belum ada data.</td></tr>';

    return;
  }

  table.innerHTML = rows
    .map((row) => {
      const jobText =
        (row.jobs || [])
          .map(
            (job) =>
              `${esc(job.type)} (${job.qty} SL)`
          )
          .join("<br>");

      return `
        <tr>
          <td>${fmtDate(row.date)}</td>
          <td>${esc(row.name)}</td>
          <td>${jobText}</td>

          <td>
            ${Number(row.total || 0)
              .toFixed(2)
              .replace(".", ",")}%
          </td>

          <td>
            ${Number(row.lack || 0)
              .toFixed(2)
              .replace(".", ",")}%
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================
   STATUS OFF
========================= */

function getDailyStatus() {
  return getStore(
    "arcDailyStatus"
  );
}

function setDailyStatus(rows) {
  setStore(
    "arcDailyStatus",
    rows
  );
}

function setOffStatus(
  username,
  date,
  isOff = true
) {
  let rows =
    getDailyStatus().filter(
      (row) =>
        !(
          row.username === username &&
          row.date === date
        )
    );

  if (isOff) {
    const user =
      loadUsers()[username];

    rows.push({
      id: uid(),
      username: username,
      name:
        user?.name || username,
      date: date,
      status: "OFF",
      createdAt:
        new Date().toISOString()
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
    document.getElementById(
      "achievementDate"
    );

  if (
    dateInput &&
    !dateInput.value
  ) {
    dateInput.value =
      isoDate();
  }

  const date =
    dateInput?.value ||
    isoDate();

  const keyword =
    (
      document.getElementById(
        "achievementName"
      )?.value || ""
    )
      .trim()
      .toLowerCase();

  const allUsers =
    loadUsers();

  const staff =
    Object.entries(allUsers)
      .filter(
        ([username, user]) => {
          return (
            user.role === "staff" &&
            (
              !keyword ||
              username.includes(keyword) ||
              user.name
                .toLowerCase()
                .includes(keyword)
            )
          );
        }
      )
      .sort(
        (a, b) =>
          a[1].name.localeCompare(
            b[1].name
          )
      );

  const reports =
    getStore("arcReports")
      .filter(
        (row) =>
          row.date === date
      );

  const statusRows =
    getDailyStatus()
      .filter(
        (row) =>
          row.date === date
      );

  const table =
    document.getElementById(
      "achievementRows"
    );

  if (!table) return;

  if (!staff.length) {
    table.innerHTML =
      '<tr><td class="empty" colspan="6">Staff tidak ditemukan.</td></tr>';

    return;
  }

  table.innerHTML =
    staff
      .map(
        ([username, user]) => {
          const dailyReports =
            reports
              .filter(
                (row) =>
                  row.username === username
              )
              .sort(
                (a, b) =>
                  String(
                    b.createdAt || ""
                  ).localeCompare(
                    String(
                      a.createdAt || ""
                    )
                  )
              );

          const off =
            statusRows.find(
              (row) =>
                row.username === username &&
                row.status === "OFF"
            );

          if (
            dailyReports.length
          ) {
            const report =
              dailyReports[0];

            const total =
              Math.min(
                Number(
                  report.total || 0
                ),
                100
              );

            const kurang =
              Math.max(
                0,
                100 - total
              );

            const status =
              total >= 100
                ? "✅ 100%"
                : "⚠️ Kurang";

            return `
              <tr>

                <td>
                  ${esc(user.name)}
                </td>

                <td>
                  ${status}
                </td>

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
                          .replace(".", ",") +
                        "%"
                  }
                </td>

                <td>
                  ${esc(
                    report.time || "-"
                  )}
                </td>

                <td>-</td>

              </tr>
            `;
          }

          if (off) {
            return `
              <tr>

                <td>
                  ${esc(user.name)}
                </td>

                <td>
                  <b>OFF</b>
                </td>

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

              <td>
                ${esc(user.name)}
              </td>

              <td>
                Belum Lapor
              </td>

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
        }
      )
      .join("");
}

/* =========================
   EXPORT CSV
========================= */

function csvEscape(value) {
  const text =
    String(
      value ?? ""
    ).replace(
      /"/g,
      '""'
    );

  return `"${text}"`;
}

function downloadCSV(
  filename,
  rows
) {
  const csv =
    "\ufeff" +
    rows
      .map(
        (row) =>
          row
            .map(csvEscape)
            .join(",")
      )
      .join("\n");

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;
  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function exportCSV(type) {
  if (type === "attendance") {
    const data =
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

        ...data.map(
          (row) => [
            row.date,
            row.name,
            row.username,
            row.time,
            row.photoName || ""
          ]
        )
      ]
    );

    return;
  }

  if (type === "cleaning") {
    const data =
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

        ...data.map(
          (row) => [
            row.date,
            row.name,
            row.username,
            row.area,
            row.time
          ]
        )
      ]
    );

    return;
  }

  if (type === "reports") {
    const data =
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

        ...data.map(
          (row) => [
            row.date,
            row.name,
            row.username,

            (row.jobs || [])
              .map(
                (job) =>
                  `${job.type} ${job.qty} SL ${job.note || ""}`
              )
              .join(" | "),

            Number(
              row.total || 0
            ).toFixed(2),

            Number(
              row.lack || 0
            ).toFixed(2)
          ]
        )
      ]
    );

    return;
  }

  if (type === "achievement") {
    const date =
      document.getElementById(
        "achievementDate"
      )?.value ||
      isoDate();

    const keyword =
      (
        document.getElementById(
          "achievementName"
        )?.value || ""
      )
        .trim()
        .toLowerCase();

    const allUsers =
      loadUsers();

    const reports =
      getStore("arcReports")
        .filter(
          (row) =>
            row.date === date
        );

    const statusRows =
      getDailyStatus()
        .filter(
          (row) =>
            row.date === date
        );

    const output = [
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

    Object.entries(
      allUsers
    )
      .filter(
        ([username, user]) =>
          user.role === "staff" &&
          (
            !keyword ||
            username.includes(
              keyword
            ) ||
            user.name
              .toLowerCase()
              .includes(keyword)
          )
      )
      .sort(
        (a, b) =>
          a[1].name.localeCompare(
            b[1].name
          )
      )
      .forEach(
        ([username, user]) => {
          const dailyReports =
            reports
              .filter(
                (row) =>
                  row.username === username
              )
              .sort(
                (a, b) =>
                  String(
                    b.createdAt || ""
                  ).localeCompare(
                    String(
                      a.createdAt || ""
                    )
                  )
              );

          const off =
            statusRows.find(
              (row) =>
                row.username === username &&
                row.status === "OFF"
            );

          if (
            dailyReports.length
          ) {
            const report =
              dailyReports[0];

            const total =
              Math.min(
                Number(
                  report.total || 0
                ),
                100
              );

            const kurang =
              Math.max(
                0,
                100 - total
              );

            output.push([
              date,
              user.name,
              username,

              total >= 100
                ? "100%"
                : "Kurang",

              total.toFixed(2),
              kurang.toFixed(2),
              report.time || ""
            ]);
          } else if (off) {
            output.push([
              date,
              user.name,
              username,
              "OFF",
              "",
              "",
              ""
            ]);
          } else {
            output.push([
              date,
              user.name,
              username,
              "Belum Lapor",
              "",
              "",
              ""
            ]);
          }
        }
      );

    downloadCSV(
      `ARC_Rekap_Pencapaian_${date}.csv`,
      output
    );
  }
}

/* =========================
   ARSIP SEMUA DATA
========================= */

function exportAll() {
  exportRaw(
    "ARC_Arsip_Semua_Data.csv"
  );
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

  getStore(
    "arcAttendance"
  ).forEach((row) => {
    all.push([
      "Absensi",
      row.date,
      row.name,
      "Masuk",
      row.time,
      "",
      ""
    ]);
  });

  getStore(
    "arcCleaning"
  ).forEach((row) => {
    all.push([
      "Kebersihan",
      row.date,
      row.name,
      row.area,
      row.time,
      "",
      ""
    ]);
  });

  getStore(
    "arcReports"
  ).forEach((row) => {
    const detail =
      (row.jobs || [])
        .map(
          (job) =>
            `${job.type} ${job.qty} SL ${job.note || ""}`
        )
        .join(" | ");

    all.push([
      "Laporan",
      row.date,
      row.name,
      detail,
      row.time,
      Number(
        row.total || 0
      ).toFixed(2),
      Number(
        row.lack || 0
      ).toFixed(2)
    ]);
  });

  getDailyStatus()
    .forEach((row) => {
      all.push([
        "Status Harian",
        row.date,
        row.name,
        row.status,
        "",
        "",
        ""
      ]);
    });

  downloadCSV(
    filename,
    all
  );
}

/* =========================
   RETENSI 6 BULAN
========================= */

function purgeOldData() {
  const keys = [
    "arcAttendance",
    "arcCleaning",
    "arcReports",
    "arcDailyStatus"
  ];

  let deleted = 0;

  keys.forEach((key) => {
    const before =
      getStore(key);

    const keep =
      before.filter(
        (row) =>
          !isOlderThanRetention(
            row.createdAt
          )
      );

    deleted +=
      before.length -
      keep.length;

    setStore(
      key,
      keep
    );
  });

  alert(
    `${deleted} data lebih dari ${RETENTION_MONTHS} bulan berhasil dihapus. Data staff tidak ikut terhapus.`
  );

  renderAdminSummary();
  renderRetentionInfo();
}

function renderRetentionInfo() {
  const d =
    cutoffDate();

  const info =
    document.getElementById(
      "retentionInfo"
    );

  if (!info) return;

  info.textContent =
    `Batas saat ini: data sebelum ${d.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    )} dapat dihapus.`;
}

/* =========================
   ESCAPE HTML
========================= */

function esc(value) {
  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    function (char) {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return map[char];
    }
  );
}

/* =========================
   START
========================= */

(function startARC() {
  users = loadUsers();

  const saved =
    localStorage.getItem(
      "arcUser"
    );

  if (saved) {
    try {
      currentUser =
        JSON.parse(saved);

      /*
       * Pastikan akun masih ada.
       */
      if (
        currentUser &&
        users[
          currentUser.username
        ]
      ) {
        currentUser = {
          username:
            currentUser.username,
          ...users[
            currentUser.username
          ]
        };

        if (
          currentUser.role ===
          "admin"
        ) {
          showPage(
            "adminPage"
          );
        } else {
          showPage(
            "dashboardPage"
          );
        }

        return;
      }
    } catch (error) {
      console.error(
        "Session error:",
        error
      );
    }
  }

  localStorage.removeItem(
    "arcUser"
  );

  currentUser = null;

  showPage("loginPage");
})();

setInterval(
  refreshMeta,
  30000
);
