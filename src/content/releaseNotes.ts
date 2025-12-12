// eslint-disable-next-line @typescript-eslint/no-var-requires
const generated = require('./releaseNotes.generated.json') as Record<string, ReleaseNotes>;

export type ReleaseNotes = {
  version: string;
  title: string;
  description?: string;
  changes?: string[];
};

export function getReleaseNotesForVersion(version: string): ReleaseNotes | null {
  const notes = generated?.[version];
  if (!notes || typeof notes !== 'object') return null;
  if (!notes.version || !notes.title) return null;
  return notes;
}
