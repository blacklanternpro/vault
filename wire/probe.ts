import { BlobPreconditionFailedError, del, get, put } from '@vercel/blob'

/*
 * Answers one question Phase 3 depends on, against the real private store:
 * does put() honour ifMatch (conditional write on the ETag) for private
 * blobs, and does allowOverwrite:false refuse an existing one? Writes only a
 * scratch file next to the board, then deletes it.
 */

export async function probeBlob(token: string): Promise<Record<string, unknown>> {
  const path = `wire-spike/probe-${Date.now()}.json`
  const opts = { access: 'private' as const, contentType: 'application/json', addRandomSuffix: false, token }
  const out: Record<string, unknown> = { path }
  const first = await put(path, '{"n":1}', { ...opts, allowOverwrite: false })
  out.firstEtag = first.etag
  try {
    await put(path, '{"n":"dup"}', { ...opts, allowOverwrite: false })
    out.createIfAbsent = 'NOT ENFORCED (second create succeeded)'
  } catch (err) {
    out.createIfAbsent = `refused: ${(err as Error).constructor.name}: ${(err as Error).message}`
  }
  const second = await put(path, '{"n":2}', { ...opts, ifMatch: first.etag })
  out.ifMatchCurrent = `written, etag ${second.etag}`
  try {
    await put(path, '{"n":"stale"}', { ...opts, ifMatch: first.etag })
    out.ifMatchStale = 'NOT ENFORCED (stale write succeeded)'
  } catch (err) {
    out.ifMatchStale = err instanceof BlobPreconditionFailedError ? 'refused: BlobPreconditionFailedError' : `refused: ${(err as Error).constructor.name}: ${(err as Error).message}`
  }
  const got = await get(path, { access: 'private', useCache: false, token })
  out.readBack = got && got.statusCode === 200 ? { body: await new Response(got.stream).text(), etag: got.blob.etag } : null
  const nm = await get(path, { access: 'private', useCache: false, token, ifNoneMatch: second.etag })
  out.ifNoneMatch = nm ? nm.statusCode : null
  await del(path, { token })
  out.deleted = true
  // The board's own pattern: create, then read the ETag back with get() and write over it with ifMatch.
  for (const cache of [undefined, 60]) {
    const p2 = `wire-spike/probe-rw-${cache ?? 'default'}-${Date.now()}.json`
    const extra = cache ? { cacheControlMaxAge: cache } : {}
    const made = await put(p2, '{"n":1}', { ...opts, ...extra, allowOverwrite: false })
    const read = await get(p2, { access: 'private', useCache: false, token })
    const readEtag = read?.blob.etag ?? null
    if (read?.stream) await new Response(read.stream).text()
    let outcome: string
    try {
      const w = await put(p2, '{"n":2}', { ...opts, ...extra, ifMatch: readEtag ?? '' })
      outcome = `written, etag ${w.etag}`
    } catch (err) {
      outcome = `refused: ${(err as Error).constructor.name}`
    }
    out[`readThenWrite(cacheControlMaxAge=${cache ?? 'default'})`] = { putEtag: made.etag, getEtag: readEtag, getHeaderEtag: read?.headers.get('etag') ?? null, outcome }
    await del(p2, { token })
  }
  return out
}
