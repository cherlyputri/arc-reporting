
const RETENTION_MONTHS = 6;
const DEFAULT_USERS = {
  admin:{password:"admin123",name:"Admin ARC",role:"admin"},
  hasan:{password:"123456",name:"Hasan",role:"staff"},
  sani:{password:"123456",name:"Sani",role:"staff"},
  arfah:{password:"123456",name:"Arfah",role:"staff"},
  fuad:{password:"123456",name:"Fuad",role:"staff"}
};

let users = loadUsers();
let currentUser = null;
let jobs = [];

function getStore(key){ try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]} }
function setStore(key,val){ localStorage.setItem(key,JSON.stringify(val)) }
function loadUsers(){
  const saved=localStorage.getItem('arcUsers');
  if(saved){ try{return JSON.parse(saved)}catch(e){} }
  localStorage.setItem('arcUsers',JSON.stringify(DEFAULT_USERS));
  return JSON.parse(JSON.stringify(DEFAULT_USERS));
}
function persistUsers(){localStorage.setItem('arcUsers',JSON.stringify(users))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function isoDate(d=new Date()){return d.toISOString().slice(0,10)}
function now(){
  const d=new Date();
  return {iso:d.toISOString(),isoDate:isoDate(d),date:d.toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}),time:d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace('.',':')}
}
function fmtDate(v){return new Date(v+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}
function cutoffDate(){
  const d=new Date(); d.setMonth(d.getMonth()-RETENTION_MONTHS); return d;
}
function isOlderThanRetention(iso){return new Date(iso)<cutoffDate()}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  refreshMeta();
  if(id==='adminPage'){renderAdminSummary();showAdminSection('staffSection')}
  window.scrollTo({top:0,behavior:'smooth'});
}
function login(){
  users=loadUsers();
  const u=document.getElementById('username').value.trim().toLowerCase(),p=document.getElementById('password').value;
  if(users[u]&&users[u].password===p){
    currentUser={username:u,...users[u]};localStorage.setItem('arcUser',JSON.stringify(currentUser));
    showPage(currentUser.role==='admin'?'adminPage':'dashboardPage');
  }else alert('Username atau password salah.');
}
function logout(){localStorage.removeItem('arcUser');currentUser=null;document.getElementById('username').value='';document.getElementById('password').value='';showPage('loginPage')}
function refreshMeta(){
  const n=now(),name=currentUser?.name||'-';
  ['staffName','absenName','cleanName','reportName'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=name});
  ['absenDate','cleanDate','reportDate'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=n.date});
  ['absenTime','cleanTime','reportTime'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=n.time});
  const t=document.getElementById('todayText');if(t)t.textContent=n.date;
  const a=document.getElementById('areaSelect'),ca=document.getElementById('cleanArea');if(a&&ca)ca.textContent=a.value;
}
document.addEventListener('change',e=>{if(e.target.id==='areaSelect')refreshMeta()});
function previewImage(input,id){const f=input.files?.[0];if(!f)return;const img=document.getElementById(id);img.src=URL.createObjectURL(f)}

function addJob(){
  const sel=document.getElementById('jobType'),qty=Number(document.getElementById('jobQty').value||0),note=document.getElementById('jobNote').value.trim();
  if(qty<=0){alert('Isi jumlah SL dulu.');return}
  const pct=Number(sel.options[sel.selectedIndex].dataset.pct);
  jobs.push({type:sel.value,qty,pct,note,total:qty*pct});
  document.getElementById('jobQty').value='';document.getElementById('jobNote').value='';renderJobs();
}
function removeJob(i){jobs.splice(i,1);renderJobs()}
function renderJobs(){
  const box=document.getElementById('jobList');
  box.innerHTML=jobs.map((j,i)=>`<div class="job-row"><div><b>${esc(j.type)}</b>${j.note?`<br><small>${esc(j.note)}</small>`:''}</div><div>${j.qty} SL</div><div>${j.total.toFixed(2).replace('.',',')}%</div><button onclick="removeJob(${i})">✕</button></div>`).join('');
  const total=Math.min(jobs.reduce((a,b)=>a+b.total,0),100);
  document.getElementById('totalPct').textContent=total.toFixed(2).replace('.',',')+'%';
  document.getElementById('lackPct').textContent=Math.max(0,100-total).toFixed(2).replace('.',',')+'%';
}
function photoName(id){return document.getElementById(id)?.files?.[0]?.name||''}

