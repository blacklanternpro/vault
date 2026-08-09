interface AsciiRuleProps {
  /** The glyph tiled to build the rule, e.g. "/" or "*". */
  char?: string;
  className?: string;
}

/**
 * A divider made of literal repeated characters instead of a <hr> / border.
 * The string is over-tiled and clipped with `overflow-hidden` so it always
 * fills the full width of its container, at any viewport size, without ever
 * wrapping to a second line.
 */
export function AsciiRule({ char = '/', className = '' }: AsciiRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={`ascii-rule font-mono leading-none ${className}`}
    >
      {char.repeat(600)}
    </div>
  );
}
