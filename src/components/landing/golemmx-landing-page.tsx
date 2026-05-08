"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ensureGSAP } from "@/lib/gsap";
import { whitelistApi } from "@/lib/api";
import { useLanguage } from "@/components/providers/language-provider";
import type { Locale } from "@/i18n";
import styles from "./golemmx-landing-page.module.css";

const landingCopy: Record<Locale, {
  nav: {
    capabilities: string;
    platform: string;
    contact: string;
    signIn: string;
    menu: string;
    close: string;
  };
  hero: {
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    tagOne: string;
    tagTwo: string;
    liveBadge: string;
    cards: Array<{ icon: string; title: string; copy: string }>;
  };
  market: {
    heading: string;
    body: string;
    cards: Array<{ key: string; name: string; copy: string; price: string; tag: string; tone: string; bars: readonly ["mid" | "full" | "short", "mid" | "full" | "short", "mid" | "full" | "short"] }>;
    proofHeading: string;
    proofBody: string;
    proofCards: Array<{ key: string; name: string; copy: string; image?: string; accent: string }>;
  };
  portal: {
    heading: string;
    body: string;
    title: string;
    score: string;
    rows: readonly [string, string, string, string, string][];
  };
  contact: {
    heading: string;
    body: string;
    registerHeading: string;
    registerBody: string;
    name: string;
    email: string;
    company: string;
    subject: string;
    message: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    companyPlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    note: string;
    submitting: string;
    success: string;
    error: string;
  };
  footer: string;
}> = {
  en: {
    nav: {
      capabilities: "Capabilities",
      platform: "Platform",
      contact: "Contact",
      signIn: "Sign in",
      menu: "Menu",
      close: "Close",
    },
    hero: {
      title: "Receive client tickets and turn them into a workflow",
      body: "paladin.mx combines a helpdesk with a cloud work management platform to plan, organize, and track projects, tasks, tickets, and operational workflows in one place.",
      primaryCta: "Capabilities",
      secondaryCta: "How it works",
      tagOne: "Public ticket URL",
      tagTwo: "Automatic assignment",
      liveBadge: "Live workspace",
      cards: [
        { icon: "URL", title: "Client intake", copy: "Clients create tickets through a dedicated public URL" },
        { icon: "KAN", title: "Visual management", copy: "Organize work with Kanban boards, lists, and timelines" },
        { icon: "TASK", title: "Task breakdown", copy: "Split tickets into multiple tasks and responsible owners" },
      ],
    },
    market: {
      heading: "One platform for support, collaboration, and work tracking",
      body: "paladin.mx helps teams receive tickets, organize them, assign them, turn them into tasks, and track progress with a clear view of ongoing work.",
      cards: [
        { key: "one", name: "Ticket portal", copy: "Share a URL with clients so they can submit incidents and requests through a simple, organized channel.", price: "External support", tag: "HELPDESK", tone: "#dff1e4", bars: ["mid", "full", "short"] as const },
        { key: "two", name: "Automatic assignment", copy: "Each ticket can be routed automatically to the right team to reduce response times and manual work.", price: "Smart flow", tag: "AUTO", tone: "#dceaff", bars: ["full", "short", "mid"] as const },
        { key: "three", name: "Projects and tasks", copy: "Turn every ticket into actionable work with lists, Kanban boards, timelines, and assigned tasks.", price: "Real collaboration", tag: "WORK", tone: "#f1e2ff", bars: ["short", "full", "mid"] as const },
        { key: "four", name: "Centralized tracking", copy: "Track progress, distribute ownership, and split a ticket into multiple tasks without leaving the platform.", price: "Full visibility", tag: "TRACK", tone: "#ffe3c4", bars: ["mid", "short", "full"] as const },
      ],
      proofHeading: "How the workflow moves inside paladin.mx",
      proofBody: "The process starts with a shared operational view, continues in a Kanban flow where work is assigned and advanced, and lands in a project workspace where each delivery is tracked in detail.",
      proofCards: [
        { key: "workspace", name: "1. Operational overview", copy: "The team starts here to review incoming work, active priorities, and the overall status of the operation from a single dashboard.", image: "/dashboard.PNG", accent: "#dcfce7" },
        { key: "kanban", name: "2. Work in progress", copy: "From there, tickets and tasks move through the Kanban board, where each item is assigned, updated, and advanced by the responsible team.", image: "/kanban-dashboard.PNG", accent: "#dbeafe" },
        { key: "projects", name: "3. Project execution", copy: "When the work needs deeper follow-up, the team opens the project workspace to organize deliverables, track details, and keep execution aligned.", image: "/rbac.PNG", accent: "#f3e8ff" },
      ],
    },
    portal: {
      heading: "From the client ticket to coordinated team execution",
      body: "Share a URL with your clients to receive requests, let the platform assign them automatically, and then collaborate with your team using boards, lists, tasks, operational KPIs, velocity metrics, client satisfaction, and centralized performance tracking.",
      title: "paladin.mx operational flow",
      score: "92%",
      rows: [
        ["1", "Ticket intake", "Share a URL so your clients can create tickets and requests through a centralized channel", "Active", "var(--green)"],
        ["2", "Team routing", "Each ticket is assigned to the right team and can be distributed by priority", "Stable", "var(--blue)"],
        ["3", "Work execution", "Turn tickets into tasks, lists, and boards to manage collaborative execution", "Live", "var(--purple)"],
        ["4", "KPIs and performance", "Measure velocity, client satisfaction, response times, and team performance", "Visible", "var(--yellow)"],
      ],
    },
    contact: {
      heading: "Join the whitelist",
      body: "Request access to the paladin.mx whitelist and tell us a bit about your team. We are opening access in stages and prioritizing teams with active support and operations workflows.",
      registerHeading: "Contact",
      registerBody: "Request a demo through the form and tell us about your team, your support flow, or the operation you want to organize. We will help you shape the right setup and show you how paladin.mx can fit your workflow.",
      name: "Name",
      email: "Email",
      company: "Company",
      subject: "Team or use case",
      message: "Why do you want access?",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@company.com",
      companyPlaceholder: "Your company name",
      subjectPlaceholder: "Support, operations, projects...",
      messagePlaceholder: "Tell us how your team would use paladin.mx",
      submit: "Request whitelist access",
      note: "You can also email hola@paladin.mx to be added manually.",
      submitting: "Sending...",
      success: "Your whitelist request was received. We will review it and contact you soon.",
      error: "We could not save your request right now. Please try again or email hola@paladin.mx.",
    },
    footer: "paladin.mx. Helpdesk and work management in one platform.",
  },
  es: {
    nav: {
      capabilities: "Capacidades",
      platform: "Plataforma",
      contact: "Contacto",
      signIn: "Iniciar sesion",
      menu: "Menu",
      close: "Cerrar",
    },
    hero: {
      title: "Recibe tickets de tus clientes y conviertelos en un flujo de trabajo",
      body: "paladin.mx combina un helpdesk con una plataforma de gestion de trabajo en la nube para planear, organizar y dar seguimiento a proyectos, tareas, tickets y flujos operativos desde un solo lugar.",
      primaryCta: "Capacidades",
      secondaryCta: "Como funciona",
      tagOne: "URL publica para tickets",
      tagTwo: "Asignacion automatica",
      liveBadge: "Mesa de trabajo en vivo",
      cards: [
        { icon: "URL", title: "Entrada de clientes", copy: "Tus clientes crean tickets desde una URL dedicada" },
        { icon: "KAN", title: "Gestion visual", copy: "Organiza el trabajo con Kanban, listas y timelines" },
        { icon: "TASK", title: "Desglose por tareas", copy: "Divide tickets en multiples tareas y responsables" },
      ],
    },
    market: {
      heading: "Una sola plataforma para soporte, colaboracion y seguimiento del trabajo",
      body: "paladin.mx ayuda a los equipos a recibir tickets, organizarlos, asignarlos, convertirlos en tareas y seguir el progreso con una vista clara del trabajo en curso.",
      cards: [
        { key: "one", name: "Portal de tickets", copy: "Comparte una URL con tus clientes para que reporten incidencias y solicitudes desde un canal simple y ordenado.", price: "Atencion externa", tag: "HELPDESK", tone: "#dff1e4", bars: ["mid", "full", "short"] as const },
        { key: "two", name: "Asignacion automatica", copy: "Cada ticket puede enrutarse automaticamente al equipo correcto para reducir tiempos de respuesta y evitar trabajo manual.", price: "Flujo inteligente", tag: "AUTO", tone: "#dceaff", bars: ["full", "short", "mid"] as const },
        { key: "three", name: "Proyectos y tareas", copy: "Convierte cada ticket en trabajo accionable con listas, tableros Kanban, timelines y tareas asignadas.", price: "Colaboracion real", tag: "WORK", tone: "#f1e2ff", bars: ["short", "full", "mid"] as const },
        { key: "four", name: "Seguimiento centralizado", copy: "Da seguimiento al avance, reparte responsables y divide un ticket en multiples tareas sin salir de la plataforma.", price: "Visibilidad total", tag: "TRACK", tone: "#ffe3c4", bars: ["mid", "short", "full"] as const },
      ],
      proofHeading: "Asi avanza el flujo dentro de paladin.mx",
      proofBody: "El proceso empieza con una vista general de la operacion, continua en un flujo Kanban donde el trabajo se asigna y avanza, y termina en un workspace de proyecto donde cada entrega se sigue a detalle.",
      proofCards: [
        { key: "workspace", name: "1. Vista operativa", copy: "El equipo empieza aqui para revisar trabajo entrante, prioridades activas y el estado general de la operacion desde un solo dashboard.", image: "/dashboard.PNG", accent: "#dcfce7" },
        { key: "kanban", name: "2. Trabajo en proceso", copy: "Desde ahi, los tickets y tareas avanzan por el tablero Kanban, donde cada elemento se asigna, se actualiza y cambia de etapa con claridad.", image: "/kanban-dashboard.PNG", accent: "#dbeafe" },
        { key: "projects", name: "3. Ejecucion del proyecto", copy: "Cuando el trabajo necesita seguimiento mas profundo, el equipo entra al workspace del proyecto para organizar entregables, revisar detalles y mantener la ejecucion alineada.", image: "/rbac.PNG", accent: "#f3e8ff" },
      ],
    },
    portal: {
      heading: "Del ticket del cliente al trabajo coordinado del equipo",
      body: "Comparte una URL con tus clientes para recibir solicitudes, deja que la plataforma las asigne automaticamente y despues colabora con tu equipo usando tableros, listas, tareas, KPIs operativos, metricas de velocidad, satisfaccion del cliente y seguimiento centralizado del rendimiento.",
      title: "Flujo operativo de paladin.mx",
      score: "92%",
      rows: [
        ["1", "Recepcion de tickets", "Comparte una URL para que tus clientes creen tickets y solicitudes desde un canal centralizado", "Activo", "var(--green)"],
        ["2", "Enrutamiento del equipo", "Cada ticket se asigna al equipo correcto y puede repartirse entre responsables segun prioridad", "Estable", "var(--blue)"],
        ["3", "Ejecucion del trabajo", "Convierte tickets en tareas, listas y tableros para dar seguimiento al trabajo colaborativo", "En linea", "var(--purple)"],
        ["4", "KPIs y rendimiento", "Mide velocidad, satisfaccion del cliente, tiempos de respuesta y desempeno del equipo", "Visible", "var(--yellow)"],
      ],
    },
    contact: {
      heading: "Unete a la whitelist",
      body: "Solicita acceso a la whitelist de paladin.mx y cuentanos un poco sobre tu equipo. Estamos abriendo el acceso por etapas y priorizando equipos con flujos activos de soporte y operacion.",
      registerHeading: "Contacto",
      registerBody: "Solicita una demo desde el formulario y cuentanos sobre tu equipo, tu flujo de soporte o la operacion que quieres organizar. Te ayudamos a definir la mejor implementacion y a entender como paladin.mx se adapta a tu flujo de trabajo.",
      name: "Nombre",
      email: "Email",
      company: "Empresa",
      subject: "Equipo o caso de uso",
      message: "Por que quieres acceso?",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@empresa.com",
      companyPlaceholder: "Nombre de tu empresa",
      subjectPlaceholder: "Soporte, operacion, proyectos...",
      messagePlaceholder: "Cuentanos como usaria tu equipo paladin.mx",
      submit: "Solicitar acceso a la whitelist",
      note: "Tambien puedes escribir a hola@paladin.mx para agregarte manualmente.",
      submitting: "Enviando...",
      success: "Recibimos tu solicitud para la whitelist. La revisaremos y te contactaremos pronto.",
      error: "No pudimos guardar tu solicitud en este momento. Intenta de nuevo o escribe a hola@paladin.mx.",
    },
    footer: "paladin.mx. Helpdesk y gestion de trabajo en una sola plataforma.",
  },
} as const;

