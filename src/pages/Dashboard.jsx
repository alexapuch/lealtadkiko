import { useAuth } from '../lib/auth'
import StampCard from '../components/StampCard'
import QRDisplay from '../components/QRDisplay'

export default function Dashboard() {
  const { profile, loading } = useAuth()

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl pulse-slow">☕</div>
          <p className="text-coffee-medium mt-2">Cargando tu tarjeta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Greeting */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-coffee">
          ¡Hola, {profile.full_name || 'Amante del café'}!
        </h2>
        <p className="text-sm text-coffee-medium mt-1">
          Acumula sellos y gana un café gratis
        </p>
      </div>

      {/* Stamp Card */}
      <StampCard stamps={profile.stamps_count} />

      {/* QR Code */}
      <QRDisplay qrToken={profile.qr_token} fullName={profile.full_name} />

      {/* History hint */}
      <p className="text-center text-xs text-coffee-medium/50">
        Muestra tu código QR al barista cada vez que compres un café
      </p>
    </div>
  )
}
