"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Search, Loader2, Navigation, X, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import dynamic from "next/dynamic"

const MapContainerDynamic = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof import("react-leaflet").MapContainer>>

const TileLayerDynamic = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof import("react-leaflet").TileLayer>>

const MarkerDynamic = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof import("react-leaflet").Marker>>

const PopupDynamic = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof import("react-leaflet").Popup>>

const MapClickHandler = dynamic<{ onClick: (lat: number, lng: number) => void }>(
    () => import("@/components/location-picker-map-events").then((mod) => mod.MapClickHandler),
    { ssr: false }
)

const MapFlyTo = dynamic<{ center: [number, number]; zoom: number }>(
    () => import("@/components/location-picker-map-events").then((mod) => mod.MapFlyTo),
    { ssr: false }
)

export interface LocationData {
    address: string
    latitude: number
    longitude: number
}

interface LocationPickerProps {
    value?: LocationData | null
    onChange: (location: LocationData) => void
    placeholder?: string
    className?: string
    error?: string
    label?: string
    required?: boolean
    mapHeight?: number
    disabled?: boolean
}

// Popular Bulgarian cities for quick selection
const BG_CITIES: { name: string; label: string; lat: number; lng: number }[] = [
    { name: "Sofia", label: "София", lat: 42.6977, lng: 23.3219 },
    { name: "Plovdiv", label: "Пловдив", lat: 42.1354, lng: 24.7453 },
    { name: "Varna", label: "Варна", lat: 43.2141, lng: 27.9147 },
    { name: "Burgas", label: "Бургас", lat: 42.5048, lng: 27.4626 },
    { name: "Ruse", label: "Русе", lat: 43.8486, lng: 25.9549 },
    { name: "Stara Zagora", label: "Ст. Загора", lat: 42.4258, lng: 25.6345 },
    { name: "Pleven", label: "Плевен", lat: 43.4170, lng: 24.6067 },
    { name: "Veliko Tarnovo", label: "В. Търново", lat: 43.0757, lng: 25.6172 },
    { name: "Blagoevgrad", label: "Благоевград", lat: 42.0116, lng: 23.0942 },
]

const BULGARIA_CENTER: [number, number] = [42.7339, 25.4858]
const BULGARIA_ZOOM = 7

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "LynkSkill/1.0" } }
        )
        if (!res.ok) throw new Error("Geocoding failed")
        const data = await res.json()
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
}

