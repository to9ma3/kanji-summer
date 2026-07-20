export function StarBadge({ count, label }: { count: number; label?: string }): React.JSX.Element {
  return (
    <span className="star-count">
      <span aria-hidden="true">⭐</span>
      <span>
        {count}
        {label ? <span className="sr-only"> {label}</span> : null}
      </span>
    </span>
  )
}

export default StarBadge
