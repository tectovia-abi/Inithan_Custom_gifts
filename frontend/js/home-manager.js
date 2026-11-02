// =========================================================================
// HOMEPAGE DYNAMIC MANAGER - Inithan Custom Gifts
// Reads /api/homepage-config & /api/products to dynamically populate
// section titles, subtitles, visibility toggles, and product display counts.
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initDynamicHomepage();
});

async function initDynamicHomepage() {
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;

  try {
    const [cfgRes, prodRes] = await Promise.all([
      fetch(`${apiBase}/api/homepage-config`).catch(() => null),
      fetch(`${apiBase}/api/products`).catch(() => null)
    ]);

    const cfgData = cfgRes ? await cfgRes.json() : null;
    const prodData = prodRes ? await prodRes.json() : null;

    if (cfgData && cfgData.success && cfgData.config) {
      applyHomepageConfig(cfgData.config, prodData && prodData.success ? prodData.products : null);
    }
  } catch (err) {
    console.debug('Dynamic homepage manager info:', err);
  }
}

function applyHomepageConfig(config, dbProducts) {
  if (!config) return;

  // 0. Top Header Navigation Bar (#navbar)
  if (config.navbar) {
    if (config.navbar.logoUrl) {
      const logoImgs = document.querySelectorAll('#navLogoImg, .footer-logo-img');
      logoImgs.forEach(img => { img.src = config.navbar.logoUrl; });
    }
    if (config.navbar.brandName) {
      document.querySelectorAll('.nav-brand-name').forEach(el => { el.textContent = config.navbar.brandName; });
    }
    if (config.navbar.brandTagline) {
      document.querySelectorAll('.nav-brand-tagline').forEach(el => { el.textContent = config.navbar.brandTagline; });
    }
    // Update the 8 navbar menu links without changing their count
    if (Array.isArray(config.navbar.links) && config.navbar.links.length > 0) {
      const navLinkEls = document.querySelectorAll('#navLinks a');
      config.navbar.links.forEach((linkData, idx) => {
        if (navLinkEls[idx]) {
          if (linkData.text) navLinkEls[idx].textContent = linkData.text;
          if (linkData.url) navLinkEls[idx].setAttribute('href', linkData.url);
        }
      });
    }
  }

  // 1. Hero Section (#home)
  const heroSec = document.getElementById('home');
  if (heroSec && config.hero) {
    if (config.hero.enabled === false) {
      heroSec.style.display = 'none';
    } else {
      // Mascot image (Left of hero)
      if (config.hero.mascotImageUrl) {
        const mascotImg = heroSec.querySelector('.mascot-img');
        if (mascotImg) mascotImg.src = config.hero.mascotImageUrl;
      }

      // Single hero image fallback (index2.html)
      const singleHeroImg = heroSec.querySelector('#heroImage');
      if (singleHeroImg && Array.isArray(config.hero.slides) && config.hero.slides[0] && config.hero.slides[0].imageUrl) {
        singleHeroImg.src = config.hero.slides[0].imageUrl;
      }

      // 5 Hero runner showcase banner slides (index.html)
      if (Array.isArray(config.hero.slides) && config.hero.slides.length > 0) {
        const slideEls = heroSec.querySelectorAll('.runner-slides-track .runner-slide');
        config.hero.slides.forEach((slideData, idx) => {
          if (slideEls[idx]) {
            if (slideData.link) slideEls[idx].setAttribute('href', slideData.link);
            const imgEl = slideEls[idx].querySelector('.runner-slide-img-box img');
            if (imgEl && slideData.imageUrl) imgEl.src = slideData.imageUrl;
            const badgeEl = slideEls[idx].querySelector('.runner-badge');
            if (badgeEl && slideData.badge) badgeEl.textContent = slideData.badge;
            const titleEl = slideEls[idx].querySelector('.runner-slide-title');
            if (titleEl && slideData.title) titleEl.textContent = slideData.title;
            const subEl = slideEls[idx].querySelector('.runner-slide-sub');
            if (subEl && slideData.subtitle) subEl.textContent = slideData.subtitle;
            const ctaEl = slideEls[idx].querySelector('.runner-slide-cta');
            if (ctaEl && slideData.ctaText) ctaEl.textContent = slideData.ctaText;
          }
        });
      }

      const scriptEl = heroSec.querySelector('.hero-ref-script');
      if (scriptEl && config.hero.scriptText) scriptEl.textContent = config.hero.scriptText;

      const headEl = heroSec.querySelector('.hero-ref-headline');
      if (headEl && config.hero.headline) {
        headEl.innerHTML = config.hero.headline.includes('<span') ? config.hero.headline : `INTO <span class="highlight-red">${escapeHtml(config.hero.headline.replace(/^into\s*/i, ''))}</span>`;
      }

      const subEl = heroSec.querySelector('.hero-ref-sub');
      if (subEl && config.hero.subheadline) subEl.textContent = config.hero.subheadline;

      const cta1 = heroSec.querySelector('.hero-ref-btn.btn-primary') || heroSec.querySelector('.hero-btn-explore');
      if (cta1) {
        if (config.hero.ctaPrimaryText) cta1.textContent = config.hero.ctaPrimaryText;
        if (config.hero.ctaPrimaryLink) cta1.setAttribute('href', config.hero.ctaPrimaryLink);
      }

      const cta2 = heroSec.querySelector('.hero-ref-btn.btn-outline');
      if (cta2) {
        if (config.hero.ctaSecondaryText) cta2.textContent = config.hero.ctaSecondaryText;
        if (config.hero.ctaSecondaryLink) cta2.setAttribute('href', config.hero.ctaSecondaryLink);
      }
    }
  }

  // 2. Shop By Category (#shop-category)
  const catSec = document.getElementById('shop-category');
  if (catSec && config.shopCategory) {
    if (config.shopCategory.enabled === false) {
      catSec.style.display = 'none';
    } else {
      catSec.style.display = '';
      const titleEl = catSec.querySelector('.home-section-title');
      if (titleEl && config.shopCategory.title) titleEl.innerHTML = formatSectionTitle(config.shopCategory.title);

      const subEl = catSec.querySelector('.home-section-subtitle');
      if (subEl && config.shopCategory.subtitle) subEl.textContent = config.shopCategory.subtitle;

      // Update the 10 category cards photo, title & link without changing count
      if (Array.isArray(config.shopCategory.items) && config.shopCategory.items.length > 0) {
        const catCardEls = catSec.querySelectorAll('.category-collections-grid .cat-collection-card');
        config.shopCategory.items.forEach((itemData, idx) => {
          if (catCardEls[idx]) {
            if (itemData.title) {
              const titleSpan = catCardEls[idx].querySelector('.cat-card-title');
              if (titleSpan) titleSpan.textContent = itemData.title;
            }
            if (itemData.imageUrl) {
              const imgEl = catCardEls[idx].querySelector('img');
              if (imgEl) imgEl.src = itemData.imageUrl;
            }
            if (itemData.link) {
              catCardEls[idx].setAttribute('href', itemData.link);
            }
          }
        });
      }
    }
  }

  // 3. For Relationship (#shop-relationship)
  const relSec = document.getElementById('shop-relationship');
  if (relSec && config.shopRelationship) {
    if (config.shopRelationship.enabled === false) {
      relSec.style.display = 'none';
    } else {
      relSec.style.display = '';
      const titleEl = relSec.querySelector('.home-section-title');
      if (titleEl && config.shopRelationship.title) titleEl.innerHTML = formatSectionTitle(config.shopRelationship.title);

      const subEl = relSec.querySelector('.home-section-subtitle');
      if (subEl && config.shopRelationship.subtitle) subEl.textContent = config.shopRelationship.subtitle;
    }
  }

  // 4. Gifts by Budget (#gifts-budget)
  const budSec = document.getElementById('gifts-budget');
  if (budSec && config.giftsBudget) {
    if (config.giftsBudget.enabled === false) {
      budSec.style.display = 'none';
    } else {
      budSec.style.display = '';
      const titleEl = budSec.querySelector('.home-section-title');
      if (titleEl && config.giftsBudget.title) titleEl.innerHTML = formatSectionTitle(config.giftsBudget.title);

      const subEl = budSec.querySelector('.home-section-subtitle');
      if (subEl && config.giftsBudget.subtitle) subEl.textContent = config.giftsBudget.subtitle;
    }
  }

  // 5. Celebrate Every Occasion (#home-occasions)
  const occSec = document.getElementById('home-occasions');
  if (occSec && config.homeOccasions) {
    if (config.homeOccasions.enabled === false) {
      occSec.style.display = 'none';
    } else {
      occSec.style.display = '';
      const titleEl = occSec.querySelector('.home-section-title');
      if (titleEl && config.homeOccasions.title) titleEl.innerHTML = formatSectionTitle(config.homeOccasions.title);

      const subEl = occSec.querySelector('.home-section-subtitle');
      if (subEl && config.homeOccasions.subtitle) subEl.textContent = config.homeOccasions.subtitle;

      // Dynamic Product Count limiter
      const maxCount = config.homeOccasions.maxProductsCount || 8;
      applyMarqueeCountLimit('#home-occasions', maxCount, dbProducts);
    }
  }

  // 6. Discover Unique Creations (#unique-collection)
  const uniqSec = document.getElementById('unique-collection');
  if (uniqSec && config.uniqueCollection) {
    if (config.uniqueCollection.enabled === false) {
      uniqSec.style.display = 'none';
    } else {
      uniqSec.style.display = '';
      const titleEl = uniqSec.querySelector('.home-section-title');
      if (titleEl && config.uniqueCollection.title) titleEl.innerHTML = formatSectionTitle(config.uniqueCollection.title);

      const subEl = uniqSec.querySelector('.home-section-subtitle');
      if (subEl && config.uniqueCollection.subtitle) subEl.textContent = config.uniqueCollection.subtitle;

      // Dynamic Product Count limiter
      const maxCount = config.uniqueCollection.maxProductsCount || 8;
      applyMarqueeCountLimit('#unique-collection', maxCount, dbProducts);
    }
  }

  // 7. Customer Reviews (#customer-reviews)
  const revSec = document.getElementById('customer-reviews');
  if (revSec && config.customerReviews) {
    if (config.customerReviews.enabled === false) {
      revSec.style.display = 'none';
    } else {
      revSec.style.display = '';
      const titleEl = revSec.querySelector('.home-section-title');
      if (titleEl && config.customerReviews.title) titleEl.innerHTML = formatSectionTitle(config.customerReviews.title);

      const subEl = revSec.querySelector('.home-section-subtitle');
      if (subEl && config.customerReviews.subtitle) subEl.textContent = config.customerReviews.subtitle;

      // Control review cards count
      const maxReviews = config.customerReviews.maxReviewsCount || 3;
      const reviewCards = revSec.querySelectorAll('.customer-review-card');
      reviewCards.forEach((card, index) => {
        card.style.display = index < maxReviews ? '' : 'none';
      });
    }
  }
}

// Limit the number of product cards visible in a marquee section
function applyMarqueeCountLimit(sectionSelector, maxCount, dbProducts) {
  const section = document.querySelector(sectionSelector);
  if (!section) return;

  const groups = section.querySelectorAll('.occasions-marquee-group, .unique-marquee-group');
  groups.forEach(group => {
    const cards = group.querySelectorAll('.occ-product-card');
    cards.forEach((card, idx) => {
      if (idx < maxCount) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

function formatSectionTitle(rawTitle) {
  if (!rawTitle) return '';
  // Wrap trailing emoji in <span class="heart-accent">
  const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)$/u;
  const match = rawTitle.match(emojiRegex);
  if (match) {
    const textPart = rawTitle.slice(0, match.index).trim();
    return `${escapeHtml(textPart)} <span class="heart-accent">${match[0]}</span>`;
  }
  return escapeHtml(rawTitle);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
