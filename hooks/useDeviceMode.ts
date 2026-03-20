"use client";

import { useEffect, useMemo, useState } from "react";

export type DeviceMode = "mobile" | "tablet" | "desktop";

type DeviceState = {
  width: number;
  height: number;
  isTouch: boolean;
  isPortrait: boolean;
  mode: DeviceMode;
};

function getDeviceState(): DeviceState {
  if (typeof window === "undefined") {
    return {
      width: 1440,
      height: 900,
      isTouch: false,
      isPortrait: false,
      mode: "desktop",
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0;

  const isPortrait = height > width;

  let mode: DeviceMode = "desktop";
  if (width < 768) mode = "mobile";
  else if (width < 1024) mode = "tablet";

  return {
    width,
    height,
    isTouch,
    isPortrait,
    mode,
  };
}

export function useDeviceMode() {
  const [state, setState] = useState<DeviceState>(getDeviceState);

  useEffect(() => {
    const update = () => {
      const next = getDeviceState();
      setState(next);

      document.body.dataset.device = next.mode;
      document.body.dataset.touch = next.isTouch ? "true" : "false";
      document.body.dataset.orientation = next.isPortrait
        ? "portrait"
        : "landscape";
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      isMobile: state.mode === "mobile",
      isTablet: state.mode === "tablet",
      isDesktop: state.mode === "desktop",
    }),
    [state]
  );
}