function saveAttendance(){
  if(!currentUser)return;
  const n=now(),rows=getStore('arcAttendance');
  rows.push({id:uid(),username:currentUser.username,name:currentUser.name,date:n.isoDate,time:n.time,createdAt:n.iso,photoName:photoName('absenPhoto')});
  setStore('arcAttendance',rows);alert('Absensi tersimpan.');
}
function saveCleaning(){
  if(!currentUser)return;
  const n=now(),rows=getStore('arcCleaning'),area=document.getElementById('areaSelect').value;
  rows.push({id:uid(),username:currentUser.username,name:currentUser.name,area,date:n.isoDate,time:n.time,createdAt:n.iso,photoName:photoName('cleanPhoto')});
  setStore('arcCleaning',rows);alert('Laporan kebersihan tersimpan.');
}
function saveDailyReport(){
  if(!currentUser)return;if(!jobs.length){alert('Tambahkan pekerjaan dulu.');return}
  const n=now(),rows=getStore('arcReports'),total=Math.min(jobs.reduce((a,b)=>a+b.total,0),100),lack=Math.max(0,100-total);
  rows.push({id:uid(),username:currentUser.username,name:currentUser.name,date:n.isoDate,time:n.time,createdAt:n.iso,total,lack,jobs:JSON.parse(JSON.stringify(jobs)),photoName:photoName('reportPhoto')});
  setStore('arcReports',rows);alert('Laporan harian tersimpan.');jobs=[];renderJobs();
}

async function copyAndOpenWA(type){
  refreshMeta();const n=now(),name=currentUser?.name||'-';let text='';
  if(type==='absen')text=`✅ ABSENSI MASUK\n\n👤 Nama: ${name}\n📅 Tanggal: ${n.date}\n🕐 Jam: ${n.time}\n\n📸 Foto kedatangan terlampir`;
  if(type==='clean'){const area=document.getElementById('areaSelect').value;text=`🧹 LAPORAN KEBERSIHAN LAB\n\n👤 Nama: ${name}\n📍 Area: ${area}\n📅 Tanggal: ${n.date}\n🕐 Jam: ${n.time}\n\n📸 Foto area terlampir`}
  if(type==='report'){
    if(!jobs.length){alert('Tambahkan pekerjaan dulu.');return}
    const total=Math.min(jobs.reduce((a,b)=>a+b.total,0),100),kurang=Math.max(0,100-total),detail=jobs.map(j=>`${j.type}\n${j.qty} SL = ${j.total.toFixed(2).replace('.',',')}%${j.note?`\n${j.note}`:''}`).join('\n\n');
    text=`📝 LAPORAN HARIAN\n\n👤 Nama: ${name}\n📅 Tanggal: ${n.date}\n🕐 Jam: ${n.time}\n\n${detail}\n\n📊 TOTAL: ${total.toFixed(2).replace('.',',')}%\n⚠️ KURANG: ${kurang.toFixed(2).replace('.',',')}%\n\n📸 Foto lembar kerja terlampir`;
  }
  try{await navigator.clipboard.writeText(text)}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
  alert('Teks laporan sudah disalin. WhatsApp akan dibuka. Pilih grup kerja, paste teks, lalu kirim bersama foto.');
  window.open('https://wa.me/','_blank');
}

