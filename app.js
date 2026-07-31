// Offline Expense Tracker (stores data in localStorage)
// Keys: 'expenses_v1', 'categories_v1', 'common_budget_v1'

(function(){
  // --- Utilities ---
  const $ = (sel, root=document) => root.querySelector(sel);
  const fmt = num => Number(num).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

  const STORAGE = {
    EXP: 'expenses_v1',
    CAT: 'categories_v1',
    BUD: 'common_budget_v1'
  };

  // --- Default categories & payment methods ---
  const defaultCategories = ['Food','Travel','Groceries','Gym','Rent','Cook/Maid Salary'];
  const paymentMethods = ['Card','Cash','UPI','Bank Transfer'];

  // --- State ---
  let expenses = [];
  let categories = [];
  let commonBudget = 0;

  // --- Elements ---
  const form = $('#expense-form');
  const amountEl = $('#amount');
  const dateEl = $('#date');
  const typeEl = $('#type');
  const categoryEl = $('#category');
  const paymentEl = $('#payment');
  const notesEl = $('#notes');
  const addCatBtn = $('#add-category');
  const tableBody = $('#expenses-table tbody');
  const totalEl = $('#total');
  const totalPersonalEl = $('#total-personal');
  const totalSpouseEl = $('#total-spouse');
  const totalCommonEl = $('#total-common');
  const filterTypeEl = $('#filter-type');
  const exportBtn = $('#export');
  const importFile = $('#import-file');
  const clearAllBtn = $('#clear-all');
  const commonBudgetInput = $('#common-budget');
  const saveBudgetBtn = $('#save-budget');
  const commonRemainingEl = $('#common-remaining');

  // --- Storage helpers ---
  function load(){
    try{
      expenses = JSON.parse(localStorage.getItem(STORAGE.EXP)) || [];
    }catch(e){ expenses = []; }
    try{
      categories = JSON.parse(localStorage.getItem(STORAGE.CAT)) || defaultCategories.slice();
    }catch(e){ categories = defaultCategories.slice(); }
    try{
      commonBudget = Number(localStorage.getItem(STORAGE.BUD) || 0);
    }catch(e){ commonBudget = 0; }
  }
  function save(){
    localStorage.setItem(STORAGE.EXP, JSON.stringify(expenses));
    localStorage.setItem(STORAGE.CAT, JSON.stringify(categories));
    localStorage.setItem(STORAGE.BUD, String(commonBudget));
  }

  // --- UI rendering ---
  function populateCategoryOptions(){
    categoryEl.innerHTML = '';
    categories.forEach(c=>{
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      categoryEl.appendChild(o);
    });
  }
  function populatePaymentMethods(){
    paymentEl.innerHTML = '';
    paymentMethods.forEach(p=>{
      const o = document.createElement('option');
      o.value = p;
      o.textContent = p;
      paymentEl.appendChild(o);
    });
  }
  function renderTable(filter='all'){
    tableBody.innerHTML = '';
    const list = expenses
      .slice()
      .sort((a,b)=> new Date(b.date) - new Date(a.date))
      .filter(e => filter==='all' ? true : e.type===filter);

    list.forEach(e=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.date}</td>
        <td>${e.type}</td>
        <td>${e.category}</td>
        <td>${e.payment}</td>
        <td>${fmt(e.amount)}</td>
        <td>${e.notes || ''}</td>
        <td class="actions-cell">
          <button data-id="${e.id}" class="edit secondary">Edit</button>
          <button data-id="${e.id}" class="delete danger">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }
  function computeSummary(){
    const total = expenses.reduce((s,e)=> s + Number(e.amount || 0), 0);
    const personal = expenses.filter(e=> e.type==='personal').reduce((s,e)=> s+Number(e.amount||0),0);
    const spouse = expenses.filter(e=> e.type==='spouse').reduce((s,e)=> s+Number(e.amount||0),0);
    const common = expenses.filter(e=> e.type==='common').reduce((s,e)=> s+Number(e.amount||0),0);
    totalEl.textContent = fmt(total);
    totalPersonalEl.textContent = fmt(personal);
    totalSpouseEl.textContent = fmt(spouse);
    totalCommonEl.textContent = fmt(common);
    const remaining = commonBudget - common;
    commonRemainingEl.textContent = `${fmt(remaining)} (pooled: ${fmt(commonBudget)})`;
  }

  // --- Actions ---
  function addExpense(obj){
    obj.id = obj.id || ('e_' + Date.now());
    expenses.push(obj);
    save();
    renderTable(filterTypeEl.value);
    computeSummary();
  }
  function updateExpense(id, updates){
    const idx = expenses.findIndex(e=> e.id===id);
    if(idx===-1) return;
    expenses[idx] = {...expenses[idx], ...updates};
    save();
    renderTable(filterTypeEl.value);
    computeSummary();
  }
  function deleteExpense(id){
    expenses = expenses.filter(e=> e.id!==id);
    save();
    renderTable(filterTypeEl.value);
    computeSummary();
  }

  // --- Event listeners ---
  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const amount = parseFloat(amountEl.value || 0);
    if(!amount || amount<=0){ alert('Enter a valid amount'); return; }
    const date = dateEl.value || new Date().toISOString().slice(0,10);
    const payload = {
      amount: amount,
      date: date,
      type: typeEl.value,
      category: categoryEl.value,
      payment: paymentEl.value,
      notes: notesEl.value
    };
    addExpense(payload);
    form.reset();
    // keep default date as today
    dateEl.value = new Date().toISOString().slice(0,10);
  });

  addCatBtn.addEventListener('click', ()=>{
    const name = prompt('New category name:');
    if(!name) return;
    const trimmed = name.trim();
    if(!trimmed) return;
    if(categories.includes(trimmed)){ alert('Category already exists'); return; }
    categories.push(trimmed);
    save();
    populateCategoryOptions();
    categoryEl.value = trimmed;
  });

  tableBody.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    if(btn.classList.contains('delete')){
      if(confirm('Delete this expense?')) deleteExpense(id);
    } else if(btn.classList.contains('edit')){
      const e = expenses.find(x=> x.id===id);
      if(!e) return;
      // simple edit flow via prompt for amount and notes (keeps UI small)
      const newAmount = prompt('Amount', e.amount);
      if(newAmount===null) return;
      const newNotes = prompt('Notes', e.notes || '');
      updateExpense(id, { amount: Number(newAmount), notes: newNotes });
    }
  });

  filterTypeEl.addEventListener('change', ()=> renderTable(filterTypeEl.value));

  exportBtn.addEventListener('click', ()=>{
    const data = { expenses, categories, commonBudget, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener('change', (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if(!confirm('Import will replace current data. Continue?')) return;
        expenses = Array.isArray(data.expenses) ? data.expenses : (data.expenses || []);
        categories = Array.isArray(data.categories) ? data.categories : (data.categories || defaultCategories.slice());
        commonBudget = Number(data.commonBudget || 0);
        save();
        populateCategoryOptions();
        renderTable(filterTypeEl.value);
        computeSummary();
        commonBudgetInput.value = commonBudget || '';
        alert('Import done');
      }catch(err){
        alert('Invalid file');
      }
    };
    reader.readAsText(f);
    importFile.value = '';
  });

  clearAllBtn.addEventListener('click', ()=>{
    if(!confirm('This will clear all data stored locally. Continue?')) return;
    expenses = [];
    categories = defaultCategories.slice();
    commonBudget = 0;
    save();
    populateCategoryOptions();
    renderTable(filterTypeEl.value);
    computeSummary();
    commonBudgetInput.value = '';
  });

  saveBudgetBtn.addEventListener('click', ()=>{
    const v = parseFloat(commonBudgetInput.value || 0);
    if(isNaN(v) || v < 0){ alert('Enter a valid number'); return; }
    commonBudget = v;
    save();
    computeSummary();
    alert('Common budget saved');
  });

  // initialize defaults
  function init(){
    load();
    if(categories.length === 0) categories = defaultCategories.slice();
    populateCategoryOptions();
    populatePaymentMethods();
    // set default date to today
    dateEl.value = new Date().toISOString().slice(0,10);
    commonBudgetInput.value = commonBudget || '';
    renderTable();
    computeSummary();
  }

  init();

})();
