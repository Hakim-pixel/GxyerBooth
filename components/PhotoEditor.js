'use client'
import { useRef, useState, useEffect } from 'react'
import { filters, layouts, borderColors } from './constants'
import PhotostripPreview from './PhotostripPreview'
import SidebarTabs from './SidebarTabs'

export default function PhotoEditor() {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const pointersRef = useRef(new Map())

  const [photo, setPhoto] = useState(null)
  const [photoSrc, setPhotoSrc] = useState(null)
  const [sticker, setSticker] = useState(null)
  const [stickerSrc, setStickerSrc] = useState(null)

  const [bgColor, setBgColor] = useState('#ffffff')
  const [frameColor, setFrameColor] = useState('#0f172a')
  const [frameWidth, setFrameWidth] = useState(8)

  // transform state
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  // interactive states
  const [isDragging, setIsDragging] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [delay, setDelay] = useState(3)
  const [showGrid, setShowGrid] = useState(false)
  const [mirror, setMirror] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false) // NEW robust lock
  
  // Customization
  const [activeTab, setActiveTab] = useState('layout')
  const [layoutMode, setLayoutMode] = useState('4-strip') // '3-strip', '4-strip'
  const [imageFilter, setImageFilter] = useState('none')
  const [stripBgColor, setStripBgColor] = useState('#ffffff')
  const [stripTheme, setStripTheme] = useState('solid')
  const [stripOverlay, setStripOverlay] = useState(null)
  
  const [frameStyle, setFrameStyle] = useState('polaroid')
  const [caption, setCaption] = useState('')
  
  const [stripMode, setStripMode] = useState(true)
  const [stripPhotos, setStripPhotos] = useState([])
  
  const stripCount = layoutMode === '3-strip' ? 3 : layoutMode === '2x3-grid' ? 6 : 4

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // load photo & sticker
  useEffect(() => {
    if (!photoSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setPhoto(img)
    img.src = photoSrc
  }, [photoSrc])

  useEffect(() => {
    if (!stickerSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setSticker(img)
    img.src = stickerSrc
  }, [stickerSrc])

  // redraw
  useEffect(() => {
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, sticker, bgColor, frameColor, frameWidth, scale, offsetX, offsetY, showGrid, frameStyle, caption, mirror, imageFilter])

  // live preview loop when camera is on and no static photo is set
  useEffect(() => {
    const video = videoRef.current
    const shouldPreview = isCameraOn && video && !photo
    if (!shouldPreview) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      draw()
      return
    }

    let mounted = true
    const loop = () => {
      if (!mounted) return
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [isCameraOn, photo, imageFilter, mirror])

  function handlePhotoUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setPhotoSrc(r.result)
    r.readAsDataURL(f)
  }

  function handleStickerChoose(name) {
    setStickerSrc(`/stickers/${name}`)
  }

  function handleStickerUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setStickerSrc(r.result)
    r.readAsDataURL(f)
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = (canvas.width = 900)
    const h = (canvas.height = 700)

    // background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)

    // decorative frame
    drawDecorativeFrame(ctx, w, h)

    // central photo / live-video area
    const targetBaseW = 480
    const video = videoRef.current

    ctx.save()
    ctx.filter = imageFilter

    if (isCameraOn && video && !photo) {
      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      const tW = targetBaseW * scale
      const tH = (vh / vw) * tW
      const x = (w - tW) / 2 + offsetX
      const y = (h - tH) / 2 + offsetY

      ctx.save()
      roundRect(ctx, x - 6, y - 6, tW + 12, tH + 12, 20)
      ctx.clip()
      try {
        if (mirror) {
          ctx.translate(x + tW / 2, y + tH / 2)
          ctx.scale(-1, 1)
          ctx.drawImage(video, -tW / 2, -tH / 2, tW, tH)
        } else {
          ctx.drawImage(video, x, y, tW, tH)
        }
      } catch (e) {
        // ignore
      }
      ctx.restore()
    } else if (photo) {
      const pw = photo.width
      const ph = photo.height
      const tW = targetBaseW * scale
      const tH = (ph / pw) * tW
      const x = (w - tW) / 2 + offsetX
      const y = (h - tH) / 2 + offsetY

      ctx.save()
      roundRect(ctx, x - 6, y - 6, tW + 12, tH + 12, 20)
      ctx.clip()
      ctx.drawImage(photo, x, y, tW, tH)
      ctx.restore()
    } else {
      ctx.fillStyle = '#ffffff33'
      const pw = targetBaseW * scale
      const ph = pw * 0.75
      const x = (w - pw) / 2 + offsetX
      const y = (h - ph) / 2 + offsetY
      roundRect(ctx, x, y, pw, ph, 16)
      ctx.fillStyle = '#ffffff44'
      ctx.fill()
    }
    ctx.restore() // restore filter

    // sticker
    if (sticker) {
      const sw = 120
      const sh = (sticker.height / sticker.width) * sw
      const px = w / 2 + (targetBaseW * scale) / 2 - sw - 24 + offsetX
      const py = h / 2 + (photo ? (photo.height / photo.width) * (targetBaseW * scale) : 200) / 2 - sh - 24 + offsetY
      ctx.drawImage(sticker, px, py, sw, sh)
    }

    if (showGrid) {
      ctx.save()
      ctx.strokeStyle = frameColor + '55'
      ctx.lineWidth = 1
      const cols = 3
      const rows = 3
      for (let i = 1; i < cols; i++) {
        const x = (w / cols) * i
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let j = 1; j < rows; j++) {
        const y = (h / rows) * j
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      ctx.restore()
    }
  }

  function drawDecorativeFrame(ctx, w, h) {
    const drawRound = (x, y, ww, hh, r) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + ww, y, x + ww, y + hh, r)
      ctx.arcTo(x + ww, y + hh, x, y + hh, r)
      ctx.arcTo(x, y + hh, x, y, r)
      ctx.arcTo(x, y, x + ww, y, r)
      ctx.closePath()
    }

    if (frameStyle === 'polaroid') {
      const pad = 24
      ctx.save()
      ctx.fillStyle = frameColor
      ctx.fillRect(0, 0, w, h)
      ctx.restore()

      const border = 28
      const pbx = border
      const pby = border
      const pbw = w - border * 2
      const pbh = h - border * 2

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 6
      ctx.fillStyle = '#ffffff'
      drawRound(pbx, pby, pbw, pbh, 10)
      ctx.fill()
      ctx.restore()

      const innerPad = 18
      const iy = pby + innerPad
      const ih = pbh - innerPad * 2 - 40 
      if (caption) {
        ctx.font = '18px Georgia, serif'
        ctx.fillStyle = '#111827'
        ctx.textAlign = 'center'
        ctx.fillText(caption, w / 2, iy + ih + 32)
      }
    } else if (frameStyle === 'classic') {
      const thickness = Math.max(8, frameWidth || 12)
      const inset = thickness / 2
      ctx.save()
      ctx.fillStyle = frameColor
      ctx.fillRect(0, 0, w, h)
      const g = ctx.createLinearGradient(0, 0, w, 0)
      g.addColorStop(0, '#ffffff44')
      g.addColorStop(0.5, '#00000022')
      g.addColorStop(1, '#ffffff22')
      ctx.strokeStyle = g
      ctx.lineWidth = thickness
      drawRound(inset, inset, w - inset * 2, h - inset * 2, 18)
      ctx.stroke()
      ctx.restore()
    } else if (frameStyle === 'film') {
      ctx.save()
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, w, h)
      const holeW = 16
      const gap = 18
      const holeH = 28
      ctx.fillStyle = '#f3f4f6'
      for (let y = gap; y < h - gap; y += holeH + gap) {
        ctx.beginPath(); ctx.rect(8, y, holeW, holeH); ctx.fill()
        ctx.beginPath(); ctx.rect(w - 8 - holeW, y, holeW, holeH); ctx.fill()
      }
      ctx.restore()
    } else if (frameStyle === 'modern') {
      ctx.save()
      ctx.fillStyle = frameColor
      ctx.fillRect(0, 0, w, h)
      const pad = 22
      ctx.fillStyle = '#fff'
      drawRound(pad, pad, w - pad * 2, h - pad * 2, 16)
      ctx.fill()
      const starX = w - 120
      const starY = h / 2 + 60
      drawStar(ctx, starX, starY, 5, 24, 12, '#FFD700')
      ctx.restore()
    }
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes
    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step
      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + width, y, x + width, y + height, radius)
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    ctx.arcTo(x, y + height, x, y, radius)
    ctx.arcTo(x, y, x + width, y, radius)
    ctx.closePath()
  }

  function downloadImage() {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'GxyerBooth-single.png'
    a.click()
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsCameraOn(true)
    } catch (err) {
      console.error('Cannot access camera', err)
    }
  }

  function stopCamera() {
    const s = videoRef.current?.srcObject
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
  }

  function playShutter() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtxRef.current
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = 1000
      g.gain.value = 0.0001
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setTargetAtTime(0.12, ctx.currentTime, 0.01)
      o.start()
      o.stop(ctx.currentTime + 0.12)
    } catch (e) {}
  }

  function captureFromCamera() {
    const video = videoRef.current
    if (!video) return
    const ensureReady = () => new Promise((resolve) => {
      if (video.videoWidth && video.videoHeight) return resolve()
      function onMeta() { resolve(); cleanup() }
      function onTimeout() { resolve(); cleanup() }
      function cleanup() { video.removeEventListener('loadedmetadata', onMeta) }
      video.addEventListener('loadedmetadata', onMeta)
      setTimeout(onTimeout, 500)
    })

    ensureReady().then(() => {
      const canvas = document.createElement('canvas')
      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      canvas.width = vw
      canvas.height = vh
      const ctx = canvas.getContext('2d')
      
      ctx.filter = imageFilter
      
      try {
        if (mirror) {
          ctx.translate(vw, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, vw, vh)
      } catch (e) {
        console.warn('captureFromCamera drawImage failed', e)
      }
      const data = canvas.toDataURL('image/png')
      setPhotoSrc(data)
      playShutter()
    })
  }

  async function captureSequence(count = stripCount) {
    if (!isCameraOn) {
      captureFromCamera()
      return
    }

    if (isCapturing) return // Lock the sequence to prevent multiple clicks
    setIsCapturing(true)
    setStripPhotos([])

    for (let i = 0; i < count; i++) {
      // Countdown phase
      for (let c = delay; c > 0; c--) {
        setCountdown(c)
        await sleep(1000)
      }
      
      // Capture phase
      setCountdown(0)
      const video = videoRef.current
      if (video) {
        const cCanvas = document.createElement('canvas')
        const vw = video.videoWidth || 640
        const vh = video.videoHeight || 480
        cCanvas.width = vw
        cCanvas.height = vh
        const ctx = cCanvas.getContext('2d')
        
        ctx.filter = imageFilter
        
        if (mirror) {
          ctx.translate(vw, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, vw, vh)
        const data = cCanvas.toDataURL('image/png')
        
        playShutter()
        setStripPhotos((s) => {
          // Safeguard to never add more than requested count
          if (s.length < count) return [...s, data]
          return s
        })
      }
      
      // Wait for user to notice the capture before next countdown
      await sleep(1000)
    }

    setIsCapturing(false)
  }

  async function startCountdownAndCapture(sec = delay) {
    if (isCapturing) return
    setIsCapturing(true)
    for (let c = sec; c > 0; c--) {
      setCountdown(c)
      await sleep(1000)
    }
    setCountdown(0)
    captureFromCamera()
    setIsCapturing(false)
  }

  async function downloadStrip() {
    if (!stripPhotos?.length) return
    const images = await Promise.all(stripPhotos.map(src => {
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = src
      })
    }))

    const w = images[0].width
    const h = images[0].height
    const pad = Math.round(w * 0.08)
    
    const cols = layoutMode.includes('grid') ? 2 : 1
    const rows = Math.ceil(images.length / cols)
    
    const canvas = document.createElement('canvas')
    canvas.width = (w * cols) + (pad * (cols + 1))
    canvas.height = (h * rows) + (pad * (rows + 1)) + 120
    const ctx = canvas.getContext('2d')
    
    if (stripTheme === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      g.addColorStop(0, '#fbcfe8')
      g.addColorStop(1, '#c4b5fd')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else if (stripTheme === 'polka') {
      ctx.fillStyle = stripBgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      for (let i = 0; i < canvas.width; i += 40) {
        for (let j = 0; j < canvas.height; j += 40) {
          ctx.beginPath(); ctx.arc(i, j, 8, 0, Math.PI * 2); ctx.fill()
        }
      }
    } else if (stripTheme === 'y2k') {
      ctx.fillStyle = '#1e1b4b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      for(let i=0; i<30; i++) {
        drawStar(ctx, Math.random()*canvas.width, Math.random()*canvas.height, 5, 20, 8, '#fb7185')
      }
    } else {
      ctx.fillStyle = stripBgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    images.forEach((im, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = pad + col * (w + pad)
      const y = pad + row * (h + pad)
      
      ctx.drawImage(im, x, y, w, h)
      ctx.strokeStyle = '#00000015'
      ctx.lineWidth = 4
      ctx.strokeRect(x, y, w, h)
    })

    if (stripOverlay) {
      const overlayImg = await new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = stripOverlay
      })
      ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
    } else {
      const darkTextColors = ['#ffffff', '#fef08a', '#fecdd3', '#bfdbfe']
      ctx.fillStyle = (stripTheme === 'solid' && darkTextColors.includes(stripBgColor)) || stripTheme === 'polka' ? '#111827' : '#ffffff'
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('GxyerBooth', canvas.width / 2, canvas.height - 60)
    }

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'GxyerBooth-strip.png'
    a.click()
  }

  function handlePointerDown(e) {
    const map = pointersRef.current
    map.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setIsDragging(true)
  }

  function handlePointerMove(e) {
    const canvas = e.currentTarget
    const map = pointersRef.current
    if (!map.has(e.pointerId)) return
    map.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (map.size === 1) {
      const dx = e.movementX || 0
      const dy = e.movementY || 0
      setOffsetX((x) => x + dx)
      setOffsetY((y) => y + dy)
    } else if (map.size === 2) {
      const pts = Array.from(map.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      if (!canvas._lastPinchDist) canvas._lastPinchDist = dist
      else {
        const diff = dist - canvas._lastPinchDist
        setScale((s) => Math.max(0.2, Math.min(3, s + diff * 0.005)))
        canvas._lastPinchDist = dist
      }
    }
  }

  function handlePointerUp(e) {
    pointersRef.current.delete(e.pointerId)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setIsDragging(false)
    if (e.currentTarget) e.currentTarget._lastPinchDist = null
  }

  function handleWheel(e) {
    e.preventDefault()
    setScale((s) => Math.max(0.2, Math.min(3, s - e.deltaY * 0.0015)))
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ' ) {
        if (isCameraOn) captureFromCamera()
      }
      if (e.key === 'c') {
        if (isCameraOn) stopCamera(); else startCamera()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isCameraOn])

  function toggleFullscreen() {
    const el = canvasRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  function resetTransform() {
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] py-8 font-sans text-slate-800">
      <header className="max-w-6xl mx-auto px-4 flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-pink-600 flex items-center gap-3" style={{ color: '#ec4899' }}>
          ✨ GxyerBooth
        </h1>
        <div className="flex gap-4">
          <button className="px-6 py-2.5 rounded-full font-bold shadow-md bg-white hover:bg-pink-50 text-pink-600 transition border border-pink-100" onClick={() => { if (isCameraOn) stopCamera(); else startCamera() }}>
            {isCameraOn ? 'Stop Camera ⏹' : 'Start Camera 📸'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="flex-1 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col w-full">
          <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center bg-slate-50">
             <div className="flex gap-2">
               <button className="px-4 py-2 rounded-full font-bold transition shadow-sm" style={{ backgroundColor: delay === 3 ? '#ec4899' : '#fff', color: delay === 3 ? '#fff' : '#475569', border: '1px solid #e2e8f0' }} onClick={() => setDelay(3)}>3s</button>
               <button className="px-4 py-2 rounded-full font-bold transition shadow-sm" style={{ backgroundColor: delay === 5 ? '#ec4899' : '#fff', color: delay === 5 ? '#fff' : '#475569', border: '1px solid #e2e8f0' }} onClick={() => setDelay(5)}>5s</button>
               <button className="px-4 py-2 rounded-full font-bold transition shadow-sm" style={{ backgroundColor: delay === 10 ? '#ec4899' : '#fff', color: delay === 10 ? '#fff' : '#475569', border: '1px solid #e2e8f0' }} onClick={() => setDelay(10)}>10s</button>
               <button className="px-4 py-2 rounded-full font-bold transition shadow-sm ml-2" style={{ backgroundColor: showGrid ? '#8b5cf6' : '#fff', color: showGrid ? '#fff' : '#475569', border: '1px solid #e2e8f0' }} onClick={() => setShowGrid(!showGrid)}>Grid</button>
             </div>
             <div>
               <label className="px-5 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-full cursor-pointer hover:bg-slate-50 transition shadow-sm">
                 Upload Photo
                 <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
               </label>
             </div>
          </div>

          <div className="relative flex justify-center items-center bg-slate-100 p-4 lg:p-8" style={{ minHeight: 500 }}>
             <div className="relative shadow-2xl rounded-2xl overflow-hidden" style={{ width: 760, height: 460 }}>
                <canvas ref={canvasRef} className="w-full h-full block bg-white" />
                <video ref={videoRef} autoPlay playsInline muted className={`absolute top-4 right-4 w-32 h-24 object-cover rounded-xl shadow-lg border-2 border-white/50 backdrop-blur ${isCameraOn ? '' : 'hidden'}`} style={{ transform: mirror ? 'scaleX(-1)' : 'none' }} />
             </div>
             {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-32 h-32 bg-pink-500/90 text-white rounded-full flex items-center justify-center text-6xl font-bold shadow-2xl animate-pulse" style={{ backgroundColor: 'rgba(236,72,153,0.9)', color: 'white' }}>
                     {countdown}
                  </div>
                </div>
             )}
          </div>

          <div className="p-6 bg-white flex flex-col items-center">
             <button disabled={isCapturing} className="relative group px-12 py-5 rounded-full text-2xl font-black shadow-xl transition-transform" style={{ backgroundColor: isCapturing ? '#cbd5e1' : '#ec4899', color: isCapturing ? '#64748b' : '#ffffff', cursor: isCapturing ? 'not-allowed' : 'pointer' }} onClick={() => {
                if (isCapturing) return;
                if (stripMode) captureSequence(stripCount)
                else {
                  if (isCameraOn) startCountdownAndCapture(delay)
                  else captureFromCamera()
                }
             }}>
                <span className="flex items-center gap-2">
                   {stripMode ? `Start ${stripCount}-Pose Capture` : 'Take Photo'}
                </span>
             </button>
             
             <div className="mt-6 flex flex-wrap justify-center gap-6 items-center">
               <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 hover:text-pink-600 transition">
                  <input type="checkbox" checked={stripMode} onChange={(e) => setStripMode(e.target.checked)} className="w-5 h-5 accent-pink-500 rounded cursor-pointer" />
                  Strip Mode (Photobooth)
               </label>
               <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 hover:text-pink-600 transition">
                  <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="w-5 h-5 accent-pink-500 rounded cursor-pointer" />
                  Mirror Camera
               </label>
             </div>

             <div className="w-full flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                <button className="text-slate-400 hover:text-slate-800 font-bold px-4 py-2 transition" onClick={resetTransform}>Reset Position</button>
                <div className="flex gap-2">
                  <button className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2 bg-slate-100 rounded-lg transition" onClick={toggleFullscreen}>Fullscreen</button>
                  <button className="text-white font-bold px-4 py-2 rounded-lg hover:bg-black transition shadow-md" style={{ backgroundColor: '#1e293b' }} onClick={downloadImage}>Save Frame</button>
                </div>
             </div>
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6">
           <PhotostripPreview 
              stripMode={stripMode} 
              stripPhotos={stripPhotos} 
              stripCount={stripCount} 
              layoutMode={layoutMode}
              stripTheme={stripTheme} 
              stripBgColor={stripBgColor} 
              stripOverlay={stripOverlay}
              setStripPhotos={setStripPhotos} 
              downloadStrip={downloadStrip} 
           />
           <SidebarTabs 
              activeTab={activeTab} setActiveTab={setActiveTab}
              layoutMode={layoutMode} setLayoutMode={setLayoutMode}
              setStripPhotos={setStripPhotos} setStripMode={setStripMode}
              stripTheme={stripTheme} setStripTheme={setStripTheme}
              stripBgColor={stripBgColor} setStripBgColor={setStripBgColor}
              stripOverlay={stripOverlay} setStripOverlay={setStripOverlay}
              imageFilter={imageFilter} setImageFilter={setImageFilter}
              layouts={layouts} borderColors={borderColors} filters={filters}
           />
        </div>

      </main>
    </div>
  )
}
