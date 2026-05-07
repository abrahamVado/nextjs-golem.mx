import type { Metadata } from "next";
import { GolemMxLandingPage } from "@/components/landing/golemmx-landing-page";

export const metadata: Metadata = {
  title: "golem.mx | Helpdesk y flujo de trabajo",
  description:
    "golem.mx combina helpdesk, gestion de trabajo y seguimiento operativo en una experiencia visual animada.",
};

export default function Home() {
  return <GolemMxLandingPage />;
}
