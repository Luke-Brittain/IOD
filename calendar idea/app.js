// Simple calendar with per-day tasks stored in localStorage
(function(){
  const storageKey = 'calendar-tasks-v1';
  const calendarEl = document.getElementById('calendar');
  const monthLabel = document.getElementById('month-label');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const panel = document.getElementById('tasks-panel');
  const panelDateEl = document.getElementById('panel-date');
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const closePanel = document.getElementById('close-panel');

  let viewDate = new Date();
  let tasks = loadTasks();
  let activeIso = null;

  function loadTasks(){
    try{const raw = localStorage.getItem(storageKey); return raw?JSON.parse(raw):{}}catch(e){return{}}
  }

  function saveTasks(){ localStorage.setItem(storageKey, JSON.stringify(tasks)); }

  function isoDate(d){
    const y=d.getFullYear(); const m=(d.getMonth()+1).toString().padStart(2,'0'); const day=d.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

  function render(){
    calendarEl.innerHTML='';
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const month = viewDate.getMonth();
    monthLabel.textContent = viewDate.toLocaleString(undefined,{month:'long', year:'numeric'});

    // find first Sunday to display
    const firstDayIndex = start.getDay();
    const total = end.getDate();
    const cells = firstDayIndex + total;
    const rows = Math.ceil(cells/7) * 7;

    for(let i=0;i<rows;i++){
      const cell = document.createElement('div');
      cell.className='day';

      const dayIndex = i - firstDayIndex + 1;
      if(dayIndex < 1 || dayIndex > total){
        cell.classList.add('empty');
        calendarEl.appendChild(cell);
        continue;
      }

      const d = new Date(viewDate.getFullYear(), month, dayIndex);
      const iso = isoDate(d);
      const dateEl = document.createElement('div');
      dateEl.className='date';
      dateEl.textContent = dayIndex;
      const countEl = document.createElement('div');
      countEl.className='task-count';

      const dayTasks = tasks[iso] || [];
      const totalTasks = dayTasks.length;
      const doneCount = dayTasks.filter(t=>t.done).length;

      if(totalTasks === 0){
        cell.classList.add('tile-grey');
        countEl.textContent = 'No tasks';
      } else if(doneCount === 0){
        cell.classList.add('tile-grey');
        countEl.textContent = `${totalTasks} task${totalTasks>1?'s':''}`;
      } else if(doneCount < totalTasks){
        cell.classList.add('tile-orange');
        countEl.textContent = `${doneCount}/${totalTasks} done`;
      } else {
        cell.classList.add('tile-green');
        countEl.textContent = 'All done';
      }

      const btn = document.createElement('button');
      btn.appendChild(dateEl);
      btn.appendChild(countEl);
      btn.addEventListener('click',()=>openPanel(iso));

      cell.appendChild(btn);
      calendarEl.appendChild(cell);
    }
  }

  function openPanel(iso){
    activeIso = iso;
    panelDateEl.textContent = new Date(iso).toLocaleDateString();
    renderTaskList();
    panel.classList.remove('hidden');
    taskInput.focus();
  }

  function closePanelFn(){ activeIso=null; panel.classList.add('hidden'); taskList.innerHTML=''; }

  function renderTaskList(){
    taskList.innerHTML='';
    const list = tasks[activeIso] || [];
    if(list.length===0){
      const li=document.createElement('li'); li.textContent='No tasks for this day.'; li.style.color='var(--muted)'; taskList.appendChild(li); return;
    }
    list.forEach(t=>{
      const li=document.createElement('li'); li.className='task-item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!t.done; cb.addEventListener('change',()=>{ t.done = cb.checked; saveTasks(); render(); renderTaskList(); });
      const span=document.createElement('span'); span.textContent=t.text; span.style.flex='1';
      const del=document.createElement('button'); del.textContent='Delete'; del.style.marginLeft='8px'; del.addEventListener('click',()=>{ tasks[activeIso]=tasks[activeIso].filter(x=>x.id!==t.id); if(tasks[activeIso].length===0) delete tasks[activeIso]; saveTasks(); render(); renderTaskList(); });
      li.appendChild(cb); li.appendChild(span); li.appendChild(del); taskList.appendChild(li);
    })
  }

  taskForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const text = taskInput.value.trim(); if(!text || !activeIso) return; const id = Date.now().toString(36);
    tasks[activeIso] = tasks[activeIso] || [];
    tasks[activeIso].push({id,text,done:false});
    saveTasks(); taskInput.value=''; render(); renderTaskList();
  });

  closePanel.addEventListener('click', closePanelFn);
  prevBtn.addEventListener('click',()=>{ viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1); render(); });
  nextBtn.addEventListener('click',()=>{ viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1); render(); });

  // initial render
  render();
})();
