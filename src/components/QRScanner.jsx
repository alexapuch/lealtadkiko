import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onError }) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)
  const containerRef = useRef(null)

  async function startScanner() {
    if (scannerRef.current) return

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          stopScanner()
          onScan(decodedText)
        },
        () => {} // ignore scan failures (no QR in frame)
      )

      setScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      onError?.('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      scannerRef.current = null
      setScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 fade-in">
      <h2 className="text-lg font-bold text-coffee mb-3 text-center">
        Escanear QR del Cliente
      </h2>

      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden bg-espresso/5"
        style={{ minHeight: scanning ? 'auto' : '0' }}
      />

      <div className="mt-4 text-center">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="px-6 py-3 bg-coffee text-cream rounded-xl font-semibold hover:bg-coffee-light transition-colors inline-flex items-center gap-2"
          >
            <span className="text-xl">📷</span>
            Abrir Cámara
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-6 py-3 bg-danger text-white rounded-xl font-semibold hover:bg-danger/80 transition-colors"
          >
            Cerrar Cámara
          </button>
        )}
      </div>
    </div>
  )
}
