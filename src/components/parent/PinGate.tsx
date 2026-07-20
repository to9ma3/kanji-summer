import { useState, type ReactNode } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useParentGate } from '../../context/ParentGateContext'
import { clearState } from '../../services/storage'
import Modal from '../common/Modal'

/**
 * 保護者画面を4桁PINで保護する。PIN未設定の場合はそのまま通す（初回設定用）。
 * 暗号学的なセキュリティではないため、あくまで子どもが誤って設定を変えないための
 * ゲートとして機能する（README にも明記）。
 */
export function PinGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { state, dispatch } = useAppData()
  const { unlocked, unlock } = useParentGate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  if (!state.settings.parentPin || unlocked) {
    return <>{children}</>
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (input === state.settings.parentPin) {
      setError(null)
      unlock()
    } else {
      setError('PINが違います。もう一度入力してください。')
      setInput('')
    }
  }

  const handleForgotReset = (): void => {
    clearState()
    dispatch({ type: 'data/resetAll' })
    setShowResetConfirm(false)
    unlock()
  }

  return (
    <div className="page">
      <div className="card stack" style={{ maxWidth: 360, margin: '40px auto' }}>
        <h1 style={{ fontSize: 20 }}>保護者用PIN</h1>
        <p className="text-muted">保護者設定を開くには、4桁のPINを入力してください。</p>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="parent-pin-input">PIN（4桁）</label>
            <input
              id="parent-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!!error}
              aria-describedby={error ? 'parent-pin-error' : undefined}
            />
          </div>
          {error ? (
            <p id="parent-pin-error" role="alert" style={{ color: 'var(--color-bad)', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={input.length !== 4}>
            入力する
          </button>
        </form>
        <button type="button" className="btn btn-ghost" onClick={() => setShowResetConfirm(true)}>
          PINをわすれた場合
        </button>
      </div>

      {showResetConfirm ? (
        <Modal title="PINをわすれた場合" onClose={() => setShowResetConfirm(false)}>
          <p>
            PINは暗号のような強い保護ではないため、わすれた場合は
            <strong>すべての学習データと設定をリセット</strong>
            することでPINも解除できます。学習の記録は元に戻せません。
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowResetConfirm(false)}
            >
              やめる
            </button>
            <button type="button" className="btn btn-danger" onClick={handleForgotReset}>
              リセットしてPINを解除する
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default PinGate
