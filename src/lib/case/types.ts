export type Status =
  | "open"
  | "sent"
  | "awaiting"
  | "replied"
  | "review"
  | "complaint"
  | "exhausted"
  | "bounce";

export type AvenueKind =
  | "foi"
  | "eir"
  | "sar"
  | "enquiry"
  | "complaint"
  | "regulator"
  | "political"
  | "archive"
  | "letter"
  | "criminal"
  | "planning";

export type Sector =
  | "heritage"
  | "land"
  | "justice"
  | "health"
  | "elected"
  | "regulator"
  | "media"
  | "utility"
  | "private"
  | "archive";

export type Track =
  | "welsh-public"
  | "uk-public"
  | "police"
  | "nhs"
  | "land-registry"
  | "private"
  | "elected"
  | "media"
  | "utility"
  | "regulator"
  | "archive"
  | "coroner"
  | "developer"
  | "political-committee";

export type EmailHit = {
  date: string;
  subject: string;
  from: string;
  to: string;
  direction: "out" | "in";
  preview: string;
  reference?: string;
};

export type PolicyLink = {
  label: string;
  url: string;
};

export type Avenue = {
  id: string;
  label: string;
  kind: AvenueKind;
  description: string;
  how: string;
  policyUrl?: string;
  contact?: string;
  children?: Avenue[];
  emails?: EmailHit[];
  status: Status;
  deadline?: string;
  reference?: string;
  note?: string;
};

export type Party = {
  id: string;
  name: string;
  shortName: string;
  sector: Sector;
  track: Track;
  role: string;
  holds: string;
  emails: string[];
  policies: PolicyLink[];
  wdtk?: string;
  notes: string;
  avenues: Avenue[];
};

export type TreeNode = {
  id: string;
  path: string;
  label: string;
  kind?: AvenueKind;
  status: Status;
  emails: EmailHit[];
  description?: string;
  how?: string;
  policyUrl?: string;
  contact?: string;
  reference?: string;
  note?: string;
  deadline?: string;
  remaining: number;
  depleted: number;
  children: TreeNode[];
  partyId?: string;
  sector?: Sector;
};

export const STATUS_ORDER: Status[] = [
  "open",
  "sent",
  "awaiting",
  "replied",
  "review",
  "complaint",
  "bounce",
  "exhausted",
];

export const STATUS_LABEL: Record<Status, string> = {
  open: "REMAINING",
  sent: "SENT",
  awaiting: "AWAITING",
  replied: "REPLIED",
  review: "REVIEW",
  complaint: "COMPLAINT",
  exhausted: "DEPLETED",
  bounce: "BOUNCE",
};

export function isDepleted(s: Status): boolean {
  return s === "exhausted" || s === "bounce";
}

export function isInFlight(s: Status): boolean {
  return (
    s === "sent" ||
    s === "awaiting" ||
    s === "replied" ||
    s === "review" ||
    s === "complaint"
  );
}