export function PaladinMxLandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { locale, setLocale } = useLanguage();
  const copy = landingCopy[locale];
  const proofCards = copy.market.proofCards;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeProofCard, setActiveProofCard] = useState<(typeof copy.market.proofCards)[number] | null>(null);
  const [isWhitelistSubmitting, setIsWhitelistSubmitting] = useState(false);
  const [whitelistFeedback, setWhitelistFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleWhitelistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWhitelistFeedback(null);
    setIsWhitelistSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    try {
      await whitelistApi.create(payload);

      form.reset();
      setWhitelistFeedback({ type: "success", message: copy.contact.success });
    } catch (error) {
      const maybeError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        maybeError.response?.data?.error?.message ||
        (error instanceof Error && error.message ? error.message : copy.contact.error);
      setWhitelistFeedback({ type: "error", message });
    } finally {
      setIsWhitelistSubmitting(false);
    }
  }

  useEffect(() => {
    if (!rootRef.current) return;

    const gsap = ensureGSAP();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo("[data-landing-nav]", { y: -42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
      gsap.fromTo("[data-hero-copy] > *", { y: 54, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.12 });
      gsap.fromTo("[data-hero-dashboard]", { y: 95, rotateY: -34, rotateX: 20, rotateZ: 9, opacity: 0 }, { y: 0, rotateY: -13, rotateX: 7, rotateZ: 2, opacity: 1, duration: 1.25, ease: "power3.out", delay: 0.32 });
      gsap.fromTo("[data-app-card]", { scale: 0.68, y: 70, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "back.out(1.8)", delay: 0.8 });

      gsap.fromTo("[data-proof-copy]", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: "[data-proof-stage]", start: "top 82%" } });
      gsap.fromTo("[data-proof-card]", { y: 80, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: "[data-proof-stage]", start: "top 78%" } });

      gsap.fromTo("[data-portal-copy]", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "[data-portal]", start: "top 82%" } });
      gsap.fromTo("[data-portal-window]", { x: 100, y: 48, rotateY: 24, rotateX: 10, opacity: 0 }, { x: 0, y: 0, rotateY: 10, rotateX: 5, opacity: 1, duration: 0.95, ease: "power3.out", scrollTrigger: { trigger: "[data-portal]", start: "top 78%" } });
      gsap.fromTo("[data-portal-row]", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: "back.out(1.4)", scrollTrigger: { trigger: "[data-portal-window]", start: "top 82%" } });
      gsap.to("[data-portal-window]", { rotateY: -5, rotateX: -2, y: -26, ease: "none", scrollTrigger: { trigger: "[data-portal]", start: "top 75%", end: "bottom top", scrub: 1 } });

      gsap.fromTo("[data-contact-copy] > *", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "[data-contact]", start: "top 82%" } });
      gsap.fromTo("[data-contact-machine]", { x: -100, y: 48, rotateY: -22, rotateX: 10, opacity: 0 }, { x: 0, y: 0, rotateY: 0, rotateX: 0, opacity: 1, duration: 0.95, ease: "power3.out", scrollTrigger: { trigger: "[data-contact]", start: "top 78%" } });
      gsap.fromTo("[data-contact-form] label, [data-contact-form] .contact-submit", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: "[data-contact-window]", start: "top 84%" } });

    }, rootRef);

    return () => ctx.revert();
  }, [proofCards]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [locale]);

  useEffect(() => {
    if (!activeProofCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveProofCard(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeProofCard]);

  return (
    <div ref={rootRef} className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Saltar al contenido</a>
      <div className={styles.grain} aria-hidden="true" />

      <header className={`${styles.nav} ${isMobileMenuOpen ? styles.navMenuOpen : styles.navMenuClosed}`} data-landing-nav="">
        <a href="#hero" className={styles.brand} aria-label="paladin.mx - Ir al inicio">
          <img src="/golem-logo.svg" alt="paladin.mx" className={styles.brandLogo} />
        </a>
        <nav className={styles.navLinks} aria-label="Navegacion principal">
          <a href="#mercado" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.capabilities}</a>
          <a href="#portal" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.platform}</a>
          <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.contact}</a>
        </nav>
        <div className={styles.navActions}>
          <div className={styles.languageSwitch} aria-label="Language switcher">
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`${styles.languageOption} ${locale === "en" ? styles.languageOptionActive : ""}`}
              title="English (USA)"
            >
              <Image src="/flags/us.svg" alt="USA flag" width={18} height={12} className={styles.flag} />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale("es")}
              aria-pressed={locale === "es"}
              className={`${styles.languageOption} ${locale === "es" ? styles.languageOptionActive : ""}`}
              title="Espanol (Mexico)"
            >
              <Image src="/flags/mx.svg" alt="Mexico flag" width={18} height={12} className={styles.flag} />
              <span>ES</span>
            </button>
          </div>
          <a href="/login" className={`${styles.button} ${styles.buttonSecondary}`}>{copy.nav.signIn}</a>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            <span className={styles.mobileMenuLabel}>{isMobileMenuOpen ? copy.nav.close : copy.nav.menu}</span>
            <span className={styles.mobileMenuIcon} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
        <div
          id="landing-mobile-menu"
          className={`${styles.mobileMenuPanel} ${isMobileMenuOpen ? styles.mobileMenuPanelOpen : ""}`}
        >
          <nav className={styles.mobileNavLinks} aria-label="Mobile navigation">
            <a href="#mercado" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.capabilities}</a>
            <a href="#portal" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.platform}</a>
            <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)}>{copy.nav.contact}</a>
          </nav>
          <div className={styles.mobileMenuFooter}>
            <div className={styles.languageSwitch} aria-label="Language switcher">
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`${styles.languageOption} ${locale === "en" ? styles.languageOptionActive : ""}`}
                title="English (USA)"
              >
                <Image src="/flags/us.svg" alt="USA flag" width={18} height={12} className={styles.flag} />
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => setLocale("es")}
                aria-pressed={locale === "es"}
                className={`${styles.languageOption} ${locale === "es" ? styles.languageOptionActive : ""}`}
                title="Espanol (Mexico)"
              >
                <Image src="/flags/mx.svg" alt="Mexico flag" width={18} height={12} className={styles.flag} />
                <span>ES</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section id="hero" className={`${styles.section} ${styles.hero}`} data-hero="">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy} data-hero-copy="">
              <h1>{copy.hero.title}</h1>
              <p>{copy.hero.body}</p>
              <div className={styles.heroActions}>
                <a href="#mercado" className={`${styles.button} ${styles.buttonPrimary}`}>{copy.hero.primaryCta}</a>
                <a href="#portal" className={`${styles.button} ${styles.buttonSecondary}`}>{copy.hero.secondaryCta}</a>
              </div>
            </div>

            <div className={styles.marketDevice} aria-hidden="true">
              <div className={`${styles.orb} ${styles.orbOne}`} data-orb="one" />
              <div className={`${styles.orb} ${styles.orbTwo}`} data-orb="two" />
              <div className={`${styles.orb} ${styles.orbThree}`} data-orb="three" />
              <div className={`${styles.floatingTag} ${styles.tagOne}`}>{copy.hero.tagOne}</div>
              <div className={`${styles.floatingTag} ${styles.tagTwo}`}>{copy.hero.tagTwo}</div>

              <div className={styles.dashboard} data-hero-dashboard="">
                <div className={styles.screen}>
                  <div className={styles.screenGrid} />
                  <div className={styles.screenTop}>
                    <div className={styles.dots} role="img" aria-label="Controles de ventana">
                      <span /><span /><span />
                    </div>
                    <div className={styles.miniBadge}>{copy.hero.liveBadge}</div>
                  </div>

                  {copy.hero.cards.map((card, index) => (
                    <article
                      key={card.title}
                      className={`${styles.appCard} ${index === 0 ? styles.cardA : index === 1 ? styles.cardB : styles.cardC}`}
                      data-app-card=""
                    >
                      <div className={styles.icon}>{card.icon}</div>
                      <h3>{card.title}</h3>
                      <p>{card.copy}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mercado" className={`${styles.section} ${styles.marketProofStage}`} data-proof-stage="">
          <div className={styles.container}>
            <h2 className={styles.sectionHeading} data-proof-copy="">{copy.market.proofHeading}</h2>
            <p className={styles.sectionCopy} data-proof-copy="">{copy.market.proofBody}</p>

            <div className={styles.proofGrid}>
              {copy.market.proofCards.map((card) => (
                <article key={card.key} className={styles.proofCard} data-proof-card="">
                  <div className={styles.proofFrame}>
                    <div className={styles.proofToolbar}>
                      <div className={styles.proofDots} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className={styles.proofUrl}>app.paladin.mx/{card.key}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.proofScreenButton}
                      onClick={() => setActiveProofCard(card)}
                      aria-label={`Open ${card.name} screenshot`}
                    >
                      <div className={styles.proofScreen} style={{ background: `linear-gradient(180deg, ${card.accent} 0%, #ffffff 100%)` }}>
                      {card.image ? (
                        <Image src={card.image} alt={card.name} fill className={styles.proofImage} />
                      ) : (
                        <div className={styles.proofPlaceholder}>
                          <div className={styles.proofPlaceholderBadge}>Screenshot slot</div>
                          <div className={styles.proofPlaceholderBars} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                          </div>
                          <p>Add a real screenshot here from `public/landing/screenshots/`</p>
                        </div>
                      )}
                      </div>
                    </button>
                  </div>
                  <h3>{card.name}</h3>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="portal" className={`${styles.section} ${styles.portal}`} data-portal="">
          <div className={`${styles.container} ${styles.portalGrid}`}>
            <div>
              <h2 className={styles.sectionHeading} data-portal-copy="">{copy.portal.heading}</h2>
              <p className={styles.sectionCopy} data-portal-copy="">{copy.portal.body}</p>
            </div>

            <div className={styles.portalMachine} aria-hidden="true">
              <div className={styles.portalWindow} data-portal-window="">
                <div className={styles.portalScreen}>
                  <div className={styles.portalHeader}>
                    <span>{copy.portal.title}</span>
                    <span>{copy.portal.score}</span>
                  </div>
                  {copy.portal.rows.map(([index, title, rowCopy, status, tone]) => (
                    <div className={styles.portalRow} data-portal-row="" key={index}>
                      <div className={styles.portalDot} style={{ background: tone }}>{index}</div>
                      <div>
                        <h4>{title}</h4>
                        <p>{rowCopy}</p>
                      </div>
                      <span className={styles.portalStatus}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className={`${styles.section} ${styles.contactMini}`} data-contact="">
          <div className={`${styles.container} ${styles.contactGrid}`}>
            <div className={styles.contactMachine} data-contact-machine="">
              <div className={styles.contactWindow} data-contact-window="">
                <div className={styles.contactScreen}>
                  <div className={styles.contactHeader}>
                    <span>{copy.contact.heading}</span>
                    <span>online</span>
                  </div>
                  <form className={styles.contactForm} data-contact-form="" onSubmit={handleWhitelistSubmit}>
                    <label>
                      {copy.contact.name}
                      <input type="text" name="name" placeholder={copy.contact.namePlaceholder} required />
                    </label>
                    <label>
                      {copy.contact.email}
                      <input type="email" name="email" placeholder={copy.contact.emailPlaceholder} required />
                    </label>
                    <label>
                      {copy.contact.company}
                      <input type="text" name="company" placeholder={copy.contact.companyPlaceholder} />
                    </label>
                    <label>
                      {copy.contact.subject}
                      <input type="text" name="subject" placeholder={copy.contact.subjectPlaceholder} />
                    </label>
                    <label className={styles.full}>
                      {copy.contact.message}
                      <textarea name="message" placeholder={copy.contact.messagePlaceholder} required />
                    </label>
                    {whitelistFeedback ? (
                      <div
                        className={styles.full}
                        role="status"
                        aria-live="polite"
                        style={{ color: whitelistFeedback.type === "success" ? "#14532d" : "#991b1b", fontWeight: 600 }}
                      >
                        {whitelistFeedback.message}
                      </div>
                    ) : null}
                    <div className={styles.contactActions}>
                      <button type="submit" disabled={isWhitelistSubmitting} className={`${styles.button} ${styles.buttonPrimary} contact-submit`}>
                        {isWhitelistSubmitting ? copy.contact.submitting : copy.contact.submit}
                      </button>
                      <span className={styles.contactNote}>{copy.contact.note}</span>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className={styles.contactCopy} data-contact-copy="">
              <h2 className={styles.sectionHeading}>{copy.contact.heading}</h2>
              <p className={styles.sectionCopy}>{copy.contact.body}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <a href="#hero" className={styles.brand} aria-label="paladin.mx - Volver al inicio">
            <img src="/golem-logo.svg" alt="paladin.mx" className={styles.brandLogo} />
          </a>
          <p>&copy; {new Date().getFullYear()} {copy.footer}</p>
        </div>
      </footer>

      {activeProofCard ? (
        <div
          className={styles.proofModal}
          role="dialog"
          aria-modal="true"
          aria-label={activeProofCard.name}
          onClick={() => setActiveProofCard(null)}
        >
          <div className={styles.proofModalFrame} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.proofModalClose}
              onClick={() => setActiveProofCard(null)}
              aria-label="Close screenshot"
            >
              Close
            </button>
            <div className={styles.proofModalImageWrap}>
              {activeProofCard.image ? (
                <Image src={activeProofCard.image} alt={activeProofCard.name} fill className={styles.proofModalImage} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
