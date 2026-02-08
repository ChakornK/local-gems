"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const GeolocationContext = createContext(null);

export const useGeolocation = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error("useGeolocation must be used within a GeolocationProvider");
  }
  return context;
};

export const GeolocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (err) => {
      let errorMessage = "An unknown error occurred.";
      switch (err.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          errorMessage = "User denied the request for Geolocation.";
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case GeolocationPositionError.TIMEOUT:
          errorMessage = "The request to get user location timed out.";
          break;
        case GeolocationPositionError.UNKNOWN_ERROR:
          errorMessage = "An unknown error occurred.";
          break;
        default:
          errorMessage = err.message || "An unknown error occurred.";
      }
      setError(errorMessage);
      setLoading(false);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const watcher = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options,
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return (
    <GeolocationContext.Provider value={{ location, error, loading }}>
      {children}
    </GeolocationContext.Provider>
  );
};
