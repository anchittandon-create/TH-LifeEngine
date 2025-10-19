export function createId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}_${random}${time}`;
}
