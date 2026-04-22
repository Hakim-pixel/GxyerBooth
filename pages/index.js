import dynamic from 'next/dynamic'
import Head from 'next/head'

const PhotoEditor = dynamic(() => import('../components/PhotoEditor'), { ssr: false })

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Fotobox - Custom Theme &amp; Upload</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>Fotobox — Buat tema & tambahkan foto wajah</h1>
        <p>Upload foto, pilih warna tema/frame, tambahkan sticker, lalu download hasilnya.</p>
        <PhotoEditor />
      </main>

      <footer>
        <small>Siap dideploy ke Vercel</small>
      </footer>
    </div>
  )
}
