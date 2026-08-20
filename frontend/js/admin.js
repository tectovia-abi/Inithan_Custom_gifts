/**
 * admin.js — Admin Dashboard Logic
 */

function initAdmin() {
  // 1. Verify Authentication & Admin Role
  const user = getAuthUser();
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

  if (!user || !token || !user.isAdmin) {
    // Not an admin, redirect to home
    window.location.href = 'index.html';
    return;
  }

  // Set Header User Info
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || 'Admin';
  const adminAvatarEl = document.getElementById('adminAvatar');
  if (adminAvatarEl) {
    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A';
    adminAvatarEl.textContent = initial;
  }

  // 2. Sidebar Navigation
  const navLinks = document.querySelectorAll('.admin-nav-link[data-target]');
  const sections = document.querySelectorAll('.admin-section');
  const headerTitle = document.getElementById('headerTitle');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update Active Link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update Header Title
      if (headerTitle) headerTitle.textContent = link.textContent.trim();

      // Show Target Section
      const targetId = link.getAttribute('data-target');
      if (targetId && document.getElementById(targetId)) {
        sections.forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
      }
    });
  });

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // 3. Data Fetching
  fetchDashboardData(token);
  loadCategoriesForDropdowns();
  loadOccasionsForDropdowns();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}

let allProducts = [];
let allInquiries = [];
let allCategories = [];
let allOccasions = [];

