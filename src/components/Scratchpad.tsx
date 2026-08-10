import { useState, type FormEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface ScratchpadProps {
  currentDay: number;
}

export function Scratchpad({ currentDay }: ScratchpadProps) {
  const { notes, addNote } = useCrdtState();

  const [scratchInput, setScratchInput] = useState('');

  const handleAddScratch = (e: FormEvent) => {
    e.preventDefault();
    if (!scratchInput.trim()) return;
    addNote({ id: Date.now().toString(), date: `08.${currentDay}.26`, text: scratchInput });
    setScratchInput('');
  };

  return (
    <section>
      <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-12">
        Scratchpad
      </h2>

      <form onSubmit={handleAddScratch} className="max-w-2xl mx-auto mb-10">
        <textarea 
          value={scratchInput}
          onChange={(e) => setScratchInput(e.target.value)}
          placeholder="paste raw text, links, or braindumps..."
          className="w-full bg-transparent border-2 border-[#111] p-3 text-sm md:text-base font-mono outline-none focus:bg-white resize-y min-h-[100px]"
        />
        <div className="flex justify-between items-center mt-2">
          <button type="button" className="text-xs font-bold underline hover:text-[#0000FF]">+ ATTACH MEDIA</button>
          <button type="submit" className="bg-[#111] text-[#F4F4F0] px-6 py-2 text-sm font-bold hover:bg-[#0000FF] transition-colors">APPEND</button>
        </div>
      </form>

      <div className="max-w-2xl mx-auto space-y-6">
        {notes.map((note) => (
          <div key={note.id} className="flex flex-col gap-1 text-sm md:text-base font-mono py-2 hover:bg-black/5 px-2 -mx-2 transition-colors">
            <div className="text-[#111] font-bold">{note.date}</div>
            <div className="text-[#111] leading-snug whitespace-pre-wrap">{note.text}</div>
            {note.attachment && (
              <a href={note.attachment} className="text-[#0000FF] underline hover:bg-[#0000FF] hover:text-white inline-block w-max mt-1 text-xs">
                [ATTACHMENT] -{">"} {note.attachment}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
