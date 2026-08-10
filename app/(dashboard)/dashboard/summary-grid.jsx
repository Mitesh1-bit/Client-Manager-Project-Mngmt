"use client";

import Link from "next/link";
import { Building2, FolderKanban, GitPullRequestArrow } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { formatDate } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

import { AnimatedNumber } from "./animated-number";

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = { duration: 0.35, ease: "easeOut" };

// Tailwind's class scanner needs literal, complete class strings — a
// template-built `bg-tone-${tone}-bg` never gets generated, so the tones are
// spelled out here instead.
const TONE_CLASSES = {
  info: "bg-tone-info-bg text-tone-info-fg",
  accent: "bg-tone-accent-bg text-tone-accent-fg",
  caution: "bg-tone-caution-bg text-tone-caution-fg",
};

export function SummaryGrid({ summary }) {
  const reduce = useReducedMotion();
  const activeProjects = summary.projects.nodes.filter((project) => project.status === "ACTIVE");
  const atRiskProjects = activeProjects.filter((project) => project.health !== "ON_TRACK");
  const openCount = summary.changeRequestDashboard?.openCount ?? 0;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <SummaryCard
        icon={Building2}
        tone="info"
        label="Clients"
        value={summary.companies.totalCount}
        detail={`${summary.companies.nodes.filter((c) => c.status === "ACTIVE").length} active`}
      />
      <SummaryCard
        icon={FolderKanban}
        tone="accent"
        label="Active projects"
        value={activeProjects.length}
        detail={`${atRiskProjects.length} needing attention`}
      />
      <SummaryCard
        icon={GitPullRequestArrow}
        tone="caution"
        label="Open change requests"
        value={openCount}
        detail={`${summary.changeRequestDashboard?.pendingApprovalCount ?? 0} pending approval`}
      />

      <motion.div variants={CARD_VARIANTS} transition={CARD_TRANSITION} className="sm:col-span-2 xl:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-subheading">Project health snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <p className="text-caption text-muted-foreground">No active projects yet.</p>
            ) : (
              <ul className="space-y-2">
                {activeProjects.map((project) => (
                  <ProjectHealthRow key={project.id} project={project} reduce={reduce} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function SummaryCard({ icon: Icon, tone, label, value, detail }) {
  return (
    <motion.div variants={CARD_VARIANTS} transition={CARD_TRANSITION} whileHover={{ y: -2 }}>
      <Card className="shadow-xs transition-shadow hover:shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-caption font-medium text-muted-foreground">{label}</CardTitle>
          <span
            aria-hidden="true"
            className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}
          >
            <Icon className="size-4.5" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="tabular text-title">
            <AnimatedNumber value={value} />
          </p>
          <p className="mt-1 text-caption text-muted-foreground">{detail}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectHealthRow({ project, reduce }) {
  return (
    <motion.li variants={CARD_VARIANTS} transition={CARD_TRANSITION} whileHover={reduce ? undefined : { x: 2 }}>
      <Link
        href={`/projects/${project.id}`}
        className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 transition-colors hover:bg-muted/40 focus-ring"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-caption">{project.name}</span>
            <StatusBadge kind="projectHealth" value={project.health} size="sm" />
            <StatusBadge kind="priority" value={project.priority} size="sm" />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={project.completionPercent} className="h-1.5 max-w-40" />
            <span className="tabular text-[0.6875rem] text-muted-foreground">
              {project.completionPercent}%
            </span>
          </div>
        </div>

        <span className="text-[0.75rem] whitespace-nowrap text-muted-foreground">
          {project.endDate ? `Due ${formatDate(project.endDate)}` : "No due date"}
        </span>

        {project.projectManager ? (
          <EntityAvatar name={project.projectManager.name} imageUrl={project.projectManager.avatarUrl} size="xs" />
        ) : null}
      </Link>
    </motion.li>
  );
}
