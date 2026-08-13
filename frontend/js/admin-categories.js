(function () {
  // ── admin-categories.js — CSP-safe admin category controller ─────────────────

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
    ? 'http://127.0.0.1:8081'
    : window.location.origin;

  let categories = [];
  let currentCatImageBase64 = '';

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
      element.classList.toggle('active');
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

  // Fetch all categories from DB
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

  // Render categories HTML template
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
            <span class="acc-count">${cat.subcategories.length} Subcategories</span>
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
              ${cat.subcategories.map(sub => `
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
  }

  // Save main category (Create/Update)
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
        fetchCategories();
      } else {
        alert(data.message || 'Error saving category');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save: ' + error.message);
    }
  }

  // Delete main category
  async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category completely?')) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCategories();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Save subcategory
  async function saveSubcategory(e) {
    e.preventDefault();
    const catId = document.getElementById('targetCatId').value;
    const subName = document.getElementById('subcatName').value;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}/sub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subName })
      });
      const data = await res.json();
      if (data.success) {
        closeModal('subcatModal');
        fetchCategories();
      } else {
        alert(data.message || 'Error adding subcategory');
      }
    } catch (error) {
      console.error(error);
      alert('Server error');
    }
  }

  // Delete subcategory
  async function deleteSubcategory(catId, subName) {
    if (!confirm(`Delete subcategory "${subName}"?`)) return;
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}/sub/${encodeURIComponent(subName)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCategories();
      } else {
        alert('Failed to delete subcategory');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Main initialization routine
  function init() {
    const user = getAuthUser();
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

    // Admin Route Protection
    if (!user || !token || !user.isAdmin) {
      window.location.href = 'index.html';
      return;
    }

    document.getElementById('adminName').textContent = user.fullName || 'Admin';
    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A';
    document.getElementById('adminAvatar').textContent = initial;

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Static click bindings
    const addCatBtn = document.getElementById('addCatBtn');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', () => openCatModal());
    }

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

    // Image Upload listener
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

    // Event Delegation for dynamic Accordion Container elements
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (categoriesContainer) {
      categoriesContainer.addEventListener('click', (e) => {
        // 1. Accordion Toggle
        const header = e.target.closest('[data-toggle-accordion]');
        if (header) {
          toggleAccordion(header.getAttribute('data-toggle-accordion'));
          return;
        }

        // 2. Edit Category
        const editBtn = e.target.closest('[data-action="edit-cat"]');
        if (editBtn) {
          openCatModal(
            editBtn.getAttribute('data-id'),
            editBtn.getAttribute('data-name'),
            editBtn.getAttribute('data-image')
          );
          return;
        }

        // 3. Delete Category
        const deleteBtn = e.target.closest('[data-action="delete-cat"]');
        if (deleteBtn) {
          deleteCategory(deleteBtn.getAttribute('data-id'));
          return;
        }

        // 4. Add Subcategory
        const addSubBtn = e.target.closest('[data-action="add-sub"]');
        if (addSubBtn) {
          openSubcatModal(addSubBtn.getAttribute('data-cat-id'));
          return;
        }

        // 5. Delete Subcategory
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

    // Fetch initial list of categories
    fetchCategories();
  }

  // Wait for document DOM parsing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
