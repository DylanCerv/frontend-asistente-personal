export function extractPreferredNameRequest(message: string): string | null {
  const text = message.trim();
  if (!text) return null;

  const patterns = [
    /(?:quiero|necesito|prefiero)\s+que\s+(?:tú\s+|tu\s+)?(?:me\s+)?llames?\s+(?:así\s*[:,-]?\s*)?["']?([^"'.,!?\n]+)["']?/i,
    /ll[aá]mame\s+(?:así\s*[:,-]?\s*)?["']?([^"'.,!?\n]+)["']?/i,
    /(?:puedes|podrías)\s+llamarme\s+(?:así\s*[:,-]?\s*)?["']?([^"'.,!?\n]+)["']?/i,
    /mi\s+nombre\s+(?:para\s+ti\s+)?(?:es|sea)\s+["']?([^"'.,!?\n]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1]?.trim();
    if (name && name.length >= 1 && name.length <= 40) {
      return name.replace(/\s+/g, ' ');
    }
  }

  return null;
}
