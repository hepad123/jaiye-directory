

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';

const newsreader = "'Newsreader', var(--font-playfair, serif)";
const manrope = "'Manrope', var(--font-jost, sans-serif)";
const bebas = "'Bebas Neue', serif";
const ACCENT = '#B4690E';
const BG = '#FAF7F2';
const BORDER = '#E5DDD4';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const CATEGORIES = ['Hair','Makeup','Lashes','Nails','Brows'];

type StyleEntry = {
  id: string;
  month: number;
  style_name: string;
  category: string;
  image_url: string | null;
  note: string | null;
  created_at: string;
};

type ModalState = {
  open: boolean;
  month: number | null;
};

function StyleCard({ entry, onDelete }: { entry: StyleEntry; onDelete: (id: string, imageUrl: string | null) => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPress() {
    pressTimer.current = setTimeout(() => { setShowDelete(true); }, 600);
  }

  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(entry.id, entry.image_url);
    setShowDelete(false);
  }

  return (
    <div
      className="style-card"
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={() => { endPress(); setShowDelete(false); }}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onClick={() => { if (showDelete) setShowDelete(false); }}
    >
      {entry.image_url ? (
        <img src={entry.image_url} alt={entry.style_name} />
      ) : (
        <div className="no-image">
          <span style={{ fontFamily: newsreader, fontSize: 13, color: '#a8a29e', fontStyle: 'italic' }}>No image</span>
        </div>
      )}
      <span className="cat-pill">{entry.category}</span>
      {showDelete && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
          <button
            onClick={handleDelete}
            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: manrope, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >&#128465; Delete</button>
        </div>
      )}
      <div className="note-bar">
        <p className="entry-name">{entry.style_name}</p>
        {entry.note && <p style={{ marginTop: 2, margin: 0, fontFamily: manrope, fontSize: 12, color: '#fff', lineHeight: '1.3' }}>{entry.note}</p>}
      </div>
    </div>
  );
}

