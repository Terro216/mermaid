import { useState, useEffect, useCallback, useRef } from 'react';

export const useShake = (onShake) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const onShakeRef = useRef(onShake);

  // Keep callback ref updated
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const requestPermission = useCallback(async () => {
    // Check if DeviceMotionEvent exists
    if (typeof DeviceMotionEvent === 'undefined') {
      console.log('DeviceMotion not supported');
      setPermissionDenied(true);
      return false;
    }

    // iOS 13+ requires permission request (must be called from user gesture)
    // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          return true;
        } else {
          setPermissionDenied(true);
          return false;
        }
      } catch (e) {
        console.error('Permission request failed:', e);
        setPermissionDenied(true);
        return false;
      }
    } else {
      // Android and older iOS - no permission needed
      setPermissionGranted(true);
      return true;
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;
    let isFirstReading = true;
    
    // Higher threshold = more effort required
    const SHAKE_THRESHOLD = 25; // Increased from 12
    const DEBOUNCE_MS = 50; // Faster sampling for better responsiveness
    
    // Max intensity to prevent too fast progress
    const MAX_INTENSITY = 1.5;
    // Minimum shake to register anything
    const MIN_SPEED_FOR_PROGRESS = 30;

    const handleMotion = (event) => {
      // Use acceleration without gravity for pure device movement
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/acceleration
      const acceleration = event.acceleration || event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      const currentTime = Date.now();
      
      // Skip first reading to establish baseline
      if (isFirstReading) {
        lastX = x;
        lastY = y;
        lastZ = z;
        lastUpdate = currentTime;
        isFirstReading = false;
        return;
      }

      if ((currentTime - lastUpdate) < DEBOUNCE_MS) return;

      const timeDiff = currentTime - lastUpdate;
      lastUpdate = currentTime;

      // Calculate acceleration magnitude change
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);
      
      // Vector magnitude of acceleration change
      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
      
      // Normalize by time for consistent speed measurement
      const speed = magnitude / timeDiff * 1000;

      if (speed > SHAKE_THRESHOLD) {
        // Calculate intensity with diminishing returns (logarithmic scaling)
        // This means shaking harder gives less additional benefit
        const rawIntensity = speed - SHAKE_THRESHOLD;
        
        // Logarithmic scaling: intensity = log(1 + rawIntensity / scale) * multiplier
        // This gives diminishing returns as shake gets stronger
        const intensity = Math.min(
          Math.log(1 + rawIntensity / 20) * 0.5,
          MAX_INTENSITY
        );
        
        // Only trigger if above minimum threshold
        if (speed > MIN_SPEED_FOR_PROGRESS) {
          onShakeRef.current(intensity);
          
          // Haptic feedback proportional to intensity (Android)
          if (navigator.vibrate) {
            navigator.vibrate(Math.min(20 + intensity * 30, 50));
          }
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted]);

  return { requestPermission, permissionGranted, permissionDenied };
};

export default useShake;
