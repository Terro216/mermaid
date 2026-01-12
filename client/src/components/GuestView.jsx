import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';
import useShake from '../hooks/useShake';
import Bubbles from './Bubbles';

const GuestView = () => {
  const [name, setName] = useState('');
  const [gamePhase, setGamePhase] = useState('join'); // join, waiting, racing, finished
  const [playerInfo, setPlayerInfo] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [testProgress, setTestProgress] = useState(0); // For shake test on waiting screen
  const [shakeDetected, setShakeDetected] = useState(false); // Track if shake ever worked
  const shakeTimeoutRef = useRef(null);
  const testDecayRef = useRef(null);

  // Handle shake event - works for both waiting (test) and racing
  const handleShake = useCallback((intensity) => {
    // Visual feedback for any shake
    setIsShaking(true);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setIsShaking(false);
    }, 100);

    if (gamePhase === 'waiting') {
      // Test mode - show progress but don't send to server
      setShakeDetected(true);
      setTestProgress(prev => Math.min(prev + intensity * 3, 100));
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    } else if (gamePhase === 'racing') {
      // Real game - send to server
      socket.emit('shake', intensity);
    }
  }, [gamePhase]);

  const { requestPermission, permissionGranted, permissionDenied } = useShake(handleShake);

  // Decay test progress over time
  useEffect(() => {
    if (gamePhase === 'waiting' && testProgress > 0) {
      testDecayRef.current = setInterval(() => {
        setTestProgress(prev => Math.max(prev - 2, 0));
      }, 100);
    }
    return () => {
      if (testDecayRef.current) {
        clearInterval(testDecayRef.current);
      }
    };
  }, [gamePhase, testProgress > 0]);

  useEffect(() => {
    socket.on('joined_successfully', (info) => {
      setPlayerInfo(info);
      setGamePhase('waiting');
    });

    socket.on('race_started', () => {
      setGamePhase('racing');
      setTestProgress(0); // Reset test progress
      // Vibrate on start
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    });

    socket.on('game_over', (winnerData) => {
      setWinner(winnerData);
      setGamePhase('finished');
      // Victory vibration if won
      if (winnerData.id === socket.id && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    });

    socket.on('game_reset', () => {
      setGamePhase('waiting');
      setWinner(null);
      setTestProgress(0);
    });

    socket.on('update_players', (players) => {
      if (players[socket.id]) {
        setPlayerInfo(players[socket.id]);
      }
    });

    return () => {
      socket.off('joined_successfully');
      socket.off('race_started');
      socket.off('game_over');
      socket.off('game_reset');
      socket.off('update_players');
    };
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) return;
    
    // Request permission on user interaction (required for iOS)
    // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
    const hasPermission = await requestPermission();
    
    if (hasPermission || permissionDenied) {
      // Join even if permission denied (they can try again or use on desktop)
      socket.emit('join_game', name.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const didWin = winner && winner.id === socket.id;

  return (
    <div className={`min-h-screen min-h-[100dvh] relative overflow-hidden flex flex-col ${isShaking ? 'shake-active' : ''}`}>
      <Bubbles count={10} />

      {/* Join Screen - with padding for mobile keyboard */}
      {gamePhase === 'join' && (
        <div className="flex-1 flex items-start justify-center p-6 pt-[15vh] pb-[30vh]">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-ocean-foam/30 w-full max-w-sm">
            <h1 className="font-display text-2xl text-white text-center mb-2">
              🧜‍♀️ Mermaid Race
            </h1>
            <p className="text-ocean-foam/70 text-center font-body mb-8">
              Как тебя зовут?
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Имя русалки..."
              maxLength={20}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              className="w-full px-6 py-4 rounded-2xl bg-ocean-dark/50 border border-ocean-foam/30 text-white font-body text-lg placeholder-ocean-foam/40 focus:outline-none focus:border-ocean-foam/60 transition-colors"
            />

            <button
              onClick={handleJoin}
              disabled={!name.trim()}
              className="mt-4 w-full py-4 bg-gradient-to-r from-ocean-surface to-ocean-foam hover:from-ocean-foam hover:to-ocean-surface disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-ocean-dark font-display text-xl rounded-2xl shadow-lg shadow-ocean-foam/30 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              Войти в море 🌊
            </button>

            {permissionDenied && (
              <p className="mt-4 text-yellow-300/80 text-center text-sm font-body">
                ⚠️ Доступ к датчикам не разрешен. Тряска может не работать.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Waiting Screen */}
      {gamePhase === 'waiting' && playerInfo && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 transition-transform duration-150 ${
                testProgress > 0 ? 'scale-110' : 'animate-wave'
              }`}
              style={{ 
                backgroundColor: playerInfo.color,
                boxShadow: testProgress > 0 ? `0 0 ${testProgress / 2}px ${testProgress / 3}px rgba(144, 224, 239, 0.5)` : 'none'
              }}
            >
              {playerInfo.avatar}
            </div>
            <h2 className="font-display text-3xl text-white mb-2">
              {playerInfo.name}
            </h2>
            <p className="text-ocean-foam/70 font-body text-lg">
              Ждем старта заплыва...
            </p>
          </div>

          {/* Shake test section */}
          <div className="mt-8 w-64">
            <p className="text-ocean-foam/60 font-body text-sm text-center mb-3">
              📱 Потряси телефон для проверки
            </p>
            
            {/* Test progress bar */}
            <div className="h-3 bg-ocean-dark/50 rounded-full overflow-hidden border border-ocean-foam/30">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-100"
                style={{ width: `${testProgress}%` }}
              />
            </div>
            
            {/* Status indicator */}
            <div className="mt-3 text-center">
              {!permissionGranted && !permissionDenied ? (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-yellow-500/80 hover:bg-yellow-500 text-ocean-dark font-body text-sm rounded-lg transition-colors"
                >
                  📱 Разрешить датчики
                </button>
              ) : permissionDenied ? (
                <span className="text-yellow-300/70 font-body text-sm">
                  ⚠️ Датчики недоступны
                </span>
              ) : shakeDetected ? (
                <span className="text-green-400 font-body text-sm">
                  ✓ Датчики работают!
                </span>
              ) : (
                <span className="text-ocean-foam/50 font-body text-sm">
                  Тряхни для проверки...
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-ocean-foam/50">
            <div className="w-3 h-3 bg-ocean-foam rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-ocean-foam rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-ocean-foam rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      {/* Racing Screen */}
      {gamePhase === 'racing' && playerInfo && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 select-none">
          <div className="text-center">
            <div className="font-display text-6xl text-white mb-4 animate-pulse">
              ТРЯСИ! 📱💨
            </div>
            
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-6xl mx-auto my-8 animate-swim shadow-2xl"
              style={{ backgroundColor: playerInfo.color }}
            >
              {playerInfo.avatar}
            </div>

            {/* Progress indicator */}
            <div className="w-64 h-4 bg-ocean-dark/50 rounded-full overflow-hidden border border-ocean-foam/30 mx-auto">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-150"
                style={{ width: `${playerInfo.progress || 0}%` }}
              />
            </div>
            <p className="text-ocean-foam font-display text-2xl mt-2">
              {Math.round(playerInfo.progress || 0)}%
            </p>
          </div>
        </div>
      )}

      {/* Finished Screen */}
      {gamePhase === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            {didWin ? (
              <>
                <div className="text-8xl mb-6">🏆</div>
                <h2 className="font-display text-4xl text-yellow-300 mb-8">
                  ТЫ ПОБЕДИЛ!
                </h2>
                {/* More spacing between text and avatar */}
                <div 
                  className="text-7xl animate-winner-scale"
                  style={{ marginTop: '1rem' }}
                >
                  {playerInfo?.avatar}
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🌊</div>
                <h2 className="font-display text-3xl text-white mb-4">
                  Заплыв окончен
                </h2>
                {winner && (
                  <p className="text-ocean-foam font-body text-xl">
                    Победитель: <span className="text-yellow-300">{winner.name}</span> {winner.avatar}
                  </p>
                )}
              </>
            )}

            <p className="mt-10 text-ocean-foam/60 font-body">
              Ждем следующего заплыва...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestView;
