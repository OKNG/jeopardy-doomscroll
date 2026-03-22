export async function fetchRandomClues(limit = 1) {
  const res = await fetch(`/api/clue?random=true&limit=${limit}`)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export async function fetchCategory(categoryId) {
  const res = await fetch(`/api/category?id=${categoryId}`)
  if (!res.ok) throw new Error(`${res.status}`)
  const [cat] = await res.json()
  return cat
}
