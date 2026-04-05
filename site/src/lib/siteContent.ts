import type { PortableTextBlock } from "@portabletext/types";

/** Normalized shape used by homepage components (Sanity or fallback). */
export type ServiceItem = {
  title: string;
  body: string;
  accent: "teal" | "coral" | "gold" | "lavender";
};

export type OutcomeItem = {
  title: string;
  body: string;
};

export type HeroSlide = {
  headline: string;
  sub: string;
};

export type HomePageData = {
  tagline: string;
  hero: {
    slides: HeroSlide[];
    primaryCta: { href: string; label: string };
    secondaryCta: { href: string; label: string; external?: boolean };
    cardTitle: string;
    cardBody: string;
  };
  sayYesHeading: string;
  nada: {
    title: string;
    subtitle: string;
    bullets: string[];
    ctaLabel: string;
    ctaUrl: string;
  };
  painPoints: string[];
  about: {
    lead: string;
    body: string;
    avadhi: string;
  };
  servicesIntro: string;
  servicesSub: string;
  services: ServiceItem[];
  sessionCadence: { title: string; body: string };
  outcomes: OutcomeItem[];
  testimonial: { quote: string; name: string };
  aboutDetailed: {
    mission: string;
    bioParagraphs: string[];
    coreValues: string[];
    oath: string;
  };
};

export type SiteSettingsData = {
  title: string;
  description: string;
  whatsappUrl: string;
  nadaAcademyUrl: string;
};

export type BlogPostData = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  body?: PortableTextBlock[] | null;
};

