(function () {
  // ── admin-categories.js — CSP-safe admin category & occasion controller ─────────────────

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
    ? 'http://127.0.0.1:8081'
    : window.location.origin;

  let categories = [];
  let occasions = [];
  let relationships = [];
  let currentCatImageBase64 = '';
  let currentOccImageBase64 = '';
  let currentRelImageBase64 = '';
  let lastExpandedCatId = '';

  // Toast Notifications
  function showToast(message, isSuccess = true) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${isSuccess ? 'success' : 'error'}`;
    
    const icon = isSuccess ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Close modals helper
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Toggle accordion item
  function toggleAccordion(id) {
    const element = document.getElementById(id);
    if (element) {
      const isActive = element.classList.contains('active');
      
      document.querySelectorAll('.acc-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isActive) {
        element.classList.add('active');
        lastExpandedCatId = id.replace('acc-', '');
      } else {
        lastExpandedCatId = '';
      }
    }
  }

  // Open main category modal
  function openCatModal(id = '', name = '', image = '') {
    document.getElementById('catId').value = id;
    document.getElementById('catName').value = name;
    
    const preview = document.getElementById('catImagePreview');
    if (image && image !== 'undefined') {
      currentCatImageBase64 = image;
      preview.src = image;
      preview.style.display = 'block';
    } else {
      currentCatImageBase64 = '';
      preview.src = '';
      preview.style.display = 'none';
    }

    document.getElementById('catModalTitle').textContent = id ? 'Edit Category' : 'Add Category';
    document.getElementById('catModal').style.display = 'flex';
  }

  // Open subcategory modal
  function openSubcatModal(catId) {
    document.getElementById('targetCatId').value = catId;
    document.getElementById('subcatName').value = '';
    document.getElementById('subcatModal').style.display = 'flex';
  }

  // ── Categories Logic ────────────────────────────────────────────────────────
  async function fetchCategories() {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      if (data.success) {
        categories = data.categories;
        renderCategories();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      document.getElementById('categoriesContainer').innerHTML = '<p class="text-center" style="color:red;">Failed to load categories.</p>';
    }
  }

  function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    if (categories.length === 0) {
      container.innerHTML = '<p class="text-center">No categories found. Add one to get started!</p>';
      return;
    }

    container.innerHTML = categories.map(cat => `
      <div class="acc-item" id="acc-${cat._id}">
        <div class="acc-header" data-toggle-accordion="acc-${cat._id}">
          <div class="acc-title-group" style="pointer-events: none;">
            <img src="${cat.image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'}" alt="Icon" class="acc-img" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'">
            <span class="acc-title">${cat.name}</span>
            <span class="acc-count">${cat.subcategories ? cat.subcategories.length : 0} Subcategories</span>
          </div>
          <div class="acc-toggle-icon" style="pointer-events: none;">▼</div>
        </div>
        <div class="acc-body">
          <div class="acc-content">
            <div class="acc-actions">
              <button class="btn-action btn-edit" data-action="edit-cat" data-id="${cat._id}" data-name="${cat.name.replace(/"/g, '&quot;')}" data-image="${cat.image || ''}">✎ Edit Category</button>
              <button class="btn-action btn-delete" data-action="delete-cat" data-id="${cat._id}">🗑️ Delete Category</button>
            </div>
            
            <h4 style="margin-bottom: 15px; color: #555;">Subcategories</h4>
            <div class="subcat-grid">
              ${(cat.subcategories || []).map(sub => `
                <span class="subcat-pill">
                  ${sub}
                  <span class="del-subcat" data-action="delete-sub" data-cat-id="${cat._id}" data-sub-name="${sub.replace(/"/g, '&quot;')}">×</span>
                </span>
              `).join('')}
              <button class="btn-action btn-add-sub" data-action="add-sub" data-cat-id="${cat._id}">+ Add Subcategory</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (lastExpandedCatId) {
      const element = document.getElementById(`acc-${lastExpandedCatId}`);
      if (element) {
        element.classList.add('active');
      }
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('catId').value;
    const name = document.getElementById('catName').value;
    const image = currentCatImageBase64;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE}/api/categories/${id}` : `${API_BASE}/api/categories`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, image: image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png' })
      });

      const data = await res.json();
      if (data.success) {
        closeModal('catModal');
        lastExpandedCatId = data.category ? data.category._id : '';
        fetchCategories();
        showToast(id ? 'Category updated successfully!' : 'Category added successfully!', true);
      } else {
        showToast(data.message || 'Error saving category', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save category', false);
    }
  }

  async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category completely?')) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        showToast('Category deleted successfully!', true);
      } else {
        showToast(data.message || 'Error deleting category', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete category', false);
    }
  }

  async function saveSubcategory(e) {
    e.preventDefault();
    const catId = document.getElementById('targetCatId').value;
    const subcatName = document.getElementById('subcatName').value;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: subcatName })
      });

      const data = await res.json();
      if (data.success) {
        closeModal('subcatModal');
        lastExpandedCatId = catId;
        fetchCategories();
        showToast('Subcategory added successfully!', true);
      } else {
        showToast(data.message || 'Error adding subcategory', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to add subcategory', false);
    }
  }

  async function deleteSubcategory(catId, subName) {
    if (!confirm(`Delete subcategory "${subName}"?`)) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}/subcategories/${encodeURIComponent(subName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        lastExpandedCatId = catId;
        fetchCategories();
        showToast('Subcategory deleted successfully!', true);
      } else {
        showToast(data.message || 'Error deleting subcategory', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete subcategory', false);
    }
  }

  // ── Occasions Logic ────────────────────────────────────────────────────────
  async function fetchOccasions() {
    try {
      const res = await fetch(`${API_BASE}/api/occasions`);
      const data = await res.json();
      if (data.success) {
        occasions = data.occasions;
        renderOccasions();
      }
    } catch (error) {
      console.error('Error fetching occasions:', error);
      const container = document.getElementById('occasionsContainer');
      if (container) container.innerHTML = '<p class="text-center" style="color:red;">Failed to load occasions.</p>';
    }
  }

  function renderOccasions() {
    const container = document.getElementById('occasionsContainer');
    if (!container) return;

    if (occasions.length === 0) {
      container.innerHTML = '<p class="text-center" style="padding: 40px; color: #666;">No occasions found. Click "+ Add New Occasion" to add one!</p>';
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${occasions.map(occ => `
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${occ.image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'}" alt="${occ.name}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid #eee;" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'">
                  <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b;">${occ.name}</h3>
                </div>
                <span style="font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: ${occ.status === 'Active' ? '#dcfce7' : '#f1f5f9'}; color: ${occ.status === 'Active' ? '#15803d' : '#64748b'};">${occ.status || 'Active'}</span>
              </div>
              <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 15px 0; line-height: 1.4;">${occ.description || 'No description provided.'}</p>
            </div>
            
            <div style="display: flex; gap: 10px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
              <button class="btn-action btn-edit" style="flex:1;" data-action="edit-occ" data-id="${occ._id}" data-name="${occ.name.replace(/"/g, '&quot;')}" data-desc="${(occ.description || '').replace(/"/g, '&quot;')}" data-status="${occ.status || 'Active'}" data-image="${occ.image || ''}">✎ Edit</button>
              <button class="btn-action btn-delete" style="flex:1;" data-action="delete-occ" data-id="${occ._id}">🗑️ Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function openOccModal(id = '', name = '', description = '', status = 'Active', image = '') {
    document.getElementById('occId').value = id;
    document.getElementById('occName').value = name;
    document.getElementById('occDescription').value = description;
    document.getElementById('occStatus').value = status || 'Active';
    
    const preview = document.getElementById('occImagePreview');
    if (image && image !== 'undefined') {
      currentOccImageBase64 = image;
      preview.src = image;
      preview.style.display = 'block';
    } else {
      currentOccImageBase64 = '';
      preview.src = '';
      preview.style.display = 'none';
    }

    document.getElementById('occModalTitle').textContent = id ? 'Edit Occasion' : 'Add Occasion';
    document.getElementById('occModal').style.display = 'flex';
  }

  async function saveOccasion(e) {
    e.preventDefault();
    const id = document.getElementById('occId').value;
    const name = document.getElementById('occName').value;
    const description = document.getElementById('occDescription').value;
    const status = document.getElementById('occStatus').value;
    const image = currentOccImageBase64;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE}/api/occasions/${id}` : `${API_BASE}/api/occasions`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          description, 
          status, 
          image: image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png' 
        })
      });

      const data = await res.json();
      if (data.success) {
        closeModal('occModal');
        fetchOccasions();
        showToast(id ? 'Occasion updated successfully!' : 'Occasion added successfully!', true);
      } else {
        showToast(data.message || 'Error saving occasion', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save occasion', false);
    }
  }

  async function deleteOccasion(id) {
    if (!confirm('Are you sure you want to delete this occasion?')) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/occasions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchOccasions();
        showToast('Occasion deleted successfully!', true);
      } else {
        showToast(data.message || 'Error deleting occasion', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete occasion', false);
    }
  }

  // ── Relationships Logic ────────────────────────────────────────────────────
  async function fetchRelationships() {
    try {
      const res = await fetch(`${API_BASE}/api/relationships`);
      const data = await res.json();
      if (data.success) {
        relationships = data.relationships;
        renderRelationships();
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      const container = document.getElementById('relationshipsContainer');
      if (container) container.innerHTML = '<p class="text-center" style="color:red;">Failed to load relationships.</p>';
    }
  }

  function renderRelationships() {
    const container = document.getElementById('relationshipsContainer');
    if (!container) return;

    if (relationships.length === 0) {
      container.innerHTML = '<p class="text-center" style="padding: 40px; color: #666;">No relationships found. Click "+ Add New Relationship" to add one!</p>';
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${relationships.map(rel => `
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${rel.image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'}" alt="${rel.name}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid #eee;" onerror="this.src='https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png'">
                  <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b;">${rel.name}</h3>
                </div>
                <span style="font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: ${rel.status === 'Active' ? '#dcfce7' : '#f1f5f9'}; color: ${rel.status === 'Active' ? '#15803d' : '#64748b'};">${rel.status || 'Active'}</span>
              </div>
              <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 15px 0; line-height: 1.4;">${rel.description || 'No description provided.'}</p>
            </div>
            
            <div style="display: flex; gap: 10px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
              <button class="btn-action btn-edit" style="flex:1;" data-action="edit-rel" data-id="${rel._id}" data-name="${rel.name.replace(/"/g, '&quot;')}" data-desc="${(rel.description || '').replace(/"/g, '&quot;')}" data-status="${rel.status || 'Active'}" data-image="${rel.image || ''}">✎ Edit</button>
              <button class="btn-action btn-delete" style="flex:1;" data-action="delete-rel" data-id="${rel._id}">🗑️ Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function openRelModal(id = '', name = '', description = '', status = 'Active', image = '') {
    document.getElementById('relId').value = id;
    document.getElementById('relName').value = name;
    document.getElementById('relDescription').value = description;
    document.getElementById('relStatus').value = status || 'Active';
    
    const preview = document.getElementById('relImagePreview');
    if (image && image !== 'undefined') {
      currentRelImageBase64 = image;
      preview.src = image;
      preview.style.display = 'block';
    } else {
      currentRelImageBase64 = '';
      preview.src = '';
      preview.style.display = 'none';
    }

    document.getElementById('relModalTitle').textContent = id ? 'Edit Relationship' : 'Add Relationship';
    document.getElementById('relModal').style.display = 'flex';
  }

  async function saveRelationship(e) {
    e.preventDefault();
    const id = document.getElementById('relId').value;
    const name = document.getElementById('relName').value;
    const description = document.getElementById('relDescription').value;
    const status = document.getElementById('relStatus').value;
    const image = currentRelImageBase64;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE}/api/relationships/${id}` : `${API_BASE}/api/relationships`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          description, 
          status, 
          image: image || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png' 
        })
      });

      const data = await res.json();
      if (data.success) {
        closeModal('relModal');
        fetchRelationships();
        showToast(id ? 'Relationship updated successfully!' : 'Relationship added successfully!', true);
      } else {
        showToast(data.message || 'Error saving relationship', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save relationship', false);
    }
  }

  async function deleteRelationship(id) {
    if (!confirm('Are you sure you want to delete this relationship?')) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/relationships/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchRelationships();
        showToast('Relationship deleted successfully!', true);
      } else {
        showToast(data.message || 'Error deleting relationship', false);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete relationship', false);
    }
  }

  // ── DOM Initialization ──────────────────────────────────────────────────────
  function init() {
    // Add Category button
    const addCatBtn = document.getElementById('addCatBtn');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', () => openCatModal());
    }

    // Add Occasion button
    const addOccBtn = document.getElementById('addOccBtn');
    if (addOccBtn) {
      addOccBtn.addEventListener('click', () => openOccModal());
    }

    // Add Relationship button
    const addRelBtn = document.getElementById('addRelBtn');
    if (addRelBtn) {
      addRelBtn.addEventListener('click', () => openRelModal());
    }

    // Tab Switcher (Categories vs Occasions vs Relationships)
    const tabCatBtn = document.getElementById('tabCatBtn');
    const tabOccBtn = document.getElementById('tabOccBtn');
    const tabRelBtn = document.getElementById('tabRelBtn');
    const catSection = document.getElementById('categoriesSection');
    const occSection = document.getElementById('occasionsSection');
    const relSection = document.getElementById('relationshipsSection');
    const headerTitle = document.getElementById('headerTitle');

    function switchToCategories() {
      if (tabCatBtn) {
        tabCatBtn.style.borderBottomColor = 'var(--primary, #C41E3A)';
        tabCatBtn.style.color = 'var(--primary, #C41E3A)';
      }
      if (tabOccBtn) {
        tabOccBtn.style.borderBottomColor = 'transparent';
        tabOccBtn.style.color = '#64748b';
      }
      if (tabRelBtn) {
        tabRelBtn.style.borderBottomColor = 'transparent';
        tabRelBtn.style.color = '#64748b';
      }
      if (catSection) catSection.style.display = 'block';
      if (occSection) occSection.style.display = 'none';
      if (relSection) relSection.style.display = 'none';
      if (headerTitle) headerTitle.textContent = 'Manage Categories';
    }

    function switchToOccasions() {
      if (tabOccBtn) {
        tabOccBtn.style.borderBottomColor = 'var(--primary, #C41E3A)';
        tabOccBtn.style.color = 'var(--primary, #C41E3A)';
      }
      if (tabCatBtn) {
        tabCatBtn.style.borderBottomColor = 'transparent';
        tabCatBtn.style.color = '#64748b';
      }
      if (tabRelBtn) {
        tabRelBtn.style.borderBottomColor = 'transparent';
        tabRelBtn.style.color = '#64748b';
      }
      if (occSection) occSection.style.display = 'block';
      if (catSection) catSection.style.display = 'none';
      if (relSection) relSection.style.display = 'none';
      if (headerTitle) headerTitle.textContent = 'Manage Occasions';
      fetchOccasions();
    }

    function switchToRelationships() {
      if (tabRelBtn) {
        tabRelBtn.style.borderBottomColor = 'var(--primary, #C41E3A)';
        tabRelBtn.style.color = 'var(--primary, #C41E3A)';
      }
      if (tabCatBtn) {
        tabCatBtn.style.borderBottomColor = 'transparent';
        tabCatBtn.style.color = '#64748b';
      }
      if (tabOccBtn) {
        tabOccBtn.style.borderBottomColor = 'transparent';
        tabOccBtn.style.color = '#64748b';
      }
      if (relSection) relSection.style.display = 'block';
      if (catSection) catSection.style.display = 'none';
      if (occSection) occSection.style.display = 'none';
      if (headerTitle) headerTitle.textContent = 'Manage Relationships';
      fetchRelationships();
    }

    if (tabCatBtn) tabCatBtn.addEventListener('click', switchToCategories);
    if (tabOccBtn) tabOccBtn.addEventListener('click', switchToOccasions);
    if (tabRelBtn) tabRelBtn.addEventListener('click', switchToRelationships);

    // Global Modal Close listener delegation
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        closeModal(closeBtn.getAttribute('data-close-modal'));
      }
    });

    // Form submit handlers
    const catForm = document.getElementById('catForm');
    if (catForm) {
      catForm.addEventListener('submit', saveCategory);
    }

    const subcatForm = document.getElementById('subcatForm');
    if (subcatForm) {
      subcatForm.addEventListener('submit', saveSubcategory);
    }

    const occForm = document.getElementById('occForm');
    if (occForm) {
      occForm.addEventListener('submit', saveOccasion);
    }

    const relForm = document.getElementById('relForm');
    if (relForm) {
      relForm.addEventListener('submit', saveRelationship);
    }

    // Image Upload listeners
    const catImageFile = document.getElementById('catImageFile');
    const catImagePreview = document.getElementById('catImagePreview');
    if (catImageFile && catImagePreview) {
      catImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            currentCatImageBase64 = evt.target.result;
            catImagePreview.src = currentCatImageBase64;
            catImagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const occImageFile = document.getElementById('occImageFile');
    const occImagePreview = document.getElementById('occImagePreview');
    if (occImageFile && occImagePreview) {
      occImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            currentOccImageBase64 = evt.target.result;
            occImagePreview.src = currentOccImageBase64;
            occImagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const relImageFile = document.getElementById('relImageFile');
    const relImagePreview = document.getElementById('relImagePreview');
    if (relImageFile && relImagePreview) {
      relImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            currentRelImageBase64 = evt.target.result;
            relImagePreview.src = currentRelImageBase64;
            relImagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Event Delegation for Categories Container
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (categoriesContainer) {
      categoriesContainer.addEventListener('click', (e) => {
        const header = e.target.closest('[data-toggle-accordion]');
        if (header) {
          toggleAccordion(header.getAttribute('data-toggle-accordion'));
          return;
        }

        const editBtn = e.target.closest('[data-action="edit-cat"]');
        if (editBtn) {
          openCatModal(
            editBtn.getAttribute('data-id'),
            editBtn.getAttribute('data-name'),
            editBtn.getAttribute('data-image')
          );
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete-cat"]');
        if (deleteBtn) {
          deleteCategory(deleteBtn.getAttribute('data-id'));
          return;
        }

        const addSubBtn = e.target.closest('[data-action="add-sub"]');
        if (addSubBtn) {
          openSubcatModal(addSubBtn.getAttribute('data-cat-id'));
          return;
        }

        const delSubBtn = e.target.closest('[data-action="delete-sub"]');
        if (delSubBtn) {
          deleteSubcategory(
            delSubBtn.getAttribute('data-cat-id'),
            delSubBtn.getAttribute('data-sub-name')
          );
          return;
        }
      });
    }

    // Event Delegation for Occasions Container
    const occasionsContainer = document.getElementById('occasionsContainer');
    if (occasionsContainer) {
      occasionsContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-occ"]');
        if (editBtn) {
          openOccModal(
            editBtn.getAttribute('data-id'),
            editBtn.getAttribute('data-name'),
            editBtn.getAttribute('data-desc'),
            editBtn.getAttribute('data-status'),
            editBtn.getAttribute('data-image')
          );
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete-occ"]');
        if (deleteBtn) {
          deleteOccasion(deleteBtn.getAttribute('data-id'));
          return;
        }
      });
    }

    // Event Delegation for Relationships Container
    const relationshipsContainer = document.getElementById('relationshipsContainer');
    if (relationshipsContainer) {
      relationshipsContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-rel"]');
        if (editBtn) {
          openRelModal(
            editBtn.getAttribute('data-id'),
            editBtn.getAttribute('data-name'),
            editBtn.getAttribute('data-desc'),
            editBtn.getAttribute('data-status'),
            editBtn.getAttribute('data-image')
          );
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete-rel"]');
        if (deleteBtn) {
          deleteRelationship(deleteBtn.getAttribute('data-id'));
          return;
        }
      });
    }

    // Fetch initial lists
    fetchCategories();
    fetchOccasions();
    fetchRelationships();

    // Check URL hash if user clicked direct link to #occasions or #relationships
    if (window.location.hash === '#occasions' || window.location.pathname.includes('admin-occasions.html')) {
      switchToOccasions();
    } else if (window.location.hash === '#relationships' || window.location.hash === '#relations') {
      switchToRelationships();
    }
  }

  // Wait for document DOM parsing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
