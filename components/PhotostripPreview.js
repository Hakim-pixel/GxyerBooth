export default function PhotostripPreview({
  stripMode, stripPhotos, stripCount, layoutMode,
  stripTheme, stripBgColor, stripOverlay,
  setStripPhotos, downloadStrip
}) {
  if (!stripMode) return null;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 flex flex-col items-center relative overflow-hidden">
      <h3 className="text-xl font-black text-slate-800 mb-6 w-full text-center">Your Photostrip</h3>
      
      <div className={`p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-lg transition-all duration-300 relative overflow-hidden ${layoutMode.includes('grid') ? 'w-64' : 'w-48'}`}
           style={{ 
             background: stripTheme === 'solid' ? stripBgColor : stripTheme === 'gradient' ? 'linear-gradient(to bottom, #fbcfe8, #c4b5fd)' : stripTheme === 'polka' ? `radial-gradient(rgba(255,255,255,0.6) 15%, transparent 16%) 0 0, radial-gradient(rgba(255,255,255,0.6) 15%, transparent 16%) 10px 10px, ${stripBgColor}` : '#1e1b4b',
             backgroundSize: stripTheme === 'polka' ? '20px 20px' : undefined
           }}>
         {stripTheme === 'y2k' && (
           <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #fb7185 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
         )}
         {stripOverlay && (
           <img src={stripOverlay} className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" />
         )}
         <div className={`grid gap-3 relative z-10 ${layoutMode.includes('grid') ? 'grid-cols-2' : 'grid-cols-1'}`}>
           {stripPhotos.length === 0 ? (
              Array.from({ length: stripCount }).map((_, i) => (
                <div key={i} className="aspect-square bg-black/10 rounded border border-black/5 flex items-center justify-center">
                  <span className="text-black/30 font-bold text-xl">{i+1}</span>
                </div>
              ))
           ) : (
              stripPhotos.map((src, i) => (
                <div key={i} className="aspect-square rounded border border-black/5 overflow-hidden bg-black/5">
                  <img src={src} className="w-full h-full object-cover" />
                </div>
              ))
           )}
         </div>
         {!stripOverlay && (
           <div className="mt-5 text-center font-black text-base tracking-tight relative z-10" style={{ color: (stripTheme === 'solid' && ['#ffffff', '#fef08a', '#fecdd3', '#bfdbfe'].includes(stripBgColor)) || stripTheme === 'polka' ? '#111827' : '#ffffff' }}>
              GxyerBooth
           </div>
         )}
      </div>

      {stripPhotos.length > 0 && (
        <div className="w-full flex gap-3 mt-8">
           <button className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition" onClick={() => setStripPhotos([])}>Clear</button>
           <button className="flex-[2] py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all" style={{ backgroundColor: '#ec4899' }} onClick={downloadStrip}>Download Strip</button>
        </div>
      )}
    </div>
  )
}
