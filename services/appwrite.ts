import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

// Handle environment variables safely with fallbacks
// This prevents crashes if import.meta.env is undefined (e.g. running without Vite's env injection)
const env = (import.meta as any).env || {};
const endpoint = env.VITE_APPWRITE_ENDPOINT || "https://appwrite.code045.nl/v1";
const projectId = env.VITE_APPWRITE_PROJECT_ID || "698725fd0027d82d3e46";

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

// Database Constants - Ensure these match your Appwrite setup
export const DB_ID = 'hotel_db';
export const COLLECTIONS = {
    PROPERTIES: 'properties',
    ROOMS: 'rooms',
    ROOM_TYPES: 'room_types',
    GUESTS: 'guests',
    RESERVATIONS: 'reservations',
    FOLIOS: 'folios',
    DAILY_RATES: 'daily_rates'
};