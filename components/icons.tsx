/**
 * Tiny hand-written SVG icons so we don't need an icon library.
 * Each one takes the same props as an <svg> element.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Base>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M21 10.5h-4a2.25 2.25 0 0 0 0 4.5h4z" />
    </Base>
  );
}

export function TransactionsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h13l-3-3" />
      <path d="M20 16H7l3 3" />
    </Base>
  );
}

export function BudgetIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v9l6.5 4.5" />
      <circle cx="12" cy="12" r="9" />
    </Base>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7h-5v5" />
    </Base>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M21 17h-5v-5" />
    </Base>
  );
}

export function PiggyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 5 0c0 2.5-5 2-5 5a2.5 2.5 0 0 0 5 0" />
    </Base>
  );
}

export function BankIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9M10 10v9M14 10v9M19 10v9" />
      <path d="M3 20h18" />
    </Base>
  );
}

export function CashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 6h18M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Base>
  );
}

/** The three dots that open a row's actions menu. */
export function MoreIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </Base>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 5l7 7-7 7" />
    </Base>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Base>
  );
}
