export default function SidebarTabs({
  activeTab, setActiveTab,
  layoutMode, setLayoutMode, setStripPhotos, setStripMode,
  stripTheme, setStripTheme,
  stripBgColor, setStripBgColor,
  stripOverlay, setStripOverlay,
  imageFilter, setImageFilter,
  layouts, borderColors, filters
}) {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
      <div className="flex border-b border-slate-100">
         {['Layout', 'Frame', 'Filter'].map(tab => (
            <button key={tab} className={`flex-1 py-4 font-bold text-sm transition ${activeTab === tab.toLowerCase() ? 'border-b-2' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === tab.toLowerCase() ? '#ec4899' : undefined, borderColor: activeTab === tab.toLowerCase() ? '#ec4899' : undefined, backgroundColor: activeTab === tab.toLowerCase() ? '#fdf2f8' : undefined }} onClick={() => setActiveTab(tab.toLowerCase())}>
              {tab}
            </button>
         ))}
      </div>
      <div className="p-6">
         {activeTab === 'layout' && (
            <div className="flex flex-col gap-6">
               <div>
                 <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Strip Layout</h4>
                 <div className="grid grid-cols-2 gap-3">
                    {layouts.map(l => (
                      <button key={l.id} className="py-4 rounded-xl border-2 font-bold transition shadow-sm" style={{ borderColor: layoutMode === l.id ? '#ec4899' : '#e2e8f0', color: layoutMode === l.id ? '#ec4899' : '#475569', backgroundColor: layoutMode === l.id ? '#fdf2f8' : '#fff' }} onClick={() => { setLayoutMode(l.id); setStripPhotos([]); setStripMode(true); }}>
                         {l.name}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
         )}

         {activeTab === 'frame' && (
            <div className="flex flex-col gap-6">
               <div>
                 <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Strip Theme</h4>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'solid', name: 'Solid Color' },
                      { id: 'gradient', name: 'Pink Gradient' },
                      { id: 'polka', name: 'Polka Dots' },
                      { id: 'y2k', name: 'Y2K Stars' },
                    ].map(t => (
                      <button key={t.id} className="py-3 rounded-xl border-2 font-bold transition shadow-sm" style={{ borderColor: stripTheme === t.id ? '#ec4899' : '#e2e8f0', color: stripTheme === t.id ? '#ec4899' : '#475569', backgroundColor: stripTheme === t.id ? '#fdf2f8' : '#fff' }} onClick={() => setStripTheme(t.id)}>
                        {t.name}
                      </button>
                    ))}
                 </div>
               </div>
               
               {stripTheme === 'solid' && (
                 <div>
                   <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Strip Border Color</h4>
                   <div className="flex flex-wrap gap-3">
                      {borderColors.map(c => (
                        <button key={c} className={`w-12 h-12 rounded-full border-4 shadow-sm transition transform hover:scale-110 ${stripBgColor === c ? 'scale-110' : 'border-slate-100'}`} style={{ backgroundColor: c, borderColor: stripBgColor === c ? '#ec4899' : undefined }} onClick={() => setStripBgColor(c)} />
                      ))}
                      <label className="w-12 h-12 rounded-full border-4 border-slate-100 shadow-sm flex items-center justify-center bg-[conic-gradient(red,yellow,green,blue,magenta,red)] cursor-pointer hover:scale-110 transition transform">
                        <input type="color" value={stripBgColor} onChange={e => setStripBgColor(e.target.value)} className="opacity-0 absolute w-0 h-0" />
                      </label>
                   </div>
                 </div>
               )}

               <div>
                 <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Custom Frame Overlay</h4>
                 <label className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl text-center cursor-pointer hover:bg-slate-50 transition shadow-sm block">
                    Upload Overlay (PNG)
                    <input type="file" accept="image/png" onChange={(e) => {
                       const f = e.target.files?.[0]
                       if (!f) return
                       const r = new FileReader()
                       r.onload = () => setStripOverlay(r.result)
                       r.readAsDataURL(f)
                    }} className="hidden" />
                 </label>
                 {stripOverlay && (
                   <button className="w-full py-2 mt-2 text-rose-500 font-bold bg-rose-50 rounded-xl hover:bg-rose-100 transition" onClick={() => setStripOverlay(null)}>Remove Overlay</button>
                 )}
               </div>
            </div>
         )}

         {activeTab === 'filter' && (
            <div className="flex flex-col gap-3">
               <h4 className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">Image Filter</h4>
               <div className="grid grid-cols-2 gap-3">
                 {filters.map(f => (
                    <button key={f.name} className="px-4 py-4 rounded-xl border-2 font-bold transition text-center shadow-sm" style={{ borderColor: imageFilter === f.value ? '#8b5cf6' : '#e2e8f0', color: imageFilter === f.value ? '#6d28d9' : '#475569', backgroundColor: imageFilter === f.value ? '#f5f3ff' : '#fff' }} onClick={() => setImageFilter(f.value)}>
                      {f.name}
                    </button>
                 ))}
               </div>
            </div>
         )}
      </div>
    </div>
  )
}
