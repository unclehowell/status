import type { Avenue, AvenueKind, EmailHit, Status, Track } from "./types";

export type Overlay = {
  status?: Status;
  emails?: EmailHit[];
  reference?: string;
  note?: string;
  deadline?: string;
  contact?: string;
};

const LIVE: Record<string, number> = {
  sent: 1,
  replied: 2,
  awaiting: 3,
  review: 4,
  complaint: 5,
};

function advanced(statuses: Status[]): Status {
  if (!statuses.length) return "open";
  const live = statuses.filter((s) => LIVE[s] != null);
  if (live.length) {
    return live.reduce((a, b) => ((LIVE[b] ?? 0) >= (LIVE[a] ?? 0) ? b : a));
  }
  if (statuses.includes("open")) return "open";
  if (statuses.includes("bounce") && !statuses.includes("exhausted")) return "bounce";
  if (statuses.includes("bounce")) return "bounce";
  return "exhausted";
}

function inferStatus(emails: EmailHit[]): Status {
  if (!emails.length) return "open";
  const last = emails[emails.length - 1];
  const hasOut = emails.some((e) => e.direction === "out");
  const hasIn = emails.some((e) => e.direction === "in");
  const blob = emails
    .map((e) => `${e.subject} ${e.preview}`)
    .join(" ")
    .toLowerCase();
  if (blob.includes("address not found") || blob.includes("wasn't delivered")) {
    return "bounce";
  }
  if (
    blob.includes("internal review") ||
    blob.includes("review of") ||
    (blob.includes("atisn") && blob.includes("review"))
  ) {
    return "review";
  }
  if (
    blob.includes("information commissioner") ||
    blob.includes("ombudsman") ||
    blob.includes("iopc")
  ) {
    return "complaint";
  }
  if (hasOut && !hasIn) return "sent";
  if (hasIn && last.direction === "out") return "awaiting";
  if (hasIn) return "replied";
  return "sent";
}

function gather(
  overlays: Record<string, Overlay>,
  ids: string[],
): Overlay {
  const emails: EmailHit[] = [];
  const statuses: Status[] = [];
  let reference: string | undefined;
  let note: string | undefined;
  let deadline: string | undefined;
  let contact: string | undefined;
  for (const id of ids) {
    const ov = overlays[id];
    if (!ov) continue;
    if (ov.emails?.length) emails.push(...ov.emails);
    if (ov.status) statuses.push(ov.status);
    if (ov.reference) reference = ov.reference;
    if (ov.note) note = ov.note;
    if (ov.deadline) deadline = ov.deadline;
    if (ov.contact) contact = ov.contact;
  }
  emails.sort((a, b) => a.date.localeCompare(b.date));
  let status: Status | undefined;
  if (statuses.length) status = advanced(statuses);
  else if (emails.length) status = inferStatus(emails);
  return { emails, status, reference, note, deadline, contact };
}

function node(
  id: string,
  label: string,
  kind: AvenueKind,
  description: string,
  how: string,
  overlay: Overlay,
  extra?: Partial<Avenue>,
): Avenue {
  const emails = overlay.emails ?? extra?.emails ?? [];
  const status = overlay.status ?? extra?.status ?? inferStatus(emails);
  return {
    id,
    label,
    kind,
    description,
    how,
    policyUrl: extra?.policyUrl,
    contact: overlay.contact ?? extra?.contact,
    emails,
    status,
    deadline: overlay.deadline ?? extra?.deadline,
    reference: overlay.reference ?? extra?.reference,
    note: overlay.note ?? extra?.note,
    children: extra?.children,
  };
}

function withChildren(
  id: string,
  label: string,
  kind: AvenueKind,
  description: string,
  how: string,
  children: Avenue[],
  overlay: Overlay,
  extra?: Partial<Avenue>,
): Avenue {
  const emails = [...(overlay.emails ?? [])];
  for (const c of children) emails.push(...(c.emails ?? []));
  emails.sort((a, b) => a.date.localeCompare(b.date));
  const own = overlay.status ?? (emails.length ? inferStatus(emails) : "open");
  const status = advanced([own, ...children.map((c) => c.status)]);
  return {
    id,
    label,
    kind,
    description,
    how,
    policyUrl: extra?.policyUrl,
    contact: overlay.contact ?? extra?.contact,
    emails,
    status,
    deadline: overlay.deadline,
    reference: overlay.reference ?? extra?.reference,
    note: overlay.note ?? extra?.note,
    children,
  };
}

