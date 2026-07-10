"use client";

import { useQuery } from "@tanstack/react-query";
import { useExecutiveDataProvider } from "./executive-provider-context";
import type {
  ExecutiveOverview,
  Mission,
  Department,
  Artifact,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
} from "./types";

function useProvider() {
  return useExecutiveDataProvider();
}

const POLL = {
  missions: 3000,
  activity: 3000,
  overview: 5000,
  approvals: 5000,
  risks: 5000,
  blockers: 5000,
  departments: 10000,
  decisions: 30000,
  artifacts: 30000,
} as const;

export function useExecutiveOverview(initialData?: ExecutiveOverview) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "overview"],
    queryFn: () => provider.getOverview(),
    initialData,
    refetchInterval: POLL.overview,
    staleTime: POLL.overview,
  });
}

export function useExecutiveMissions(initialData?: Mission[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "missions"],
    queryFn: () => provider.getMissions(),
    initialData,
    refetchInterval: POLL.missions,
    staleTime: POLL.missions,
  });
}

export function useExecutiveDepartments(initialData?: Department[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "departments"],
    queryFn: () => provider.getDepartments(),
    initialData,
    refetchInterval: POLL.departments,
    staleTime: POLL.departments,
  });
}

export function useExecutiveApprovals(initialData?: Approval[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "approvals"],
    queryFn: () => provider.getApprovals(),
    initialData,
    refetchInterval: POLL.approvals,
    staleTime: POLL.approvals,
  });
}

export function useExecutiveRisks(initialData?: Risk[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "risks"],
    queryFn: () => provider.getRisks(),
    initialData,
    refetchInterval: POLL.risks,
    staleTime: POLL.risks,
  });
}

export function useExecutiveBlockers(initialData?: Blocker[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "blockers"],
    queryFn: () => provider.getBlockers(),
    initialData,
    refetchInterval: POLL.blockers,
    staleTime: POLL.blockers,
  });
}

export function useExecutiveDecisions(initialData?: Decision[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "decisions"],
    queryFn: () => provider.getDecisions(),
    initialData,
    refetchInterval: POLL.decisions,
    staleTime: POLL.decisions,
  });
}

export function useExecutiveArtifacts(initialData?: Artifact[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "artifacts"],
    queryFn: () => provider.getArtifacts(),
    initialData,
    refetchInterval: POLL.artifacts,
    staleTime: POLL.artifacts,
  });
}

export function useExecutiveActivity(initialData?: ActivityItem[]) {
  const provider = useProvider();
  return useQuery({
    queryKey: ["executive", "activity"],
    queryFn: () => provider.getActivity(),
    initialData,
    refetchInterval: POLL.activity,
    staleTime: POLL.activity,
  });
}
