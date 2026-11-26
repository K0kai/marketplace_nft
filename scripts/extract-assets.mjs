// Recorta as artes dos frames exportados do Figma e gera versões WebP para a aplicação.
// Uso: pnpm assets   (precisa da pasta design/ local)
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

// coordenadas no PNG original (2880px de largura); o recuo remove os cantos arredondados do frame
const SOURCES = {
  emerald: { file: 'design/Desktop/Início.png', left: 1740, top: 202, size: 900, inset: 22 },
  sage: { file: 'design/Desktop/Login.png', left: 1559, top: 2997, size: 501, inset: 18 },
  golden: { file: 'design/Desktop/Login.png', left: 1559, top: 2149, size: 501, inset: 18 },
  ivory: { file: 'design/Desktop/Login.png', left: 2141, top: 2149, size: 501, inset: 18 },
}

const WIDTHS = [160, 320, 640]

await mkdir('public/nfts', { recursive: true })

for (const [name, { file, left, top, size, inset }] of Object.entries(SOURCES)) {
  const crop = await sharp(file)
    .extract({
      left: left + inset,
      top: top + inset,
      width: size - inset * 2,
      height: size - inset * 2,
    })
    .toBuffer()

  for (const width of WIDTHS) {
    await sharp(crop)
      .resize(width, width, { withoutEnlargement: false })
      .webp({ quality: 80 })
      .toFile(`public/nfts/${name}-${width}.webp`)
  }
  console.log(`ok ${name}`)
}
