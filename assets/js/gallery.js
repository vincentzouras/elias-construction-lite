(function () {
  "use strict";

  const IMAGES_PER_BATCH = 8;
  let currentIndex = 0;
  let allImages = [];
  let isLoading = false;

  function createImageElement(image) {
    const col = document.createElement("div");
    col.className = "col-lg-3 col-md-4 col-sm-6";

    const link = document.createElement("a");
    link.href = `assets/img/${image.category}/${image.filename}`;
    link.className = "glightbox";
    link.setAttribute("data-gallery", "gallery");

    const img = document.createElement("img");
    img.src = `assets/img/${image.category}/${image.filename}`;
    img.alt = `${image.category} project`;
    img.className = "img-fluid rounded";
    img.loading = "lazy";

    link.appendChild(img);
    col.appendChild(link);
    return col;
  }

  function loadMoreImages() {
    if (isLoading || currentIndex >= allImages.length) return;

    isLoading = true;
    const galleryGrid = document.getElementById("gallery-grid");
    const endIndex = Math.min(currentIndex + IMAGES_PER_BATCH, allImages.length);
    const loadedCount = endIndex - currentIndex;

    for (let i = currentIndex; i < endIndex; i++) {
      galleryGrid.appendChild(createImageElement(allImages[i]));
    }

    currentIndex = endIndex;
    isLoading = false;

    // Reinitialize GLightbox to include new images
    if (typeof GLightbox !== "undefined") {
      GLightbox({
        selector: ".glightbox",
      });
    }
  }

  function checkLoadMore() {
    const galleryGrid = document.getElementById("gallery-grid");
    if (!galleryGrid) return;

    const rect = galleryGrid.getBoundingClientRect();
    const scrollThreshold = window.innerHeight + 500; // Load when 500px from bottom

    if (rect.bottom < scrollThreshold && currentIndex < allImages.length) {
      loadMoreImages();
    }
  }

  function initGallery() {
    const galleryGrid = document.getElementById("gallery-grid");
    if (!galleryGrid) return;

    // Get category filter from data attribute (for category pages)
    const filterCategory = galleryGrid.getAttribute("data-category");

    // Flatten all images from specified categories
    allImages = [];
    const categories = filterCategory ? [filterCategory] : ["basements", "kitchens", "bathrooms", "additions"];

    categories.forEach((category) => {
      if (galleryImages[category]) {
        galleryImages[category].forEach((filename) => {
          allImages.push({
            filename: filename,
            category: category,
          });
        });
      }
    });

    // Load initial batch
    currentIndex = 0;
    loadMoreImages();

    // Set up infinite scroll listener
    window.addEventListener("scroll", checkLoadMore);
    window.addEventListener("resize", checkLoadMore);
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGallery);
  } else {
    initGallery();
  }
})();
