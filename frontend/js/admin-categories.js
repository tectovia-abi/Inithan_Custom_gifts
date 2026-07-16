document.addEventListener('DOMContentLoaded', () => {
  const user = getAuthUser();
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

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
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  fetchCategories();
});

let categories = [];

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
  if (categories.length === 0) {
    container.innerHTML = '<p class="text-center">No categories found. Add one to get started!</p>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="acc-item" id="acc-${cat._id}">
      <div class="acc-header" onclick="toggleAccordion('acc-${cat._id}')">
        <div class="acc-title-group">
          <img src="${cat.image || 'images/gift-box.png'}" alt="Icon" class="acc-img" onerror="this.src='images/gift-box.png'">
          <span class="acc-title">${cat.name}</span>
          <span class="acc-count">${cat.subcategories.length} Subcategories</span>
        </div>
        <div class="acc-toggle-icon">▼</div>
      </div>
      <div class="acc-body">
        <div class="acc-content">
          <div class="acc-actions">
            <button class="btn-action btn-edit" onclick="openCatModal('${cat._id}', '${cat.name.replace(/'/g, "\\'")}', '${cat.image}')">✎ Edit Category</button>
            <button class="btn-action btn-delete" onclick="deleteCategory('${cat._id}')">🗑️ Delete Category</button>
          </div>
          
          <h4 style="margin-bottom: 15px; color: #555;">Subcategories</h4>
          <div class="subcat-grid">
            ${cat.subcategories.map(sub => `
              <span class="subcat-pill">
                ${sub}
                <span class="del-subcat" onclick="deleteSubcategory('${cat._id}', '${sub.replace(/'/g, "\\'")}')">×</span>
              </span>
            `).join('')}
            <button class="btn-action btn-add-sub" onclick="openSubcatModal('${cat._id}')">+ Add Subcategory</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

window.toggleAccordion = function(id) {
  const element = document.getElementById(id);
  // Optional: if we want only one to open at a time, we could close others here
  element.classList.toggle('active');
};

window.currentCatImageBase64 = '';

// ── Main Category Functions ──────────────────────────────────────────────
window.openCatModal = function(id = '', name = '', image = '') {
  document.getElementById('catId').value = id;
  document.getElementById('catName').value = name;
  
  const preview = document.getElementById('catImagePreview');
  if (image) {
    window.currentCatImageBase64 = image;
    preview.src = image;
    preview.style.display = 'block';
  } else {
    window.currentCatImageBase64 = '';
    preview.src = '';
    preview.style.display = 'none';
  }

  document.getElementById('catModalTitle').textContent = id ? 'Edit Category' : 'Add Category';
  document.getElementById('catModal').style.display = 'flex';
};

window.saveCategory = async function(e) {
  e.preventDefault();
  const id = document.getElementById('catId').value;
  const name = document.getElementById('catName').value;
  const image = window.currentCatImageBase64;
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://127.0.0.1:5000';

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${apiBase}/api/categories/${id}` : `${apiBase}/api/categories`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, image: image || 'images/gift-box.png' })
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (data.success) {
        window.closeModal('catModal');
        fetchCategories();
      } else {
        alert(data.message || 'Error saving category');
      }
    } else {
      const text = await res.text();
      console.error("Non-JSON response:", text);
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error(error);
    alert('Failed to save: ' + error.message);
  }
};

// Handle category image file upload
document.addEventListener('DOMContentLoaded', () => {
  const catImageFile = document.getElementById('catImageFile');
  const catImagePreview = document.getElementById('catImagePreview');

  if (catImageFile) {
    catImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          window.currentCatImageBase64 = evt.target.result;
          catImagePreview.src = window.currentCatImageBase64;
          catImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

window.deleteCategory = async function(id) {
  if (!confirm('Are you sure you want to delete this category completely?')) return;
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://127.0.0.1:5000';

  try {
    const res = await fetch(`${apiBase}/api/categories/${id}`, {
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
};

// ── Subcategory Functions ────────────────────────────────────────────────
window.openSubcatModal = function(catId) {
  document.getElementById('targetCatId').value = catId;
  document.getElementById('subcatName').value = '';
  document.getElementById('subcatModal').style.display = 'flex';
};

window.saveSubcategory = async function(e) {
  e.preventDefault();
  const catId = document.getElementById('targetCatId').value;
  const subName = document.getElementById('subcatName').value;
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://127.0.0.1:5000';

  try {
    const res = await fetch(`${apiBase}/api/categories/${catId}/sub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subName })
    });
    const data = await res.json();
    if (data.success) {
      window.closeModal('subcatModal');
      fetchCategories();
    } else {
      alert(data.message || 'Error adding subcategory');
    }
  } catch (error) {
    console.error(error);
    alert('Server error');
  }
};

window.deleteSubcategory = async function(catId, subName) {
  if (!confirm(`Delete subcategory "${subName}"?`)) return;
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://127.0.0.1:5000';

  try {
    const res = await fetch(`${apiBase}/api/categories/${catId}/sub/${encodeURIComponent(subName)}`, {
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
};

// ── Utils ─────────────────────────────────────────────────────────────────
window.closeModal = function(id) {
  document.getElementById(id).style.display = 'none';
};
