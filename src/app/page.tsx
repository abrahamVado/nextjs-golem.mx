import type { Metadata } from "next";
import { PaladinMxLandingPage } from "@/components/landing/golemmx-landing-page";

export const metadata: Metadata = {
  title: "paladin.mx | Helpdesk y flujo de trabajo",
  description:
    "paladin.mx combina helpdesk, gestion de trabajo y seguimiento operativo en una experiencia visual animada.",
};

export default function Home() {
  return <PaladinMxLandingPage />;
}
