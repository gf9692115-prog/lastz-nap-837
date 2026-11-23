/**
 * OCR-safe player comparison for bounty rows.
 *
 * The database still enforces the exact unique key. This helper only adds a
 * narrow application-level guard for the same alliance + minute when the
 * pixel-font OCR produced a near-identical spelling of the same nickname.
 */
export function normalizeComparablePlayer(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\[[^\]]*\]/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    for (let index = 0; index < current.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

export function isLikelySamePlayer(left: string, right: string): boolean {
  const a = normalizeComparablePlayer(left);
  const b = normalizeComparablePlayer(right);
  if (!a || !b) return false;
  if (a === b) return true;

  const maxLength = Math.max(a.length, b.length);
  if (maxLength < 8) return false;

  const allowedDistance = Math.min(
    3,
    Math.max(1, Math.round(maxLength * 0.25)),
  );
  return editDistance(a, b) <= allowedDistance;
}
