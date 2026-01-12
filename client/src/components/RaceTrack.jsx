const RaceTrack = ({ players, winner }) => {
  const playerList = Object.values(players);

  if (playerList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-ocean-foam/50 text-xl font-body">
        Ожидание игроков...
      </div>
    );
  }

  return (
    <div className="relative w-full px-4 py-6">
      {/* Finish line */}
      <div className="absolute right-8 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-300 rounded-full shadow-lg shadow-yellow-500/30">
        <div className="absolute -top-2 -right-6 text-2xl">🏁</div>
      </div>

      {/* Lanes */}
      <div className="space-y-4">
        {playerList.map((player, index) => (
          <div
            key={player.id}
            className="relative h-20 bg-ocean-dark/40 rounded-2xl overflow-hidden border border-ocean-foam/20"
          >
            {/* Lane background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(144,224,239,0.3) 20px, rgba(144,224,239,0.3) 21px)'
              }} />
            </div>

            {/* Progress bar */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-ocean-surface/30 to-ocean-foam/30 transition-all duration-150"
              style={{ width: `${Math.min(player.progress, 100)}%` }}
            />

            {/* Mermaid avatar */}
            <div
              className={`mermaid-avatar absolute top-1/2 -translate-y-1/2 flex items-center gap-2 transition-all duration-150 ${
                winner?.id === player.id ? 'winner-glow scale-110' : ''
              }`}
              style={{ 
                left: `calc(${Math.min(player.progress, 95)}% - 20px)`,
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg animate-swim"
                style={{ backgroundColor: player.color }}
              >
                {player.avatar}
              </div>
            </div>

            {/* Player name */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <span 
                className="font-display text-lg text-white drop-shadow-lg px-3 py-1 rounded-full"
                style={{ backgroundColor: `${player.color}cc` }}
              >
                {player.name}
              </span>
            </div>

            {/* Progress percentage */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 font-body font-bold text-ocean-foam/80">
              {Math.round(player.progress)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceTrack;

