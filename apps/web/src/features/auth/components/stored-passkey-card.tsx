"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucmp/ui";
import type { PasskeyCredentialSummary, PasskeyUser } from "../passkey";

function truncate(value: string, keep = 24): string {
  return value.length > keep ? `${value.slice(0, keep)}…` : value;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-border border-b py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="body-sm text-muted-foreground">{label}</dt>
      <dd className="body-sm break-all font-mono text-foreground sm:text-right">{value}</dd>
    </div>
  );
}

/**
 * "What the server stored": the public key and metadata the relying party
 * keeps for a passkey — and, explicitly, no private key.
 */
export function StoredPasskeyCard({
  credential,
  title,
  user,
}: {
  credential: PasskeyCredentialSummary;
  title: string;
  user: PasskeyUser;
}) {
  return (
    <Card data-slot="stored-passkey-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Signed in as {user.name} ({user.email})
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>
            {credential.type === "synced" ? "Passkey type: Synced" : "Passkey type: Device-bound"}
          </Badge>
          {credential.backedUp && <Badge variant="inverse">Backed up</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <dl>
          <Row label="Credential ID" value={truncate(credential.id)} />
          <Row label="Public key (COSE, base64url)" value={truncate(credential.publicKey, 40)} />
          <Row label="Private key" value="not stored — stays on the authenticator" />
          <Row label="Signature counter" value={String(credential.counter)} />
          <Row label="Transports" value={credential.transports.join(", ") || "—"} />
          <Row label="Authenticator (AAGUID)" value={credential.aaguid} />
          <Row label="Created" value={new Date(credential.createdAt).toLocaleString()} />
          <Row
            label="Last used"
            value={credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleString() : "—"}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
