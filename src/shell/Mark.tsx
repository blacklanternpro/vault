export function Mark({ text, query }: { text: string; query: string | null }) {
  const label = text.trim() ? text : '_'
  const q = query?.trim()
  if (!q) return <>{label}</>
  const at = label.toLowerCase().indexOf(q.toLowerCase())
  if (at < 0) return <>{label}</>
  return (
    <>
      {label.slice(0, at)}
      <mark className="find-mark">{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  )
}
