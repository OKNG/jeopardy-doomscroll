const WRITTEN_NUMBERS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15',
  sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20',
}

const DIGIT_TO_WORD = Object.fromEntries(
  Object.entries(WRITTEN_NUMBERS).map(([word, digit]) => [digit, word])
)

function normalize(str) {
  let s = str.toLowerCase()
  // Strip HTML tags
  s = s.replace(/<[^>]+>/g, '')
  // Strip punctuation except hyphens/apostrophes within words
  s = s.replace(/(?<!\w)['-]|['-](?!\w)/g, '')
  s = s.replace(/[^\w\s'-]/g, '')
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()
  // Strip leading articles
  s = s.replace(/^(a|an|the)\s+/i, '')
  // Number normalization: words → digits
  s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/g,
    (m) => WRITTEN_NUMBERS[m])
  // Number normalization: digits → words (for matching the other direction)
  // We store both forms and match against both
  return s
}

function normalizeWithDigitVariant(str) {
  const base = normalize(str)
  // Create a variant where digits are replaced with words
  const digitVariant = base.replace(/\b(\d+)\b/g, (m) => DIGIT_TO_WORD[m] || m)
  const variants = [base]
  if (digitVariant !== base) variants.push(digitVariant)
  return variants
}

function extractAlternates(answer) {
  const normalized = normalize(answer)
  const alts = [normalized]

  // Parenthetical: "Smith (or Jones)" → also "Jones"
  const parenMatch = answer.match(/\((?:or\s+)?(.+?)\)/i)
  if (parenMatch) {
    alts.push(normalize(parenMatch[1]))
    // Also add the answer without the parenthetical
    alts.push(normalize(answer.replace(/\s*\(.*?\)\s*/g, ' ')))
  }

  // Slash: "DNA/RNA" → "DNA", "RNA"
  if (normalized.includes('/')) {
    for (const part of normalized.split('/')) {
      const trimmed = part.trim()
      if (trimmed) alts.push(trimmed)
    }
  }

  // "or" clause: "Smith or Jones" → both parts (only if no parenthetical matched)
  if (!parenMatch && /\bor\b/i.test(normalized)) {
    for (const part of normalized.split(/\bor\b/i)) {
      const trimmed = part.trim()
      if (trimmed) alts.push(trimmed)
    }
  }

  return [...new Set(alts)]
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      )
    }
    prev = curr
  }
  return prev[n]
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

function matchPair(spoken, correct) {
  // Exact
  if (spoken === correct) return { match: true, confidence: 'exact' }

  // Containment
  if (spoken.length >= 3) {
    if (correct.includes(spoken) || spoken.includes(correct)) {
      return { match: true, confidence: 'containment' }
    }
  }

  // Fuzzy
  const refLen = correct.length
  if (refLen <= 4) return { match: false, confidence: 'none' }
  const threshold = refLen <= 10 ? 0.75 : 0.65
  if (similarity(spoken, correct) >= threshold) {
    return { match: true, confidence: 'fuzzy' }
  }

  return { match: false, confidence: 'none' }
}

export function checkAnswer(spoken, correct) {
  const spokenVariants = normalizeWithDigitVariant(spoken)
  const correctAlts = extractAlternates(correct)

  for (const sv of spokenVariants) {
    for (const ca of correctAlts) {
      // Also try digit variants of the correct answer
      const caVariants = normalizeWithDigitVariant(ca)
      // caVariants[0] is already normalized via extractAlternates, but
      // normalizeWithDigitVariant re-normalizes which is fine (idempotent)
      for (const cv of [ca, ...caVariants]) {
        const result = matchPair(sv, cv)
        if (result.match) return result
      }
    }
  }

  return { match: false, confidence: 'none' }
}
