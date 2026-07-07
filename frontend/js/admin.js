/**
 * admin.js — Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verify Authentication & Admin Role
  const user = getAuthUser();
  const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token');

  if (!user || !token || !user.isAdmin) {
    // Not an admin, redirect to home
    window.location.href = 'index.html';
    return;
  }

  // Set Header User Info
  document.getElementById('adminName').textContent = user.fullName || 'Admin';
  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A';
  document.getElementById('adminAvatar').textContent = initial;

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
      headerTitle.textContent = link.textContent.trim();

      // Show Target Section
      const targetId = link.getAttribute('data-target');
      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // 3. Data Fetching
  fetchDashboardData(token);
});

let allProducts = [];
let allInquiries = [];

async function fetchDashboardData(token) {
  try {
    // Fetch Products
    const prodRes = await fetch(`${API_BASE}/api/products`);
    const prodData = await prodRes.json();
    allProducts = prodData.success ? prodData.products : [];
    
    // Fetch Users
    const usersRes = await fetch(`${API_BASE}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    const users = usersData.success ? usersData.users : [];

    // Fetch Inquiries
    const inqRes = await fetch(`${API_BASE}/api/bulk-inquiry`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const inqData = await inqRes.json();
    allInquiries = inqData.success ? inqData.inquiries : [];

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
      
      let primaryImageBase64 = "";
      let galleryImagesBase64 = [];

      // Primary Image Upload Handling
      const pImageFile = document.getElementById('p_imageFile');
      const primaryImagePreview = document.getElementById('primaryImagePreview');

      if (pImageFile) {
        pImageFile.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
              primaryImageBase64 = evt.target.result;
              primaryImagePreview.src = primaryImageBase64;
              primaryImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Gallery Images Upload Handling
      const pGalleryFiles = document.getElementById('p_galleryFiles');
      const galleryPreviewContainer = document.getElementById('galleryPreviewContainer');
      const galleryUploadBox = document.getElementById('galleryUploadBox');

      if (pGalleryFiles) {
        pGalleryFiles.addEventListener('change', (e) => {
          const files = Array.from(e.target.files);
          
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(evt) {
              const base64 = evt.target.result;
              galleryImagesBase64.push(base64);
              
              // Create image element and insert it before the upload box
              const img = document.createElement('img');
              img.src = base64;
              img.className = 'gallery-item';
              galleryPreviewContainer.insertBefore(img, galleryUploadBox);
            };
            reader.readAsDataURL(file);
          });
        });
      }

      addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById('saveProductBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const payload = {
          name: document.getElementById('p_name').value,
          code: document.getElementById('p_code').value,
          brand: document.getElementById('p_brand').value,
          category: document.getElementById('p_category').value,
          subCategory: document.getElementById('p_subCategory').value,
          productType: document.getElementById('p_productType').value,
          status: document.getElementById('p_status').value,
          imageUrl: primaryImageBase64,
          galleryImages: galleryImagesBase64,
          shortDescription: document.getElementById('p_shortDescription').value,
          detailedDescription: document.getElementById('p_detailedDescription').value,
          price: document.getElementById('p_price').value,
          discountPrice: document.getElementById('p_discountPrice').value,
          costPrice: document.getElementById('p_costPrice').value,
          stockQuantity: document.getElementById('p_stockQuantity').value,
          lowStockAlert: document.getElementById('p_lowStockAlert').value,
          skuBarcode: document.getElementById('p_skuBarcode').value,
          weight: document.getElementById('p_weight').value,
          dimensions: {
            length: document.getElementById('p_dim_l').value,
            width: document.getElementById('p_dim_w').value,
            height: document.getElementById('p_dim_h').value
          },
          shippingType: document.getElementById('p_shippingType').value,
          keywords: document.getElementById('p_keywords').value,
          metaTitle: document.getElementById('p_metaTitle').value,
          metaDescription: document.getElementById('p_metaDescription').value,
          urlSlug: document.getElementById('p_urlSlug').value,
          visibility: document.getElementById('p_visibility').value,
          isFeatured: document.getElementById('p_isFeatured').checked,
          isBestSeller: document.getElementById('p_isBestSeller').checked,
          isNewArrival: document.getElementById('p_isNewArrival').checked,
          showOnHomepage: document.getElementById('p_showOnHomepage').checked,
          allowReviews: document.getElementById('p_allowReviews').checked
        };

        try {
          const res = await fetch(`${API_BASE}/api/products`, {
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

  } catch (error) {
    console.error('Error fetching admin data:', error);
  }
}

function populateProducts(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No products found matching your search.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.imageUrl}" alt="${p.name}" class="product-img-thumbnail" onerror="this.src='images/product-placeholder.png'"></td>
      <td><strong>${p.name}</strong><br><span style="font-size:0.8rem; color:var(--gray-500)">${p.category || 'Custom Gifts'}</span></td>
      <td>${p.code}</td>
      <td>₹${p.price}</td>
    </tr>
  `).join('');
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
        <td><button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="openInquiryModal(${index})">View Details</button></td>
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
          <button onclick="updateInquiryStatus('${inq._id}')" class="status-btn">Save Changes</button>
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
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:5000';
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
