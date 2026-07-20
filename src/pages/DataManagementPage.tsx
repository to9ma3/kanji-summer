import { useRef, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import PinGate from '../components/parent/PinGate'
import Modal from '../components/common/Modal'
import {
  buildExportData,
  serializeExportData,
  parseImportData,
  applyImportToState,
  triggerJsonDownload,
} from '../services/exportImport'
import { todayJst } from '../domain/dateUtils'

type ConfirmKind = 'history' | 'all' | null

function DataManagementContent(): React.JSX.Element {
  const { state, dispatch } = useAppData()
  const { back } = useNavigation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null)

  const handleExport = (): void => {
    const data = buildExportData(state, new Date().toISOString())
    const json = serializeExportData(data)
    triggerJsonDownload(`kanji-summer-backup-${todayJst()}.json`, json)
  }

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportMessage(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const result = parseImportData(text)
      if (!result.ok) {
        setImportError(result.error)
        return
      }
      const nextState = applyImportToState(state, result.data)
      dispatch({ type: 'data/import', payload: nextState })
      setImportMessage('学習データを読み込みました。')
    }
    reader.onerror = () => setImportError('ファイルを読み込めませんでした。')
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleConfirmReset = (): void => {
    if (confirmKind === 'history') {
      dispatch({ type: 'data/resetHistoryOnly' })
    } else if (confirmKind === 'all') {
      dispatch({ type: 'data/resetAll' })
    }
    setConfirmKind(null)
    window.location.reload()
  }

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>データ管理</h1>
        <span style={{ width: 44 }} />
      </div>

      <section className="card stack" aria-label="バックアップ・エクスポート">
        <h2 style={{ fontSize: 16 }}>エクスポート・バックアップ</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          学習データをJSONファイルとして保存できます。機種変更前のバックアップにも使えます。
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={handleExport}>
          学習データをエクスポート
        </button>
      </section>

      <section className="card stack" aria-label="インポート">
        <h2 style={{ fontSize: 16 }}>インポート</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          エクスポートしたJSONファイルを選んで読み込みます。内容を確認してから取り込みます。
        </p>
        <label className="btn btn-secondary btn-block" htmlFor="import-file-input">
          JSONファイルを選ぶ
        </label>
        <input
          id="import-file-input"
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          className="sr-only"
        />
        {importError ? (
          <p role="alert" style={{ color: 'var(--color-bad)', margin: 0 }}>
            {importError}
          </p>
        ) : null}
        {importMessage ? (
          <p role="status" aria-live="polite" className="text-muted" style={{ margin: 0 }}>
            {importMessage}
          </p>
        ) : null}
      </section>

      <section className="card stack" aria-label="データのリセット">
        <h2 style={{ fontSize: 16 }}>データのリセット</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          リセットする前に、上のエクスポートでバックアップを取ることをおすすめします。
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setConfirmKind('history')}
        >
          学習履歴だけリセット
        </button>
        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={() => setConfirmKind('all')}
        >
          すべての設定と履歴をリセット
        </button>
      </section>

      {confirmKind ? (
        <Modal title="本当にリセットしますか？" onClose={() => setConfirmKind(null)}>
          <p>
            {confirmKind === 'history'
              ? '学習の記録（進み具合・カレンダー・実績・星）がすべて消えます。設定は残ります。'
              : 'すべての設定と学習の記録が消え、初回設定からやり直しになります。'}
          </p>
          <p style={{ fontWeight: 700 }}>この操作は取り消せません。よろしいですか？</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmKind(null)}
            >
              やめる
            </button>
            <button type="button" className="btn btn-danger" onClick={handleConfirmReset}>
              リセットする
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export function DataManagementPage(): React.JSX.Element {
  return (
    <PinGate>
      <DataManagementContent />
    </PinGate>
  )
}

export default DataManagementPage
