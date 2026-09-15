/**
 * Cute Cat Avatars & Tag Constants
 * High-quality SVG illustrations embedded as clean Data URIs
 */

export interface CatAvatarPreset {
  id: string
  name: string
  url: string
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const CAT_AVATARS: CatAvatarPreset[] = [
  {
    id: 'ginger',
    name: 'Ginger Mochi',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFF3E0" />
        <!-- Ears -->
        <polygon points="22,42 16,16 42,26" fill="#FFA726" />
        <polygon points="25,38 20,20 38,28" fill="#FFCCBC" />
        <polygon points="78,42 84,16 58,26" fill="#FFA726" />
        <polygon points="75,38 80,20 62,28" fill="#FFCCBC" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#FFA726" />
        <!-- Cheeks / Muzzle -->
        <ellipse cx="43" cy="62" rx="10" ry="8" fill="#FFF8E1" />
        <ellipse cx="57" cy="62" rx="10" ry="8" fill="#FFF8E1" />
        <!-- Tabby stripes -->
        <path d="M46,30 Q50,38 54,30" stroke="#FB8C00" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M48,24 Q50,30 52,24" stroke="#FB8C00" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <!-- Eyes (Happy Curvy) -->
        <path d="M33,49 Q38,43 43,49" stroke="#3E2723" stroke-width="3.5" fill="none" stroke-linecap="round" />
        <path d="M57,49 Q62,43 67,49" stroke="#3E2723" stroke-width="3.5" fill="none" stroke-linecap="round" />
        <!-- Nose & Mouth -->
        <polygon points="48,59 52,59 50,62" fill="#FF8A80" />
        <path d="M46,63 Q50,67 50,64 Q50,67 54,63" stroke="#3E2723" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="28" cy="58" r="5" fill="#FF8A80" opacity="0.55" />
        <circle cx="72" cy="58" r="5" fill="#FF8A80" opacity="0.55" />
        <!-- Whiskers -->
        <line x1="20" y1="58" x2="34" y2="60" stroke="#FB8C00" stroke-width="1.8" stroke-linecap="round" />
        <line x1="18" y1="64" x2="33" y2="64" stroke="#FB8C00" stroke-width="1.8" stroke-linecap="round" />
        <line x1="80" y1="58" x2="66" y2="60" stroke="#FB8C00" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="64" x2="67" y2="64" stroke="#FB8C00" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'tuxedo',
    name: 'Tuxedo Boba',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ECEFF1" />
        <!-- Ears -->
        <polygon points="22,42 15,16 42,26" fill="#263238" />
        <polygon points="25,38 20,22 37,28" fill="#FFCCBC" />
        <polygon points="78,42 85,16 58,26" fill="#263238" />
        <polygon points="75,38 80,22 63,28" fill="#FFCCBC" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#263238" />
        <!-- White Blaze & Chest -->
        <polygon points="50,42 42,75 58,75" fill="#FFFFFF" />
        <ellipse cx="43" cy="63" rx="11" ry="9" fill="#FFFFFF" />
        <ellipse cx="57" cy="63" rx="11" ry="9" fill="#FFFFFF" />
        <!-- Big Cute Emerald Eyes -->
        <ellipse cx="36" cy="48" rx="6" ry="7" fill="#66BB6A" />
        <ellipse cx="64" cy="48" rx="6" ry="7" fill="#66BB6A" />
        <ellipse cx="37" cy="48" rx="3" ry="5.5" fill="#1B5E20" />
        <ellipse cx="63" cy="48" rx="3" ry="5.5" fill="#1B5E20" />
        <circle cx="34" cy="45" r="2" fill="#FFFFFF" />
        <circle cx="62" cy="45" r="2" fill="#FFFFFF" />
        <!-- Nose & Mouth -->
        <polygon points="48,60 52,60 50,63" fill="#FF8A80" />
        <path d="M46,64 Q50,68 50,65 Q50,68 54,64" stroke="#263238" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="28" cy="59" r="4" fill="#FF8A80" opacity="0.4" />
        <circle cx="72" cy="59" r="4" fill="#FF8A80" opacity="0.4" />
        <!-- Whiskers -->
        <line x1="18" y1="60" x2="33" y2="61" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
        <line x1="17" y1="66" x2="32" y2="65" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="60" x2="67" y2="61" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
        <line x1="83" y1="66" x2="68" y2="65" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'calico',
    name: 'Calico Luna',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFF8E1" />
        <!-- Ears -->
        <polygon points="22,42 16,16 42,26" fill="#FB8C00" />
        <polygon points="25,38 20,22 37,28" fill="#FFCCBC" />
        <polygon points="78,42 84,16 58,26" fill="#455A64" />
        <polygon points="75,38 80,22 63,28" fill="#FFCCBC" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#FFFFFF" />
        <!-- Patches -->
        <path d="M20,40 Q35,28 42,48 Q30,60 16,52 Z" fill="#FB8C00" opacity="0.9" />
        <path d="M80,38 Q65,30 60,46 Q70,62 84,50 Z" fill="#455A64" opacity="0.85" />
        <!-- Star / Anime Eyes -->
        <circle cx="36" cy="49" r="6" fill="#37474F" />
        <circle cx="64" cy="49" r="6" fill="#37474F" />
        <circle cx="34" cy="47" r="2.2" fill="#FFFFFF" />
        <circle cx="62" cy="47" r="2.2" fill="#FFFFFF" />
        <circle cx="37" cy="52" r="1" fill="#FFFFFF" />
        <circle cx="65" cy="52" r="1" fill="#FFFFFF" />
        <!-- Nose & Mouth -->
        <polygon points="48,60 52,60 50,63" fill="#FF8A80" />
        <path d="M46,64 Q50,68 50,65 Q50,68 54,64" stroke="#37474F" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="27" cy="58" r="5" fill="#FF8A80" opacity="0.6" />
        <circle cx="73" cy="58" r="5" fill="#FF8A80" opacity="0.6" />
        <!-- Whiskers -->
        <line x1="18" y1="60" x2="31" y2="61" stroke="#90A4AE" stroke-width="1.8" stroke-linecap="round" />
        <line x1="17" y1="66" x2="30" y2="65" stroke="#90A4AE" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="60" x2="69" y2="61" stroke="#90A4AE" stroke-width="1.8" stroke-linecap="round" />
        <line x1="83" y1="66" x2="70" y2="65" stroke="#90A4AE" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'grey',
    name: 'Smokey Whiskers',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#EDE7F6" />
        <!-- Ears -->
        <polygon points="22,42 16,16 42,26" fill="#78909C" />
        <polygon points="25,38 20,22 37,28" fill="#F8BBD0" />
        <polygon points="78,42 84,16 58,26" fill="#78909C" />
        <polygon points="75,38 80,22 63,28" fill="#F8BBD0" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#90A4AE" />
        <!-- Cheeks -->
        <ellipse cx="43" cy="62" rx="10" ry="8" fill="#CFD8DC" />
        <ellipse cx="57" cy="62" rx="10" ry="8" fill="#CFD8DC" />
        <!-- Forehead Stripes -->
        <path d="M46,28 Q50,35 54,28" stroke="#607D8B" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <!-- Big Amber Eyes -->
        <ellipse cx="36" cy="48" rx="6" ry="7" fill="#FFB300" />
        <ellipse cx="64" cy="48" rx="6" ry="7" fill="#FFB300" />
        <ellipse cx="37" cy="48" rx="2.8" ry="5.5" fill="#37474F" />
        <ellipse cx="63" cy="48" rx="2.8" ry="5.5" fill="#37474F" />
        <circle cx="34" cy="45" r="2" fill="#FFFFFF" />
        <circle cx="62" cy="45" r="2" fill="#FFFFFF" />
        <!-- Nose & Mouth -->
        <polygon points="48,59 52,59 50,62" fill="#F48FB1" />
        <path d="M46,63 Q50,67 50,64 Q50,67 54,63" stroke="#37474F" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="28" cy="58" r="5" fill="#F48FB1" opacity="0.6" />
        <circle cx="72" cy="58" r="5" fill="#F48FB1" opacity="0.6" />
        <!-- Whiskers -->
        <line x1="18" y1="59" x2="33" y2="60" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="17" y1="65" x2="32" y2="64" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="59" x2="67" y2="60" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="83" y1="65" x2="68" y2="64" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'cloud',
    name: 'Fluffy Marshmallow',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#E0F7FA" />
        <!-- Ears -->
        <polygon points="22,42 16,16 42,26" fill="#FFFFFF" />
        <polygon points="25,38 20,22 37,28" fill="#FFCDD2" />
        <polygon points="78,42 84,16 58,26" fill="#FFFFFF" />
        <polygon points="75,38 80,22 63,28" fill="#FFCDD2" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" />
        <!-- Big Sky Blue Eyes -->
        <ellipse cx="36" cy="48" rx="6" ry="7" fill="#4FC3F7" />
        <ellipse cx="64" cy="48" rx="6" ry="7" fill="#4FC3F7" />
        <ellipse cx="37" cy="48" rx="3" ry="5.5" fill="#0277BD" />
        <ellipse cx="63" cy="48" rx="3" ry="5.5" fill="#0277BD" />
        <circle cx="34" cy="45" r="2.2" fill="#FFFFFF" />
        <circle cx="62" cy="45" r="2.2" fill="#FFFFFF" />
        <!-- Nose & Mouth -->
        <polygon points="48,59 52,59 50,62" fill="#FF80AB" />
        <path d="M46,63 Q50,67 50,64 Q50,67 54,63" stroke="#424242" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="28" cy="58" r="5.5" fill="#FF80AB" opacity="0.5" />
        <circle cx="72" cy="58" r="5.5" fill="#FF80AB" opacity="0.5" />
        <!-- Whiskers -->
        <line x1="18" y1="59" x2="33" y2="60" stroke="#B0BEC5" stroke-width="1.8" stroke-linecap="round" />
        <line x1="17" y1="65" x2="32" y2="64" stroke="#B0BEC5" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="59" x2="67" y2="60" stroke="#B0BEC5" stroke-width="1.8" stroke-linecap="round" />
        <line x1="83" y1="65" x2="68" y2="64" stroke="#B0BEC5" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'midnight',
    name: 'Midnight Spark',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#212121" />
        <!-- Ears -->
        <polygon points="22,42 16,16 42,26" fill="#37474F" />
        <polygon points="25,38 20,22 37,28" fill="#78909C" />
        <polygon points="78,42 84,16 58,26" fill="#37474F" />
        <polygon points="75,38 80,22 63,28" fill="#78909C" />
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#263238" />
        <!-- Glowing Gold Eyes -->
        <ellipse cx="36" cy="48" rx="6.5" ry="7.5" fill="#FFD54F" />
        <ellipse cx="64" cy="48" rx="6.5" ry="7.5" fill="#FFD54F" />
        <ellipse cx="37" cy="48" rx="2.5" ry="6" fill="#212121" />
        <ellipse cx="63" cy="48" rx="2.5" ry="6" fill="#212121" />
        <circle cx="34" cy="44" r="2.2" fill="#FFFFFF" />
        <circle cx="62" cy="44" r="2.2" fill="#FFFFFF" />
        <!-- Nose & Mouth -->
        <polygon points="48,59 52,59 50,62" fill="#FF8A80" />
        <path d="M46,63 Q50,67 50,64 Q50,67 54,63" stroke="#ECEFF1" stroke-width="2" fill="none" stroke-linecap="round" />
        <!-- Blush -->
        <circle cx="28" cy="58" r="4" fill="#FF8A80" opacity="0.4" />
        <circle cx="72" cy="58" r="4" fill="#FF8A80" opacity="0.4" />
        <!-- Whiskers -->
        <line x1="18" y1="59" x2="33" y2="60" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="17" y1="65" x2="32" y2="64" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="82" y1="59" x2="67" y2="60" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
        <line x1="83" y1="65" x2="68" y2="64" stroke="#ECEFF1" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `),
  },
]

/**
 * Returns a cute cat avatar for any user.
 * If user has a custom image, returns that.
 * Otherwise deterministically returns one of the 6 cute cats!
 */
export function getCatAvatar(nameOrSeed?: string | null, customUrlOrId?: string | null): string {
  if (customUrlOrId && customUrlOrId.trim() !== '') {
    const val = customUrlOrId.trim()
    const foundPreset = CAT_AVATARS.find((c) => c.id === val || c.url === val)
    if (foundPreset) return foundPreset.url
    if (val.startsWith('data:') || val.startsWith('http')) {
      return val
    }
  }
  const str = (nameOrSeed || 'User').trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % CAT_AVATARS.length
  return CAT_AVATARS[index].url
}

/**
 * Predefined tags requested:
 * study, career, body, personal, partner, plus other
 */
export const PREDEFINED_TAGS = [
  { id: 'study', label: 'Study', emoji: '📚', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'career', label: 'Career', emoji: '💼', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'body', label: 'Body', emoji: '🏋️', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'personal', label: 'Personal', emoji: '🧘', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'partner', label: 'Partner', emoji: '👥', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
] as const

export function getTagInfo(tag?: string | null) {
  if (!tag) return null
  const normalized = tag.trim().toLowerCase()
  const found = PREDEFINED_TAGS.find((t) => t.id === normalized || t.label.toLowerCase() === normalized)
  if (found) return found
  return {
    id: normalized,
    label: tag,
    emoji: '🏷️',
    color: '#0070f3',
    bg: 'rgba(0, 112, 243, 0.12)',
  }
}
