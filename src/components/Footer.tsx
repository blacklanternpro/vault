import { useEffect, useState } from 'react'

function formatStamp(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function Footer() {
  const [now, setNow] = useState(() => formatStamp(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatStamp(new Date())), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="border-t-2 border-ink bg-white px-3 py-1.5 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
        <span>LOCAL_ONLY · NO_CLOUD</span>
        <span className="text-cobalt tabular-nums tracking-[0.28em]">{now}</span>
        <span>END_TRANSMISSION</span>
      </div>
    </footer>
  )
}
