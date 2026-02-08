import CalendarClient from '../components/CalendarClient'

export default function Page() {
  return (
    <main className="container">
      <header className="header">
        <h1>Daily Tasks Calendar</h1>
      </header>
      <CalendarClient />
    </main>
  )
}
