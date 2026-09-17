/**
 * ============================================
 * CUSTOM REVIEW SYSTEM — Client-Side Logic
 * ============================================
 *
 * Handles:
 * 1. Interactive star rating selection
 * 2. Form submission via fetch + FormData
 * 3. Loading & rendering review cards with media
 * 4. File preview before upload
 */

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // CONFIG
  // =============================================
  const API_BASE = window.location.origin; // Same-origin in production
  const API_URL = `${API_BASE}/api/reviews`;

  // =============================================
  // DOM REFERENCES
  // =============================================
  const reviewForm = document.getElementById('reviewForm');
  const starsContainer = document.getElementById('starRating');
  const ratingInput = document.getElementById('ratingValue');
  const imageInput = document.getElementById('reviewImage');
  const videoInput = document.getElementById('reviewVideo');
  const imagePreview = document.getElementById('imagePreview');
  const videoPreview = document.getElementById('videoPreview');
  const submitBtn = document.getElementById('reviewSubmitBtn');
  const formMessage = document.getElementById('formMessage');
  const reviewsContainer = document.getElementById('reviewsContainer');
  const reviewsLoading = document.getElementById('reviewsLoading');

  // =============================================
  // INTERACTIVE STAR RATING
  // =============================================
  if (starsContainer) {
    const stars = starsContainer.querySelectorAll('.star-btn');

    stars.forEach(star => {
      // Hover preview
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        stars.forEach(s => {
          s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
        });
      });

      // Click to set
      star.addEventListener('click', () => {
        const val = star.dataset.value;
        ratingInput.value = val;
        stars.forEach(s => {
          s.classList.toggle('selected', parseInt(s.dataset.value) <= parseInt(val));
        });
      });
    });

    // Reset hover on mouse leave
    starsContainer.addEventListener('mouseleave', () => {
      const current = parseInt(ratingInput.value) || 0;
      stars.forEach(s => {
        s.classList.remove('hovered');
        s.classList.toggle('selected', parseInt(s.dataset.value) <= current);
      });
    });
  }

  // =============================================
  // FILE PREVIEW
  // =============================================
  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file && imagePreview) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
      } else if (imagePreview) {
        imagePreview.style.display = 'none';
      }
    });
  }

  if (videoInput) {
    videoInput.addEventListener('change', () => {
      const file = videoInput.files[0];
      if (file && videoPreview) {
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
      } else if (videoPreview) {
        videoPreview.style.display = 'none';
      }
    });
  }

  // =============================================
  // FORM SUBMISSION
  // =============================================
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate rating
      if (!ratingInput.value || ratingInput.value === '0') {
        showMessage('Silakan pilih rating bintang.', 'error');
        return;
      }

      // Build FormData
      const formData = new FormData();
      formData.append('user_name', reviewForm.querySelector('#reviewName').value);
      formData.append('rating', ratingInput.value);
      formData.append('review_text', reviewForm.querySelector('#reviewText').value);

      if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }
      if (videoInput.files[0]) {
        formData.append('video', videoInput.files[0]);
      }

      // UI: disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: formData  // No Content-Type header — browser sets multipart boundary
        });

        const data = await res.json();

        if (data.success) {
          showMessage('Terima kasih! Ulasan Anda berhasil dikirim. ✅', 'success');
          reviewForm.reset();
          ratingInput.value = '';
          if (imagePreview) imagePreview.style.display = 'none';
          if (videoPreview) videoPreview.style.display = 'none';
          // Clear star selection
          starsContainer?.querySelectorAll('.star-btn').forEach(s => {
            s.classList.remove('selected', 'hovered');
          });
          // Reload reviews
          loadReviews();
        } else {
          showMessage(data.message || 'Gagal mengirim ulasan.', 'error');
        }
      } catch (err) {
        console.error('Submit error:', err);
        showMessage('Terjadi kesalahan jaringan. Coba lagi nanti.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Ulasan';
      }
    });
  }

  // =============================================
  // SHOW MESSAGE (success / error)
  // =============================================
  function showMessage(text, type) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  }

  // =============================================
  // LOAD & RENDER REVIEWS
  // =============================================
  async function loadReviews() {
    if (!reviewsContainer) return;

    if (reviewsLoading) reviewsLoading.style.display = 'block';
    reviewsContainer.innerHTML = '';

    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (reviewsLoading) reviewsLoading.style.display = 'none';

      if (!data.success || !data.data.length) {
        reviewsContainer.innerHTML = '<p class="reviews-empty">Belum ada ulasan. Jadilah yang pertama! 🎉</p>';
        return;
      }

      data.data.forEach(review => {
        reviewsContainer.appendChild(createReviewCard(review));
      });

    } catch (err) {
      console.error('Error loading reviews:', err);
      if (reviewsLoading) reviewsLoading.style.display = 'none';
      reviewsContainer.innerHTML = '<p class="reviews-empty">Gagal memuat ulasan.</p>';
    }
  }

  // =============================================
  // CREATE REVIEW CARD
  // =============================================
  function createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'review-card';

    // Stars HTML
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="rv-star${i <= review.rating ? ' filled' : ''}" aria-hidden="true">★</span>`;
    }

    // Date
    const date = new Date(review.created_at);
    const dateStr = date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Initial avatar
    const initial = escapeHTML(review.user_name.charAt(0).toUpperCase());

    // Media HTML
    let mediaHTML = '';
    if (review.image_path || review.video_path) {
      mediaHTML = '<div class="review-media">';
      if (review.image_path) {
        mediaHTML += `<img src="${escapeAttr(review.image_path)}" alt="Foto ulasan dari ${escapeAttr(review.user_name)}" loading="lazy" class="review-img">`;
      }
      if (review.video_path) {
        mediaHTML += `<video controls preload="metadata" class="review-video"><source src="${escapeAttr(review.video_path)}">Browser Anda tidak mendukung video.</video>`;
      }
      mediaHTML += '</div>';
    }

    card.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">${initial}</div>
        <div class="review-meta">
          <span class="review-name">${escapeHTML(review.user_name)}</span>
          <span class="review-date">${dateStr}</span>
        </div>
      </div>
      <div class="review-stars">${starsHTML}</div>
      <p class="review-text">${escapeHTML(review.review_text)}</p>
      ${mediaHTML}
    `;

    return card;
  }

  // =============================================
  // HELPERS — XSS-safe
  // =============================================
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // =============================================
  // INIT — Load reviews on page load
  // =============================================
  loadReviews();

});
