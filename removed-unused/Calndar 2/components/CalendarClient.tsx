"use client"
import React, { useEffect, useState } from 'react'
import TaskPanelClient from './TaskPanelClient'
import { loadTasks, saveTasks, KEY } from '../lib/storage'

function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CalendarClient() {
  const [viewDate, setViewDate] = useState(new Date())
  const [tasks, setTasks] = useState<Record<string, any[]>>({})
  const [activeDate, setActiveDate] = useState<string | null>(null)

  useEffect(() => {
    setTasks(loadTasks())
  }, [])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)

  const renderGrid = () => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    const firstDayIndex = start.getDay()
    const total = end.getDate()
    const cells = firstDayIndex + total
    const rows = Math.ceil(cells / 7) * 7

    const month = viewDate.getMonth()
    const nodes = [] as React.ReactNode[]

    for (let i = 0; i < rows; i++) {
      const dayIndex = i - firstDayIndex + 1
      if (dayIndex < 1 || dayIndex > total) {
        nodes.push(<div key={i} className="day empty" />)
        continue
      }

      const d = new Date(viewDate.getFullYear(), month, dayIndex)
      const iso = isoDate(d)
      const dayTasks = tasks[iso] || []
      const totalTasks = dayTasks.length
      const doneCount = dayTasks.filter((t) => t.done).length

      let cls = 'day'
      if (totalTasks === 0 || doneCount === 0) cls += ' tile-grey'
      else if (doneCount < totalTasks) cls += ' tile-orange'
      else cls += ' tile-green'

      nodes.push(
        <div key={iso} className={cls}>
          <button onClick={() => setActiveDate(iso)}>
            <div className="date">{dayIndex}</div>
            <div className="task-count">
              {totalTasks === 0 ? 'No tasks' : doneCount === totalTasks ? 'All done' : `${doneCount}/${totalTasks} done`}
            </div>
          </button>
        </div>
      )
    }

    return nodes
  }

  function handleAdd(date: string, text: string) {
    const id = Date.now().toString(36)
    const item = { id, text, done: false, createdAt: new Date().toISOString() }
    setTasks((t) => ({ ...t, [date]: [...(t[date] || []), item] }))
  }

  function handleToggle(date: string, id: string, done: boolean) {
    setTasks((t) => ({
      ...t,
      [date]: (t[date] || []).map((x: any) => (x.id === id ? { ...x, done } : x))
    }))
  }

  function handleDelete(date: string, id: string) {
    setTasks((t) => {
      const next = (t[date] || []).filter((x: any) => x.id !== id)
      const copy = { ...t }
      if (next.length) copy[date] = next
      else delete copy[date]
      return copy
    })
  }

  return (
    <div>
      <div className="nav" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</button>
        <div className="month-label" style={{ minWidth: 200, textAlign: 'center', fontWeight: 600 }}>{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</button>
      </div>

      <div className="weekdays"> <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div> </div>
      <div className="calendar-grid">{renderGrid()}</div>

      {activeDate && (
        <TaskPanelClient
          date={activeDate}
          tasks={tasks[activeDate] || []}
          onAdd={(text: string) => handleAdd(activeDate, text)}
          onToggle={(id: string, done: boolean) => handleToggle(activeDate, id, done)}
          onDelete={(id: string) => handleDelete(activeDate, id)}
          onClose={() => setActiveDate(null)}
        />
      )}
    </div>
  )
}
