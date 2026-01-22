/**
 * DynamicBackground Component
 * Renders theme-specific animated backgrounds using CSS and Canvas
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    hue?: number;
}

export const DynamicBackground: React.FC = () => {
    const { settings } = useSettings();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    // Only these 3 themes have animated backgrounds
    const animatedThemes = ['cosmic', 'lavender', 'light'];
    const isAnimatedTheme = animatedThemes.includes(settings.theme);

    const themeConfig = useMemo(() => {
        switch (settings.theme) {
            case 'light':
                return {
                    type: 'clouds',
                    particleCount: 20,
                    baseColor: 'rgba(255, 255, 255, ',
                    bgGradient: 'radial-gradient(ellipse at 50% 0%, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
                    shootingStars: false,
                };
            case 'cosmic':
                return {
                    type: 'stars',
                    particleCount: 200,
                    baseColor: 'rgba(139, 92, 246, ',
                    bgGradient: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 40%, #020617 100%)',
                    shootingStars: true,
                };
            case 'lavender':
                return {
                    type: 'petals',
                    particleCount: 50,
                    baseColor: 'rgba(232, 121, 249, ',
                    bgGradient: 'radial-gradient(ellipse at 50% 0%, #3b0764 0%, #2e1065 50%, #1a0525 100%)',
                    shootingStars: false,
                };
            default:
                // Non-animated themes - return minimal config (won't render)
                return {
                    type: 'none',
                    particleCount: 0,
                    baseColor: 'rgba(0, 0, 0, ',
                    bgGradient: 'none',
                    shootingStars: false,
                };
        }
    }, [settings.theme]);

    // Initialize particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const initParticles = () => {
            const particles: Particle[] = [];
            for (let i = 0; i < themeConfig.particleCount; i++) {
                particles.push(createParticle(canvas.width, canvas.height, themeConfig.type));
            }
            particlesRef.current = particles;
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [themeConfig]);

    // Animation loop
    useEffect(() => {
        if (settings.enableAnimation === false) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let shootingStarTimer = 0;
        let shootingStar: { x: number; y: number; length: number; speed: number; opacity: number } | null = null;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            particlesRef.current.forEach((particle) => {
                updateParticle(particle, canvas.width, canvas.height, themeConfig.type);
                drawParticle(ctx, particle, themeConfig);
            });

            // Shooting stars for midnight/cosmic theme
            if (themeConfig.shootingStars) {
                shootingStarTimer++;
                if (shootingStarTimer > 300 && Math.random() < 0.01) {
                    shootingStar = {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height * 0.5,
                        length: 80 + Math.random() * 40,
                        speed: 15 + Math.random() * 10,
                        opacity: 1,
                    };
                    shootingStarTimer = 0;
                }

                if (shootingStar) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.opacity})`;
                    ctx.lineWidth = 2;
                    ctx.moveTo(shootingStar.x, shootingStar.y);
                    ctx.lineTo(
                        shootingStar.x - shootingStar.length,
                        shootingStar.y - shootingStar.length * 0.3
                    );
                    ctx.stroke();

                    shootingStar.x += shootingStar.speed;
                    shootingStar.y += shootingStar.speed * 0.3;
                    shootingStar.opacity -= 0.02;

                    if (shootingStar.opacity <= 0) {
                        shootingStar = null;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [settings.enableAnimation, themeConfig]);

    // Don't render anything for non-animated themes (solid body background will show)
    if (!isAnimatedTheme) {
        return null;
    }

    return (
        <>
            {/* Gradient Background Layer */}
            <div
                className="fixed inset-0 z-0 transition-all duration-1000"
                style={{ background: themeConfig.bgGradient }}
            />

            {/* Canvas Particle Layer */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 z-0 pointer-events-none"
                style={{ opacity: settings.enableAnimation === false ? 0 : 0.8 }}
            />

            {/* Ambient Glow Overlay - only for animated themes */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div
                    className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] animate-float-slow ${settings.theme === 'cosmic' ? 'bg-violet-600/20' :
                            settings.theme === 'lavender' ? 'bg-fuchsia-500/10' :
                                settings.theme === 'light' ? 'bg-blue-300/20' :
                                    'bg-purple-500/10'
                        }`}
                    style={{ top: '-15%', left: '-10%' }}
                />
                <div
                    className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] animate-float-slower ${settings.theme === 'cosmic' ? 'bg-pink-600/20' :
                            settings.theme === 'lavender' ? 'bg-purple-600/20' :
                                settings.theme === 'light' ? 'bg-sky-300/20' :
                                    'bg-pink-500/10'
                        }`}
                    style={{ bottom: '-10%', right: '-5%' }}
                />
            </div>
        </>
    );
};

