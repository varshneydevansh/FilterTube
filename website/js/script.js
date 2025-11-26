// FilterTube Website Script - GLOBAL THEME MANAGER

// === CRITICAL: Theme must be set BEFORE any other code runs ===
// This code runs immediately when script.js loads
(function () {
    'use strict';

    const STORAGE_KEY = 'filtertube-theme';
    const DEFAULT_THEME = 'dark';

    // Get theme from localStorage
    function getTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        } catch (e) {
            console.error('Error reading theme:', e);
        }
        return DEFAULT_THEME;
    }

    // Set theme immediately
    function setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('Invalid theme:', theme);
            return false;
        }
        try {
            localStorage.setItem(STORAGE_KEY, theme);
            document.documentElement.setAttribute('data-theme', theme);
            console.log('[FilterTube] Theme set to:', theme);
            return true;
        } catch (e) {
            console.error('Error saving theme:', e);
            return false;
        }
    }

    // Global theme manager
    window.FilterTubeTheme = {
        get: getTheme,
        set: setTheme,
        toggle: function () {
            const current = getTheme();
            const newTheme = current === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
            return newTheme;
        }
    };

    // Initialize theme IMMEDIATELY
    const currentTheme = getTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);
    console.log('[FilterTube] Theme initialized:', currentTheme);
})();

// DOM Ready code
document.addEventListener('DOMContentLoaded', () => {
    // --- Register Service Worker for PWA (instant page loads) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('[FilterTube] Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('[FilterTube] Service Worker registration failed:', error);
            });
    }

    // --- Theme Toggle Button ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Update button text
        function updateButtonText() {
            const theme = window.FilterTubeTheme.get();
            themeToggle.textContent = theme === 'light' ? 'DARK MODE' : 'LIGHT MODE';
        }
        updateButtonText();

        themeToggle.addEventListener('click', () => {
            const newTheme = window.FilterTubeTheme.toggle();
            updateButtonText();

            // Update flower animation if exists
            if (window.flowerApp) {
                window.flowerApp.updateColors(newTheme);
            }
        });
    }

    // --- Mobile Menu ---
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Intersection Observer REMOVED for instant content visibility
    // Content now shows immediately instead of waiting for scroll

    // --- Hero Canvas Animation (Pixel Flower) ---
    // ONLY run on home page to improve performance
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '/website/' || window.location.pathname === '/website/index.html')) {
        window.flowerApp = new PixelFlowerApp(heroCanvas);
    }
});

