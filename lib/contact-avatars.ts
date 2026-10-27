/** Stable sample art for missing contact photos; never saved as identity data. */
export function sampleContactAvatar(contactKey: string): string {
  let hash = 0;
  for (const character of contactKey)
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  const index = (hash % 16) + 1;
  return `/contact-avatars/avatar-${String(index).padStart(2, "0")}.svg`;
}
