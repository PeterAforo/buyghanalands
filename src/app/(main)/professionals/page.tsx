import { Metadata } from "next";
import { prisma, withDbRetry } from "@/lib/db";
import { ProfessionalsClient } from "./professionals-client";

export const metadata: Metadata = {
  title: "Find Professionals | Buy Ghana Lands",
  description: "Find licensed surveyors, lawyers, architects, engineers, planners, and valuers for your land transactions in Ghana.",
};

export const dynamic = 'force-dynamic';

const professionalTypes = [
  { value: "SURVEYOR", label: "Surveyors" },
  { value: "LAWYER", label: "Lawyers" },
  { value: "ARCHITECT", label: "Architects" },
  { value: "ENGINEER", label: "Engineers" },
  { value: "PLANNER", label: "Planners" },
  { value: "VALUER", label: "Valuers" },
];

async function getProfessionals() {
  const professionals = await withDbRetry(() => prisma.professionalProfile.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      services: {
        where: { isPublished: true },
        take: 3,
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  }));

  return professionals.map((p) => ({
    id: p.id,
    professionalType: p.professionalType,
    companyName: p.companyName,
    baseLocation: p.baseLocation,
    licenseStatus: p.licenseStatus,
    yearsExperience: p.yearsExperience,
    user: {
      id: p.user.id,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
    },
    services: p.services.map((s) => ({
      id: s.id,
      title: s.title,
    })),
    avgRating:
      p.reviewsReceived.length > 0
        ? p.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) /
          p.reviewsReceived.length
        : 0,
    reviewCount: p.reviewsReceived.length,
  }));
}

export default async function ProfessionalsPage() {
  const professionals = await getProfessionals();

  return (
    <ProfessionalsClient
      initialProfessionals={professionals}
      professionalTypes={professionalTypes}
    />
  );
}
