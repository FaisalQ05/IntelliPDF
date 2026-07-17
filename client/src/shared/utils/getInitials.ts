/**
 * Derives up to 2 uppercase initials from a full name.
 * Falls back to "U" when name is empty or undefined.
 */
export function getInitials(name: string | undefined | null): string {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  )
}
