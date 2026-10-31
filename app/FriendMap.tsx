'use client'

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSpacetimeDB, useTable, useReducer } from "spacetimedb/react"
import { tables, reducers } from '../src/module_bindings'
import { Providers } from './providers'

const STEP = 0.0005

const pin = (name: string, isMe: boolean) => 
    L.divIcon({
        className: '',
        iconSize: [0,0],
        html: `<div class="pin ${isMe ? 'me' : ''}">
                <span>${name.replace(/[<>&]/g, '')}</span>
                </div>`
    })

function FriendMap() {
    const { isActive, identity } = useSpacetimeDB()
    const [users] = useTable(tables.user)
    const setName = useReducer(reducers.setName)
    const updateLocation = useReducer(reducers.updateLocation)

    const [pos, setPos] = useState(() => ({
        lat: 44.650853 + (Math.random() - 0.5) * 0.004,
        lng: -63.592444 + (Math.random() - 0.5) * 0.004,
    }))

    // set default location randomly around downtown halifax

    const [myName, setMyName] = useState(
        () => sessionStorage.getItem('name') || `Friend ${Math.floor(Math.random() * 100)}` 
    )
    // random number for person if no name found

    useEffect(() => {
        if (!isActive) return;

        sessionStorage.setItem('name', myName)
        setName({ name: myName })
    }, [isActive, myName])

    useEffect(() => {
        if (isActive)   updateLocation(pos)
    }, [isActive, pos])

    // To mimic movement without really going outside

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp')    setPos(p => ({...p, lat: p.lat + STEP}))
            if (e.key === 'ArrowDown')  setPos(p => ({...p, lat: p.lat - STEP}))
            if (e.key === 'ArrowLeft')  setPos(p => ({...p, lng: p.lng - STEP}))
            if (e.key === 'ArrowRight') setPos(p => ({...p, lng: p.lng + STEP}))
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const useMyLocation = () => {
        console.log("use my locationis pressed")
        navigator.geolocation.getCurrentPosition(p => 
            setPos({lat: p.coords.latitude, lng: p.coords.longitude})
        )
    }

    return (
        <main>
            <MapContainer
                center={[44.650853, -63.592444]}
                zoom = {16}
                style= {{ height: '100vh' }}
            >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {users
                    .filter(u => u.online && u.name)
                    .map(u => (
                        <Marker
                            key={u.identity.toHexString()}
                            position={[u.lat, u.lng]}
                            icon={pin(
                                u.name, u.identity.toHexString() === identity?.toHexString()
                            )}
                        />
                    ))
                    
                }
            </MapContainer>

            <div className="hud">
                <span className="hint">
                    {isActive ? 'Move with the arow keys': 'Connecting...'}
                </span>
                <input value={myName} onChange={(e => setMyName(e.target.value))} />
                <button onClick={useMyLocation}>Use my real location</button>
            </div>
        </main> 
    )
}

export default function Page(){
    return(
        <Providers>
            <FriendMap />
        </Providers>
    )
}