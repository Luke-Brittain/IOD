"use client"
import React, { useState } from 'react'

export default function TaskPanelClient({
  date,
  tasks,
  onAdd,
  onToggle,
  onDelete,
  onClose
}: any) {
  const [text, setText] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    onAdd(v)
    setText('')
  }

  return (
    <aside className="tasks-panel" style={{ position: 'fixed', right: 20, top: 80, width: 320 }}>
      <button className="close" onClick={onClose} style={{ float: 'right', fontSize: 20 }}>×</button>
      <h2 id="panel-date">{new Date(date).toLocaleDateString()}</h2>
      <form id="task-form" onSubmit={submit} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New task" />
        <button type="submit">Add</button>
      </form>
      <ul className="task-list">
        {tasks.length === 0 && <li style={{ color: 'var(--muted)' }}>No tasks for this day.</li>}
        {tasks.map((t: any) => (
          <li key={t.id} className="task-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!t.done} onChange={(e) => onToggle(t.id, e.target.checked)} />
            <span style={{ flex: 1 }}>{t.text}</span>
            <button onClick={() => onDelete(t.id)} style={{ marginLeft: 8 }}>Delete</button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
