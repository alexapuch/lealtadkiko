import { useState } from 'react'
import { supabase } from '../lib/supabase'
import QRScanner from '../components/QRScanner'
import StampCard from '../components/StampCard'

export default function Admin() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scannedToken, setScannedToken] = useState('')

  async function handleScan(qrToken) {
    setLoading(true)
    setError('')
    setSuccess('')
    setCustomer(null)
    setScannedToken(qrToken)

    try {
      const { data, error } = await supabase.rpc('lookup_customer', {
        customer_qr_token: qrToken,
      })

      if (error) throw error

      if (!data.found) {
        setError('Cliente no encontrado. QR inválido.')
        return
      }

      setCustomer(data)
    } catch (err) {
      setError(err.message || 'Error al buscar cliente')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStamp() {
    if (!scannedToken) return
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.rpc('add_stamp', {
        customer_qr_token: scannedToken,
      })

      if (error) throw error

      if (!data.success) {
        setError(data.message)
        return
      }

      setSuccess(`+1 sello para ${data.customer_name} (${data.stamps_after}/10)`)
      setCustomer((prev) => ({
        ...prev,
        stamps_count: data.stamps_after,
      }))
    } catch (err) {
      setError(err.message || 'Error al agregar sello')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRedeem() {
    if (!scannedToken) return
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        customer_qr_token: scannedToken,
      })

      if (error) throw error

      if (!data.success) {
        setError(data.message)
        return
      }

      setSuccess(`Premio canjeado para ${data.customer_name}. Sellos reseteados a 0.`)
      setCustomer((prev) => ({
        ...prev,
        stamps_count: 0,
      }))
    } catch (err) {
      setError(err.message || 'Error al canjear premio')
    } finally {
      setActionLoading(false)
    }
  }

  function handleReset() {
    setCustomer(null)
    setScannedToken('')
    setError('')
    setSuccess('')
  }

  function handleScanError(msg) {
    setError(msg)
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-coffee">Panel de Barista</h2>
        <p className="text-sm text-coffee-medium mt-1">
          Escanea el QR del cliente para agregar sellos
        </p>
      </div>

      {/* Scanner - show only when no customer is loaded */}
      {!customer && !loading && <QRScanner onScan={handleScan} onError={handleScanError} />}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl pulse-slow">🔍</div>
          <p className="text-coffee-medium mt-2">Buscando cliente...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-center">
          <p className="text-danger text-sm font-medium">{error}</p>
          {!customer && (
            <button
              onClick={handleReset}
              className="mt-2 text-xs text-danger/70 underline bg-transparent border-none cursor-pointer"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
          <span className="text-2xl">✅</span>
          <p className="text-success text-sm font-medium mt-1">{success}</p>
        </div>
      )}

      {/* Customer Info */}
      {customer && (
        <div className="space-y-4 fade-in">
          {/* Customer details */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-coffee">{customer.full_name || 'Sin nombre'}</h3>
              <p className="text-sm text-coffee-medium">{customer.email}</p>
            </div>

            {/* Stamp Card Preview */}
            <StampCard stamps={customer.stamps_count} />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddStamp}
              disabled={actionLoading || customer.stamps_count >= 10}
              className="py-4 bg-coffee text-cream rounded-xl font-bold text-sm hover:bg-coffee-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1"
            >
              {actionLoading ? (
                <span className="pulse-slow">☕</span>
              ) : (
                <>
                  <span className="text-2xl">☕</span>
                  <span>+1 Sello</span>
                </>
              )}
            </button>

            <button
              onClick={handleRedeem}
              disabled={actionLoading || customer.stamps_count < 10}
              className="py-4 bg-success text-white rounded-xl font-bold text-sm hover:bg-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1"
            >
              {actionLoading ? (
                <span className="pulse-slow">🎁</span>
              ) : (
                <>
                  <span className="text-2xl">🎁</span>
                  <span>Canjear Premio</span>
                </>
              )}
            </button>
          </div>

          {/* Scan another */}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-cream-dark text-coffee rounded-xl font-medium hover:bg-cream-dark/70 transition-colors"
          >
            Escanear otro cliente
          </button>
        </div>
      )}
    </div>
  )
}
