let role = null;
let currentCategory = null;
let currentProject = null;

document.getElementById('loginBtn').addEventListener('click', async () => {
  const r = document.getElementById('role').value;
  const pw = document.getElementById('password').value;
  const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role: r, password: pw }) });
  const j = await res.json().catch(()=>({ok:false}));
  if (res.ok && j.ok) {
    role = j.role;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
    loadCategories();
    document.getElementById('addProjectBtn').style.display = (role==='admin')? 'inline-block':'none';
  } else {
    document.getElementById('loginMsg').textContent = 'فشل تسجيل الدخول';
  }
});

async function loadCategories(){
  const res = await fetch('/api/categories');
  const cats = await res.json();
  const ul = document.getElementById('menu');
  ul.innerHTML='';
  cats.forEach(c=>{
    const li = document.createElement('li');
    li.className='menu-item';
    li.textContent = c;
    li.onclick = () => { selectCategory(c); document.querySelectorAll('.menu-item').forEach(x=>x.classList.remove('active')); li.classList.add('active'); };
    ul.appendChild(li);
  });
}

async function selectCategory(cat){
  currentCategory = cat;
  document.getElementById('currentCategory').textContent = cat;
  const res = await fetch('/api/categories/' + encodeURIComponent(cat) + '/projects');
  const projs = await res.json();
  renderProjects(projs);
}

function renderProjects(projs){
  const container = document.getElementById('projects');
  container.innerHTML = '';
  if (role === 'admin') {
    const addBtn = document.getElementById('addProjectBtn');
    addBtn.onclick = async () => {
      const name = prompt('اسم الكتالوج/المشروع:') || 'مشروع جديد';
      const r = await fetch('/api/categories/' + encodeURIComponent(currentCategory) + '/projects', {
        method:'POST', headers:{'Content-Type':'application/json','x-role': role}, body: JSON.stringify({name})
      });
      const p = await r.json();
      selectCategory(currentCategory);
    };
  }
  projs.forEach(p=>{
    const b = document.createElement('button');
    b.className='project-btn';
    b.textContent = p.name;
    b.onclick = () => { loadProject(p.id, p.name); };
    container.appendChild(b);
  });
}

async function loadProject(id, name){
  currentProject = id;
  document.getElementById('recordsArea').innerHTML = `<h3>${name}</h3>`;
  const res = await fetch('/api/projects/' + id + '/records');
  const records = await res.json();
  renderRecords(records);
}

function renderRecords(records){
  const area = document.getElementById('recordsArea');
  area.innerHTML += `
    <div>
      <table class="table" id="dataTable">
        <thead>
          <tr>
            <th>الاسم</th><th>المنصب</th><th>اللجنة</th><th>الرقم</th><th>الرقم القومي</th><th>المحافظة</th><th>اجراءات</th>
          </tr>
          <tr id="inputRow">
            <td><input id="i_الاسم"></td>
            <td><input id="i_المنصب"></td>
            <td><input id="i_اللجنة"></td>
            <td><input id="i_الرقم"></td>
            <td><input id="i_الرقم_القومي"></td>
            <td><input id="i_المحافظة"></td>
            <td><button id="insertBtn">ادخال</button></td>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
  `;
  if (role !== 'admin') document.getElementById('inputRow').style.display = 'none';
  document.getElementById('insertBtn')?.addEventListener('click', async ()=>{
    const payload = {
      'الاسم': document.getElementById('i_الاسم').value,
      'المنصب': document.getElementById('i_المنصب').value,
      'اللجنة': document.getElementById('i_اللجنة').value,
      'الرقم': document.getElementById('i_الرقم').value,
      'الرقم_القومي': document.getElementById('i_الرقم_القومي').value,
      'المحافظة': document.getElementById('i_المحافظة').value
    };
    await fetch('/api/projects/' + currentProject + '/records', { method:'POST', headers:{'Content-Type':'application/json','x-role': role}, body: JSON.stringify(payload) });
    await loadProject(currentProject, document.querySelector('#recordsArea h3').textContent);
  });
  const tbody = document.getElementById('tbody');
  records.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.الاسم}</td><td>${r.المنصب}</td><td>${r.اللجنة}</td><td>${r.الرقم}</td><td>${r.الرقم_القومي}</td><td>${r.المحافظة}</td>
      <td></td>
    `;
    const actionsTd = tr.querySelector('td:last-child');
    if (role === 'admin') {
      const edit = document.createElement('button'); edit.textContent='تعديل'; edit.className='action-btn action-edit';
      const del = document.createElement('button'); del.textContent='حذف'; del.className='action-btn action-delete';
      edit.onclick = async ()=> {
        const updated = {
          'الاسم': prompt('الاسم', r.الاسم) || r.الاسم,
          'المنصب': prompt('المنصب', r.المنصب) || r.المنصب,
          'اللجنة': prompt('اللجنة', r.اللجنة) || r.اللجنة,
          'الرقم': prompt('الرقم', r.الرقم) || r.الرقم,
          'الرقم_القومي': prompt('الرقم القومي', r.الرقم_القومي) || r.الرقم_القومي,
          'المحافظة': prompt('المحافظة', r.المحافظة) || r.المحافظة
        };
        await fetch('/api/projects/' + currentProject + '/records/' + r.id, { method:'PUT', headers:{'Content-Type':'application/json','x-role': role}, body: JSON.stringify(updated) });
        await loadProject(currentProject, document.querySelector('#recordsArea h3').textContent);
      };
      del.onclick = async ()=> {
        if (!confirm('حذف السجل؟')) return;
        await fetch('/api/projects/' + currentProject + '/records/' + r.id, { method:'DELETE', headers:{'x-role': role} });
        await loadProject(currentProject, document.querySelector('#recordsArea h3').textContent);
      };
      actionsTd.appendChild(edit); actionsTd.appendChild(del);
    } else {
      actionsTd.textContent = 'عرض فقط';
    }
    tbody.appendChild(tr);
  });
}
