import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserLocation } from '../types.ts';
import { reverseGeocodeCoords, calculateDistanceMeters } from '../services/locationService.ts';

export type LocationPermissionState = 'checking' | 'prompt' | 'granted' | 'denied' | 'unsupported';

interface LocationContextType {
  permissionState: LocationPermissionState;
  location: UserLocation | null;
  isLocating: boolean;
  errorDetail: string | null;
  requestLocationPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  lastGeocodedCoords: { lat: number; lng: number } | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('checking');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Store last coordinates that were reverse-geocoded to avoid unnecessary API hits (<100m)
  const lastGeocodedRef = useRef<{ 
    lat: number; 
    lng: number; 
    address: string; 
    city: string; 
    state: string; 
    district: string;
    block: string;
    postcode: string; 
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Helper to process coords and update state
  const processCoords = useCallback(async (lat: number, lng: number, accuracy?: number) => {
    try {
      const now = Date.now();
      const last = lastGeocodedRef.current;

      let city = last?.city || '';
      let state = last?.state || '';
      let district = last?.district || '';
      let block = last?.block || '';
      let postcode = last?.postcode || '';
      let formattedAddress = last?.address || '';

      // Check if we need to call Nominatim (>100 meters moved or first time)
      const distanceMoved = last ? calculateDistanceMeters(last.lat, last.lng, lat, lng) : Infinity;

      if (!last || distanceMoved > 100) {
        const geocoded = await reverseGeocodeCoords(lat, lng);
        city = geocoded.city;
        state = geocoded.state;
        district = geocoded.district;
        block = geocoded.block;
        postcode = geocoded.postcode;
        formattedAddress = geocoded.formattedAddress;

        lastGeocodedRef.current = {
          lat,
          lng,
          city,
          state,
          district,
          block,
          postcode,
          address: formattedAddress,
        };
      }

      if (isMountedRef.current) {
        const newLocation: UserLocation = {
          latitude: lat,
          longitude: lng,
          accuracy,
          city,
          state,
          district,
          block,
          postcode,
          formattedAddress,
          lastUpdated: now,
        };
        setLocation(newLocation);
        setPermissionState('granted');
        setErrorDetail(null);
      }
    } catch (err: any) {
      console.error('Error processing coordinates:', err);
    }
  }, []);

  // Request location with high accuracy
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setErrorDetail('Geolocation is not supported by your device/browser.');
      return false;
    }

    setIsLocating(true);
    setErrorDetail(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          await processCoords(lat, lng, accuracy);

          if (isMountedRef.current) {
            setIsLocating(false);
            setPermissionState('granted');
          }
          resolve(true);
        },
        (error) => {
          console.warn('Geolocation acquisition error:', error);
          if (isMountedRef.current) {
            setIsLocating(false);
            if (error.code === error.PERMISSION_DENIED) {
              setPermissionState('denied');
              setErrorDetail('Location access was denied. Please allow location permissions in your browser or site settings.');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              setErrorDetail('Position is currently unavailable. Please check GPS connection.');
            } else if (error.code === error.TIMEOUT) {
              setErrorDetail('Location request timed out. Retrying...');
            } else {
              setErrorDetail(error.message || 'Unable to retrieve location.');
            }
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }, [processCoords]);

  // Refresh current location
  const refreshLocation = useCallback(async () => {
    if (permissionState === 'granted' || permissionState === 'checking') {
      await requestLocationPermission();
    }
  }, [permissionState, requestLocationPermission]);

  // Initial check on load
  useEffect(() => {
    isMountedRef.current = true;

    const checkInitialPermission = async () => {
      if (!('geolocation' in navigator)) {
        setPermissionState('unsupported');
        return;
      }

      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            await requestLocationPermission();
          } else if (status.state === 'denied') {
            setPermissionState('denied');
          } else {
            // 'prompt'
            setPermissionState('prompt');
          }

          status.onchange = () => {
            if (status.state === 'granted') {
              requestLocationPermission();
            } else if (status.state === 'denied') {
              setPermissionState('denied');
            } else {
              setPermissionState('prompt');
            }
          };
          return;
        } catch (e) {
          // Some browsers/iframes throw on permissions query, fallback below
          console.log('Permissions API query fallback:', e);
        }
      }

      // Fallback: check by requesting
      setPermissionState('prompt');
    };

    checkInitialPermission();

    // Setup periodic polling every 30-45 seconds
    const intervalId = setInterval(() => {
      if (permissionState === 'granted' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            processCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          (err) => console.log('Periodic location poll notice:', err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );
      }
    }, 35000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [permissionState, processCoords, requestLocationPermission]);

  return (
    <LocationContext.Provider
      value={{
        permissionState,
        location,
        isLocating,
        errorDetail,
        requestLocationPermission,
        refreshLocation,
        lastGeocodedCoords: lastGeocodedRef.current
          ? { lat: lastGeocodedRef.current.lat, lng: lastGeocodedRef.current.lng }
          : null,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
