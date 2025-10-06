// /lib/validateEIK.ts

export function validateEIK(eik: string): boolean {
    // Да е точно 9 или 13 цифри
    if (!/^\d{9}$/.test(eik) && !/^\d{13}$/.test(eik)) return false;

    // Отхвърляме всички нули
    if (/^0+$/.test(eik)) return false;

    // --- Проверка за 9-цифрен ЕИК ---
    if (eik.length === 9) {
        const digits = eik.split("").map(Number);
        const weights1 = [1, 2, 3, 4, 5, 6, 7, 8];
        const weights2 = [3, 4, 5, 6, 7, 8, 9, 10];

        let sum = 0;
        for (let i = 0; i < 8; i++) sum += digits[i] * weights1[i];
        let remainder = sum % 11;

        if (remainder === 10) {
            sum = 0;
            for (let i = 0; i < 8; i++) sum += digits[i] * weights2[i];
            remainder = sum % 11;
            if (remainder === 10) remainder = 0;
        }

        return remainder === digits[8];
    }

    // --- Проверка за 13-цифрен ЕИК (клон) ---
    if (eik.length === 13) {
        const digits = eik.split("").map(Number);
        const base = digits.slice(0, 9).join("");
        if (!validateEIK(base)) return false;

        const weights = [2, 7, 3, 5];
        let sum = 0;
        for (let i = 9; i < 12; i++) sum += digits[i] * weights[i - 9];
        let remainder = sum % 11;
        if (remainder === 10) remainder = 0;

        return remainder === digits[12];
    }

    return false;
}
