import React from 'react';

interface SmokeyBackgroundProps {
    className?: string;
    color?: string;
}

export const SmokeyBackground = ({ className, color = "#14b8a6" }: SmokeyBackgroundProps) => {
    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" />

            {/* Animated smokey effects */}
            <div
                className="absolute inset-0 opacity-30 animate-pulse"
                style={{
                    background: `radial-gradient(ellipse at 30% 20%, ${color}20 0%, transparent 50%)`,
                    animationDuration: '4s'
                }}
            />
            <div
                className="absolute inset-0 opacity-20 animate-pulse"
                style={{
                    background: `radial-gradient(ellipse at 70% 80%, ${color}15 0%, transparent 50%)`,
                    animationDuration: '6s',
                    animationDelay: '2s'
                }}
            />
            <div
                className="absolute inset-0 opacity-15 animate-pulse"
                style={{
                    background: `radial-gradient(ellipse at 50% 50%, ${color}10 0%, transparent 60%)`,
                    animationDuration: '8s',
                    animationDelay: '1s'
                }}
            />

            {/* Additional ambient glow */}
            <div
                className="absolute top-0 right-0 w-1/2 h-1/2 opacity-10"
                style={{
                    background: `radial-gradient(circle at top right, ${color}30 0%, transparent 70%)`
                }}
            />
            <div
                className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-10"
                style={{
                    background: `radial-gradient(circle at bottom left, ${color}20 0%, transparent 70%)`
                }}
            />
        </div>
    );
};
