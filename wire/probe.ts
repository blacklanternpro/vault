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
  return out
}
