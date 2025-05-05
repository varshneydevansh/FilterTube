// === Mobile Navigation Toggle ===
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const navLinks = document.querySelector('.nav-links');

mobileNavToggle.addEventListener('click', () => {
    const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
    mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
    // Optional: Change icon on toggle
    const icon = mobileNavToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            mobileNavToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('active');
            mobileNavToggle.querySelector('i').classList.remove('fa-times');
            mobileNavToggle.querySelector('i').classList.add('fa-bars');
        }
    });
});

// === Hero Section Interactive 3D Effect ===
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section');
    const waves = document.querySelectorAll('.wave');
    
    // Only add these event listeners if we're on a device that supports hover
    if (window.matchMedia('(hover: hover)').matches) {
        // Add mousemove event listener to hero section
        heroSection.addEventListener('mousemove', (e) => {
            // Calculate mouse position relative to center of hero section
            const rect = heroSection.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate percentage from center (-1 to 1 range)
            const percentX = (mouseX - centerX) / centerX;
            const percentY = (mouseY - centerY) / centerY;
            
            // Apply transform to each wave with different intensities based on z-index
            waves.forEach((wave, index) => {
                // Deeper waves move more to create parallax
                const intensity = (5 - index) * 10; // Decreasing intensity for deeper layers
                // Use translate3d for better performance
                wave.style.transform = `translate3d(${percentX * intensity}px, ${percentY * intensity}px, ${-10 * (index + 1)}px)`;
            });
        });
        
        // Reset position when mouse leaves hero section
        heroSection.addEventListener('mouseleave', () => {
            waves.forEach((wave, index) => {
                // Reset to original position with animation
                wave.style.transition = 'transform 0.5s ease-out';
                wave.style.transform = `translateZ(${-10 * (index + 1)}px)`;
                
                // Remove transition after animation completes to avoid conflict with mousemove
                setTimeout(() => {
                    wave.style.transition = 'transform 0.2s ease-out';
                }, 500);
            });
        });
    }
});

// === Scroll Animations ===
const animatedElements = document.querySelectorAll('.animate-on-scroll');

const observerOptions = {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    threshold: 0.1 // Trigger when 10% of the element is visible
};

const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Optional: Stop observing once animated
            // observer.unobserve(entry.target);
        } else {
            // Optional: Remove class if you want animation to repeat on scroll up
            // entry.target.classList.remove('is-visible');
        }
    });
};

const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

animatedElements.forEach(el => {
    scrollObserver.observe(el);
});

// === Smooth Scroll for Nav Links ===
// Already handled by CSS `scroll-behavior: smooth;` if targeting IDs
// Add JS fallback or more complex logic if needed later

// === Active Nav Link Highlighting (Optional) ===
// Basic highlighting based on hash
function highlightNavLink() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinksAnchors = document.querySelectorAll('.nav-links a');
    let currentSectionId = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        // Adjust for navbar height if it's fixed
        const scrollPosition = window.scrollY + 100; // Add offset

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSectionId = section.getAttribute('id');
        }
    });

    navLinksAnchors.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
        }
    });

    // Special case for top of page
    if (window.scrollY < 200 && currentSectionId === '' ) {
         navLinksAnchors.forEach(link => link.classList.remove('active'));
         // Optionally highlight a 'Home' link if you add one
    }
}

window.addEventListener('scroll', highlightNavLink);
document.addEventListener('DOMContentLoaded', highlightNavLink); // Initial highlight

console.log('FilterTube Website Script Loaded'); 

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const expanded = mobileNavToggle.getAttribute('aria-expanded') === 'true' || false;
            mobileNavToggle.setAttribute('aria-expanded', !expanded);
        });
    }

    // Scroll Animation
    const animateOnScroll = document.querySelectorAll('.animate-on-scroll');
    
    const checkScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        
        animateOnScroll.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('is-visible');
            }
        });
    };
    
    // Initial check and scroll event listener
    checkScroll();
    window.addEventListener('scroll', checkScroll);

    // Hero Section background color breathing effect
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        // Colors to transition between
        const colors = [
            { r: 242, g: 84, b: 91, a: 0.9 },   // Primary start color (brighter)
            { r: 250, g: 128, b: 114, a: 0.8 },  // Primary end color
            { r: 255, g: 159, b: 139, a: 0.7 },  // Lighter variant
            { r: 250, g: 128, b: 114, a: 0.8 }   // Back to primary end
        ];
        
        let colorIndex = 0;
        let nextColorIndex = 1;
        let progress = 0;
        const transitionSpeed = 0.005; // Adjust for faster/slower transitions
        
        // Update SVG wave colors
        function updateWaveColors() {
            const currentColor = interpolateColors(colors[colorIndex], colors[nextColorIndex], progress);
            const waves = heroSection.querySelectorAll('.wave');
            
            if (waves.length > 0) {
                // Update wave fill colors
                waves[0].querySelector('path').setAttribute('fill', `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`);
                waves[0].querySelector('path').setAttribute('fill-opacity', currentColor.a);
                
                // For second wave, use a slightly different shade
                if (waves[1]) {
                    const secondColor = {
                        r: Math.min(255, currentColor.r + 10),
                        g: Math.min(255, currentColor.g + 10),
                        b: Math.min(255, currentColor.b + 10),
                        a: currentColor.a - 0.1
                    };
                    waves[1].querySelector('path').setAttribute('fill', `rgb(${secondColor.r}, ${secondColor.g}, ${secondColor.b})`);
                    waves[1].querySelector('path').setAttribute('fill-opacity', secondColor.a);
                }
            }
            
            // Update progress for next frame
            progress += transitionSpeed;
            
            // Move to next color when transition completes
            if (progress >= 1) {
                colorIndex = nextColorIndex;
                nextColorIndex = (nextColorIndex + 1) % colors.length;
                progress = 0;
            }
            
            requestAnimationFrame(updateWaveColors);
        }
        
        // Helper function to interpolate between two colors
        function interpolateColors(color1, color2, factor) {
            return {
                r: Math.round(color1.r + factor * (color2.r - color1.r)),
                g: Math.round(color1.g + factor * (color2.g - color1.g)),
                b: Math.round(color1.b + factor * (color2.b - color1.b)),
                a: color1.a + factor * (color2.a - color1.a)
            };
        }
        
        // Start the animation
        updateWaveColors();
    }

    // FAQ Accordion functionality (for privacy page)
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                item.classList.toggle('active');
                
                // Close other open FAQs (for accordion behavior)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        }
    });
}); 