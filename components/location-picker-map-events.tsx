"use client"

import { useMapEvents, useMap } from "react-leaflet"
import { useEffect, useRef } from "react"

// Fix default marker icon issue with webpack/next.js
import L from "leaflet"

// Fix Leaflet default marker icons
if (typeof window !== "undefined") {
    // @ts-expect-error - Leaflet internals
    delete (L.Icon.Default.prototype)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })
}

interface MapClickHandlerProps {
    onClick: (lat: number, lng: number) => void
}

export function MapClickHandler({ onClick }: MapClickHandlerProps) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

interface MapFlyToProps {
    center: [number, number]
    zoom: number
}

export function MapFlyTo({ center, zoom }: MapFlyToProps) {
    const map = useMap()
    const prevCenter = useRef<[number, number]>(center)

    useEffect(() => {
        // Only fly if center actually changed
        if (
            prevCenter.current[0] !== center[0] ||
            prevCenter.current[1] !== center[1]
        ) {
            map.flyTo(center, zoom, { duration: 1 })
            prevCenter.current = center
        }
    }, [center, zoom, map])

    return null
}
