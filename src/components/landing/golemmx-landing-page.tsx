"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ensureGSAP } from "@/lib/gsap";
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
      body: "golem.mx combines a helpdesk with a cloud work management platform to plan, organize, and track projects, tasks, tickets, and operational workflows in one place.",
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
      body: "golem.mx helps teams receive tickets, organize them, assign them, turn them into tasks, and track progress with a clear view of ongoing work.",
      cards: [
        { key: "one", name: "Ticket portal", copy: "Share a URL with clients so they can submit incidents and requests through a simple, organized channel.", price: "External support", tag: "HELPDESK", tone: "#dff1e4", bars: ["mid", "full", "short"] as const },
        { key: "two", name: "Automatic assignment", copy: "Each ticket can be routed automatically to the right team to reduce response times and manual work.", price: "Smart flow", tag: "AUTO", tone: "#dceaff", bars: ["full", "short", "mid"] as const },
        { key: "three", name: "Projects and tasks", copy: "Turn every ticket into actionable work with lists, Kanban boards, timelines, and assigned tasks.", price: "Real collaboration", tag: "WORK", tone: "#f1e2ff", bars: ["short", "full", "mid"] as const },
        { key: "four", name: "Centralized tracking", copy: "Track progress, distribute ownership, and split a ticket into multiple tasks without leaving the platform.", price: "Full visibility", tag: "TRACK", tone: "#ffe3c4", bars: ["mid", "short", "full"] as const },
      ],
    },
    portal: {
      heading: "From the client ticket to coordinated team execution",
      body: "Share a URL with your clients to receive requests, let the platform assign them automatically, and then collaborate with your team using boards, lists, tasks, operational KPIs, velocity metrics, client satisfaction, and centralized performance tracking.",
      title: "golem.mx operational flow",
      score: "92%",
      rows: [
        ["1", "Ticket intake", "Share a URL so your clients can create tickets and requests through a centralized channel", "Active", "var(--green)"],
        ["2", "Team routing", "Each ticket is assigned to the right team and can be distributed by priority", "Stable", "var(--blue)"],
        ["3", "Work execution", "Turn tickets into tasks, lists, and boards to manage collaborative execution", "Live", "var(--purple)"],
        ["4", "KPIs and performance", "Measure velocity, client satisfaction, response times, and team performance", "Visible", "var(--yellow)"],
      ],
    },
    contact: {
      heading: "Contact",
      body: "Request a demo through the form and tell us about your team, your support flow, or the operation you want to organize. We will help you shape the right setup and show you how golem.mx can fit your workflow.",
      name: "Name",
      email: "Email",
      company: "Company",
      subject: "Subject",
      message: "Message",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@company.com",
      companyPlaceholder: "Your company name",
      subjectPlaceholder: "Demo, support, integration...",
      messagePlaceholder: "Tell us what you need",
      submit: "Send inquiry",
      note: "Or email us directly at hola@golem.mx",
    },
    footer: "golem.mx. Helpdesk and work management in one platform.",
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
      body: "golem.mx combina un helpdesk con una plataforma de gestion de trabajo en la nube para planear, organizar y dar seguimiento a proyectos, tareas, tickets y flujos operativos desde un solo lugar.",
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
      body: "golem.mx ayuda a los equipos a recibir tickets, organizarlos, asignarlos, convertirlos en tareas y seguir el progreso con una vista clara del trabajo en curso.",
      cards: [
        { key: "one", name: "Portal de tickets", copy: "Comparte una URL con tus clientes para que reporten incidencias y solicitudes desde un canal simple y ordenado.", price: "Atencion externa", tag: "HELPDESK", tone: "#dff1e4", bars: ["mid", "full", "short"] as const },
        { key: "two", name: "Asignacion automatica", copy: "Cada ticket puede enrutarse automaticamente al equipo correcto para reducir tiempos de respuesta y evitar trabajo manual.", price: "Flujo inteligente", tag: "AUTO", tone: "#dceaff", bars: ["full", "short", "mid"] as const },
        { key: "three", name: "Proyectos y tareas", copy: "Convierte cada ticket en trabajo accionable con listas, tableros Kanban, timelines y tareas asignadas.", price: "Colaboracion real", tag: "WORK", tone: "#f1e2ff", bars: ["short", "full", "mid"] as const },
        { key: "four", name: "Seguimiento centralizado", copy: "Da seguimiento al avance, reparte responsables y divide un ticket en multiples tareas sin salir de la plataforma.", price: "Visibilidad total", tag: "TRACK", tone: "#ffe3c4", bars: ["mid", "short", "full"] as const },
      ],
    },
    portal: {
      heading: "Del ticket del cliente al trabajo coordinado del equipo",
      body: "Comparte una URL con tus clientes para recibir solicitudes, deja que la plataforma las asigne automaticamente y despues colabora con tu equipo usando tableros, listas, tareas, KPIs operativos, metricas de velocidad, satisfaccion del cliente y seguimiento centralizado del rendimiento.",
      title: "Flujo operativo de golem.mx",
      score: "92%",
      rows: [
        ["1", "Recepcion de tickets", "Comparte una URL para que tus clientes creen tickets y solicitudes desde un canal centralizado", "Activo", "var(--green)"],
        ["2", "Enrutamiento del equipo", "Cada ticket se asigna al equipo correcto y puede repartirse entre responsables segun prioridad", "Estable", "var(--blue)"],
        ["3", "Ejecucion del trabajo", "Convierte tickets en tareas, listas y tableros para dar seguimiento al trabajo colaborativo", "En linea", "var(--purple)"],
        ["4", "KPIs y rendimiento", "Mide velocidad, satisfaccion del cliente, tiempos de respuesta y desempeno del equipo", "Visible", "var(--yellow)"],
      ],
    },
    contact: {
      heading: "Contacto",
      body: "Solicita una demo desde el formulario y cuentanos sobre tu equipo, tu flujo de soporte o la operacion que quieres organizar. Te ayudamos a definir la mejor implementacion y a entender como golem.mx se adapta a tu flujo de trabajo.",
      name: "Nombre",
      email: "Email",
      company: "Empresa",
      subject: "Tema",
      message: "Mensaje",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@empresa.com",
      companyPlaceholder: "Nombre de tu empresa",
      subjectPlaceholder: "Demo, soporte, integracion...",
      messagePlaceholder: "Cuentanos que necesitas",
      submit: "Enviar consulta",
      note: "O escribenos directo a hola@golem.mx",
    },
    footer: "golem.mx. Helpdesk y gestion de trabajo en una sola plataforma.",
  },
} as const;

