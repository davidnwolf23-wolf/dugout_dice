import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

// ⚾ Baseball — Inning Win
export const BaseballIcon = ({ size = 48, className = '', color = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Ball Body */}
        <circle cx="32" cy="32" r="30" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />

        {/* Left Seam */}
        <path d="M18 10 C26 22, 26 44, 18 56" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Right Seam */}
        <path d="M46 10 C38 22, 38 44, 46 56" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Stitches - Left */}
        <line x1="14" y1="16" x2="22" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="24" x2="22" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="32" x2="22" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="40" x2="22" y2="39" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="48" x2="22" y2="46" stroke={color} strokeWidth="2" strokeLinecap="round" />

        {/* Stitches - Right */}
        <line x1="50" y1="16" x2="42" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="51" y1="24" x2="42" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="51" y1="32" x2="42" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="51" y1="40" x2="42" y2="39" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="48" x2="42" y2="46" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 🧤 Baseball Glove — Pitching Side (Defensive)
// 🧤 Baseball Glove — Pitching Side (Defensive)
export const GloveIcon = ({ size = 48, className = '', color = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Glove Outline / Body */}
        <path d="M16 54 C12 46, 10 32, 12 24 C14 16, 18 14, 22 16 L22 12 C22 8, 28 8, 28 12 L28 10 C28 6, 34 6, 34 10 L34 12 C34 8, 40 8, 40 12 L40 16 C40 12, 46 12, 46 16 L46 34 C48 44, 42 52, 36 56 L24 56 C20 56, 16 54, 16 54 Z"
            stroke={color} strokeWidth="3" strokeLinejoin="round" fill={color} fillOpacity="0.1" />

        {/* Webbing (Basket Weave) */}
        <path d="M12 24 C16 28, 22 26, 22 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="20" x2="20" y2="18" stroke={color} strokeWidth="2" />
        <line x1="15" y1="24" x2="21" y2="22" stroke={color} strokeWidth="2" />
        <line x1="16" y1="16" x2="18" y2="26" stroke={color} strokeWidth="2" />

        {/* Finger Definitions via internal lines */}
        <path d="M22 16 L22 36" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 12 L28 34" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M34 12 L34 34" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M40 16 L40 36" stroke={color} strokeWidth="2" strokeLinecap="round" />

        {/* Lacing Details */}
        <path d="M12 24 L14 26 M14 22 L16 24 M10 30 L12 32" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M46 16 L48 18 M46 22 L48 24 M46 28 L48 30" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8" />

        {/* Palm / Heel Pad */}
        <path d="M20 48 Q 32 52, 40 46" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
);

// ⚔️ Crossed Bats — Hitting Side (Offensive)
export const CrossedBatsIcon = ({ size = 48, className = '', color = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Bat 1 (Back) - angled top-left to bottom-right */}
        <g transform="rotate(45 32 32)">
            {/* Knob (Rounded Cap) - Centered at 32, slightly wider than handle (30-34) */}
            <path d="M29 54 Q 32 56, 35 54 L35 53 L29 53 Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {/* Handle & Barrel */}
            <path d="M30 53 L30 36 L27 10 C27 7, 30 5, 32 5 C34 5, 37 7, 37 10 L34 36 L34 53" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {/* Grip tape */}
            <path d="M30 50 L34 48 M30 46 L34 44 M30 42 L34 40 M30 38 L34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            {/* Wood grain */}
            <path d="M32 12 V 28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </g>

        {/* Bat 2 (Front) - angled top-right to bottom-left */}
        <g transform="rotate(-45 32 32)">
            {/* Knob (Rounded Cap) */}
            <path d="M29 54 Q 32 56, 35 54 L35 53 L29 53 Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {/* Handle & Barrel */}
            <path d="M30 53 L30 36 L27 10 C27 7, 30 5, 32 5 C34 5, 37 7, 37 10 L34 36 L34 53" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {/* Grip tape */}
            <path d="M30 50 L34 48 M30 46 L34 44 M30 42 L34 40 M30 38 L34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            {/* Wood grain */}
            <path d="M32 12 V 28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </g>
    </svg>
);

// 👮 Umpire Mask — Strike Zone
export const UmpireIcon = ({ size = 48, className = '', color = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Outer Frame */}
        <path d="M16 20 C16 10, 24 4, 32 4 C40 4, 48 10, 48 20 L48 36 C48 50, 40 60, 32 60 C24 60, 16 50, 16 36 Z"
            stroke={color} strokeWidth="3" strokeLinejoin="round" fill="none" />

        {/* Horizontal Eye Bar */}
        <rect x="14" y="24" width="36" height="8" rx="2" stroke={color} strokeWidth="2.5" fill="none" />

        {/* Top Padding Area */}
        <path d="M22 10 H42 V18 H22 Z" fill={color} fillOpacity="0.4" />
        <path d="M22 10 V18 M42 10 V18 M32 4 V18" stroke={color} strokeWidth="2" />

        {/* Jaw Padding Area */}
        <path d="M20 40 H44 V52 H20 Z" fill={color} fillOpacity="0.4" />

        {/* Vertical Cage Bars */}
        <line x1="32" y1="32" x2="32" y2="60" stroke={color} strokeWidth="2" />
        <line x1="24" y1="32" x2="24" y2="56" stroke={color} strokeWidth="2" />
        <line x1="40" y1="32" x2="40" y2="56" stroke={color} strokeWidth="2" />

        {/* Horizontal Cage Bars (Lower) */}
        <line x1="16" y1="40" x2="48" y2="40" stroke={color} strokeWidth="2" />
        <line x1="20" y1="48" x2="44" y2="48" stroke={color} strokeWidth="2" />
    </svg>
);

// 🏠 Home Plate — Batter Up
export const HomePlateIcon = ({ size = 48, className = '', color = 'currentColor' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Pentagon home plate shape (pointing down) */}
        <polygon
            points="12,22 52,22 52,42 32,58 12,42"
            stroke={color} strokeWidth="3" strokeLinejoin="round" fill="none"
        />
        {/* Inner detail line */}
        <polygon
            points="18,26 46,26 46,38 32,50 18,38"
            stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 2" fill="none"
        />
        {/* Top bevel for 3D effect */}
        <line x1="16" y1="18" x2="48" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
);
