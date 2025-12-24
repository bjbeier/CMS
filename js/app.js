// Initialize Lucide Icons
if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
}

// Mobile Menu Toggle Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Dad Joke Generator
const dadJokeElement = document.getElementById('dad-joke');
if (dadJokeElement) {
    const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "I would tell you a UDP joke, but you might not get it.",
        "There are 10 types of people in the world: those who understand binary, and those who don't.",
        "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
        "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
        "My password is the last 8 digits of Pi.",
        "I'm not lazy, I'm just in energy saving mode."
    ];

    dadJokeElement.textContent = jokes[Math.floor(Math.random() * jokes.length)];
}

// Typewriter Effect
const textElement = document.getElementById('typewriter');
if (textElement) {
    const phrases = [
        "Leader.",
        "Tech Enthusiast.",
        "Home Automation Tinkerer.",
        "Problem Solver.",
        "Family Man."
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    document.addEventListener('DOMContentLoaded', type);
}
