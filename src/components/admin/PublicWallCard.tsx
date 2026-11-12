"use client";

import { ExternalLink, Link2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Button, buttonClass, Card, CardTitle } from "@/components/ui";
import { api } from "@/lib/client/api";
import { CopyField } from "./CopyField";

/** Turns the public wall link on, shows it, replaces or revokes it (as for the booth). */
export function PublicWallCard({ eventId, initialToken }: { eventId: string; initialToken: string | null }) {
  const t = useT();
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [origin, setOrigin] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the page's own origin is only known in the browser
  useEffect(() => setOrigin(window.location.origin), []);

  async function renew() {
    if (token && !confirming) return setConfirming(true);
    setConfirming(false);
    setBusy(true);
    const res = await api<{ wallToken: string }>(`/api/admin/events/${eventId}/wall-link`, { method: "POST" }).catch(() => null);
    if (res) setToken(res.wallToken);
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    await api(`/api/admin/events/${eventId}/wall-link`, { method: "DELETE" }).catch(() => {});
    setToken(null);
    setBusy(false);
  }

  const link = token ? `${origin}/w/${token}` : null;

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <CardTitle>{t("admin.publicWall.title")}</CardTitle>
        <p className="text-sm text-ink-muted">{t("admin.publicWall.hint")}</p>
      </div>
      {link ? (
        <>
          <CopyField value={link} />
          <div className="flex flex-wrap gap-2">
            <a href={link} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
              <ExternalLink className="size-4" aria-hidden />
              {t("admin.publicWall.open")}
            </a>
            <Button size="sm" variant={confirming ? "danger" : "ghost"} onClick={renew} onBlur={() => setConfirming(false)} loading={busy}>
              <RefreshCw className="size-4" aria-hidden />
              {confirming ? t("admin.publicWall.confirmNewLink") : t("admin.publicWall.newLink")}
            </Button>
            <Button size="sm" variant="ghost" onClick={disable} disabled={busy}>
              {t("admin.publicWall.disable")}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <Button variant="secondary" onClick={renew} loading={busy}>
            <Link2 className="size-4" aria-hidden />
            {t("admin.publicWall.enable")}
          </Button>
        </div>
      )}
    </Card>
  );
}