// --- Optimized Pixel Flower Class ---
class PixelFlowerApp {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.pixels = [];
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.frame = 0;
        this.theme = document.documentElement.getAttribute('data-theme');
        this.isAnimating = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initFlower();
        this.animate();
    }

    updateColors(newTheme) {
        this.theme = newTheme;
        // Re-initialize to update pixel colors
        this.pixels.forEach(p => {
            p.color = this.getPixelColor(p.type);
        });
    }

    resize() {
        this.width = this.canvas.parentElement.offsetWidth;
        this.height = this.canvas.parentElement.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    getPixelColor(type) {
        const isLight = this.theme === 'light';
        if (type === 'stem') return isLight ? '#2ecc71' : '#27ae60';
        if (type === 'leaf') return isLight ? '#16a085' : '#1abc9c';
        if (type === 'center') return isLight ? '#f39c12' : '#f1c40f';
        if (type === 'petal-outer') {
            const colors = isLight
                ? ['#e74c3c', '#c0392b', '#d35400']
                : ['#ff3333', '#e74c3c', '#d35400'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        if (type === 'petal-inner') {
            const colors = isLight
                ? ['#ff6b6b', '#ff8787', '#ff9f43']
                : ['#ff5555', '#ff7777', '#ffaa55'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        return '#fff';
    }

    initFlower() {
        const pixelSize = 8; // Increased from 6 for better performance
        this.pixels = [];

        // Reduced stem
        for (let y = 0; y < 12; y++) { // Reduced from 20
            for (let x = -1; x <= 1; x++) {
                if (y < 3 && Math.abs(x) === 1) continue;
                this.pixels.push({
                    x: x * pixelSize,
                    y: 80 + (y * pixelSize),
                    targetX: x * pixelSize,
                    targetY: 80 + (y * pixelSize),
                    currentX: (Math.random() - 0.5) * 400,
                    currentY: 400,
                    size: pixelSize,
                    color: this.getPixelColor('stem'),
                    type: 'stem',
                    speed: 0.06 + Math.random() * 0.04
                });
            }
        }

        // Reduced leaves
        const leafPositions = [
            { baseY: 120, side: -1 },
            { baseY: 160, side: 1 }
        ];

        leafPositions.forEach(leaf => {
            for (let i = 0; i < 5; i++) { // Reduced from 8
                const offsetX = leaf.side * (10 + i * 5);
                const offsetY = -Math.abs(i - 2.5) * 3;
                this.pixels.push({
                    x: offsetX,
                    y: leaf.baseY + offsetY,
                    targetX: offsetX,
                    targetY: leaf.baseY + offsetY,
                    currentX: (Math.random() - 0.5) * 500,
                    currentY: 500,
                    size: pixelSize,
                    color: this.getPixelColor('leaf'),
                    type: 'leaf',
                    speed: 0.05 + Math.random() * 0.03
                });
            }
        });

        // Smaller center
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                this.pixels.push({
                    x: x * pixelSize,
                    y: y * pixelSize,
                    targetX: x * pixelSize,
                    targetY: y * pixelSize,
                    currentX: (Math.random() - 0.5) * 300,
                    currentY: -300,
                    size: pixelSize,
                    color: this.getPixelColor('center'),
                    type: 'center',
                    speed: 0.07 + Math.random() * 0.05
                });
            }
        }

        // Reduced petals - MUCH fewer particles
        const petalLayers = [
            { count: 10, radius: 50, type: 'petal-outer', clusters: 4 }, // Reduced from 16/8
            { count: 8, radius: 35, type: 'petal-inner', clusters: 3 }   // Reduced from 12/6
        ];

        petalLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const angle = (i / layer.count) * Math.PI * 2;
                for (let j = 0; j < layer.clusters; j++) {
                    const r = layer.radius + (Math.random() * 10) - 5;
                    const angleOffset = (Math.random() - 0.5) * 0.25;
                    const px = Math.cos(angle + angleOffset) * r + (Math.random() - 0.5) * 6;
                    const py = Math.sin(angle + angleOffset) * r + (Math.random() - 0.5) * 6;

                    this.pixels.push({
                        x: px,
                        y: py,
                        targetX: px,
                        targetY: py,
                        currentX: (Math.random() - 0.5) * 600,
                        currentY: (Math.random() - 0.5) * 600,
                        size: pixelSize,
                        color: this.getPixelColor(layer.type),
                        type: layer.type,
                        speed: 0.03 + Math.random() * 0.02
                    });
                }
            }
        });

        console.log('[FilterTube] Flower initialized with', this.pixels.length, 'pixels');
    }

    animate() {
        if (!this.isAnimating) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.frame++;

        this.pixels.forEach(p => {
            // Blossom Animation (Move to target)
            const dx = p.targetX - p.currentX;
            const dy = p.targetY - p.currentY;
            p.currentX += dx * p.speed;
            p.currentY += dy * p.speed;

            // Sway Animation (after blossoming)
            let swayX = 0;
            let swayY = 0;

            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                const time = this.frame * 0.02;
                if (p.type.includes('petal')) {
                    swayX = Math.cos(time + p.x * 0.1) * 2;
                    swayY = Math.sin(time + p.y * 0.1) * 2;
                } else if (p.type === 'stem') {
                    swayX = Math.sin(time * 0.5 + p.y * 0.05) * 1.5;
                } else if (p.type === 'leaf') {
                    swayX = Math.sin(time * 0.7 + p.y * 0.1) * 2.5;
                    swayY = Math.cos(time * 0.6 + p.x * 0.1) * 1;
                }
            }

            // Simplified rendering - no shadow for performance
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(
                this.centerX + p.currentX + swayX,
                this.centerY + p.currentY + swayY,
                p.size,
                p.size
            );
        });

        requestAnimationFrame(() => this.animate());
    }
}
