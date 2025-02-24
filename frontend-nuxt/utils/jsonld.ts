interface Organization {
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
}

interface SoftwareApplication {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    price: string;
    priceCurrency: string;
  };
}

interface BlogPosting {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
  };
}

export const generateOrganizationLD = (org: Organization) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
    sameAs: org.sameAs
  };
};

export const generateSoftwareApplicationLD = (app: SoftwareApplication) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    applicationCategory: app.applicationCategory,
    operatingSystem: app.operatingSystem,
    offers: {
      '@type': 'Offer',
      price: app.offers.price,
      priceCurrency: app.offers.priceCurrency
    }
  };
};

export const generateBlogPostingLD = (post: BlogPosting) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    description: post.description,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: post.author
  };
};

export const defaultOrganization: Organization = {
  name: 'BrandCraft',
  url: 'https://brandcraft.art',
  logo: 'https://brandcraft.art/logo.png',
  sameAs: [
    'https://twitter.com/brandcraft',
    'https://facebook.com/brandcraft',
    'https://instagram.com/brandcraft',
    'https://linkedin.com/company/brandcraft'
  ]
};

export const defaultSoftwareApplication: SoftwareApplication = {
  name: 'BrandCraft - Social Media Management Platform',
  description: 'Comprehensive social media management platform for scheduling, analytics, and content creation across multiple platforms.',
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'Web',
  offers: {
    price: '0',
    priceCurrency: 'USD'
  }
};
