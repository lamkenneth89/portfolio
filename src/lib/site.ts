export const site = {
  name: 'Kenneth Lam',
  role: 'Analytics, CRM & AI-assisted engineering',
  tagline:
    'Portfolio of Kenneth Lam — customer and digital analytics in banking and consumer brands, CRM strategy, and the software he builds with AI.',
  location: 'Hong Kong',
  email: 'lamkenneth89@gmail.com',
  resume:
    'https://drive.google.com/file/d/1MXE_T88pa3901aET01uZx4XhEQ-D9yPh/view?usp=sharing',
  socials: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/kenneth-lam-0809?utm_source=personal_website&utm_medium=personal_website',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/lamkenneth89?utm_source=personal_website&utm_medium=personal_website',
    },
    {
      label: 'Tableau Public',
      href: 'https://public.tableau.com/app/profile/kenneth.lam',
    },
  ],
  nav: [
    { label: 'Work', href: '/#work' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/#contact' },
  ],
  /** GA4 property in use since 2025. */
  ga4: 'G-5LS37NMPYN',
  /**
   * GTM web container, e.g. 'GTM-XXXXXXX'. Until this is filled in the site
   * falls back to the plain gtag snippet, so measurement never goes dark
   * between creating the container and configuring its tags.
   * See docs/tracking-spec.md.
   */
  gtm: '',
} as const;

export const facts = [
  { label: 'Based', value: 'Hong Kong' },
  { label: 'Focus', value: 'Customer analytics · CRM · AI builds' },
  { label: 'Worked at', value: 'Standard Chartered · Dyson · Viu · Mattel' },
  { label: 'Certified', value: 'Professional Scrum Master' },
] as const;
