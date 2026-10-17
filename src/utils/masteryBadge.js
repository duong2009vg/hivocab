// Huy hiệu được tính từ số từ đã đạt SRS level 4 hoặc 5.
export function getMasteryBadge(masteredCount = 0) {
  const count = Math.max(0, Number(masteredCount) || 0);

  if (count >= 1000) {
    return { name: 'Siêu bá khí', emoji: '👑' };
  }
  if (count >= 500) {
    return { name: 'Bá khí', emoji: '🔥' };
  }
  if (count >= 100) {
    return { name: 'Hơi bá khí', emoji: '⚡' };
  }
  return { name: 'Newbie', emoji: '🌱' };
}

export default getMasteryBadge;