const EXTRA_ENQUIRY_KEYS = [
  "enquiry.informal",
  "enquiry.retention",
  "enquiry.catalogue",
  "enquiry",
  "complaint.s1",
  "complaint.s2",
  "complaint.ombudsman",
  "complaint.jr",
  "title.official",
  "title.historical",
  "title.enquiry",
  "title.complaint",
  "title.icr",
  "title.indemnity",
  "police.psd",
  "police.iopc",
  "police.cps",
  "health.form",
  "health.caldicott",
  "coroner.interested",
  "coroner.archive",
  "political.constituency",
  "political.committee",
  "political.petition",
  "preaction.preserve",
  "preaction.lbc",
  "preaction.corporate",
  "media.newsroom",
  "media.library",
  "media.ipso",
  "utility.gss",
  "utility.ccwater",
  "regulator-own.ready",
];

export function buildAvenues(
  _track: Track,
  overlays: Record<string, Overlay>,
  o: {
    foiPolicy?: string;
    sarPolicy?: string;
    complaintPolicy?: string;
    ombudsman?: string;
    ombudsmanUrl?: string;
    foiContact?: string;
    sarContact?: string;
    complaintContact?: string;
  } = {},
): Avenue[] {
  const foiBody = gather(overlays, [
    "foi.identify",
    "foi.submit",
    "foi.ack",
    "foi.clarify",
    "foi.response",
    "foi",
  ]);
  const foiReview = gather(overlays, ["foi.review", "foi.ico", "foi.tribunal"]);
  const sarBody = gather(overlays, ["sar.submit", "sar.id", "sar.response", "sar"]);
  const sarReview = gather(overlays, ["sar.review", "sar.ico"]);
  const gdprBody = gather(overlays, ["gdpr.submit", "gdpr", "gdpr.response"]);
  const gdprReview = gather(overlays, ["gdpr.review", "gdpr.ico", "sar.ico"]);
  const enquiryBody = gather(overlays, EXTRA_ENQUIRY_KEYS);

  const foiReviewNode = node(
    "foi.review",
    "internal review",
    "foi",
    "Ask the authority to review its FOI / EIR handling, search, and any exemption. Next: ICO, then the tribunal.",
    "Write 'I request an internal review' and list the defects. Typical window 20–40 working days. If the review is late or still withholds, complain to the ICO.",
    foiReview,
    { policyUrl: o.foiPolicy, contact: o.foiContact },
  );
  const gdprReviewNode = node(
    "gdpr.review",
    "internal review",
    "sar",
    "Challenge a GDPR / DPA response with the DPO, then the ICO data-protection complaint.",
    "Write to the DPO listing withheld classes. If still incomplete, ico.org.uk data-protection complaint (separate from an FOI complaint).",
    gdprReview.status || gdprReview.emails?.length
      ? gdprReview
      : { ...gdprReview, status: "open" },
    { policyUrl: o.sarPolicy, contact: o.sarContact },
  );
  const sarReviewNode = node(
    "sar.review",
    "internal review",
    "sar",
    "Challenge a subject-access response with the DPO before the ICO.",
    "List each withheld class and why the exemption is not engaged. Then ICO data-protection complaint.",
    sarReview,
    { policyUrl: o.sarPolicy, contact: o.sarContact },
  );

  const foi = withChildren(
    "foi",
    "foi",
    "foi",
    "Freedom of Information / Environmental Information. Colour is the live FOI email status.",
    "Submit a record-lifecycle request. Diary the 20 working-day clock. Then expand for internal review.",
    [foiReviewNode],
    foiBody,
    { policyUrl: o.foiPolicy, contact: o.foiContact },
  );
  const gdpr = withChildren(
    "gdpr",
    "gdpr",
    "sar",
    "UK GDPR / DPA 2018 — how they process personal data of named Williams/Buckler family members.",
    "A data-protection complaint is distinct from a SAR. Expand for the internal review / ICO step.",
    [gdprReviewNode],
    gdprBody.emails?.length || gdprBody.status
      ? gdprBody
      : { ...gdprBody, status: "open" },
    { policyUrl: o.sarPolicy, contact: o.sarContact },
  );
  const sar = withChildren(
    "sar",
    "sar",
    "sar",
    "Subject access (UK GDPR Art. 15) for named living family members. Not a route to a deceased relative's file.",
    "Write to the DPO. One month. Expand for internal review.",
    [sarReviewNode],
    sarBody,
    { policyUrl: o.sarPolicy, contact: o.sarContact },
  );

  const enquiry = withChildren(
    "enquiry",
    "enquiry",
    "enquiry",
    "Top-level enquiry with this party. Expand for foi, gdpr and sar. Colour follows the live correspondence.",
    "Open foi, gdpr or sar. Each expands to its internal review. Policy links and emails sit in the panel.",
    [foi, gdpr, sar],
    enquiryBody,
    { contact: o.foiContact ?? o.sarContact ?? o.complaintContact },
  );

  return [enquiry];
}
