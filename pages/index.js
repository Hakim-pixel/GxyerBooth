import dynamic from 'next/dynamic'
import Head from 'next/head'

const PhotoEditor = dynamic(() => import('../components/PhotoEditor'), { ssr: false })

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>GxyerBooth</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <PhotoEditor />
      </main>
    </div>
  )
}