/* ADMIN */
function showAdminSection(id){
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if(id==='staffSection')renderStaff();
  if(id==='attendanceSection')renderAttendance();
  if(id==='cleaningSection')renderCleaning();
  if(id==='reportSection')renderReports();
  if(id==='achievementSection')renderAchievement();
  if(id==='archiveSection')renderRetentionInfo();
}
function renderAdminSummary(){
  users=loadUsers();document.getElementById('totalStaff').textContent=Object.values(users).filter(u=>u.role==='staff').length;
  const today=isoDate();
  document.getElementById('todayAttendance').textContent=getStore('arcAttendance').filter(r=>r.date===today).length;
  document.getElementById('todayCleaning').textContent=getStore('arcCleaning').filter(r=>r.date===today).length;
  document.getElementById('todayReport').textContent=getStore('arcReports').filter(r=>r.date===today).length;
}
function renderStaff(){
  users=loadUsers();renderAdminSummary();
  const kw=(document.getElementById('staffSearch')?.value||'').toLowerCase(),box=document.getElementById('staffList');
  const rows=Object.entries(users).filter(([username,u])=>username!=='admin'&&(!kw||username.includes(kw)||u.name.toLowerCase().includes(kw))).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  box.innerHTML=rows.length?rows.map(([username,u])=>`<div class="staff-item"><div class="staff-meta"><b>${esc(u.name)}</b><small>@${esc(username)}</small><span class="role-badge">${u.role==='admin'?'Admin':'Staff'}</span></div><div class="staff-actions"><button class="edit-btn" onclick="editStaff('${username}')">Edit</button><button class="delete-btn" onclick="deleteStaff('${username}')">Hapus</button></div></div>`).join(''):'<p class="hint">Data staff tidak ditemukan.</p>';
}
function openStaffForm(){document.getElementById('staffFormTitle').textContent='Tambah Staff';document.getElementById('editUsername').value='';document.getElementById('staffFullName').value='';document.getElementById('staffUsername').value='';document.getElementById('staffPassword').value='';document.getElementById('staffRole').value='staff';document.getElementById('staffUsername').disabled=false;showPage('staffFormPage')}
function editStaff(username){users=loadUsers();const u=users[username];if(!u)return;document.getElementById('staffFormTitle').textContent='Edit Staff';document.getElementById('editUsername').value=username;document.getElementById('staffFullName').value=u.name;document.getElementById('staffUsername').value=username;document.getElementById('staffPassword').value=u.password;document.getElementById('staffRole').value=u.role||'staff';document.getElementById('staffUsername').disabled=true;showPage('staffFormPage')}
function saveStaff(){users=loadUsers();const editUsername=document.getElementById('editUsername').value,name=document.getElementById('staffFullName').value.trim(),username=document.getElementById('staffUsername').value.trim().toLowerCase(),password=document.getElementById('staffPassword').value,role=document.getElementById('staffRole').value;if(!name||!username||!password){alert('Nama, username, dan password wajib diisi.');return}if(!/^[a-z0-9._-]+$/.test(username)){alert('Username hanya boleh huruf kecil, angka, titik, garis bawah, atau strip.');return}if(!editUsername&&users[username]){alert('Username sudah digunakan.');return}users[editUsername||username]={name,password,role};persistUsers();alert('Data staff berhasil disimpan.');document.getElementById('staffUsername').disabled=false;showPage('adminPage')}
function deleteStaff(username){if(!confirm(`Hapus staff @${username}?`))return;users=loadUsers();delete users[username];persistUsers();renderStaff()}