/** Fallback aligned with https://www.evolvewithavadhi.com (no fake statistics). */
export const FALLBACK_HOME: HomePageData = {
  tagline: "Empower. Thrive. Transcend.",
  hero: {
    slides: [
      {
        headline: "I help millennials in India create epic lives, relationships, and marriages.",
        sub: "Psychotherapy, couples work, and spiritual growth — approachable, conversational, and rooted in care.",
      },
      {
        headline: "I work with individuals ready to break patterns and create soul-aligned lives & relationships.",
        sub: "A blend of modern psychology, ancient wisdom, and spiritual tools — designed for real transformation.",
      },
    ],
    primaryCta: { href: "/contact", label: "Connect now" },
    secondaryCta: {
      href: "https://api.whatsapp.com/send?phone=919103196107",
      label: "Text us to schedule",
      external: true,
    },
    cardTitle: "Now offering secure online counselling and therapy",
    cardBody:
      "We are here to support you and the relationships most important to you, even from a distance — and to answer questions about your tele-therapy process.",
  },
  sayYesHeading: "Say “yes” to yourself this time.",
  nada: {
    title: "Unlock Your Healing Potential with Nada Wellness Academy",
    subtitle:
      "Ready to step into your true power and become the guide your soul is calling for? Join our Sound Healing Academy and learn the ancient art of Nada Yoga, combined with modern techniques in psychology, neuroscience, and Ayurveda.",
    bullets: [
      "Deep Healing",
      "Balance & Harmony",
      "Transformation",
      "Spiritual Alignment",
      "Personal Growth & Empowerment",
    ],
    ctaLabel: "Join now",
    ctaUrl: "https://chat.whatsapp.com/LX8BDiF83M8CFBweL0IbDx",
  },
  painPoints: [
    "Do you feel paralysed by FOMO, anxiety and panic attacks?",
    "Are you wondering why relationships are so damn hard?",
    "Do mental health disorders and labels make you hide your true self?",
    "Or is taking help for your mental health still a big no-no?",
    "What if mental health labels are superpowers in disguise?",
    "Would you be willing to dive into your true powers?",
  ],
  about: {
    lead: "You’re in the right place.",
    body: "The heart of what I do is provide space and care for you and your relationships in our community. I want to make an impact by helping singles and couples do their lives and relationships WELL so that you can have the life you dream of having. Take a look around. I know adulting and adult relationships are tough and I am here to help.",
    avadhi:
      "Avadhi Sharma is a renowned psychologist and facilitator of consciousness and change. For over 8 years now, Avadhi has been creating mental health and spiritual awareness, and inviting people worldwide to embrace their true healed divine selves — people from every culture, country, age and social strata of society.",
  },
  servicesIntro: "Approachable. Conversational. Encouraging.",
  servicesSub:
    "I provide 60 minutes counselling and therapy sessions to adults age 18 and up. Typically I meet clients on a weekly basis, though due to scheduling needs and other factors this may vary. Expecting weekly sessions is a good start, but we can surely discuss what works best for you.",
  services: [
    {
      title: "Individual counseling & therapy",
      body: `It is like a physical trainer, but for your mind and soul. Do you feel sad or anxious a lot of the time? Are you confused about your next steps in life? Are you grieving the loss of someone important to you? Do you struggle to understand why you feel good for periods of time but always end up back in that familiar stuck place? Maybe you simply want to get to know yourself better? Whatever the reason, Individual Therapy can help!`,
      accent: "teal",
    },
    {
      title: "Couple counseling & therapy",
      body: `Are you and your partner having the same fights over and over? Do you worry it might be too late to save your marriage? Could you use some help thinking through important decisions like whether or not to have kids? Do you and your partner have different hopes and desires for the future? Are you struggling to heal after one of you lied or cheated? Whatever your relationship needs, Couples counselling with Avadhi can help!`,
      accent: "coral",
    },
    {
      title: "Adulting / personal growth",
      body: `FOMO, STRESS or just trying to find your path in this one life you have got to live. Friend, I have got you. Some of the best work you can do is giving yourself the gift of time and space to go inward and cultivate your best self. We are all about this journey and I am honored to walk with you on yours.`,
      accent: "gold",
    },
    {
      title: "Spiritual growth",
      body: `Spiritual growth is the process of inner awakening, rising of the consciousness beyond the ordinary, everyday existence, and awakening to some Universal truths. It means going beyond the mind and the ego and realizing who you really are. We offer 1) Sound healing, 2) Energy clearings, 3) Meditation circles and mindfulness tools and techniques that help an individual transcend beyond the limitations and create greater good not just for oneself but for everyone.`,
      accent: "lavender",
    },
  ],
  sessionCadence: {
    title: "How often should I/we meet for sessions?",
    body: `This is a great question, which depends on your presenting issues and the therapeutic approach that your therapist feels will most benefit you. Typically, the counseling process can take anywhere from 8–20 sessions before you notice change. This, of course, depends on your motivation and the efforts that you apply between the sessions.`,
  },
  outcomes: [
    {
      title: "Stress & emotional balance",
      body: "Members report better emotional balance at home and in the workplace — with practical tools they can use between sessions.",
    },
    {
      title: "Mental chatter",
      body: "Many people experience fewer spiralling thoughts and more clarity — not “positive thinking” lectures, but skills that fit real life.",
    },
    {
      title: "Resilience",
      body: "Clients often describe stronger mental resilience and a kinder relationship with themselves as therapy progresses.",
    },
    {
      title: "Ancient wisdom + modern therapy",
      body: "Sessions blend evidence-based approaches with depth, spirituality, and respect for your story.",
    },
  ],
  testimonial: {
    quote: `I’ve done 5 sessions with Avadhi Sharma now and I can recall myself before that. She works at such a psychological and energy levels that it doesn’t even seem like a session. The transition is so smooth that I didn’t notice when it was happening. I’ve been to some clinics before when I was made to sit down and lectured on how I should think positively. It doesn’t work. I’m glad I found a gem like Avadhi who doesn’t judge or make me feel I’m incompetent to deal with my feelings. Kudos to you!`,
    name: "Nicole Kepling",
  },
  aboutDetailed: {
    mission:
      "I am passionately committed to cultivating a world where mental health is destigmatized, where healing is within reach for everyone, holistic approaches are embraced, and individuals are empowered with the tools to navigate life's challenges with resilience, strength, and the ability to rewrite their stories, reclaiming their lives.",
    bioParagraphs: [
      `Are you tired of therapists who seem disconnected from your reality? I hear you. In a world where therapy sometimes feels like a scene from a movie, it's no wonder you may be skeptical. But let me assure you, I'm not your typical therapist.`,
      `I became a psychotherapist (although that label feels limiting) because I couldn't find someone who truly understood what I was going through with my cancer-labeled parents and my own struggles. Countless times, I sat across from professionals who seemed polished but failed to grasp the depth of my experiences. It was a defining moment when I witnessed my mother's heartbreak after a therapist dismissed her chronic fatigue as unsolvable. I knew then that I had to embark on a journey into psychology and healing.`,
      `Supported by divine guidance from my gurus and armed with years of research and personal healing, I discovered that healing is anything but linear. It's a holistic integration of mind, body, and spirit. That's why I use a powerful blend of researched techniques, empowering life coaching, ancient sound healing, and mystical energy healing tools. Together, we'll break free from the shackles of your past and equip you with the tools to create your own present and future.`,
      `Forget the clichéd therapists you've seen on TV or in movies — the ones who ask how you feel and speak in monotones that could put anyone to sleep. I'm here to bring a breath of fresh air to the therapeutic space. I'm personable, genuine, and laid-back. Known for my enthusiasm and warm personality, I make it easy for you to open up about anything. You'll find me laughing at your jokes, sharing your favorite dog videos or friends memes before we dive into our sessions. And yes, you'll often catch me cross-legged in my chair, wearing loose pants (let's keep it real!).`,
      `But here's the exciting part: the journey doesn't end with healing the past. Now that you're no longer burdened by it, where do you stand in the present, and where do you envision your future? It's time for you to become the creator of your own destiny. Let's tap into the limitless possibilities that lie ahead. How much fun would that be?`,
      `As you emerge from your initial healing sessions, you'll be like a newborn, seeing the world with fresh eyes and embracing the profound wisdom within you. I understand that sometimes, the lack of a supportive environment can make you feel lost. That's why I'm here to support you with spiritual wisdom, mindfulness techniques, meditation, and somatic healing. Together, we'll embark on a journey that aligns with your life vision.`,
    ],
    coreValues: [
      "Demonstrating empathy, understanding, and care towards every individual I work with. Prioritizing the well-being and emotional needs of my clients and my co-workers.",
      "I value the inherent worth and dignity of every person, treating them with respect and honouring their unique perspectives and experiences.",
      "Fostering a sense of empowerment in my clients, helping them recognize their strengths and capabilities to overcome challenges and achieve personal growth.",
      "Encouraging an environment of authenticity and genuineness, where my clients feel safe to express themselves without judgment.",
      "Embracing humanistic approach to therapy that recognizes and celebrates the innate potential and self-actualization of each individual.",
      "Promoting holistic well-being by considering the interconnectedness of mind, body, and spirit, and addressing various aspects of a person's life in therapy and counselling and overall healing process.",
      "Holding space and creating a non-judgmental space where my clients can explore their thoughts, feelings, and experiences without fear of criticism or condemnation.",
      "Supporting and guiding my clients in their journey of personal growth, by helping you to develop resilience, self-awareness, and positive contributive changes in your lives.",
    ],
    oath: "I pledge to commit to unwavering ethical practice, upholding integrity and trust in all aspects of my work. I pledge to cultivate compassion, embracing kindness and understanding towards myself as the foundation for emotional well-being. I pledge non-judgment, embracing acceptance and compassion for all individuals without bias or criticism.",
  },
};

