import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

type Point = { x: number; y: number }
type Stroke = Point[]

export type HandwritingCanvasHandle = {
  clear: () => void
  undo: () => void
}

type HandwritingCanvasProps = {
  ariaLabel: string
  onDrawingChange?: (hasDrawing: boolean) => void
}

/**
 * 指・Apple Pencil・マウスに対応した手書きキャンバス。
 * - Pointer Events を使用
 * - devicePixelRatio に合わせて実ピクセルサイズを調整（高DPI対応）
 * - 描画中はページがスクロールしないよう touch-action:none + preventDefault
 * - OCRや書き順の自動判定は行わない（自己採点用）
 */
export const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(
  function HandwritingCanvas({ ariaLabel, onDrawingChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const strokesRef = useRef<Stroke[]>([])
    const currentStrokeRef = useRef<Stroke | null>(null)
    const drawingRef = useRef(false)
    const dimsRef = useRef({ width: 0, height: 0 })

    const redraw = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { width, height } = dimsRef.current
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#10304a'
      ctx.fillStyle = '#10304a'
      ctx.lineWidth = 6

      for (const stroke of strokesRef.current) {
        if (stroke.length === 1) {
          const p = stroke[0]
          if (!p) continue
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        if (stroke.length < 2) continue
        ctx.beginPath()
        const first = stroke[0]
        if (!first) continue
        ctx.moveTo(first.x, first.y)
        for (let i = 1; i < stroke.length; i += 1) {
          const p = stroke[i]
          if (!p) continue
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }
    }, [])

    const setupSize = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = rect.width || 280
      const height = rect.height || 280
      dimsRef.current = { width, height }
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      redraw()
    }, [redraw])

    useEffect(() => {
      setupSize()
      const canvas = canvasRef.current
      if (!canvas || typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => setupSize())
      observer.observe(canvas)
      return () => observer.disconnect()
    }, [setupSize])

    useImperativeHandle(ref, () => ({
      clear: () => {
        strokesRef.current = []
        currentStrokeRef.current = null
        redraw()
        onDrawingChange?.(false)
      },
      undo: () => {
        strokesRef.current = strokesRef.current.slice(0, -1)
        redraw()
        onDrawingChange?.(strokesRef.current.length > 0)
      },
    }))

    const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
      event.preventDefault()
      canvasRef.current?.setPointerCapture(event.pointerId)
      drawingRef.current = true
      const point = getPoint(event)
      const stroke: Stroke = [point]
      currentStrokeRef.current = stroke
      strokesRef.current = [...strokesRef.current, stroke]
      redraw()
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
      if (!drawingRef.current || !currentStrokeRef.current) return
      event.preventDefault()
      currentStrokeRef.current.push(getPoint(event))
      redraw()
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>): void => {
      if (!drawingRef.current) return
      event.preventDefault()
      drawingRef.current = false
      currentStrokeRef.current = null
      onDrawingChange?.(strokesRef.current.length > 0)
    }

    return (
      <div className="handwriting-canvas-wrap">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          お使いの環境では手書きキャンバスを表示できません。
        </canvas>
      </div>
    )
  },
)

export default HandwritingCanvas
