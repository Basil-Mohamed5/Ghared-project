// src/middleware/codeGenerator.js
export const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6); // last 6 digits
    const random = Math.floor(100 + Math.random() * 900);
    return `TRX-${timestamp}-${random}`;
};
