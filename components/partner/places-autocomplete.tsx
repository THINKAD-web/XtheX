"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

type LocationValue = { lat: number; lng: number; address: string };

type Props = {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
};

declare global {
  interface Window {
    google?: any;
  }
}

function waitForGooglePlaces({ timeoutMs = 10_000 }: { timeoutMs?: number }) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places?.Autocomplete) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            "Google Places is not loaded. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and ensure the script is loaded once in app/layout.tsx."
          )
        );
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function PlacesAutocomplete({ value, onChange }: Props) {
  const t = useTranslations("dashboard.partner");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let autocomplete: any;
    let listener: any;

    (async () => {
      try {
        await waitForGooglePlaces({});
        if (!inputRef.current) return;
        if (!window.google?.maps?.places) return;

        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const lat = place?.geometry?.location?.lat?.();
          const lng = place?.geometry?.location?.lng?.();
          const address = place?.formatted_address;
          if (typeof lat === "number" && typeof lng === "number" && typeof address === "string") {
            onChange({ lat, lng, address });
          }
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to init Places");
      }
    })();

    return () => {
      try {
        if (listener) listener.remove();
      } catch {
        // ignore
      }
    };
  }, [onChange]);

  const addressLabel = value.address || t("location.none");
  const hasCoords =
    Number.isFinite(value.lat) && Number.isFinite(value.lng);
  const coordsLabel = hasCoords
    ? t("location.coords", {
        lat: value.lat.toFixed(5),
        lng: value.lng.toFixed(5),
      })
    : "";

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        defaultValue={value.address}
        placeholder={t("location.placeholder")}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
      />
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
      <p className="text-xs text-zinc-500">
        {t("location.selected", { address: addressLabel })}
        {coordsLabel ? ` ${coordsLabel}` : ""}
      </p>
    </div>
  );
}

