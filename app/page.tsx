'use client';

import dynamic from 'next/dynamic'

const FriendMap = dynamic(() => import('./FriendMap'), { ssr: false })

export default function Home() {
    return <FriendMap />
}