function filterRows(rows,dateId,nameId){
  const date=document.getElementById(dateId)?.value||'',name=(document.getElementById(nameId)?.value||'').toLowerCase();
  return rows.filter(r=>(!date||r.date===date)&&(!name||r.name.toLowerCase().includes(name))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
function renderAttendance(){
  const rows=filterRows(getStore('arcAttendance'),'attDate','attName'),tb=document.getElementById('attendanceRows');
  tb.innerHTML=rows.length?rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.name)}</td><td>${r.time}</td><td>${r.photoName?'Ada':'-'}</td></tr>`).join(''):`<tr><td class="empty" colspan="4">Belum ada data.</td></tr>`;
}
function renderCleaning(){
  const rows=filterRows(getStore('arcCleaning'),'cleanDateFilter','cleanNameFilter'),tb=document.getElementById('cleaningRows');
  tb.innerHTML=rows.length?rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.name)}</td><td>${esc(r.area)}</td><td>${r.time}</td></tr>`).join(''):`<tr><td class="empty" colspan="4">Belum ada data.</td></tr>`;
}
function renderReports(){
  const rows=filterRows(getStore('arcReports'),'reportDateFilter','reportNameFilter'),tb=document.getElementById('reportRows');
  tb.innerHTML=rows.length?rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.name)}</td><td>${r.jobs.map(j=>`${esc(j.type)} (${j.qty} SL)`).join('<br>')}</td><td>${r.total.toFixed(2).replace('.',',')}%</td><td>${r.lack.toFixed(2).replace('.',',')}%</td></tr>`).join(''):`<tr><td class="empty" colspan="5">Belum ada data.</td></tr>`;
}
function getDailyStatus(){ return getStore('arcDailyStatus') }
function setDailyStatus(rows){ setStore('arcDailyStatus',rows) }

function setOffStatus(username,date,isOff=true){
  let rows=getDailyStatus().filter(r=>!(r.username===username && r.date===date));
  if(isOff){
    const u=loadUsers()[username];
    rows.push({id:uid(),username,name:u?.name||username,date,status:'OFF',createdAt:new Date().toISOString()});
  }
  setDailyStatus(rows);
  renderAchievement();
}

function renderAchievement(){
  const dateInput=document.getElementById('achievementDate');
  if(dateInput && !dateInput.value) dateInput.value=isoDate();

  const date=dateInput?.value||isoDate();
  const keyword=(document.getElementById('achievementName')?.value||'').trim().toLowerCase();
  const allUsers=loadUsers();
  const staff=Object.entries(allUsers)
    .filter(([username,u])=>u.role==='staff' && (!keyword || u.name.toLowerCase().includes(keyword) || username.includes(keyword)))
    .sort((a,b)=>a[1].name.localeCompare(b[1].name));

  const reports=getStore('arcReports').filter(r=>r.date===date);
  const statusRows=getDailyStatus().filter(r=>r.date===date);

  const tb=document.getElementById('achievementRows');
  if(!staff.length){
    tb.innerHTML=`<tr><td class="empty" colspan="6">Staff tidak ditemukan.</td></tr>`;
    return;
  }

  tb.innerHTML=staff.map(([username,u])=>{
    const dailyReports=reports.filter(r=>r.username===username);
    const off=statusRows.find(r=>r.username===username && r.status==='OFF');

    if(dailyReports.length){
      // Jika ada lebih dari satu laporan pada hari yang sama, gunakan laporan terakhir.
      const report=dailyReports.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
      const total=Math.min(Number(report.total||0),100);
      const kurang=Math.max(0,100-total);
      const status=total>=100 ? '✅ 100%' : '⚠️ Kurang';
      return `<tr>
        <td>${esc(u.name)}</td>
        <td>${status}</td>
        <td><b>${total.toFixed(2).replace('.',',')}%</b></td>
        <td>${kurang<=0?'-':kurang.toFixed(2).replace('.',',')+'%'}</td>
        <td>${report.time||'-'}</td>
        <td>-</td>
      </tr>`;
    }

    if(off){
      return `<tr>
        <td>${esc(u.name)}</td>
        <td><b>OFF</b></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><button class="edit-btn" onclick="setOffStatus('${username}','${date}',false)">Batalkan OFF</button></td>
      </tr>`;
    }

    return `<tr>
      <td>${esc(u.name)}</td>
      <td>Belum Lapor</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td><button class="mini-btn" onclick="setOffStatus('${username}','${date}',true)">Tandai OFF</button></td>
    </tr>`;
  }).join('');
}

function csvEscape(v){const s=String(v??'').replace(/"/g,'""');return `"${s}"`}
function downloadCSV(filename,rows){
  const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function exportCSV(type){
  if(type==='attendance'){const d=filterRows(getStore('arcAttendance'),'attDate','attName');downloadCSV('ARC_Rekap_Absensi.csv',[['Tanggal','Nama','Username','Jam','Foto'],...d.map(r=>[r.date,r.name,r.username,r.time,r.photoName||''])])}
  if(type==='cleaning'){const d=filterRows(getStore('arcCleaning'),'cleanDateFilter','cleanNameFilter');downloadCSV('ARC_Rekap_Kebersihan.csv',[['Tanggal','Nama','Username','Area','Jam'],...d.map(r=>[r.date,r.name,r.username,r.area,r.time])])}
  if(type==='reports'){const d=filterRows(getStore('arcReports'),'reportDateFilter','reportNameFilter');downloadCSV('ARC_Rekap_Laporan_Harian.csv',[['Tanggal','Nama','Username','Pekerjaan','Total %','Kurang %'],...d.map(r=>[r.date,r.name,r.username,r.jobs.map(j=>`${j.type} ${j.qty} SL ${j.note||''}`).join(' | '),r.total.toFixed(2),r.lack.toFixed(2)])])}
  if(type==='achievement'){
    const date=document.getElementById('achievementDate')?.value||isoDate();
    const keyword=(document.getElementById('achievementName')?.value||'').trim().toLowerCase();
    const allUsers=loadUsers();
    const reports=getStore('arcReports').filter(r=>r.date===date);
    const statusRows=getDailyStatus().filter(r=>r.date===date);
    const out=[['Tanggal','Nama','Username','Status','Pencapaian %','Kurang %','Jam Lapor']];

    Object.entries(allUsers)
      .filter(([username,u])=>u.role==='staff' && (!keyword || u.name.toLowerCase().includes(keyword) || username.includes(keyword)))
      .sort((a,b)=>a[1].name.localeCompare(b[1].name))
      .forEach(([username,u])=>{
        const dailyReports=reports.filter(r=>r.username===username);
        const off=statusRows.find(r=>r.username===username && r.status==='OFF');

        if(dailyReports.length){
          const report=dailyReports.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
          const total=Math.min(Number(report.total||0),100);
          const kurang=Math.max(0,100-total);
          out.push([date,u.name,username,total>=100?'100%':'Kurang',total.toFixed(2),kurang.toFixed(2),report.time||'']);
        }else if(off){
          out.push([date,u.name,username,'OFF','','','']);
        }else{
          out.push([date,u.name,username,'Belum Lapor','','','']);
        }
      });

    downloadCSV(`ARC_Rekap_Pencapaian_${date}.csv`,out);
  }
}
function exportAll(){exportRaw('ARC_Arsip_Semua_Data.csv')}
function exportRaw(filename){
  const all=[['Jenis','Tanggal','Nama','Detail','Jam','Total %','Kurang %']];
  getStore('arcAttendance').forEach(r=>all.push(['Absensi',r.date,r.name,'Masuk',r.time,'','']));
  getStore('arcCleaning').forEach(r=>all.push(['Kebersihan',r.date,r.name,r.area,r.time,'','']));
  getStore('arcReports').forEach(r=>all.push(['Laporan',r.date,r.name,r.jobs.map(j=>`${j.type} ${j.qty} SL ${j.note||''}`).join(' | '),r.time,r.total.toFixed(2),r.lack.toFixed(2)]));
  getDailyStatus().forEach(r=>all.push(['Status Harian',r.date,r.name,r.status,'','','']));
  downloadCSV(filename,all);
}
function purgeOldData(){
  const keys=['arcAttendance','arcCleaning','arcReports','arcDailyStatus'];let deleted=0;
  keys.forEach(k=>{const before=getStore(k),keep=before.filter(r=>!isOlderThanRetention(r.createdAt));deleted+=before.length-keep.length;setStore(k,keep)});
  alert(`${deleted} data lebih dari ${RETENTION_MONTHS} bulan dihapus. Data staff tetap aman.`);renderAdminSummary();renderRetentionInfo();
}
function renderRetentionInfo(){const d=cutoffDate();document.getElementById('retentionInfo').textContent=`Batas saat ini: data sebelum ${d.toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})} dapat dihapus.`}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

(function(){
  users=loadUsers();const saved=localStorage.getItem('arcUser');
  if(saved){try{currentUser=JSON.parse(saved);showPage(currentUser.role==='admin'?'adminPage':'dashboardPage')}catch(e){showPage('loginPage')}}else showPage('loginPage');
})();
setInterval(refreshMeta,30000);
