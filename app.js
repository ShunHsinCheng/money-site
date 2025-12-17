// ========== 漢堡選單展開/關閉機制 ==========
const hamburgerBtn = document.getElementById("hamburger");
const sideMenu = document.getElementById("side-menu");
const sideMenuClose = document.getElementById("side-close");
const menuOverlay = document.getElementById("menu-overlay");

function openMenu() {
  sideMenu.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
  hamburgerBtn.setAttribute("aria-expanded", "true");
  menuOverlay.style.display = "block";
}

function closeMenu() {
  sideMenu.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
  hamburgerBtn.setAttribute("aria-expanded", "false");
  menuOverlay.style.display = "none";
}

hamburgerBtn.addEventListener("click", openMenu);
sideMenuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);

// 按 menu-link 自動關閉選單
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', closeMenu, false);
});

// ========== 頁面切換（含月曆） ==========
const calendarSection = document.getElementById('calendar');
const summarySection = document.getElementById('summary');
const txFormSection = document.getElementById('tx-form').closest('section');
const txTableSection = document.getElementById('tx-tbody').closest('section');
const menuLinks = document.querySelectorAll('.menu-link');

function showSectionByHash(hash) {
  summarySection.style.display = "none";
  txFormSection.style.display = "none";
  txTableSection.style.display = "none";
  calendarSection.style.display = "none";
  if (hash === "#summary") summarySection.style.display = "";
  if (hash === "#tx-form") txFormSection.style.display = "";
  if (hash === "#tx-tbody") txTableSection.style.display = "";
  if (hash === "#calendar") {
    calendarSection.style.display = "";
    renderCalendar();
  }
}
// 預設顯示總覽
showSectionByHash('#summary');
menuLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith("#")) {
      e.preventDefault();
      showSectionByHash(href);
    }
  });
});

// ========== 記帳功能（localStorage 不變） ==========
function getAllRecords() {
  return JSON.parse(localStorage.getItem('txs') || "[]");
}

// --- 新增、刪除全部功能 ---
document.getElementById("tx-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;
  const type = form.type.value;
  const amount = parseInt(form.amount.value) || 0;
  const category = form.category.value;
  const date =
    form.date.value || new Date().toISOString().slice(0, 10);
  const note = form.note.value;
  let records = getAllRecords();
  records.push({ type, amount, category, date, note });
  localStorage.setItem("txs", JSON.stringify(records));
  form.reset();
  updateSummary();
  renderTable();
  renderCalendar();
});

document.getElementById("clear-all-btn").addEventListener("click", function () {
  if (confirm("確定清空所有紀錄嗎？")) {
    localStorage.removeItem("txs");
    updateSummary();
    renderTable();
    renderCalendar();
  }
});
document.getElementById("menu-clear").addEventListener("click", function () {
  if (confirm("確定清空所有紀錄嗎？")) {
    localStorage.removeItem("txs");
    updateSummary();
    renderTable();
    renderCalendar();
  }
});

// --- 表格畫面 ---
function renderTable() {
  const tbody = document.getElementById("tx-tbody");
  const records = getAllRecords();
  tbody.innerHTML = "";
  records.reverse().forEach((rec, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${rec.date || ""}</td>
      <td>${rec.type || ""}</td>
      <td>${rec.amount || ""}</td>
      <td>${rec.category || ""}</td>
      <td>${rec.note || ""}</td>
      <td><button class="del-btn" data-index="${records.length - 1 - i}">刪除</button></td>`;
    tbody.appendChild(tr);
  });
}

// --- 刪除單筆 ---
document.getElementById("tx-tbody").addEventListener("click", function (e) {
  if (e.target.classList.contains("del-btn")) {
    const idx = parseInt(e.target.getAttribute("data-index"));
    let records = getAllRecords();
    records.splice(idx, 1);
    localStorage.setItem("txs", JSON.stringify(records));
    updateSummary();
    renderTable();
    renderCalendar();
  }
});

// --- 總覽統計 ---
function updateSummary() {
  const records = getAllRecords();
  let totalIncome = 0,
    totalExpense = 0;
  records.forEach((rec) => {
    if (rec.type === "支出") totalExpense += Number(rec.amount || 0);
    else totalIncome += Number(rec.amount || 0);
  });
  document.getElementById("total-income").textContent = totalIncome;
  document.getElementById("total-expense").textContent = totalExpense;
  document.getElementById("balance").textContent =
    totalIncome - totalExpense;
}

// 頁面載入初始化
updateSummary();
renderTable();

// ========== 月曆功能 ==========
let calendarDate = new Date(); // 當前顯示的年月
document.getElementById('prev-month').onclick = function(){
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
};
document.getElementById('next-month').onclick = function(){
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
};

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const allRecords = getAllRecords();
  const recordsByDate = {};
  allRecords.forEach(rec => {
    const d = rec.date;
    if (!recordsByDate[d]) recordsByDate[d] = [];
    recordsByDate[d].push(rec);
  });
  document.getElementById('calendar-month-label').textContent = `${year}年${String(month+1).padStart(2,"0")}月`;
  const tbody = document.getElementById('calendar-tbody');
  tbody.innerHTML = '';
  let tr = document.createElement('tr');
  for (let i=0; i<firstDayOfWeek; i++) tr.appendChild(document.createElement('td'));
  for (let day=1; day<=daysInMonth; day++) {
    if ((tr.children.length)>=7) {
      tbody.appendChild(tr);
      tr = document.createElement('tr');
    }
    const td = document.createElement('td');
    td.classList.add('calendar-cell');
    const dstr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    td.setAttribute('data-date', dstr);
    td.innerHTML = `<div class="cal-day-num">${day}</div>`;
    if (recordsByDate[dstr]) {
      const items = recordsByDate[dstr];
      let shortInfo = '';
      let incomeSum = 0, expenseSum = 0;
      items.forEach(r => {
        if (r.type === '收入') incomeSum += Number(r.amount||0);
        else expenseSum += Number(r.amount||0);
      });
      if (incomeSum>0) shortInfo += `<span class="cal-income">+${incomeSum}</span>`;
      if (expenseSum>0) shortInfo += `<span class="cal-expense">-${expenseSum}</span>`;
      td.innerHTML += `<div class="cal-brief">${shortInfo}</div>`;
      td.classList.add('has-record');
      td.style.cursor = 'pointer';
    }
    td.addEventListener('click', function(){
      if (recordsByDate[dstr]) showCalendarDetailModal(dstr, recordsByDate[dstr], day);
    });
    tr.appendChild(td);
  }
  while (tr.children.length < 7) tr.appendChild(document.createElement('td'));
  tbody.appendChild(tr);
}

// 詳細紀錄 Modal
function showCalendarDetailModal(dateStr, records, day){
  if (!records.length) return;
  document.getElementById('calendar-detail-date').textContent = `${dateStr} 詳細紀錄`;
  const ul = document.getElementById('calendar-detail-list');
  ul.innerHTML = '';
  records.forEach(rec => {
    const li = document.createElement('li');
    li.innerHTML =
      `<b>[${rec.type}]</b> $${rec.amount} 
      <span class="label">${rec.category}</span>
      ${rec.note? `<span class="nt">${rec.note}</span>`: ''}
      `;
    ul.appendChild(li);
  });
  document.getElementById('calendar-detail-modal').style.display = '';
}
document.getElementById('calendar-detail-close').onclick = function(){
  document.getElementById('calendar-detail-modal').style.display = 'none';
};

// localStorage 變化自動重繪日曆（跨分頁同步）
window.addEventListener('storage', function(e){
  renderCalendar();
});