async function loadCategoriesForDropdowns() {
  const categorySelects = [
    document.getElementById('p_category'),
    document.getElementById('editProductCategory'),
    document.getElementById('filterCategory')
  ].filter(Boolean);

  if (categorySelects.length === 0) return;

  try {
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
    const res = await fetch(`${apiBase}/api/categories`);
    const data = await res.json();
    
    if (data.success && data.categories) {
      allCategories = data.categories;
      
      // Populate #p_category (Add Product page)
      const pCatSelect = document.getElementById('p_category');
      const pSubCatSelect = document.getElementById('p_subCategory');
      
      if (pCatSelect) {
        pCatSelect.innerHTML = '<option value="">-- Select Category --</option>' + 
          allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        
        pCatSelect.addEventListener('change', () => {
          const selectedName = pCatSelect.value;
          const foundCat = allCategories.find(c => c.name === selectedName);
          if (pSubCatSelect) {
            if (foundCat && foundCat.subcategories && foundCat.subcategories.length > 0) {
              pSubCatSelect.innerHTML = '<option value="">-- Select Sub Category --</option>' + 
                foundCat.subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            } else {
              pSubCatSelect.innerHTML = '<option value="">No subcategories available</option>';
            }
          }
        });
      }

      // Populate #filterCategory (Products list filter)
      const filterCatSelect = document.getElementById('filterCategory');
      if (filterCatSelect) {
        filterCatSelect.innerHTML = '<option value="">All Categories</option>' + 
          allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      }

      // Populate #editProductCategory (Edit Product modal)
      const editCatSelect = document.getElementById('editProductCategory');
      const editSubCatSelect = document.getElementById('editProductSubCategory');
      if (editCatSelect) {
        editCatSelect.innerHTML = '<option value="">-- Select Category --</option>' + 
          allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        
        editCatSelect.addEventListener('change', () => {
          const selectedName = editCatSelect.value;
          const foundCat = allCategories.find(c => c.name === selectedName);
          if (editSubCatSelect) {
            if (foundCat && foundCat.subcategories && foundCat.subcategories.length > 0) {
              editSubCatSelect.innerHTML = '<option value="">-- Select Sub Category --</option>' + 
                foundCat.subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            } else {
              editSubCatSelect.innerHTML = '<option value="">No subcategories available</option>';
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('Error fetching categories for dropdowns:', err);
  }
}

async function fetchDashboardData(token) {
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;

  // 1. Fetch Products
  try {
    const prodRes = await fetch(`${apiBase}/api/products`);
    const prodData = await prodRes.json();
    allProducts = (prodData && prodData.success && Array.isArray(prodData.products)) ? prodData.products : [];
  } catch (err) {
    console.error('Error fetching products:', err);
    allProducts = [];
  }

  // 2. Fetch Users
  let users = [];
  try {
    const usersRes = await fetch(`${apiBase}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    users = (usersData && usersData.success && Array.isArray(usersData.users)) ? usersData.users : [];
  } catch (err) {
    console.error('Error fetching users:', err);
    users = [];
  }

  // 3. Fetch Inquiries
  try {
    const inqRes = await fetch(`${apiBase}/api/bulk-inquiry`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const inqData = await inqRes.json();
    allInquiries = (inqData && inqData.success && Array.isArray(inqData.inquiries)) ? inqData.inquiries : [];
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    allInquiries = [];
  }

  // Update Overview Stats
  const tpEl = document.getElementById('totalProducts');
  if (tpEl) tpEl.textContent = allProducts.length;
  const tuEl = document.getElementById('totalUsers');
  if (tuEl) tuEl.textContent = users.length;
  const tiEl = document.getElementById('totalInquiries');
  if (tiEl) tiEl.textContent = allInquiries.length;

  // Populate Tables
  populateProducts(allProducts);
  populateUsers(users);
  populateInquiries(allInquiries);

    // Setup Smart Search for Products
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.code.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
        );
        populateProducts(filtered);
      });
    }

    // Setup Add Product Form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {

      // Setup Real-time Pricing Auto-Calculation
      setupPricingAutoCalc('p_price', 'p_offerPercentage', 'p_discountPrice');

      let primaryImageS3Url = '';
      let galleryImagesS3Urls = [];

      // Primary Image Upload
      const pImageFile = document.getElementById('p_imageFile');
      const primaryImagePreview = document.getElementById('primaryImagePreview');

      if (pImageFile) {
        pImageFile.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Show local preview instantly
          const reader = new FileReader();
          reader.onload = (evt) => {
            primaryImagePreview.src = evt.target.result;
            primaryImagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);

          // Upload to S3 in background
          pImageFile.disabled = true;
          primaryImagePreview.style.opacity = '0.5';
          try {
            primaryImageS3Url = await uploadFileToS3(file, '/api/upload/single');
            console.log('✅ Primary image uploaded to S3:', primaryImageS3Url);
            primaryImagePreview.style.opacity = '1';
          } catch (err) {
            alert('Image upload failed: ' + err.message);
          } finally {
            pImageFile.disabled = false;
          }
        });
      }

      // Gallery Images Upload
      const pGalleryFiles = document.getElementById('p_galleryFiles');
      const galleryPreviewContainer = document.getElementById('galleryPreviewContainer');
      const galleryUploadBox = document.getElementById('galleryUploadBox');

      if (pGalleryFiles) {
        pGalleryFiles.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);

          for (const file of files) {
            // Show local preview instantly
            const reader = new FileReader();
            reader.onload = (evt) => {
              const img = document.createElement('img');
              img.src = evt.target.result;
              img.className = 'gallery-item';
              img.style.opacity = '0.5';
              img.dataset.uploading = 'true';
              galleryPreviewContainer.insertBefore(img, galleryUploadBox);

              // Upload to S3
              uploadFileToS3(file, '/api/upload/single')
                .then(url => {
                  galleryImagesS3Urls.push(url);
                  img.src = url;
                  img.style.opacity = '1';
                  delete img.dataset.uploading;
                  console.log('✅ Gallery image uploaded to S3:', url);
                })
                .catch(err => {
                  img.style.border = '2px solid red';
                  console.error('Gallery upload failed:', err);
                });
            };
            reader.readAsDataURL(file);
          }
        });
      }

      addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById('saveProductBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const selectedOccasions = addProductOccasionPicker ? addProductOccasionPicker.getSelected() : [];

        const payload = {
          name: document.getElementById('p_name').value,
          code: document.getElementById('p_code').value,
          brand: document.getElementById('p_brand').value,
          category: document.getElementById('p_category').value,
          subCategory: document.getElementById('p_subCategory').value,
          occasions: selectedOccasions,
          productType: document.getElementById('p_productType').value,
          status: (document.getElementById('p_status') && document.getElementById('p_status').value) ? document.getElementById('p_status').value : 'Active',
          imageUrl: primaryImageS3Url,
          galleryImages: galleryImagesS3Urls,
          shortDescription: document.getElementById('p_shortDescription').value,
          detailedDescription: document.getElementById('p_detailedDescription').value,
          price: document.getElementById('p_price').value,
          offerPercentage: document.getElementById('p_offerPercentage') ? document.getElementById('p_offerPercentage').value : 0,
          discountPrice: document.getElementById('p_discountPrice').value,
          costPrice: document.getElementById('p_costPrice') ? document.getElementById('p_costPrice').value : 0,
          stockQuantity: document.getElementById('p_stockQuantity') ? document.getElementById('p_stockQuantity').value : 50,
          lowStockAlert: document.getElementById('p_lowStockAlert') ? document.getElementById('p_lowStockAlert').value : 5,
          skuBarcode: document.getElementById('p_skuBarcode') ? document.getElementById('p_skuBarcode').value : '',
          weight: document.getElementById('p_weight') ? document.getElementById('p_weight').value : 0.5,
          dimensions: {
            length: document.getElementById('p_dim_l') ? document.getElementById('p_dim_l').value : 0,
            width: document.getElementById('p_dim_w') ? document.getElementById('p_dim_w').value : 0,
            height: document.getElementById('p_dim_h') ? document.getElementById('p_dim_h').value : 0,
            unit: document.getElementById('p_dim_unit') ? document.getElementById('p_dim_unit').value : 'cm',
            description: document.getElementById('p_dim_description') ? document.getElementById('p_dim_description').value : ''
          },
          shippingType: document.getElementById('p_shippingType') ? document.getElementById('p_shippingType').value : 'Standard Delivery',
          keywords: document.getElementById('p_keywords').value,
          metaTitle: document.getElementById('p_metaTitle').value,
          metaDescription: document.getElementById('p_metaDescription').value,
          urlSlug: document.getElementById('p_urlSlug').value,
          isFeatured: document.getElementById('p_isFeatured').checked,
          isBestSeller: document.getElementById('p_isBestSeller').checked,
          isNewArrival: document.getElementById('p_isNewArrival').checked,
          showOnHomepage: document.getElementById('p_showOnHomepage').checked,
          allowReviews: document.getElementById('p_allowReviews').checked,
          allowCustomText: document.getElementById('p_allowCustomText') ? document.getElementById('p_allowCustomText').checked : true,
          customTextLabel: document.getElementById('p_customTextLabel') ? document.getElementById('p_customTextLabel').value : 'Custom Name / Message to Print',
          allowCustomImage: document.getElementById('p_allowCustomImage') ? document.getElementById('p_allowCustomImage').checked : true,
          maxCustomImages: document.getElementById('p_maxCustomImages') ? Number(document.getElementById('p_maxCustomImages').value) || 1 : 1
        };

        try {
          const res = await fetch(`${apiBase}/api/products`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          const data = await res.json();
          if (data.success) {
            alert('Product added successfully!');
            window.location.href = 'admin-products.html';
          } else {
            alert('Error: ' + data.message);
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Product';
          }
        } catch (err) {
          console.error(err);
          alert('Server error while adding product.');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Product';
        }
      });
    }

}

function populateProducts(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  // Update Stats Cards
  const statTotal = document.getElementById('statTotalProducts');
  const statActive = document.getElementById('statActiveProducts');
  const statLowStock = document.getElementById('statLowStock');
  const statOutOfStock = document.getElementById('statOutOfStock');
  const statCategories = document.getElementById('statTotalCategories');

  if (statTotal) {
    const total = products.length;
    const active = products.filter(p => p.status === 'Active' || !p.status).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const uniqueCategories = new Set(products.map(p => p.category || 'Custom Gifts')).size;

    statTotal.textContent = total;
    statActive.textContent = active;
    statLowStock.textContent = lowStock;
    statOutOfStock.textContent = outOfStock;
    statCategories.textContent = uniqueCategories;
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
      paginationInfo.textContent = `Showing 1 to ${Math.min(6, total)} of ${total} products`;
    }
  }

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 40px;">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    // Determine category badge colors
    let badgeClass = 'badge-red';
    let catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>';
    if (p.category === 'Accessories') { badgeClass = 'badge-blue'; catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>'; }
    if (p.category === 'Photo Frames') { badgeClass = 'badge-purple'; catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'; }
    if (p.category === 'Custom Mugs') { badgeClass = 'badge-orange'; catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>'; }

    return `
      <tr>
        <td>
          <div class="product-cell">
            <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='images/placeholder_machine.png'">
            <div class="product-info">
              <strong>${p.name}</strong>
              <span>${p.shortDescription || p.category || 'Custom Product'}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-pill ${badgeClass}">
            ${catIcon} ${p.category || 'Custom Gifts'}
          </span>
        </td>
        <td>${p.code || 'N/A'}</td>
        <td>₹${p.price}</td>
        <td>
          <div class="action-cell">
            <button class="action-btn view-btn" title="View" data-action="view-product" data-id="${p._id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
            <button class="action-btn edit-btn" title="Edit" data-action="edit-product" data-id="${p._id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="action-btn delete-btn" title="Delete" data-action="delete-product" data-id="${p._id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populateUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td><strong>${u.fullName}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone || 'N/A'}</td>
      <td><span class="badge ${u.isAdmin ? 'completed' : 'pending'}">${u.isAdmin ? 'Admin' : 'User'}</span></td>
    </tr>
  `).join('');
}

function populateInquiries(inquiries) {
  const tbody = document.getElementById('inquiriesTableBody');
  const recentTbody = document.getElementById('recentInquiriesBody');
  
  if (!inquiries.length) {
    const emptyRow = '<tr><td colspan="6" class="text-center">No inquiries found.</td></tr>';
    if(tbody) tbody.innerHTML = emptyRow;
    if(recentTbody) recentTbody.innerHTML = '<tr><td colspan="4" class="text-center">No inquiries found.</td></tr>';
    return;
  }

  if (tbody) {
    const rows = inquiries.map((inq, index) => `
      <tr>
        <td><strong>${inq.referenceId || 'N/A'}</strong><br><span style="font-size:0.8rem; color:var(--gray-500)">${new Date(inq.createdAt || inq.submittedAt).toLocaleDateString()}</span></td>
        <td>
          <strong>${inq.name}</strong><br>
          <span style="font-size:0.8rem; color:var(--gray-500)">${inq.email}<br>${inq.phone}</span>
        </td>
        <td>${inq.company ? inq.company + '<br>' : ''}${inq.city}${inq.state ? ', ' + inq.state : ''}</td>
        <td>${(inq.products && inq.products.length) ? inq.products.join(', ') : 'Custom'} <br><strong>Qty: ${inq.quantity}</strong></td>
        <td><span class="badge ${inq.status === 'Completed' || inq.status === 'Resolved' ? 'completed' : 'pending'}">${inq.status || 'New'}</span></td>
        <td><button class="btn btn-primary view-inquiry-btn" data-action="view-inquiry" data-index="${index}" style="padding: 5px 10px; font-size: 0.8rem;">View Details</button></td>
      </tr>
    `).join('');
    tbody.innerHTML = rows;
  }
  
  if (recentTbody) {
    const recentRows = inquiries.slice(0, 5).map(inq => `
      <tr>
        <td>${new Date(inq.createdAt || inq.submittedAt).toLocaleDateString()}</td>
        <td>${inq.name}</td>
        <td>${inq.email}</td>
        <td><span class="badge ${inq.status === 'Completed' || inq.status === 'Resolved' ? 'completed' : 'pending'}">${inq.status || 'New'}</span></td>
      </tr>
    `).join('');
    recentTbody.innerHTML = recentRows;
  }
}

// Modal Logic for Inquiries
function openInquiryModal(index) {
  const inq = allInquiries[index];
  if (!inq) return;

  const modal = document.getElementById('inquiryModal');
  const body = document.getElementById('inquiryModalBody');
  
  body.innerHTML = `
    <style>
      .inquiry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; margin-bottom: 20px; }
      .inquiry-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .inquiry-card h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 15px 0; color: #1e293b; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
      .inquiry-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; line-height: 1.4; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px; }
      .inquiry-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      .inquiry-label { color: #64748b; font-weight: 500; min-width: 120px; }
      .inquiry-value { color: #334155; font-weight: 600; text-align: right; }
      .inquiry-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .inquiry-block h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 15px 0; color: #1e293b; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
      .inquiry-text-label { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
      .inquiry-text-box { background: white; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; color: #334155; font-size: 0.95rem; margin-bottom: 18px; line-height: 1.5; }
      .status-updater { display: flex; align-items: center; justify-content: space-between; background: white; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
      .status-select { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155; outline: none; background: #f8fafc; font-weight: 500; cursor: pointer; transition: all 0.2s; min-width: 150px; }
      .status-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(196,30,58,0.1); }
      .status-btn { background: var(--primary); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(196,30,58,0.2); }
      .status-btn:hover { background: #a01830; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(196,30,58,0.3); }
      .status-btn:active { transform: translateY(0); }
    </style>
    
    <div class="inquiry-grid">
      <div class="inquiry-card">
        <h4>👤 Contact Details</h4>
        <div class="inquiry-row"><span class="inquiry-label">Name</span> <span class="inquiry-value">${inq.name}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Company</span> <span class="inquiry-value">${inq.company || 'N/A'}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Email</span> <span class="inquiry-value"><a href="mailto:${inq.email}" style="color:var(--primary);text-decoration:none;">${inq.email}</a></span></div>
        <div class="inquiry-row"><span class="inquiry-label">Phone</span> <span class="inquiry-value">${inq.phone}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">WhatsApp</span> <span class="inquiry-value">${inq.whatsapp || 'N/A'}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Location</span> <span class="inquiry-value">${inq.city}${inq.state ? ', ' + inq.state : ''}</span></div>
      </div>
      
      <div class="inquiry-card">
        <h4>📦 Order Specifications</h4>
        <div class="inquiry-row"><span class="inquiry-label">Reference ID</span> <span class="inquiry-value" style="color:var(--primary);">${inq.referenceId || 'N/A'}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Products</span> <span class="inquiry-value">${(inq.products && inq.products.length) ? inq.products.join(', ') : 'Custom'}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Quantity</span> <span class="inquiry-value">${inq.quantity} units</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Budget</span> <span class="inquiry-value">${inq.budgetRange}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Delivery Target</span> <span class="inquiry-value">${inq.deliveryDate ? new Date(inq.deliveryDate).toLocaleDateString() : 'Flexible'}</span></div>
        <div class="inquiry-row"><span class="inquiry-label">Current State</span> <span class="inquiry-value" style="font-weight:700;">${inq.status || 'New'}</span></div>
      </div>
    </div>
    
    <div class="inquiry-block">
      <h4>🎨 Customization & Special Notes</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div><span class="inquiry-text-label">Occasion</span><div class="inquiry-text-box" style="margin-bottom:0;">${inq.occasion || 'N/A'}</div></div>
        <div><span class="inquiry-text-label">Customization Needs</span><div class="inquiry-text-box" style="margin-bottom:0;">${inq.customization || 'N/A'}</div></div>
      </div>
      
      <span class="inquiry-text-label">Product Description</span>
      <div class="inquiry-text-box">${inq.productDescription || 'No description provided.'}</div>
      
      ${inq.designNotes ? `<span class="inquiry-text-label">Design Notes</span><div class="inquiry-text-box">${inq.designNotes}</div>` : ''}
      ${inq.notes ? `<span class="inquiry-text-label">Other Comments</span><div class="inquiry-text-box">${inq.notes}</div>` : ''}
      
      <div class="status-updater">
        <div style="display:flex; flex-direction:column; gap:6px;">
          <span class="inquiry-text-label" style="margin:0; color:#1e293b; font-size:0.9rem;">Update Inquiry State</span>
          <span style="font-size:0.8rem; color:#64748b; font-weight: 400; text-transform: none;">Changes are immediately reflected on the user's tracking dashboard.</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <select id="inquiryStatusSelect" class="status-select">
            <option value="New" ${inq.status === 'New' ? 'selected' : ''}>⏳ New</option>
            <option value="Reviewed" ${inq.status === 'Reviewed' ? 'selected' : ''}>👁️ Reviewed</option>
            <option value="Resolved" ${inq.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
            <option value="Cancelled" ${inq.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
          <button data-action="update-inquiry-status" data-id="${inq._id}" class="status-btn">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function closeInquiryModal() {
  document.getElementById('inquiryModal').style.display = 'none';
}

async function updateInquiryStatus(id) {
  const status = document.getElementById('inquiryStatusSelect').value;
  try {
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
    const res = await fetch(`${apiBase}/api/bulk-inquiry/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token')}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      alert('Inquiry state updated successfully!');
      window.location.reload(); 
    } else {
      alert(data.message || 'Error updating state');
    }
  } catch (err) {
    console.error(err);
    alert('Server error updating state');
  }
}

// ==========================================
// Admin Products Actions (View, Edit, Delete)
// ==========================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Global cached products for quick viewing
let cachedProducts = [];
// Hook into fetchAdminData to save products (this function already exists above)
const origPopulateProducts = populateProducts;
populateProducts = function(products) {
  cachedProducts = products;
  origPopulateProducts(products);
};

function viewProduct(id) {
  const product = cachedProducts.find(p => p._id === id);
  if (!product) return alert('Product not found!');
  
  const body = document.getElementById('viewProductBody');
  body.innerHTML = `
    <div style="display: flex; gap: 20px; align-items: flex-start;">
      <div style="flex: 1;">
        <img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; border-radius: 8px; border: 1px solid #eee;">
      </div>
      <div style="flex: 2;">
        <h2 style="margin-top:0; margin-bottom:5px;">${product.name}</h2>
        <div style="color: #6b7280; margin-bottom: 15px;">Code: ${product.code} | Category: ${product.category}</div>
        <p><strong>Description:</strong><br/>${product.shortDescription || 'N/A'}</p>
        <p><strong>Price:</strong> ₹${product.price}</p>
        <p><strong>Stock:</strong> ${product.stockQuantity !== undefined ? product.stockQuantity : 'N/A'}</p>
        <p><strong>Status:</strong> ${product.status || 'Active'}</p>
      </div>
    </div>
  `;
  openModal('viewProductModal');
}

function editProduct(id) {
  const product = cachedProducts.find(p => p._id === id);
  if (!product) return alert('Product not found!');
  
  document.getElementById('editProductId').value = product._id;
  document.getElementById('editProductName').value = product.name;
  document.getElementById('editProductCode').value = product.code;
  document.getElementById('editProductCategory').value = product.category || 'Custom Gifts';
  document.getElementById('editProductShortDesc').value = product.shortDescription || '';
  document.getElementById('editProductPrice').value = product.price;
  
  const editOfferPct = document.getElementById('editProductOfferPercentage');
  const editDiscountPrice = document.getElementById('editProductDiscountPrice');
  if (editDiscountPrice) editDiscountPrice.value = (product.discountPrice !== undefined && product.discountPrice !== null) ? product.discountPrice : '';
  if (editOfferPct) {
    if (product.offerPercentage !== undefined && product.offerPercentage !== null && Number(product.offerPercentage) > 0) {
      editOfferPct.value = product.offerPercentage;
    } else if (product.price && product.discountPrice && Number(product.price) > Number(product.discountPrice)) {
      const computedPct = ((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100;
      editOfferPct.value = (Math.round(computedPct * 100) / 100).toFixed(2);
    } else {
      editOfferPct.value = '0';
    }
  }

  document.getElementById('editProductStock').value = product.stockQuantity !== undefined ? product.stockQuantity : 50;
  document.getElementById('editProductStatus').value = product.status || 'Active';
  document.getElementById('editProductImage').value = product.imageUrl || '';
  const fileInput = document.getElementById('editProductImageFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('editProductImagePreview').src = product.imageUrl || 'images/placeholder_machine.png';
  
  if (document.getElementById('editAllowCustomText')) document.getElementById('editAllowCustomText').checked = product.allowCustomText !== undefined ? !!product.allowCustomText : true;
  if (document.getElementById('editCustomTextLabel')) document.getElementById('editCustomTextLabel').value = product.customTextLabel || 'Custom Name / Message to Print';
  if (document.getElementById('editAllowCustomImage')) document.getElementById('editAllowCustomImage').checked = product.allowCustomImage !== undefined ? !!product.allowCustomImage : true;
  if (document.getElementById('editMaxCustomImages')) document.getElementById('editMaxCustomImages').value = product.maxCustomImages || 1;

  if (editProductOccasionPicker) {
    editProductOccasionPicker.setSelected(product.occasions || []);
  }

  openModal('editProductModal');
}

// Handle Edit Form Submission
document.addEventListener('DOMContentLoaded', () => {
  setupPricingAutoCalc('editProductPrice', 'editProductOfferPercentage', 'editProductDiscountPrice');

  const editForm = document.getElementById('editProductForm');
  if (editForm) {
    // Handle image URL preview update
    const editImgInput = document.getElementById('editProductImage');
    if (editImgInput) {
      editImgInput.addEventListener('input', (e) => {
        document.getElementById('editProductImagePreview').src = e.target.value || 'images/placeholder_machine.png';
      });
    }

    // Handle image file upload
    const editImgFile = document.getElementById('editProductImageFile');
    const editProductImagePreview = document.getElementById('editProductImagePreview');
    if (editImgFile) {
      editImgFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview instantly
        const reader = new FileReader();
        reader.onload = (evt) => {
          editProductImagePreview.src = evt.target.result;
        };
        reader.readAsDataURL(file);

        // Upload to S3 in background
        editImgFile.disabled = true;
        editProductImagePreview.style.opacity = '0.5';
        try {
          const s3Url = await uploadFileToS3(file, '/api/upload/single');
          document.getElementById('editProductImage').value = s3Url;
          editProductImagePreview.src = s3Url;
          editProductImagePreview.style.opacity = '1';
          console.log('✅ Edit product image uploaded to S3:', s3Url);
        } catch (err) {
          alert('Image upload failed: ' + err.message);
          editProductImagePreview.style.opacity = '1';
        } finally {
          editImgFile.disabled = false;
        }
      });
    }
    
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      
      const selectedEditOccasions = editProductOccasionPicker ? editProductOccasionPicker.getSelected() : [];

      const id = document.getElementById('editProductId').value;
      const data = {
        name: document.getElementById('editProductName').value,
        code: document.getElementById('editProductCode').value,
        category: document.getElementById('editProductCategory').value,
        occasions: selectedEditOccasions,
        shortDescription: document.getElementById('editProductShortDesc').value,
        price: Number(document.getElementById('editProductPrice').value),
        offerPercentage: document.getElementById('editProductOfferPercentage') ? Number(document.getElementById('editProductOfferPercentage').value) : 0,
        discountPrice: document.getElementById('editProductDiscountPrice') ? Number(document.getElementById('editProductDiscountPrice').value) : 0,
        stockQuantity: Number(document.getElementById('editProductStock').value),
        status: (document.getElementById('editProductStatus') && document.getElementById('editProductStatus').value) ? document.getElementById('editProductStatus').value : 'Active',
        imageUrl: document.getElementById('editProductImage').value,
        allowCustomText: document.getElementById('editAllowCustomText') ? document.getElementById('editAllowCustomText').checked : true,
        customTextLabel: document.getElementById('editCustomTextLabel') ? document.getElementById('editCustomTextLabel').value : 'Custom Name / Message to Print',
        allowCustomImage: document.getElementById('editAllowCustomImage') ? document.getElementById('editAllowCustomImage').checked : true,
        maxCustomImages: document.getElementById('editMaxCustomImages') ? Number(document.getElementById('editMaxCustomImages').value) || 1 : 1
      };
      
      try {
        const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
        const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
        const res = await fetch(`${apiBase}/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          closeModal('editProductModal');
          alert('Product updated successfully!');
          window.location.reload();
        } else {
          const err = await res.json();
          alert(err.message || 'Failed to update product');
        }
      } catch (error) {
        console.error(error);
        alert('Server error while saving product');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  }
});

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
  
  try {
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
    const res = await fetch(`${apiBase}/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      alert('Product deleted successfully!');
      window.location.reload();
    } else {
      const err = await res.json();
      alert(err.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error(error);
    alert('Server error while deleting product');
  }
}

// Global CSP-Compliant Event Delegation Listener
document.addEventListener('click', (e) => {
  // View Inquiry Modal
  const viewInqBtn = e.target.closest('[data-action="view-inquiry"]');
  if (viewInqBtn) {
    const index = Number(viewInqBtn.getAttribute('data-index'));
    openInquiryModal(index);
    return;
  }

  // Update Inquiry Status
  const updateStatusBtn = e.target.closest('[data-action="update-inquiry-status"]');
  if (updateStatusBtn) {
    const id = updateStatusBtn.getAttribute('data-id');
    updateInquiryStatus(id);
    return;
  }

  // Close Modal
  if (e.target.closest('.close-modal') || e.target.classList.contains('close-modal')) {
    const modal = document.getElementById('inquiryModal');
    if (modal) modal.style.display = 'none';
    return;
  }

  // View Product
  const viewProdBtn = e.target.closest('[data-action="view-product"]');
  if (viewProdBtn) {
    const id = viewProdBtn.getAttribute('data-id');
    if (typeof viewProduct === 'function') viewProduct(id);
    return;
  }

  // Edit Product
  const editProdBtn = e.target.closest('[data-action="edit-product"]');
  if (editProdBtn) {
    const id = editProdBtn.getAttribute('data-id');
    if (typeof editProduct === 'function') editProduct(id);
    return;
  }

  // Delete Product
  const delProdBtn = e.target.closest('[data-action="delete-product"]');
  if (delProdBtn) {
    const id = delProdBtn.getAttribute('data-id');
    if (typeof deleteProduct === 'function') deleteProduct(id);
    return;
  }

  // Logout Link
  const logoutLink = e.target.closest('.logout-link') || e.target.closest('#adminLogoutBtn');
  if (logoutLink) {
    e.preventDefault();
    if (typeof logout === 'function') logout();
    return;
  }
});

// Global S3 file upload helper
async function uploadFileToS3(file, endpoint = '/api/upload/single') {
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
  const formData = new FormData();
  formData.append(endpoint === '/api/upload/single' ? 'image' : 'images', file);
  const res = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data.url || data.urls;
}

/**
 * Setup Real-time Pricing Auto Calculation (Selling Price, Offer %, Discount Price)
 */
function setupPricingAutoCalc(priceId, offerPctId, discountPriceId) {
  const priceInput = document.getElementById(priceId);
  const offerPctInput = document.getElementById(offerPctId);
  const discountPriceInput = document.getElementById(discountPriceId);

  if (!priceInput || !offerPctInput || !discountPriceInput) return;

  function calcFromPriceOrOffer() {
    const price = parseFloat(priceInput.value) || 0;
    const pct = parseFloat(offerPctInput.value) || 0;

    if (price > 0 && pct >= 0) {
      const discountPrice = price - (price * (pct / 100));
      discountPriceInput.value = discountPrice >= 0 ? discountPrice.toFixed(2) : '0.00';
    } else if (price > 0 && (offerPctInput.value === '' || pct === 0)) {
      discountPriceInput.value = price.toFixed(2);
    }
  }

  function calcFromDiscountPrice() {
    const price = parseFloat(priceInput.value) || 0;
    const discountPrice = parseFloat(discountPriceInput.value) || 0;

    if (price > 0) {
      if (discountPrice >= price || discountPrice <= 0) {
        offerPctInput.value = '0';
      } else {
        const pct = ((price - discountPrice) / price) * 100;
        offerPctInput.value = (Math.round(pct * 100) / 100).toFixed(2);
      }
    }
  }

  priceInput.addEventListener('input', () => {
    if (offerPctInput.value !== '' && parseFloat(offerPctInput.value) > 0) {
      calcFromPriceOrOffer();
    } else if (discountPriceInput.value !== '' && parseFloat(discountPriceInput.value) > 0) {
      calcFromDiscountPrice();
    }
  });

  offerPctInput.addEventListener('input', calcFromPriceOrOffer);
  discountPriceInput.addEventListener('input', calcFromDiscountPrice);
}

/**
 * Searchable Multi-Select Occasion Picker Class
 */
class SearchableOccasionPicker {
  constructor(searchId, tagsId, listId) {
    this.searchEl = document.getElementById(searchId);
    this.tagsEl = document.getElementById(tagsId);
    this.listEl = document.getElementById(listId);
    this.selected = new Set();
    
    if (this.searchEl) {
      this.searchEl.addEventListener('input', () => this.renderList());
    }
  }

  setSelected(list = []) {
    this.selected = new Set((list || []).map(s => String(s).trim()).filter(Boolean));
    this.render();
  }

  getSelected() {
    return Array.from(this.selected);
  }

  toggle(name) {
    if (!name) return;
    if (this.selected.has(name)) {
      this.selected.delete(name);
    } else {
      this.selected.add(name);
    }
    this.render();
  }

  render() {
    this.renderTags();
    this.renderList();
  }

  renderTags() {
    if (!this.tagsEl) return;
    const arr = this.getSelected();
    if (arr.length === 0) {
      this.tagsEl.innerHTML = '<span style="color: #94a3b8; font-size: 0.8rem; font-style: italic;">No occasions selected yet</span>';
      return;
    }

    this.tagsEl.innerHTML = arr.map(name => `
      <span style="display: inline-flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 0.82rem; font-weight: 600; padding: 4px 10px; border-radius: 16px;">
        ${name}
        <span class="remove-occ-tag" data-occ="${name.replace(/"/g, '&quot;')}" style="cursor: pointer; font-size: 0.9rem; color: #0284c7; font-weight: bold;">✕</span>
      </span>
    `).join('');

    this.tagsEl.querySelectorAll('.remove-occ-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const occName = btn.getAttribute('data-occ');
        this.toggle(occName);
      });
    });
  }

  renderList() {
    if (!this.listEl) return;
    if (!allOccasions || allOccasions.length === 0) {
      this.listEl.innerHTML = '<span style="color: #64748b; font-size: 0.85rem; padding: 4px;">No occasions available.</span>';
      return;
    }

    const query = (this.searchEl ? this.searchEl.value : '').toLowerCase().trim();
    const filtered = allOccasions.filter(o => (o.name || '').toLowerCase().includes(query));

    if (filtered.length === 0) {
      this.listEl.innerHTML = '<span style="color: #94a3b8; font-size: 0.82rem; padding: 4px;">No matching occasions found</span>';
      return;
    }

    this.listEl.innerHTML = filtered.map(occ => {
      const isSel = this.selected.has(occ.name);
      return `
        <div class="occ-option-item" data-occ="${occ.name.replace(/"/g, '&quot;')}" style="padding: 6px 10px; font-size: 0.85rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: ${isSel ? '#f0fdf4' : 'transparent'}; color: ${isSel ? '#166534' : '#334155'}; border: 1px solid ${isSel ? '#bbf7d0' : 'transparent'}; transition: background 0.15s;">
          <span style="font-weight: ${isSel ? '600' : '500'};">${occ.name}</span>
          <span style="font-size: 0.78rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${isSel ? '#dcfce7' : '#f1f5f9'}; color: ${isSel ? '#15803d' : '#64748b'};">${isSel ? '✓ Selected' : '+ Add'}</span>
        </div>
      `;
    }).join('');

    this.listEl.querySelectorAll('.occ-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const occName = item.getAttribute('data-occ');
        this.toggle(occName);
      });
    });
  }
}

let addProductOccasionPicker = null;
let editProductOccasionPicker = null;

async function loadOccasionsForDropdowns() {
  const widgetAdd = document.getElementById('p_occ_widget');
  const widgetEdit = document.getElementById('edit_p_occ_widget');

  if (!widgetAdd && !widgetEdit) return;

  try {
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;
    const res = await fetch(`${apiBase}/api/occasions`);
    const data = await res.json();
    if (data.success && Array.isArray(data.occasions)) {
      allOccasions = data.occasions;

      if (widgetAdd && !addProductOccasionPicker) {
        addProductOccasionPicker = new SearchableOccasionPicker('p_occ_search', 'p_occ_selected_tags', 'p_occ_options_list');
      }
      if (addProductOccasionPicker) addProductOccasionPicker.render();

      if (widgetEdit && !editProductOccasionPicker) {
        editProductOccasionPicker = new SearchableOccasionPicker('edit_p_occ_search', 'edit_p_occ_selected_tags', 'edit_p_occ_options_list');
      }
      if (editProductOccasionPicker) editProductOccasionPicker.render();
    }
  } catch (err) {
    console.error('Error fetching occasions for picker:', err);
  }
}

