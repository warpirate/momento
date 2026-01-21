import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';

// Proper v4 UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default class Entry extends Model {
  static table = 'entries';
  static associations = {} as const;

  @field('content') content!: string;
  @field('user_id') userId!: string;
  @field('sleep_rating') sleepRating?: number;
  @field('energy_rating') energyRating?: number;
  @field('mood_rating') moodRating?: string;
  @field('images') images?: string; // JSON stringified array of paths
  @field('voice_note') voiceNote?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Use proper v4 UUID generation
  static async generateId() {
    return generateUUID();
  }
}