// Search biased to Bulgaria first, then worldwide
async function forwardGeocode(query: string): Promise<Array<{
    display_name: string
    lat: string
    lon: string
}>> {
    try {
        // Search Bulgaria first
        const bgRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&addressdetails=1&countrycodes=bg`,
            { headers: { "Accept-Language": "en", "User-Agent": "LynkSkill/1.0" } }
        )
        const bgResults = bgRes.ok ? await bgRes.json() : []

        // Then search worldwide
        const globalRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&addressdetails=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "LynkSkill/1.0" } }
        )
        const globalResults = globalRes.ok ? await globalRes.json() : []

        // Merge and deduplicate
        const seen = new Set<string>()
        const merged: typeof bgResults = []
        for (const r of [...bgResults, ...globalResults]) {
            const key = `${parseFloat(r.lat).toFixed(4)}_${parseFloat(r.lon).toFixed(4)}`
            if (!seen.has(key)) {
                seen.add(key)
                merged.push(r)
            }
        }
        return merged.slice(0, 6)
    } catch {
        return []
    }
}

export function LocationPicker({
    value,
    onChange,
    placeholder = "Търсете локация / Search location...",
    className,
    error,
    label,
    required,
    mapHeight = 220,
    disabled = false,
}: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Array<{
        display_name: string
        lat: string
        lon: string
    }>>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
    const [mapReady, setMapReady] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const hasValue = !!(value && value.address && value.address.length > 0 && !(value.latitude === 0 && value.longitude === 0 && value.address !== "Remote"))
    const isRemote = value?.address === "Remote"

    const currentCenter: [number, number] = hasValue && !isRemote
        ? [value!.latitude, value!.longitude]
        : BULGARIA_CENTER
    const currentZoom = hasValue && !isRemote ? 14 : BULGARIA_ZOOM

    useEffect(() => { setMapReady(true) }, [])

    // Auto-show map when a location is selected (not remote)
    useEffect(() => {
        if (hasValue && !isRemote) setShowMap(true)
    }, [hasValue, isRemote])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (query.length < 2) {
            setSearchResults([])
            setShowResults(false)
            return
        }
        setIsSearching(true)
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await forwardGeocode(query)
            setSearchResults(results)
            setShowResults(results.length > 0)
            setIsSearching(false)
        }, 350)
    }, [])

    const handleSelectResult = useCallback((result: { display_name: string; lat: string; lon: string }) => {
        onChange({
            address: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
        })
        setSearchQuery("")
        setShowResults(false)
        setSearchResults([])
    }, [onChange])

    const handleQuickCity = useCallback((city: typeof BG_CITIES[0]) => {
        onChange({
            address: `${city.name}, Bulgaria`,
            latitude: city.lat,
            longitude: city.lng,
        })
    }, [onChange])

    const handleRemote = useCallback(() => {
        onChange({ address: "Remote", latitude: 0, longitude: 0 })
        setShowMap(false)
    }, [onChange])

    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        setIsReverseGeocoding(true)
        const address = await reverseGeocode(lat, lng)
        onChange({ address, latitude: lat, longitude: lng })
        setIsReverseGeocoding(false)
    }, [onChange])

    const handleUseMyLocation = useCallback(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setIsReverseGeocoding(true)
                const address = await reverseGeocode(latitude, longitude)
                onChange({ address, latitude, longitude })
                setIsReverseGeocoding(false)
            },
            () => { /* user denied */ }
        )
    }, [onChange])

    const handleClear = useCallback(() => {
        onChange({ address: "", latitude: 0, longitude: 0 })
        setSearchQuery("")
        setShowMap(false)
    }, [onChange])

    if (disabled) {
        return (
            <div className={cn("space-y-2", className)}>
                {label && (
                    <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{value?.address || "No location set"}</span>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className={cn("space-y-2.5", className)}>
            {/* Quick City Buttons */}
            <div className="flex flex-wrap gap-1.5">
                {BG_CITIES.map((city) => {
                    const isActive = value?.address?.includes(city.name)
                    return (
                        <button
                            key={city.name}
                            type="button"
                            onClick={() => handleQuickCity(city)}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                                isActive
                                    ? "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/25"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-blue-500/40"
                            )}
                        >
                            {city.label}
                        </button>
                    )
                })}
                <button
                    type="button"
                    onClick={handleRemote}
                    className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                        isRemote
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-emerald-500/40"
                    )}
                >
                    🌐 Remote
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={placeholder}
                        className={cn(
                            "pl-10 pr-20 h-11 rounded-xl border-2 transition-all text-sm",
                            error ? "border-red-500" : "border-border focus:border-blue-500"
                        )}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-blue-500/10"
                            onClick={handleUseMyLocation}
                            title="Използвай текущата ми локация"
                        >
                            <Navigation className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-[1000] max-h-52 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                            <button
                                key={`${result.lat}-${result.lon}-${idx}`}
                                type="button"
                                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-2.5 border-b border-border/50 last:border-0"
                                onClick={() => handleSelectResult(result)}
                            >
                                <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                <span className="text-xs leading-snug">{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Location Display */}
            {(hasValue || isRemote) && (
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border",
                    isRemote
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-blue-500/5 border-blue-500/20"
                )}>
                    {isRemote ? (
                        <span className="text-base">🌐</span>
                    ) : (
                        <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <p className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                        {value!.address}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full shrink-0 hover:bg-red-500/10"
                        onClick={handleClear}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Map Toggle */}
            {!isRemote && (
                <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <MapPin className="h-3 w-3" />
                    {showMap ? "Скрий картата" : "Покажи картата — натисни за точна локация"}
                    {showMap ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            )}

            {/* Map (collapsible) */}
            {mapReady && showMap && !isRemote && (
                <div className="relative rounded-xl overflow-hidden border-2 border-border animate-in fade-in slide-in-from-top-2 duration-200">
                    {isReverseGeocoding && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-lg flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                            <span className="text-xs">Зареждане на адрес...</span>
                        </div>
                    )}
                    <MapContainerDynamic
                        center={currentCenter}
                        zoom={currentZoom}
                        style={{ height: mapHeight, width: "100%" }}
                        className="z-0"
                    >
                        <TileLayerDynamic
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onClick={handleMapClick} />
                        <MapFlyTo center={currentCenter} zoom={currentZoom} />
                        {hasValue && (
                            <MarkerDynamic position={[value!.latitude, value!.longitude]}>
                                <PopupDynamic>
                                    <span className="text-xs">{value!.address}</span>
                                </PopupDynamic>
                            </MarkerDynamic>
                        )}
                    </MapContainerDynamic>
                </div>
            )}
        </div>
    )
}
