export async function fetchRandomClue() {
  const res = await fetch('/api/clue?random=true&limit=1')
  if (!res.ok) throw new Error(`${res.status}`)
  const [clue] = await res.json()
  return clue
}

export async function fetchCategory(categoryId) {
  const res = await fetch(`/api/category?id=${categoryId}`)
  if (!res.ok) throw new Error(`${res.status}`)
  const [cat] = await res.json()
  return cat
}
