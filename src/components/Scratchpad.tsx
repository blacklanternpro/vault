import { useRef, useState, type FormEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface ScratchpadProps {
  dateLabel: string;
}

export function Scratchpad({ dateLabel }: ScratchpadProps) {
  const { notes, addNote } = useCrdtState();
  const [scratchInput, setScratchInput] = useState('');
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddScratch = (e: FormEvent) => {
    e.preventDefault();
    if (!scratchInput.trim() && !pendingFile) return;
    addNote({
      id: Date.now().toString(),
      date: dateLabel,
      text: scratchInput.trim() || pendingFile?.name || 'MEDIA_ATTACH',
      attachment: pendingFile?.url,
    });
    setScratchInput('');
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingFile({ name: file.name, url });
  };

  return (
    <section>
      <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-10 md:mb-12">
        Scratchpad
      </h2>

      <form onSubmit={handleAddScratch} className="max-w-2xl mx-auto mb-10">
        <textarea
          value={scratchInput}
          onChange={(e) => setScratchInput(e.target.value)}
          placeholder="paste raw text, links, or braindumps..."
          className="w-full bg-transparent border-2 border-ink p-3 text-sm md:text-base font-mono outline-none focus:border-cobalt resize-y min-h-[100px] rounded-none caret-cobalt"
        />
        <div className="flex justify-between items-center mt-2 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold underline hover:text-cobalt uppercase tracking-wider"
            >
              + ATTACH MEDIA
            </button>
            {pendingFile && (
              <span className="text-[10px] md:text-xs font-mono text-cobalt bg-white px-1 truncate max-w-[40vw]">
                {pendingFile.name}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="bg-ink text-canvas px-6 py-2 text-sm font-bold hover:bg-cobalt transition-colors uppercase tracking-widest"
          >
            APPEND
          </button>
        </div>
      </form>

      <div className="max-w-2xl mx-auto space-y-0">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col gap-1 text-sm md:text-base font-mono py-4 border-b border-ink/20"
          >
            <div className="text-cobalt font-bold tracking-wider text-xs md:text-sm">
              {note.date}
            </div>
            <div className="text-ink leading-snug whitespace-pre-wrap">
              {note.text}
            </div>
            {note.attachment && (
              <a
                href={note.attachment}
                target="_blank"
                rel="noreferrer"
                className="text-cobalt underline hover:bg-cobalt hover:text-canvas inline-block w-max mt-1 text-xs"
              >
                [ATTACHMENT] -{'>'} {note.attachment.startsWith('blob:') ? 'LOCAL_MEDIA' : note.attachment}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
