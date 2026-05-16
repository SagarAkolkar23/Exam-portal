function seededShuffle(array, seed) {
  const arr = [...array];

  let currentIndex = arr.length;

  while (currentIndex !== 0) {
    seed = (seed * 9301 + 49297) % 233280;

    const randomIndex = Math.floor(
      (seed / 233280) * currentIndex
    );

    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
}

function generateOrder(length, seed) {
  const indices = Array.from(
    { length },
    (_, i) => i
  );

  return seededShuffle(indices, seed);
}

module.exports = {
  generateOrder,
};