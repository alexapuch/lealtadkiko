import QRCode from 'react-qr-code'

export default function QRDisplay({ qrToken, fullName }) {
  if (!qrToken) return null

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 text-center fade-in">
      <h2 className="text-lg font-bold text-coffee mb-1">Tu Código QR</h2>
      <p className="text-sm text-coffee-medium mb-4">
        Muéstralo al barista para recibir tu sello
      </p>

      <div className="bg-white p-4 rounded-xl inline-block border border-cream-dark">
        <QRCode
          value={qrToken}
          size={180}
          level="M"
          fgColor="#4A2C2A"
          bgColor="#FFFFFF"
        />
      </div>

      <p className="mt-3 text-xs text-coffee-medium/60">
        {fullName}
      </p>
    </div>
  )
}
