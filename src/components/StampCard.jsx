const TOTAL_STAMPS = 10

export default function StampCard({ stamps = 0 }) {
  const isFull = stamps >= TOTAL_STAMPS

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 fade-in">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-coffee">Tarjeta de Sellos</h2>
        <span className="text-sm font-medium text-coffee-medium bg-cream-dark px-3 py-1 rounded-full">
          {stamps}/{TOTAL_STAMPS}
        </span>
      </div>

      {/* Stamp Grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {Array.from({ length: TOTAL_STAMPS }, (_, i) => (
          <div
            key={i}
            className={`
              aspect-square rounded-xl flex items-center justify-center text-2xl
              transition-all duration-300
              ${
                i < stamps
                  ? 'bg-coffee text-cream shadow-md stamp-pop'
                  : 'bg-cream-dark/60 text-coffee-medium/30 border-2 border-dashed border-coffee-medium/20'
              }
            `}
            style={i < stamps ? { animationDelay: `${i * 0.05}s` } : undefined}
          >
            {i < stamps ? '☕' : <span className="text-lg opacity-40">☕</span>}
          </div>
        ))}
      </div>

      {/* Reward Banner */}
      {isFull ? (
        <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-success font-bold text-sm mt-1">
            ¡Felicidades! Tu café gratis te espera
          </p>
          <p className="text-success/70 text-xs mt-0.5">
            Muestra tu QR al barista para canjear
          </p>
        </div>
      ) : (
        <div className="bg-cream-dark/50 rounded-xl p-3 text-center">
          <p className="text-coffee-medium text-sm">
            Te faltan <span className="font-bold text-coffee">{TOTAL_STAMPS - stamps}</span>{' '}
            sellos para tu café gratis
          </p>
        </div>
      )}
    </div>
  )
}
