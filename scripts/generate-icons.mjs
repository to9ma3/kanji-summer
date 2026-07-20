// PWAアイコン生成スクリプト（一時的な devDependency である opentype.js / sharp を使用）。
// アイコン生成後は public/icons 以下に成果物だけが残る。著作権のある既存キャラクター等は使用しない。
import opentype from 'opentype.js'
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const iconsDir = path.join(rootDir, 'public', 'icons')

const SEA_DARK = '#0b5a8f'
const SEA_MID = '#1a8fc0'
const SEA_LIGHT = '#5fd0e6'
const SAND = '#f4d99b'
const PALM_TRUNK = '#8a5a2b'
const PALM_LEAF = '#1f8a5f'
const STAR = '#ffe07a'
const KANJI_COLOR = '#ffffff'

async function loadKanjiPathData(fontSize, centerX, centerY) {
  const fontBuffer = await readFile('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength,
  )
  const font = opentype.parse(arrayBuffer)
  const glyph = font.charToGlyph('学')
  const advanceWidth = (glyph.advanceWidth / font.unitsPerEm) * fontSize
  // ベースラインを中心付近に置き、グリフの視覚的な中心をおおよそ centerY に合わせる
  const x = centerX - advanceWidth / 2
  const y = centerY + fontSize * 0.35
  const glyphPath = glyph.getPath(x, y, fontSize)
  return glyphPath.toPathData(2)
}

function buildIcon({ kanjiPathData, maskable }) {
  const size = 512
  const contentScale = maskable ? 0.72 : 1
  const offset = (size * (1 - contentScale)) / 2

  // 島(砂浜)とヤシの木、星。maskable の場合は安全マージンを確保するため中央に縮小配置する。
  const islandCx = size / 2
  const islandCy = maskable ? size * 0.66 : size * 0.74
  const islandRx = 150 * contentScale
  const islandRy = 46 * contentScale

  const palmBaseX = islandCx + 92 * contentScale
  const palmBaseY = islandCy - 6 * contentScale
  const palmTopX = palmBaseX - 26 * contentScale
  const palmTopY = palmBaseY - 150 * contentScale

  const kanjiCenterX = islandCx - 6 * contentScale
  const kanjiCenterY = islandCy - 150 * contentScale
  const kanjiScale = contentScale

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SEA_LIGHT}" />
      <stop offset="0.55" stop-color="${SEA_MID}" />
      <stop offset="1" stop-color="${SEA_DARK}" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#sea)" />

  <!-- 小さな星 -->
  <g fill="${STAR}">
    <circle cx="${size * 0.2}" cy="${size * 0.16}" r="${7 * contentScale}" />
    <circle cx="${size * 0.8}" cy="${size * 0.22}" r="${5 * contentScale}" />
    <circle cx="${size * 0.7}" cy="${size * 0.12}" r="${4 * contentScale}" />
  </g>

  <!-- ヤシの木 -->
  <g>
    <path d="M ${palmBaseX} ${palmBaseY} Q ${palmBaseX - 10} ${(palmBaseY + palmTopY) / 2} ${palmTopX} ${palmTopY}"
      fill="none" stroke="${PALM_TRUNK}" stroke-width="${10 * contentScale}" stroke-linecap="round" />
    <g fill="${PALM_LEAF}">
      <ellipse cx="${palmTopX}" cy="${palmTopY - 6 * contentScale}" rx="${46 * contentScale}" ry="${16 * contentScale}"
        transform="rotate(-25 ${palmTopX} ${palmTopY})" />
      <ellipse cx="${palmTopX}" cy="${palmTopY - 6 * contentScale}" rx="${46 * contentScale}" ry="${16 * contentScale}"
        transform="rotate(20 ${palmTopX} ${palmTopY})" />
      <ellipse cx="${palmTopX}" cy="${palmTopY - 6 * contentScale}" rx="${46 * contentScale}" ry="${16 * contentScale}"
        transform="rotate(65 ${palmTopX} ${palmTopY})" />
      <ellipse cx="${palmTopX}" cy="${palmTopY - 6 * contentScale}" rx="${46 * contentScale}" ry="${16 * contentScale}"
        transform="rotate(-70 ${palmTopX} ${palmTopY})" />
    </g>
  </g>

  <!-- 「学」 -->
  <path d="${kanjiPathData}" fill="${KANJI_COLOR}"
    transform="translate(${kanjiCenterX - kanjiCenterX * kanjiScale} ${kanjiCenterY - kanjiCenterY * kanjiScale}) scale(${kanjiScale})" />

  <!-- 島(砂浜) -->
  <ellipse cx="${islandCx}" cy="${islandCy}" rx="${islandRx}" ry="${islandRy}" fill="${SAND}" />
  <ellipse cx="${islandCx}" cy="${islandCy - islandRy * 0.35}" rx="${islandRx * 0.86}" ry="${islandRy * 0.6}" fill="${PALM_LEAF}" opacity="0.85" />

  ${maskable ? '' : `<rect x="0" y="0" width="${size}" height="${size}" rx="112" ry="112" fill="none" />`}
</svg>`
}

async function main() {
  await mkdir(iconsDir, { recursive: true })

  const kanjiPathDataAny = await loadKanjiPathData(210, 256, 220)
  const svgAny = buildIcon({ kanjiPathData: kanjiPathDataAny, maskable: false })

  const kanjiPathDataMaskable = await loadKanjiPathData(210, 256, 220)
  const svgMaskable = buildIcon({ kanjiPathData: kanjiPathDataMaskable, maskable: true })

  await writeFile(path.join(rootDir, 'public', 'favicon.svg'), svgAny, 'utf-8')
  await writeFile(path.join(iconsDir, 'icon-master.svg'), svgAny, 'utf-8')

  await sharp(Buffer.from(svgAny))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'))
  await sharp(Buffer.from(svgAny))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'))
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'))
  await sharp(Buffer.from(svgAny))
    .resize(180, 180)
    .flatten({ background: '#0b5a8f' })
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'))
  // ルートにも apple-touch-icon を置くと、明示的な link タグなしでも拾われることがあるため両方に配置
  await sharp(Buffer.from(svgAny))
    .resize(180, 180)
    .flatten({ background: '#0b5a8f' })
    .png()
    .toFile(path.join(rootDir, 'public', 'apple-touch-icon.png'))

  console.log('icons generated')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
