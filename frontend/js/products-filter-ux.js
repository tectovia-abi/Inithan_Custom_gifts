// ============================================================
//  INITHAN — PRODUCTS PAGE FILTER UX ENHANCEMENT
//  Handles: Show More/Less, sidebar scroll shadows,
//           mobile filter drawer, body scroll-lock.
// ============================================================

const FILTER_VISIBLE_LIMIT = {
  desktop: 6,
  tablet:  6,
  mobile:  5,
};

const _filterExpandState = {};

function _getVisibleLimit() {
  const w = window.innerWidth;
  if (w <= 600)  return FILTER_VISIBLE_LIMIT.mobile;
  if (w <= 992)  return FILTER_VISIBLE_LIMIT.tablet;
  return FILTER_VISIBLE_LIMIT.desktop;
}

function _countActiveFilters() {
  return document.querySelectorAll(
    '.cat-filter-db:checked, .occ-filter-db:checked, .price-filter-db:checked'
  ).length;
}

function _updateMobileBadge() {
  const badge = document.querySelector('.mob-filter-badge');
  if (!badge) return;
  const count = _countActiveFilters();
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
}

function applyShowMoreToFilterList(listEl, groupId) {
  if (!listEl) return;

  const limit = _getVisibleLimit();
  const items = Array.from(listEl.querySelectorAll('.filter-item'));

  if (items.length <= limit) return;

  const existing = listEl.querySelector('.filter-overflow');
  const existingBtn = listEl.parentElement
    ? listEl.parentElement.querySelector('.filter-show-more-btn')
    : null;
  if (existing) existing.remove();
  if (existingBtn) existingBtn.remove();

  const extraItems = items.slice(limit);
  const hasCheckedExtra = extraItems.some(
    lbl => lbl.querySelector('input') && lbl.querySelector('input').checked
  );

  if (hasCheckedExtra && !_filterExpandState[groupId]) {
    _filterExpandState[groupId] = true;
  }

  const overflowId = `filter-overflow-${groupId}`;
  const overflowDiv = document.createElement('div');
  overflowDiv.className = 'filter-overflow' + (_filterExpandState[groupId] ? ' expanded' : '');
  overflowDiv.id = overflowId;
  extraItems.forEach(lbl => overflowDiv.appendChild(lbl));
  listEl.appendChild(overflowDiv);

  const remainingCount = extraItems.length;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'filter-show-more-btn';
  btn.setAttribute('aria-expanded', _filterExpandState[groupId] ? 'true' : 'false');
  btn.setAttribute('aria-controls', overflowId);
  btn.innerHTML = _filterExpandState[groupId]
    ? `<span class="smb-chevron">▲</span> Show Less`
    : `<span class="smb-chevron">▼</span> + Show ${remainingCount} More`;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const newState = !expanded;

    _filterExpandState[groupId] = newState;
    btn.setAttribute('aria-expanded', String(newState));
    overflowDiv.classList.toggle('expanded', newState);
    btn.innerHTML = newState
      ? `<span class="smb-chevron">▲</span> Show Less`
      : `<span class="smb-chevron">▼</span> + Show ${remainingCount} More`;
  });

  listEl.parentElement.insertBefore(btn, listEl.nextSibling);
}

function initFilterShowMore() {
  applyShowMoreToFilterList(
    document.getElementById('sidebarCategoryFilters'),
    'category'
  );
  applyShowMoreToFilterList(
    document.getElementById('sidebarOccasionFilters'),
    'occasion'
  );
}

function _updateSidebarScrollShadow(sidebar) {
  if (!sidebar) return;
  const hasAbove = sidebar.scrollTop > 0;
  const hasBelow = sidebar.scrollTop + sidebar.clientHeight < sidebar.scrollHeight - 1;
  sidebar.classList.toggle('shadow-top', hasAbove);
  sidebar.classList.toggle('shadow-bottom', hasBelow);
}

function initSidebarScrollShadow() {
  const sidebar = document.querySelector('.products-sidebar');
  if (!sidebar) return;

  const update = () => _updateSidebarScrollShadow(sidebar);
  sidebar.addEventListener('scroll', update, { passive: true });
  requestAnimationFrame(update);
  window.addEventListener('resize', update, { passive: true });
}

let _prevBodyScrollY = 0;

function _lockBodyScroll() {
  const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-w', scrollBarW + 'px');
  _prevBodyScrollY = window.scrollY;
  document.body.classList.add('scroll-locked');
}

function _unlockBodyScroll() {
  document.body.classList.remove('scroll-locked');
  document.documentElement.style.removeProperty('--scrollbar-w');
  window.scrollTo({ top: _prevBodyScrollY, behavior: 'instant' });
}

function openMobileFilterDrawer() {
  const overlay = document.getElementById('mobileFilterOverlay');
  const drawer  = document.getElementById('mobileFilterDrawer');
  if (!overlay || !drawer) return;

  _syncMobileDrawerFromSidebar();
  _lockBodyScroll();
  overlay.classList.add('open');
  requestAnimationFrame(() => drawer.classList.add('open'));
}

function closeMobileFilterDrawer() {
  const overlay = document.getElementById('mobileFilterOverlay');
  const drawer  = document.getElementById('mobileFilterDrawer');
  if (!overlay || !drawer) return;
  drawer.classList.remove('open');
  setTimeout(() => {
    overlay.classList.remove('open');
    _unlockBodyScroll();
  }, 320);
}

