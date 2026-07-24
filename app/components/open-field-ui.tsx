import type { ReactNode } from "react";

export function FieldSectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <header>
      <span className="of-eyebrow">{eyebrow}</span>
      <h2 className="of-title">{title}</h2>
      {body ? <p className="of-body">{body}</p> : null}
    </header>
  );
}

export function FieldDisclosure({
  title,
  description,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      className="of-disclosure"
      open={open}
      onToggle={(event) => onToggle?.(event.currentTarget.open)}
    >
      <summary>
        <span className="of-disclosure-copy">
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
      </summary>
      <div className="of-disclosure-body">{children}</div>
    </details>
  );
}

export function FieldSourceLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      className={`of-action${primary ? " primary" : ""}`}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
