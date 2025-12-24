"use client";

import React, { useEffect, useState } from 'react';

export default function DynamicBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[-50] overflow-hidden pointer-events-none bg-black">
            {/* Real Sky Image Background - Adjusted to hide top artifacts */}
            <div
                className="absolute inset-0 bg-cover bg-no-repeat animate-slow-zoom"
                style={{
                    backgroundImage: `url('/puleun-haneul-e-guleumgwa-aleumdaun-badawa-bada.jpg')`,
                    backgroundPosition: 'center center',
                }}
            />

            {/* Dark overlay to ensure text readability and hide artifacts */}
            <div className="absolute inset-0 bg-black/30 md:bg-black/20" />

            {/* Left edge gradient to hide artifacts - wider and darker on mobile */}
            <div 
                className="absolute inset-y-0 left-0 w-24 sm:w-20 md:w-48"
                style={{
                    background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                }}
            />

            {/* Right edge gradient to hide artifacts - wider and darker on mobile */}
            <div 
                className="absolute inset-y-0 right-0 w-24 sm:w-20 md:w-48"
                style={{
                    background: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                }}
            />

            {/* Top edge gradient */}
            <div 
                className="absolute inset-x-0 top-0 h-24 md:h-32"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
                }}
            />

            {/* Bottom edge gradient */}
            <div 
                className="absolute inset-x-0 bottom-0 h-24 md:h-32"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
                }}
            />
        </div>
    );
}
