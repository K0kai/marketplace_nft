import { Link } from '@tanstack/react-router'

type Crumb = { label: string; to?: '/' | '/cart' }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Você está em" className="py-5">
      <ol className="flex flex-wrap gap-2 text-xs font-bold">
        {items.map((item, index) => (
          <li key={item.label} className="flex gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-highlight">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
