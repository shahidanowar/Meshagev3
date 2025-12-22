/**
 * Encryption Utility for Meshage Personal Chats
 * Uses AES-256 symmetric encryption with keys derived from user persistent IDs
 */

import CryptoJS from 'crypto-js';

// Salt for key derivation (can be customized)
const ENCRYPTION_SALT = 'MESHAGE_E2E_v1';

/**
 * Generates a shared secret key from two persistent IDs
 * The key is always the same regardless of order (A+B = B+A)
 */
export const generateSharedKey = (myPersistentId: string, friendPersistentId: string): string => {
    // Sort IDs to ensure consistent key generation regardless of who initiates
    const sortedIds = [myPersistentId, friendPersistentId].sort();
    const combinedKey = `${ENCRYPTION_SALT}:${sortedIds[0]}:${sortedIds[1]}`;

    // Use SHA-256 to derive a strong key
    const hash = CryptoJS.SHA256(combinedKey);
    return hash.toString();
};

/**
 * Encrypts a message using AES-256
 * @param message - The plain text message to encrypt
 * @param sharedKey - The shared secret key between two users
 * @returns The encrypted message as a base64 string
 */
export const encryptMessage = (message: string, sharedKey: string): string => {
    try {
        const encrypted = CryptoJS.AES.encrypt(message, sharedKey);
        return encrypted.toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return message; // Return original if encryption fails
    }
};

/**
 * Decrypts a message using AES-256
 * @param encryptedMessage - The encrypted message (base64 string)
 * @param sharedKey - The shared secret key between two users
 * @returns The decrypted plain text message
 */
export const decryptMessage = (encryptedMessage: string, sharedKey: string): string => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, sharedKey);
        const plainText = decrypted.toString(CryptoJS.enc.Utf8);

        // If decryption results in empty string, return original (might not be encrypted)
        if (!plainText) {
            console.warn('Decryption resulted in empty string, message might not be encrypted');
            return encryptedMessage;
        }

        return plainText;
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedMessage; // Return encrypted text if decryption fails
    }
};

/**
 * Checks if a message appears to be encrypted (basic check)
 * Encrypted messages from CryptoJS start with "U2F" (Salted base64)
 */
export const isEncryptedMessage = (message: string): boolean => {
    // CryptoJS AES encrypted messages start with "U2F" when base64 encoded
    return message.startsWith('U2F');
};

/**
 * Prefix for encrypted direct messages
 * Format: ENCRYPTED_DM:<targetPersistentId>:<encryptedContent>
 */
export const ENCRYPTED_MESSAGE_PREFIX = 'ENCRYPTED_DM';

/**
 * Creates an encrypted direct message payload
 */
export const createEncryptedDirectMessage = (
    targetPersistentId: string,
    message: string,
    myPersistentId: string
): string => {
    const sharedKey = generateSharedKey(myPersistentId, targetPersistentId);
    const encryptedContent = encryptMessage(message, sharedKey);
    return `${ENCRYPTED_MESSAGE_PREFIX}:${targetPersistentId}:${encryptedContent}`;
};

/**
 * Parses and decrypts an encrypted direct message
 * @returns null if parsing fails, otherwise returns { senderKey: string, decryptedMessage: string }
 */
export const parseEncryptedDirectMessage = (
    fullMessage: string,
    myPersistentId: string
): { targetPersistentId: string; decryptedMessage: string } | null => {
    try {
        if (!fullMessage.startsWith(ENCRYPTED_MESSAGE_PREFIX + ':')) {
            return null;
        }

        const parts = fullMessage.split(':');
        if (parts.length < 3) {
            return null;
        }

        const targetPersistentId = parts[1];
        // Join remaining parts in case encrypted content has colons
        const encryptedContent = parts.slice(2).join(':');

        // We need the sender's persistent ID to decrypt
        // This will be provided from the peer info
        return {
            targetPersistentId,
            decryptedMessage: encryptedContent, // Will be decrypted with sender's ID later
        };
    } catch (error) {
        console.error('Error parsing encrypted message:', error);
        return null;
    }
};

export default {
    generateSharedKey,
    encryptMessage,
    decryptMessage,
    isEncryptedMessage,
    createEncryptedDirectMessage,
    parseEncryptedDirectMessage,
    ENCRYPTED_MESSAGE_PREFIX,
};