export const FALLBACK_SETTINGS: SiteSettingsData = {
  title: "Evolve with Avadhi — Therapy, couples work & spiritual growth",
  description:
    "Psychotherapy and couples counselling for millennials in India — plus spiritual growth, sound healing, and secure online sessions.",
  whatsappUrl: "https://api.whatsapp.com/send?phone=919103196107",
  nadaAcademyUrl: "https://chat.whatsapp.com/LX8BDiF83M8CFBweL0IbDx",
};

/** Footer / CTAs */
export function externalLinksFromSettings(s: SiteSettingsData) {
  return {
    whatsappBook: s.whatsappUrl,
    nadaAcademy: s.nadaAcademyUrl,
  };
}

export const FALLBACK_BLOG_POSTS: BlogPostData[] = [
  {
    slug: "loves-dilemma-navigating-the-sunk-cost-fallacy-in-relationships",
    title:
      "Love’s dilemma: navigating the sunk cost fallacy in relationships",
    excerpt:
      "Breakthrough methods are confidential & effective — our specializations in relationship dynamics.",
    publishedAt: "2024-04-10T00:00:00.000Z",
  },
  {
    slug: "cultivating-self-awareness-how-regular-reflection-can-help-identify-strengths-weaknesses-and-core-values",
    title:
      "Cultivating self-awareness: how regular reflection can help identify strengths, weaknesses, and core values",
    excerpt:
      "How regular reflection helps you see strengths, gaps, and core values with clarity.",
    publishedAt: "2024-02-16T00:00:00.000Z",
  },
  {
    slug: "the-art-of-emotional-intelligence-in-workplace",
    title: "The art of emotional intelligence in the workplace",
    excerpt:
      "Practical emotional intelligence ideas for healthier teams and leadership.",
    publishedAt: "2023-12-22T00:00:00.000Z",
  },
];