function _syncMobileDrawerFromSidebar() {
  const drawerBody = document.querySelector('.mfd-body');
  if (!drawerBody) return;

  const catList = document.getElementById('sidebarCategoryFilters');
  const occList = document.getElementById('sidebarOccasionFilters');
  const priceList = document.getElementById('sidebarPriceFilters');

  let html = '';

  if (catList) {
    html += `
      <div class="filter-group">
        <div class="filter-group-title">Category <span>▼</span></div>
        <div class="filter-list" id="mfdCategoryFilters">
          ${catList.innerHTML}
        </div>
      </div>`;
  }
  if (occList) {
    html += `
      <div class="filter-group">
        <div class="filter-group-title">Occasion <span>▼</span></div>
        <div class="filter-list" id="mfdOccasionFilters">
          ${occList.innerHTML}
        </div>
      </div>`;
  }
  if (priceList) {
    html += `
      <div class="filter-group">
        <div class="filter-group-title">Price Range <span>▼</span></div>
        <div class="filter-list" id="mfdPriceFilters">
          ${priceList.innerHTML}
        </div>
      </div>`;
  }

  drawerBody.innerHTML = html;

  applyShowMoreToFilterList(document.getElementById('mfdCategoryFilters'), 'mfd-category');
  applyShowMoreToFilterList(document.getElementById('mfdOccasionFilters'), 'mfd-occasion');

  drawerBody.scrollTop = 0;
}

function _applyMobileFilters() {
  const drawerCats   = Array.from(document.querySelectorAll('#mfdCategoryFilters input:checked')).map(i => i.value);
  const drawerOccs   = Array.from(document.querySelectorAll('#mfdOccasionFilters input:checked')).map(i => i.value);
  const drawerPrices = Array.from(document.querySelectorAll('#mfdPriceFilters input:checked')).map(i => i.value);

  document.querySelectorAll('.cat-filter-db').forEach(cb => {
    cb.checked = drawerCats.includes(cb.value);
  });
  document.querySelectorAll('.occ-filter-db').forEach(cb => {
    cb.checked = drawerOccs.includes(cb.value);
  });
  document.querySelectorAll('.price-filter-db').forEach(cb => {
    cb.checked = drawerPrices.includes(cb.value);
  });

  if (typeof applyStorefrontFilters === 'function') {
    applyStorefrontFilters();
  }

  _updateMobileBadge();
  closeMobileFilterDrawer();
}

function _clearMobileFilters() {
  document.querySelectorAll('.mfd-body input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.cat-filter-db, .occ-filter-db, .price-filter-db').forEach(cb => cb.checked = false);
  const searchInput = document.getElementById('mainProductSearch');
  if (searchInput) searchInput.value = '';
  if (typeof applyStorefrontFilters === 'function') applyStorefrontFilters();
  _updateMobileBadge();
}

function _buildMobileFilterUI() {
  if (document.getElementById('mobileFilterOverlay')) return;

  const section = document.querySelector('.section.products');
  if (section) {
    const bar = document.createElement('div');
    bar.className = 'mobile-filter-bar';
    bar.id = 'mobileFilterBar';
    bar.innerHTML = `
      <button type="button" class="mob-filter-open-btn" id="mobFilterOpenBtn" aria-label="Open filters">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        Filters
        <span class="mob-filter-badge" id="mobFilterBadge" aria-live="polite"></span>
      </button>
    `;
    section.insertBefore(bar, section.firstChild);
  }

  const overlay = document.createElement('div');
  overlay.className = 'mobile-filter-drawer-overlay';
  overlay.id = 'mobileFilterOverlay';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="mobile-filter-drawer" id="mobileFilterDrawer" role="dialog" aria-modal="true" aria-label="Product Filters">
      <div class="mfd-handle" aria-hidden="true"></div>
      <div class="mfd-header">
        <span class="mfd-title">Filters</span>
        <button type="button" class="mfd-close-btn" id="mfdCloseBtn" aria-label="Close filters">✕</button>
      </div>
      <div class="mfd-body" id="mfdBody">
      </div>
      <div class="mfd-footer">
        <button type="button" class="mfd-clear-btn" id="mfdClearBtn">Clear All</button>
        <button type="button" class="mfd-apply-btn" id="mfdApplyBtn">Apply Filters</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const openBtn = document.getElementById('mobFilterOpenBtn');
  if (openBtn) openBtn.addEventListener('click', openMobileFilterDrawer);
  const closeBtn = document.getElementById('mfdCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeMobileFilterDrawer);
  const applyBtn = document.getElementById('mfdApplyBtn');
  if (applyBtn) applyBtn.addEventListener('click', _applyMobileFilters);
  const clearBtn = document.getElementById('mfdClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', _clearMobileFilters);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMobileFilterDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeMobileFilterDrawer();
    }
  });
}

let _resizeTimer;
function _onResize() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    initFilterShowMore();
    _updateMobileBadge();
  }, 220);
}

function initProductsFilterUX() {
  _buildMobileFilterUI();
  initSidebarScrollShadow();
  initFilterShowMore();
  _updateMobileBadge();
  window.addEventListener('resize', _onResize, { passive: true });

  const sidebar = document.querySelector('.products-sidebar');
  if (sidebar) {
    sidebar.addEventListener('change', () => {
      _updateMobileBadge();
      initFilterShowMore();
    });
  }
}
