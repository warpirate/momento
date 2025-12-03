// Centralized UUID utility - generates consistent UUIDs
let userUUID: string | null = null;

export function generateUUID(userId?: string): string {
  // If we have a user ID, generate a deterministic UUID for them
  if (userId) {
    // Simple hash function to create consistent UUID from user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex and format as UUID
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}-0000-4000-8000-${hex.padEnd(12, '0').substring(0, 12)}`;
  }
  
  // Fallback for non-user contexts - generate proper v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get or create the UUID for the current user
export function getUserUUID(userId: string): string {
  if (!userUUID) {
    userUUID = generateUUID(userId);
  }
  return userUUID;
}

// Reset user UUID (useful for logout)
export function resetUserUUID(): void {
  userUUID = null;
}

// UUID validation regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

// Generate a proper v4 UUID for entries (non-deterministic)
export function generateEntryUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
