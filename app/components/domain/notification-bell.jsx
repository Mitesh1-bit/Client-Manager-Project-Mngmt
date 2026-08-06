"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, CheckCheck, GitPullRequestArrow, HeartHandshake, ListTodo, Users } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
  NotificationsDocument,
  UnreadNotificationCountDocument,
} from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

const POLL_INTERVAL_MS = 30000;
const LIST_LIMIT = 20;

const TYPE_ICONS = [
  ["task.", ListTodo],
  ["project.", Users],
  ["change_request.", GitPullRequestArrow],
  ["milestone.", HeartHandshake],
];

function iconForType(type) {
  return TYPE_ICONS.find(([prefix]) => type?.startsWith(prefix))?.[1] ?? Bell;
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const previousCount = useRef(null);

  const { data: countData } = useQuery(UnreadNotificationCountDocument, {
    pollInterval: POLL_INTERVAL_MS,
    fetchPolicy: "cache-and-network",
  });
  const unreadCount = countData?.unreadNotificationCount ?? 0;

  const { data: listData, loading } = useQuery(NotificationsDocument, {
    variables: { limit: LIST_LIMIT },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });
  const notifications = listData?.notifications ?? [];

  const [markRead] = useMutation(MarkNotificationReadDocument, {
    refetchQueries: [{ query: UnreadNotificationCountDocument }],
  });
  const [markAllRead, { loading: markingAll }] = useMutation(MarkAllNotificationsReadDocument, {
    refetchQueries: [
      { query: UnreadNotificationCountDocument },
      { query: NotificationsDocument, variables: { limit: LIST_LIMIT } },
    ],
  });

  useEffect(() => {
    if (previousCount.current !== null && unreadCount > previousCount.current && !reduceMotion) {
      setRinging(true);
      const timeout = setTimeout(() => setRinging(false), 650);
      return () => clearTimeout(timeout);
    }
    previousCount.current = unreadCount;
  }, [unreadCount, reduceMotion]);

  function handleOpenChange(next) {
    setOpen(next);
    if (next) previousCount.current = unreadCount;
  }

  function handleNotificationClick(notification) {
    if (!notification.readAt) {
      markRead({ variables: { id: notification.id } });
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative">
          <motion.span
            className="inline-flex"
            animate={ringing ? { rotate: [0, -16, 13, -9, 5, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Bell aria-hidden="true" />
          </motion.span>
          <AnimatePresence>
            {unreadCount > 0 ? (
              <motion.span
                key="badge"
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-tone-critical-fg text-[0.625rem] font-medium text-white tabular"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="font-medium">Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground transition-colors hover:text-foreground focus-ring disabled:opacity-50"
            >
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!loading && notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-caption text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {notifications.map((notification, index) => {
                  const Icon = iconForType(notification.type);
                  const unread = !notification.readAt;
                  const content = (
                    <div className="flex items-start gap-2.5 px-3 py-2.5">
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                          unread ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-caption", unread ? "font-medium" : "text-muted-foreground")}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 truncate text-caption text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {unread ? (
                        <motion.span
                          layout={!reduceMotion}
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600"
                        />
                      ) : null}
                    </div>
                  );

                  return (
                    <motion.li
                      key={notification.id}
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(index, 6) * 0.02 }}
                      className="border-b last:border-b-0"
                    >
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={() => handleNotificationClick(notification)}
                          className="block transition-colors hover:bg-muted/60 focus-ring"
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="block w-full text-left transition-colors hover:bg-muted/60 focus-ring"
                        >
                          {content}
                        </button>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
