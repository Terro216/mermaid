import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Fireworks } from 'fireworks-js';
import socket from '../socket';
import RaceTrack from './RaceTrack';
import Bubbles from './Bubbles';

const HostView = () => {
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState('lobby'); // lobby, racing, finished
  const [winner, setWinner] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const fireworksRef = useRef(null);
  const fireworksContainerRef = useRef(null);

  // Generate QR code URL (now using subdomain)
  const playUrl = `${window.location.origin}/play`;

  // Initialize and control fireworks
  useEffect(() => {
    if (gameState === 'finished' && fireworksContainerRef.current && !fireworksRef.current) {
      fireworksRef.current = new Fireworks(fireworksContainerRef.current, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.02,
        friction: 0.97,
        gravity: 1.5,
        particles: 80,
        traceLength: 3,
        traceSpeed: 10,
        explosion: 5,
        intensity: 20,
        flickering: 50,
        lineStyle: 'round',
        hue: {
          min: 0,
          max: 360
        },
        delay: {
          min: 30,
          max: 60
        },
        rocketsPoint: {
          min: 30,
          max: 70
        },
        lineWidth: {
          explosion: { min: 1, max: 3 },
          trace: { min: 1, max: 2 }
        },
        brightness: {
          min: 50,
          max: 80
        },
        decay: {
          min: 0.015,
          max: 0.03
        }
      });
      fireworksRef.current.start();
    }

    return () => {
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
    };
  }, [gameState]);

  useEffect(() => {
    // Register as host
    socket.emit('register_host');

    socket.on('host_registered', () => {
      console.log('Registered as host');
    });

    socket.on('update_players', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('race_started', () => {
      setGameState('racing');
      setWinner(null);
    });

    socket.on('game_over', (winnerData) => {
      setWinner(winnerData);
      setGameState('finished');
    });

    socket.on('game_reset', () => {
      setGameState('lobby');
      setWinner(null);
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
    });

    socket.on('error_message', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('host_registered');
      socket.off('update_players');
      socket.off('race_started');
      socket.off('game_over');
      socket.off('game_reset');
      socket.off('error_message');
    };
  }, []);

  const handleStartRace = useCallback(() => {
    // Countdown before start
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          socket.emit('start_race');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResetGame = useCallback(() => {
    socket.emit('reset_game');
  }, []);

  const playerCount = Object.keys(players).length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Bubbles count={20} />

      {/* Fireworks container */}
      {gameState === 'finished' && (
        <div 
          ref={fireworksContainerRef}
          className="fixed inset-0 z-30 pointer-events-none"
        />
      )}

      {/* Header */}
      <header className="relative z-10 text-center py-6">
        <h1 className="font-display text-5xl md:text-7xl text-white drop-shadow-lg">
          🧜‍♀️ Mermaid Race 🌊
        </h1>
        <p className="font-body text-ocean-foam/80 mt-2 text-lg">
          {gameState === 'lobby' && 'Сканируй QR и присоединяйся!'}
          {gameState === 'racing' && 'ТРЯСИТЕ ТЕЛЕФОНЫ! 📱💨'}
          {gameState === 'finished' && 'Заплыв окончен!'}
        </p>
      </header>

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-dark/80">
          <div className="font-display text-9xl text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4">
        {/* Lobby state */}
        {gameState === 'lobby' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* QR Code section */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-ocean-foam/30">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG 
                  value={playUrl} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-center text-ocean-foam mt-4 font-body text-sm break-all max-w-[200px]">
                {playUrl}
              </p>
            </div>

            {/* Players list */}
            <div className="flex-1 min-w-[300px] max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-ocean-foam/30">
                <h2 className="font-display text-2xl text-white mb-4 flex items-center gap-2">
                  <span>Игроки</span>
                  <span className="bg-ocean-surface/50 px-3 py-1 rounded-full text-lg">
                    {playerCount}
                  </span>
                </h2>

                {playerCount === 0 ? (
                  <p className="text-ocean-foam/60 font-body text-center py-8">
                    Пока никого нет... 🐚
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(players).map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 bg-ocean-dark/40 rounded-xl p-3 animate-pulse-glow"
                        style={{ animationDelay: `${Math.random() * 2}s` }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-body text-white truncate">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start button */}
                {playerCount > 0 && (
                  <button
                    onClick={handleStartRace}
                    className="mt-6 w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-display text-2xl rounded-2xl shadow-lg shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    🏁 СТАРТ ЗАПЛЫВА!
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Racing / Finished state */}
        {(gameState === 'racing' || gameState === 'finished') && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-ocean-foam/30">
              <RaceTrack players={players} winner={winner} />
            </div>

            {/* Winner announcement - BELOW the race track */}
            {gameState === 'finished' && winner && (
              <div className="text-center mt-8 animate-winner-appear">
                <div className="inline-flex items-center gap-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-yellow-400/40">
                  <span className="text-5xl">{winner.avatar}</span>
                  <div>
                    <div className="font-display text-3xl md:text-4xl text-yellow-300 drop-shadow-lg">
                      ПОБЕДА ЗА {winner.name}!
                    </div>
                  </div>
                  <span className="text-5xl">🏆</span>
                </div>
              </div>
            )}

            {/* Reset button and birthday message */}
            {gameState === 'finished' && (
              <div className="text-center mt-6 space-y-6">
                <button
                  onClick={handleResetGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-display text-xl rounded-2xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  🔄 Новый заплыв
                </button>
                
                {/* Birthday message */}
                <div className="animate-birthday-appear">
                  <p className="font-display text-2xl md:text-3xl text-pink-300 drop-shadow-lg">
                    🎂 С днем рождения, Настя! 🎂
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 mt-8">
        <p className="text-ocean-foam/40 font-body text-sm">
          илья.fun/mermaid
        </p>
      </footer>
    </div>
  );
};

export default HostView;
