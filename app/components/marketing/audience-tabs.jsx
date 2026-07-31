"use client";

import { useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";

export function AudienceTabs({ tabs, className }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const panel = tabs.find((tab) => tab.id === active) ?? tabs[0];

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActive(hash);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs]);

  function selectTab(id) {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label="Audience" className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300",
                selected
                  ? "bg-mkt-navy text-white shadow-md shadow-mkt-navy/25"
                  : "border border-mkt-navy/15 bg-white text-mkt-navy hover:border-mkt-navy/40 hover:shadow-sm",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panel.id} className="mt-8 min-h-[12rem] scroll-mt-28">
        <div key={panel.id} className="prose-marketing mkt-animate-fade-in">
          <TabPanelContent panel={panel} />
        </div>
      </div>
    </div>
  );
}

function TabPanelContent({ panel }) {
  return (
    <>
      <h3 className="font-mkt-display mb-3 text-2xl text-mkt-navy md:text-3xl">{panel.headline}</h3>
      <p className="text-base text-mkt-navy/80">{panel.body}</p>
      {panel.bullets?.length ? (
        <ul className="mt-5 space-y-2">
          {panel.bullets.map((item) => (
            <li key={item} className="flex items-start gap-2 text-mkt-navy/85">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mkt-cta" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
