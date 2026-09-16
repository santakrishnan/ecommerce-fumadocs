"use client";

import { Badge, Button, Input } from "@ucmp/ui";
import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  describePasskeyError,
  listPasskeys,
  type PasskeyCredentialSummary,
  renamePasskey,
  revokePasskey,
} from "../passkey";

export interface PasskeyListProps {
  /** RP ID and user handle, needed to signal the authenticator after a revoke. */
  rpID: string;
  userID: string;
  /** Bumps to reload (e.g. after a new registration). */
  version?: number;
}

/**
 * "Your passkeys": the relying party's records for the signed-in user, with
 * the readable name built by the RP (nickname, else authenticator · platform
 * · date). The device itself is never enumerated; this is the server's list.
 */
export function PasskeyList({ rpID, userID, version = 0 }: PasskeyListProps) {
  const [items, setItems] = useState<PasskeyCredentialSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPasskeys()
      .then((list) => active && setItems(list))
      .catch((err) => active && setError(describePasskeyError(err)));
    return () => {
      active = false;
    };
  }, [version]);

  const update = (next: PasskeyCredentialSummary) =>
    setItems((prev) => prev?.map((p) => (p.id === next.id ? next : p)) ?? prev);

  const remove = async (id: string) => {
    try {
      await revokePasskey(id, rpID, userID);
      setItems((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    } catch (err) {
      setError(describePasskeyError(err));
    }
  };

  return (
    <section className="flex w-full flex-col gap-3 text-left" data-slot="passkey-list">
      <h3 className="h3">Your passkeys</h3>
      {error && (
        <p className="body-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {items === null && <p className="body-sm text-muted-foreground">Loading…</p>}
      {items?.length === 0 && (
        <p className="body-sm text-muted-foreground">No passkeys registered.</p>
      )}
      <ul className="flex flex-col gap-2">
        {items?.map((item) => (
          <PasskeyRow
            item={item}
            key={item.id}
            onRemove={() => remove(item.id)}
            onUpdate={update}
          />
        ))}
      </ul>
    </section>
  );
}

function PasskeyRow({
  item,
  onRemove,
  onUpdate,
}: {
  item: PasskeyCredentialSummary;
  onRemove: () => void;
  onUpdate: (next: PasskeyCredentialSummary) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(item.nickname ?? "");

  const save = async () => {
    const next = await renamePasskey(item.id, nickname.trim() || null);
    onUpdate(next);
    setEditing(false);
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <KeyRoundIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {editing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <Input
                aria-label="Passkey nickname"
                autoFocus
                maxLength={60}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Work laptop"
                value={nickname}
              />
              <Button size="sm" type="submit" variant="primary">
                Save
              </Button>
              <Button onClick={() => setEditing(false)} size="sm" type="button" variant="tertiary">
                Cancel
              </Button>
            </form>
          ) : (
            <p className="body-md truncate font-medium">{item.name}</p>
          )}
          <p className="text-muted-foreground text-xs">
            {item.authenticatorName ?? "Authenticator not disclosed"}
            {item.platformLabel ? ` · ${item.platformLabel}` : ""}
            {item.lastUsedAt
              ? ` · last used ${new Date(item.lastUsedAt).toLocaleDateString()}`
              : " · never used"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{item.type === "synced" ? "Synced" : "Device-bound"}</Badge>
            {item.transports.map((t) => (
              <Badge key={t} variant="inverse">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {!editing && (
        <div className="flex gap-2 self-end">
          <Button onClick={() => setEditing(true)} size="sm" type="button" variant="text">
            Rename
          </Button>
          <Button onClick={onRemove} size="sm" type="button" variant="text">
            Revoke
          </Button>
        </div>
      )}
    </li>
  );
}