export default function StyleCalendarPage() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const supabase = useSupabase();

  const [entries, setEntries] = useState<StyleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<number[]>([new Date().getMonth() + 1]);
  const [modal, setModal] = useState<ModalState>({ open: false, month: null });

  const [styleName, setStyleName] = useState('');
  const [category, setCategory] = useState('Hair');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchEntries();
  }, [user]);

  async function fetchEntries() {
    setLoading(true);
    const { data } = await supabase
      .from('style_calendar')
      .select('*')
      .order('created_at', { ascending: true });
    setEntries(data || []);
    setLoading(false);
  }

  function toggleMonth(m: number) {
    setOpenMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function openAddModal(month: number) {
    setModal({ open: true, month });
    setStyleName('');
    setCategory('Hair');
    setNote('');
    setImageUrl('');
    setUploadedUrl('');
    setShowUrlInput(false);
  }

  function closeModal() {
    setModal({ open: false, month: null });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = user.id + '/' + Date.now() + '.' + ext;
    const { data, error } = await supabase.storage
      .from('style-calendar')
      .upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: pub } = supabase.storage.from('style-calendar').getPublicUrl(data.path);
      setUploadedUrl(pub.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!user || !modal.month || !styleName.trim()) return;
    setSaving(true);
    const finalUrl = uploadedUrl || imageUrl || null;
    await supabase.from('style_calendar').insert({
      clerk_user_id: user.id,
      month: modal.month,
      style_name: styleName.trim(),
      category,
      image_url: finalUrl,
      note: note.trim() || null,
    });
    await fetchEntries();
    setSaving(false);
    closeModal();
  }

  async function handleDelete(id: string, imgUrl: string | null) {
    if (imgUrl && imgUrl.includes('style-calendar')) {
      const path = imgUrl.split('/style-calendar/')[1];
      if (path) await supabase.storage.from('style-calendar').remove([path]);
    }
    await supabase.from('style_calendar').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  if (!isLoaded) return (
  <div style={{ background: '#FAF7F2', minHeight: '100vh', padding: '32px 20px' }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ height: 12, width: 120, background: '#f0e6dc', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 36, width: 260, background: '#f0e6dc', borderRadius: 8, marginBottom: 8 }} />
      <div style={{ height: 16, width: 200, background: '#f0e6dc', borderRadius: 6, marginBottom: 32 }} />
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 64, background: '#f0e6dc', borderRadius: 12, marginBottom: 12, opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  </div>
);

  if (!user) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Newsreader:ital,wght@0,400;0,600;1,400&family=Manrope:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ background: BG, minHeight: '100vh' }}>
          {/* Dark editorial header — even for logged-out state */}
          <div style={{ background: '#FAF7F2', padding: 'clamp(28px,5vw,56px) clamp(20px,5vw,64px) clamp(24px,4vw,44px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 20, right: 28, fontSize: 9, letterSpacing: '0.30em', textTransform: 'uppercase' as const, color: 'rgba(26,22,18,0.30)', fontFamily: manrope, fontWeight: 600 }}>The Jaiyé Edit</div>
            <div style={{ fontSize: 'clamp(11px,1.4vw,13px)', letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: ACCENT, fontFamily: manrope, fontWeight: 700, marginBottom: 8 }}>Your Beauty Diary</div>
            <div style={{ fontFamily: bebas, fontSize: 'clamp(52px,9vw,108px)', lineHeight: 0.92, color: '#1A1612', letterSpacing: '0.03em', marginBottom: 14 }}>
              STYLE<br /><span style={{ color: ACCENT }}>CALENDAR.</span>
            </div>
            <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(to right, ' + ACCENT + ' 0%, rgba(180,105,14,0.2) 60%, transparent 100%)', maxWidth: 440 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ textAlign: 'center', padding: '60px 16px' }}>
              <h2 style={{ fontSize: 22, color: '#1A1612', fontWeight: 600, margin: '0 0 10px', fontFamily: newsreader }}>Sign in to view your Style Calendar</h2>
              <p style={{ color: '#9C8C7E', fontSize: 14, margin: '0 0 28px', fontFamily: manrope, lineHeight: 1.6 }}>Save your looks month by month and build your beauty diary.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <button onClick={() => openSignIn()} style={{ padding: '13px 36px', background: ACCENT, color: 'white', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: manrope, width: 220 }}>Sign in</button>
                <button onClick={() => openSignIn()} style={{ padding: '13px 36px', background: 'rgba(26,22,18,0.05)', color: ACCENT, borderRadius: 24, border: '1.5px solid ' + ACCENT, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: manrope, width: 220 }}>Create account</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400&family=Manrope:wght@400;500;600;700&display=swap');
        .month-card { border: 1px solid #E5DDD4; border-radius: 14px; overflow: hidden; background: #FFFFFF; box-shadow: 0 2px 12px rgba(26,22,18,0.07); }
        .month-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; cursor: pointer; }
        .month-header:hover { background: rgba(26,22,18,0.03); }
        .style-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 16px 16px; }
        @media(min-width: 640px) { .style-grid { grid-template-columns: repeat(3, 1fr); } }
        @media(min-width: 1024px) { .style-grid { grid-template-columns: repeat(4, 1fr); } }
        .style-card { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 3/4; background: #EEE9E0; cursor: pointer; user-select: none; -webkit-user-select: none; }
        .style-card img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
        .note-bar { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%); padding: 28px 10px 10px; }
        .entry-name { color: #fff; font-size: 13px; font-weight: 600; margin: 0; font-family: ${manrope}; line-height: 1.3; }
        .cat-pill { position: absolute; top: 8px; left: 8px; background: ${ACCENT}; color: #fff; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 20px; font-family: ${manrope}; letter-spacing: 0.07em; text-transform: uppercase; pointer-events: none; }
        .no-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #EEE9E0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(26,22,18,0.60); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width: 640px) { .modal-overlay { align-items: center; } }
        .modal-box { background: #FFFFFF; border: 1px solid #E5DDD4; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; padding: 28px 24px 40px; }
        @media(min-width: 640px) { .modal-box { border-radius: 16px; padding: 28px 24px; } }
        .modal-title { font-family: ${newsreader}; font-size: 22px; color: #1A1612; margin: 0 0 20px; }
        .field-label { font-family: ${manrope}; font-size: 12px; font-weight: 700; color: #1A1612; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; display: block; }
        .field-input { width: 100%; border: 1px solid #E5DDD4; border-radius: 8px; padding: 10px 12px; font-family: ${manrope}; font-size: 14px; color: #1A1612; background: #FAF7F2; box-sizing: border-box; outline: none; }
        .field-input:focus { border-color: ${ACCENT}; }
        .img-btn-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .img-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #E5DDD4; font-family: ${manrope}; font-size: 13px; font-weight: 600; cursor: pointer; background: #F5EEE6; color: #9C8C7E; text-align: center; }
        .img-btn.uploaded { background: #f0fdf4; border-color: #16a34a; color: #16a34a; }
        .img-btn.uploading { opacity: 0.6; cursor: not-allowed; }
        .img-btn.url-active { background: ${ACCENT}; color: #fff; border-color: ${ACCENT}; }
        .save-btn { width: 100%; padding: 13px; background: ${ACCENT}; color: #fff; border: none; border-radius: 10px; font-family: ${manrope}; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cancel-link { display: block; text-align: center; margin-top: 12px; font-family: ${manrope}; font-size: 13px; color: #9C8C7E; cursor: pointer; }
        .upload-preview { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; margin-top: 8px; }
        .long-press-hint { text-align: center; font-family: ${manrope}; font-size: 11px; color: #9C8C7E; padding: 0 16px 12px; }
      `}</style>

      <div style={{ background: BG, minHeight: '100vh', paddingBottom: 60 }}>
        {/* ── Editorial dark header ── */}
        <div style={{ background: '#FAF7F2', padding: 'clamp(28px,5vw,56px) clamp(20px,5vw,64px) clamp(24px,4vw,44px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 20, right: 28, fontSize: 9, letterSpacing: '0.30em', textTransform: 'uppercase' as const, color: 'rgba(26,22,18,0.30)', fontFamily: manrope, fontWeight: 600 }}>The Jaiyé Edit</div>
          <div style={{ fontSize: 'clamp(11px,1.4vw,13px)', letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: ACCENT, fontFamily: manrope, fontWeight: 700, marginBottom: 8 }}>Your Beauty Diary</div>
          <div style={{ fontFamily: bebas, fontSize: 'clamp(52px,9vw,108px)', lineHeight: 0.92, color: '#1A1612', letterSpacing: '0.03em', marginBottom: 14 }}>
            STYLE<br /><span style={{ color: ACCENT }}>CALENDAR.</span>
          </div>
          <p style={{ fontFamily: manrope, fontSize: 13, color: '#9C8C7E', margin: 0 }}>Save your looks, month by month. Hold a photo to delete.</p>
          <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(to right, ' + ACCENT + ' 0%, rgba(180,105,14,0.2) 60%, transparent 100%)', maxWidth: 440 }} />
        </div>

        <div style={{ maxWidth: 720, margin: '24px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <p style={{ fontFamily: manrope, color: '#9C8C7E', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : MONTHS.map((name, i) => {
            const monthNum = i + 1;
            const monthEntries = entries.filter(e => e.month === monthNum);
            const isOpen = openMonths.includes(monthNum);

            return (
              <div key={monthNum} className="month-card">
                <div className="month-header" onClick={() => toggleMonth(monthNum)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: newsreader, fontSize: 20, fontWeight: 600, color: '#1A1612' }}>{name}</span>
                    {monthEntries.length > 0 && (
                      <span style={{ fontFamily: manrope, fontSize: 11, fontWeight: 700, color: ACCENT, background: '#fdf0e0', padding: '2px 8px', borderRadius: 20 }}>{monthEntries.length}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={e => { e.stopPropagation(); openAddModal(monthNum); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: manrope, fontSize: 20, color: ACCENT, lineHeight: 1, padding: '0 4px' }}
                    >+</button>
                    <span style={{ color: '#9C8C7E', fontSize: 14, transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>&#9660;</span>
                  </div>
                </div>

                {isOpen && (
                  <div>
                    {monthEntries.length === 0 ? (
                      <div style={{ padding: '16px 20px 20px', textAlign: 'center' }}>
                        <p style={{ fontFamily: manrope, fontSize: 13, color: '#a8a29e', margin: '0 0 12px' }}>{'No styles added for ' + name}</p>
                        <button
                          onClick={() => openAddModal(monthNum)}
                          style={{ fontFamily: manrope, fontSize: 13, fontWeight: 600, color: ACCENT, background: '#fdf0e0', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
                        >+ Add your first look</button>
                      </div>
                    ) : (
                      <>
                        <div className="style-grid">
                          {monthEntries.map(entry => (
                            <StyleCard key={entry.id} entry={entry} onDelete={handleDelete} />
                          ))}
                        </div>
                        <p className="long-press-hint">Hold a photo to delete</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modal.open && modal.month && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{'Add Style for ' + MONTHS[modal.month - 1]}</h2>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Style Name</label>
              <input
                className="field-input"
                placeholder="e.g. Knotless braids, Glam beat..."
                value={styleName}
                onChange={e => setStyleName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Style Image</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              <div className="img-btn-row">
                <button
                  className={'img-btn' + (uploading ? ' uploading' : uploadedUrl ? ' uploaded' : '')}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : uploadedUrl ? '\u2713 Photo uploaded' : '\uD83D\uDCF7 Upload photo'}
                </button>
                <button
                  className={'img-btn' + (showUrlInput ? ' url-active' : '')}
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  {'\uD83D\uDD17 Paste URL'}
                </button>
              </div>
              {uploadedUrl && !showUrlInput && <img src={uploadedUrl} alt="preview" className="upload-preview" />}
              {showUrlInput && (
                <div>
                  <input
                    className="field-input"
                    placeholder="Paste image URL or Instagram post link"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                  {imageUrl && <img src={imageUrl} alt="preview" className="upload-preview" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Category</label>
              <select className="field-input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Note</label>
              <textarea
                className="field-input"
                placeholder="How did it turn out? Any thoughts..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <button className="save-btn" onClick={handleSave} disabled={saving || !styleName.trim()}>
              {saving ? 'Saving...' : 'Add Style to ' + MONTHS[(modal.month as number) - 1]}
            </button>
            <span className="cancel-link" onClick={closeModal}>Cancel</span>
          </div>
        </div>
      )}
    </>
  );
}
