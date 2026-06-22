'use client';

type Props = {
  handover: string;
  specialNotes: string;
  onHandoverChange: (value: string) => void;
  onSpecialNotesChange: (value: string) => void;
};

function NoteCard({
  title,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h2 className="font-semibold text-zinc-900">{title}</h2>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full px-5 py-4 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none"
      />
    </div>
  );
}

export default function NotesSection({ handover, specialNotes, onHandoverChange, onSpecialNotesChange }: Props) {
  return (
    <>
      <NoteCard
        title="인수인계"
        value={handover}
        onChange={onHandoverChange}
        placeholder="다음 담당자에게 전달할 내용을 기록하세요..."
      />
      <NoteCard
        title="특이사항"
        value={specialNotes}
        onChange={onSpecialNotesChange}
        placeholder="오늘 발생한 특이사항을 기록하세요..."
      />
    </>
  );
}
