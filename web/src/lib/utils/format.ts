export function formatScientific(value: number): string {
    if (value === 0) return '0';
    if (isNaN(value)) return 'N/A';
    
    // For very small or very large numbers, use scientific notation
    if (Math.abs(value) < 0.01 || Math.abs(value) >= 1e6) {
        return value.toExponential(2);
    }
    
    // For regular numbers, use fixed decimal places
    return value.toFixed(2);
} 