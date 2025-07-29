// Utility functions

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Simple random int helper
function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}