export function GolemMxLandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { locale, setLocale } = useLanguage();
  const copy = landingCopy[locale];
  const marketCards = copy.market.cards;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return;

    const gsap = ensureGSAP();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo("[data-landing-nav]", { y: -42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
      gsap.fromTo("[data-hero-copy] > *", { y: 54, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.12 });
      gsap.fromTo("[data-hero-dashboard]", { y: 95, rotateY: -34, rotateX: 20, rotateZ: 9, opacity: 0 }, { y: 0, rotateY: -13, rotateX: 7, rotateZ: 2, opacity: 1, duration: 1.25, ease: "power3.out", delay: 0.32 });
      gsap.fromTo("[data-app-card]", { scale: 0.68, y: 70, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "back.out(1.8)", delay: 0.8 });

      gsap.fromTo("[data-market-copy]", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: "[data-market-stage]", start: "top 82%" } });
      gsap.fromTo("[data-product-card]", { y: 120, z: -180, rotateX: 14, opacity: 0 }, { y: 0, z: 0, rotateX: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: "[data-market-stage]", start: "top 78%" } });

      marketCards.forEach((card, index) => {
        gsap.to(`[data-product-card='${card.key}']`, {
          x: [54, 12, -20, -54][index],
          y: [-18, 26, -26, 18][index],
          rotateY: [8, 0, 0, -8][index],
          rotateZ: [-2, 2, -2, 2][index],
          ease: "none",
          scrollTrigger: { trigger: "[data-market-stage]", start: "top 75%", end: "bottom top", scrub: 1 },
        });
      });

      gsap.to("[data-market-scene]", {
        scale: 1.04,
        y: -18,
        ease: "none",
        scrollTrigger: { trigger: "[data-market-stage]", start: "top 75%", end: "bottom top", scrub: 1 },
      });

      gsap.fromTo("[data-portal-copy]", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "[data-portal]", start: "top 82%" } });
      gsap.fromTo("[data-portal-window]", { x: 100, y: 48, rotateY: 24, rotateX: 10, opacity: 0 }, { x: 0, y: 0, rotateY: 10, rotateX: 5, opacity: 1, duration: 0.95, ease: "power3.out", scrollTrigger: { trigger: "[data-portal]", start: "top 78%" } });
      gsap.fromTo("[data-portal-row]", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: "back.out(1.4)", scrollTrigger: { trigger: "[data-portal-window]", start: "top 82%" } });
      gsap.to("[data-portal-window]", { rotateY: -5, rotateX: -2, y: -26, ease: "none", scrollTrigger: { trigger: "[data-portal]", start: "top 75%", end: "bottom top", scrub: 1 } });

      gsap.fromTo("[data-contact-copy] > *", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "[data-contact]", start: "top 82%" } });
      gsap.fromTo("[data-contact-machine]", { x: -100, y: 48, rotateY: -22, rotateX: 10, opacity: 0 }, { x: 0, y: 0, rotateY: 0, rotateX: 0, opacity: 1, duration: 0.95, ease: "power3.out", scrollTrigger: { trigger: "[data-contact]", start: "top 78%" } });
      gsap.fromTo("[data-contact-form] label, [data-contact-form] .contact-submit", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: "[data-contact-window]", start: "top 84%" } });

    }, rootRef);

    return () => ctx.revert();
  }, [marketCards]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [locale]);

  return (
    <div ref={rootRef} className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Saltar al contenido</a>
      <div className={styles.grain} aria-hidden="true" />

      <header className={`${styles.nav} ${isMobileMenuOpen ? styles.navMenuOpen : styles.navMenuClosed}`} data-landing-nav="">
        <a href="#hero" className={styles.brand} aria-label="golem.mx - Ir al inicio">
          <img src="/golem-logo.svg" alt="golem.mx" className={styles.brandLogo} />
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

        <section id="mercado" className={`${styles.section} ${styles.marketStage}`} data-market-stage="">
          <div className={styles.container}>
            <h2 className={styles.sectionHeading} data-market-copy="">{copy.market.heading}</h2>
            <p className={styles.sectionCopy} data-market-copy="">{copy.market.body}</p>

            <div className={styles.marketScene} data-market-scene="">
              {copy.market.cards.map((card) => (
                <article key={card.name} className={styles.productCard} data-product-card={card.key}>
                  <div className={styles.productVisual} style={{ background: card.tone }} aria-hidden="true">
                    {card.bars.map((bar, index) => (
                      <div key={`${card.name}-${index}`} className={`${styles.bar} ${bar === "short" ? styles.barShort : ""} ${bar === "mid" ? styles.barMid : ""}`} />
                    ))}
                  </div>
                  <h3>{card.name}</h3>
                  <p>{card.copy}</p>
                  <div className={styles.productFooter}>
                    <span>{card.price}</span>
                    <span className={styles.pill}>{card.tag}</span>
                  </div>
                </article>
              ))}
              <div className={styles.shelfBase} aria-hidden="true" />
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
                  <form className={styles.contactForm} data-contact-form="" action="mailto:hola@golem.mx" method="post" encType="text/plain">
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
                    <div className={styles.contactActions}>
                      <button type="submit" className={`${styles.button} ${styles.buttonPrimary} contact-submit`}>{copy.contact.submit}</button>
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
          <a href="#hero" className={styles.brand} aria-label="golem.mx - Volver al inicio">
            <img src="/golem-logo.svg" alt="golem.mx" className={styles.brandLogo} />
          </a>
          <p>&copy; {new Date().getFullYear()} {copy.footer}</p>
        </div>
      </footer>
    </div>
  );
}
