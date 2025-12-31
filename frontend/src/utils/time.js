export function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + Number(minutes)
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`
}

export function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
