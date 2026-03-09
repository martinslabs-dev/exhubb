"use client";
// settings: notifications form
import { useActionState, useState } from "react";
import { saveNotifPrefsAction } from "@/lib/actions/settings";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrefGroup {
  title:       string;
  description: string;
  items:       { key: string; label: string; defaultOn: boolean }[];
}

const PREF_GROUPS: PrefGroup[] = [
  {
    title:       "Orders & Transactions",
    description: "Updates about your purchases, sales, and earnings",
    items: [
      { key: "email_order_placed",    label: "Order placed / received",    defaultOn: true  },
      { key: "email_order_shipped",   label: "Order shipped / delivered",  defaultOn: true  },
      { key: "email_order_completed", label: "Order marked as completed",  defaultOn: true  },
      { key: "email_payout",          label: "Payout processed",           defaultOn: true  },
    ],
  },
  {
    title:       "Messages",
    description: "Notifications when someone sends you a message",
    items: [
      { key: "email_new_message",    label: "New message received",        defaultOn: true  },
      { key: "email_message_digest", label: "Daily unread message digest", defaultOn: false },
    ],
  },
  {
    title:       "Account & Security",
    description: "Important alerts about your account",
    items: [
      { key: "email_login_alert",     label: "New device sign-in alert",   defaultOn: true },
      { key: "email_password_change", label: "Password or email changed",  defaultOn: true },
    ],
  },
  {
    title:       "Promotions & Updates",
    description: "Feature releases, tips, and platform news",
    items: [
      { key: "email_promotions",      label: "Promotions and deals",       defaultOn: false },
      { key: "email_product_updates", label: "Platform updates and news",  defaultOn: true  },
    ],
  },
];

export default function NotifPrefsForm() {
  const [state, formAction, pending] = useActionState(saveNotifPrefsAction, null);

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    PREF_GROUPS.forEach((g) => g.items.forEach((i) => { init[i.key] = i.defaultOn; }));
    return init;
  });

  return (
    <form action={formAction} className="space-y-4">

      {Object.entries(prefs).map(([key, val]) => (
        <input key={key} type="hidden" name={key} value={val ? "1" : "0"} />
      ))}

      {state?.success && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Preferences saved.
        </div>
      )}

      {PREF_GROUPS.map((group) => (
        <div key={group.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">{group.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">{group.description}</p>
          <ul className="space-y-3">
            {group.items.map(({ key, label }) => (
              <li key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0",
                    prefs[key] ? "bg-primary-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    prefs[key] ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? "Saving…" : "Save Preferences"}
        </button>
      </div>

    </form>
  );
}
