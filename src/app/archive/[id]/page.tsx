'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getSession } from '@/lib/auth';
import { getArchiveDoc, updateArchiveDoc, deleteArchiveDoc, uploadArchiveImage, ArchiveDoc } from '@/lib/archiveStorage';

function insertIntoTextarea(
  ta: HTMLTextAreaElement,
  before: string,
  after: string = '',
  placeholder: string = '',
): { value: string; selStart: number; selEnd: number } {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end) || placeholder;
  const newValue = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
  return { value: newValue, selStart: start + before.length, selEnd: start + before.length + selected.length };
}

function ToolbarButton({ label, title, onClick, disabled }: {
  label: string; title: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function MarkdownToolbar({
  textareaRef,
  onChange,
  onImageClick,
  uploading,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (val: string) => void;
  onImageClick: () => void;
  uploading: boolean;
}) {
  const apply = useCallback((before: string, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { value, selStart, selEnd } = insertIntoTextarea(ta, before, after, placeholder);
    onChange(value);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(selStart, selEnd); });
  }, [textareaRef, onChange]);

  const applyHeading = useCallback((level: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    const newValue = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
    onChange(newValue);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length); });
  }, [textareaRef, onChange]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <ToolbarButton label="H1" title="제목 1" onClick={() => applyHeading(1)} />
      <ToolbarButton label="H2" title="제목 2" onClick={() => applyHeading(2)} />
      <ToolbarButton label="H3" title="제목 3" onClick={() => applyHeading(3)} />
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <ToolbarButton label="B" title="굵게 (Bold)" onClick={() => apply('**', '**', '굵게')} />
      <ToolbarButton label="I" title="기울임 (Italic)" onClick={() => apply('*', '*', '기울임')} />
      <ToolbarButton label="~~" title="취소선" onClick={() => apply('~~', '~~', '취소선')} />
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <ToolbarButton label="≡" title="목록" onClick={() => apply('\n- ', '', '항목')} />
      <ToolbarButton label="1." title="번호 목록" onClick={() => apply('\n1. ', '', '항목')} />
      <ToolbarButton label="인용" title="인용" onClick={() => apply('\n> ', '', '인용')} />
      <ToolbarButton label="`" title="인라인 코드" onClick={() => apply('`', '`', 'code')} />
      <ToolbarButton label="```" title="코드 블록" onClick={() => apply('\n```\n', '\n```', 'code')} />
      <ToolbarButton label="—" title="구분선" onClick={() => apply('\n\n---\n\n')} />
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <ToolbarButton label="링크" title="링크" onClick={() => apply('[', '](url)', '링크 텍스트')} />
      <ToolbarButton
        label={uploading ? '업로드 중...' : '이미지'}
        title="이미지 삽입"
        onClick={onImageClick}
        disabled={uploading}
      />
    </div>
  );
}

export default function ArchiveDocPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [doc, setDoc] = useState<ArchiveDoc | null>(null);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editTab, setEditTab] = useState<'write' | 'preview'>('write');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    getArchiveDoc(id).then(d => {
      if (!d) { router.replace('/archive'); return; }
      setDoc(d);
      setTitleInput(d.title);
      setContentInput(d.content);
      if (!d.content) setEditing(true);
    });
  }, [id, router]);

  const handleSave = async () => {
    if (!titleInput.trim()) return;
    setSaving(true);
    await updateArchiveDoc(id, titleInput.trim(), contentInput);
    setDoc(prev => prev ? { ...prev, title: titleInput.trim(), content: contentInput } : prev);
    setEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('문서를 삭제할까요?')) return;
    await deleteArchiveDoc(id);
    router.push('/archive');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadArchiveImage(file);
    if (url) {
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const imgMd = `![이미지](${url})`;
        const newValue = contentInput.slice(0, start) + imgMd + contentInput.slice(ta.selectionEnd);
        setContentInput(newValue);
        requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + imgMd.length, start + imgMd.length); });
      } else {
        setContentInput(prev => prev + `\n![이미지](${url})\n`);
      }
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/archive')} className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {editing ? (
          <input
            type="text"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            className="flex-1 text-base font-bold text-zinc-900 outline-none bg-transparent"
            placeholder="제목"
          />
        ) : (
          <h1 className="flex-1 text-base font-bold text-zinc-900 truncate">{doc.title}</h1>
        )}
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => { setTitleInput(doc.title); setContentInput(doc.content); setEditing(false); }}
                className="text-sm text-zinc-400 hover:text-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !titleInput.trim()}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1.5 rounded-lg transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                편집
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {editing ? (
          <>
            {/* 편집 / 미리보기 탭 */}
            <div className="flex border border-zinc-200 border-b-0 rounded-t-xl overflow-hidden bg-zinc-50">
              <button
                onClick={() => setEditTab('write')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${editTab === 'write' ? 'bg-white text-zinc-900 border-b-2 border-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                편집
              </button>
              <button
                onClick={() => setEditTab('preview')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${editTab === 'preview' ? 'bg-white text-zinc-900 border-b-2 border-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                미리보기
              </button>
            </div>
            {/* 툴바 */}
            {editTab === 'write' && (
              <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 bg-zinc-50 border-x border-zinc-200 overflow-x-auto">
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  onChange={setContentInput}
                  onImageClick={() => imageInputRef.current?.click()}
                  uploading={uploadingImage}
                />
              </div>
            )}
            {editTab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={contentInput}
                onChange={e => setContentInput(e.target.value)}
                placeholder="마크다운으로 작성하세요..."
                className="w-full min-h-[60vh] text-sm text-zinc-800 placeholder:text-zinc-400 bg-white border border-zinc-200 rounded-b-xl px-5 py-4 outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
              />
            ) : (
              <div className="min-h-[60vh] bg-white border border-zinc-200 rounded-b-xl px-5 py-6 text-zinc-800 text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 [&_blockquote]:mb-3 [&_a]:text-blue-600 [&_a]:underline [&_hr]:border-zinc-200 [&_hr]:my-4 [&_strong]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 border-t-0">
                {contentInput ? (
                  <ReactMarkdown>{contentInput}</ReactMarkdown>
                ) : (
                  <p className="text-zinc-400">내용이 없습니다.</p>
                )}
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 px-5 py-6 text-zinc-800 text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 [&_blockquote]:mb-3 [&_a]:text-blue-600 [&_a]:underline [&_hr]:border-zinc-200 [&_hr]:my-4 [&_strong]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3">
            {doc.content ? (
              <ReactMarkdown>{doc.content}</ReactMarkdown>
            ) : (
              <p className="text-zinc-400 text-sm">내용이 없습니다. 편집 버튼을 눌러 작성하세요.</p>
            )}
          </div>
        )}
        <p className="text-xs text-zinc-400 mt-3 text-right">{doc.author} · 마지막 수정 {new Date(doc.updated_at).toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  );
}