// Helper functions
function createParticle(width: number, height: number, type: string): Particle {
    const base = {
        x: Math.random() * width,
        y: Math.random() * height,
        opacity: Math.random() * 0.5 + 0.2,
    };

    switch (type) {
        case 'stars':
            return {
                ...base,
                size: Math.random() * 3 + 1, // Larger stars
                speedX: 0,
                speedY: 0,
                opacity: Math.random() * 0.8 + 0.4, // Brighter
            };
        case 'clouds':
            return {
                ...base,
                size: Math.random() * 80 + 40, // Even larger fluffy clouds
                speedX: Math.random() * 0.3 + 0.1, // Slightly faster drift
                speedY: Math.random() * 0.05 - 0.025, // Slight vertical wobble
                opacity: Math.random() * 0.4 + 0.3, // Much more visible (0.3-0.7)
            };
        case 'leaves':
            return {
                ...base,
                size: Math.random() * 6 + 3,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.8 + 0.3,
                hue: Math.random() * 40 + 80, // Green hues
            };
        case 'petals':
            return {
                ...base,
                size: Math.random() * 6 + 3, // Larger petals
                speedX: Math.random() * 0.5 - 0.25,
                // Fall down slowly
                speedY: Math.random() * 0.5 + 0.2,
                hue: Math.random() * 40 + 280, // Pink/Purple hues (280-320)
            };
        case 'bubbles':
            return {
                ...base,
                size: Math.random() * 8 + 2,
                speedX: Math.random() * 0.3 - 0.15,
                speedY: -(Math.random() * 0.8 + 0.3),
            };
        case 'embers':
            return {
                ...base,
                size: Math.random() * 3 + 1,
                speedX: Math.random() * 0.4 - 0.2,
                speedY: -(Math.random() * 1 + 0.5),
                hue: Math.random() * 30 + 15, // Orange/red hues
            };
        case 'aurora':
        default:
            return {
                ...base,
                size: Math.random() * 4 + 1,
                speedX: Math.random() * 0.3 - 0.15,
                speedY: Math.random() * 0.2 - 0.1,
                hue: Math.random() * 60 + 240, // Purple/blue hues
            };
    }
}

function updateParticle(particle: Particle, width: number, height: number, type: string): void {
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // Twinkle effect for stars
    if (type === 'stars') {
        particle.opacity += (Math.random() - 0.5) * 0.05;
        particle.opacity = Math.max(0.1, Math.min(1, particle.opacity));
    }

    // Wrap around screen
    if (particle.x < 0) particle.x = width;
    if (particle.x > width) particle.x = 0;
    if (particle.y < 0) particle.y = height;
    if (particle.y > height) particle.y = 0;
}

function drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle,
    config: { type: string; baseColor: string }
): void {
    ctx.beginPath();

    switch (config.type) {
        case 'stars':
            // Draw a 4-point star
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Add glow
            if (particle.opacity > 0.7) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(200, 220, 255, ${particle.opacity * 0.3})`;
                ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'clouds':
            // Draw fluffy cloud with multiple overlapping circles and soft shadow
            ctx.save();
            ctx.shadowColor = 'rgba(100, 150, 200, 0.3)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            // Main cloud body - multiple circles for fluffy look
            ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(particle.x - particle.size * 0.4, particle.y + particle.size * 0.1, particle.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(particle.x + particle.size * 0.4, particle.y + particle.size * 0.1, particle.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;

        case 'leaves':
            ctx.fillStyle = `hsla(${particle.hue}, 60%, 50%, ${particle.opacity})`;
            ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.5, particle.x * 0.01, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'petals':
            ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
            ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.6, particle.x * 0.02, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'bubbles':
            ctx.strokeStyle = config.baseColor + `${particle.opacity})`;
            ctx.lineWidth = 1;
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.stroke();

            // Highlight
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.5})`;
            ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'embers':
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${particle.opacity})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);
            ctx.fillStyle = gradient;
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'aurora':
        default:
            const auroraGradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            auroraGradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity})`);
            auroraGradient.addColorStop(1, `hsla(${particle.hue}, 80%, 60%, 0)`);
            ctx.fillStyle = auroraGradient;
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

export default DynamicBackground;
