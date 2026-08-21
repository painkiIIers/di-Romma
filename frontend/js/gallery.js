const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];
const lightbox = document.querySelector("[data-lightbox]");
const translateGalleryText = (value) => window.siteI18n?.translate(value) || value;

if (galleryItems.length && lightbox) {
  const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
  const currentCounter = lightbox.querySelector("[data-lightbox-current]");
  const totalCounter = lightbox.querySelector("[data-lightbox-total]");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const previousButton = lightbox.querySelector("[data-lightbox-previous]");
  const nextButton = lightbox.querySelector("[data-lightbox-next]");
  let currentIndex = 0;
  let pointerStartX = 0;

  const formatNumber = (number) => String(number).padStart(2, "0");
  totalCounter.textContent = formatNumber(galleryItems.length);

  const showImage = (nextIndex) => {
    currentIndex = (nextIndex + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];

    lightboxImage.src = item.dataset.src;
    lightboxImage.alt = translateGalleryText(item.dataset.alt);
    lightboxCaption.textContent = translateGalleryText(item.dataset.caption);
    currentCounter.textContent = formatNumber(currentIndex + 1);
  };

  const openLightbox = (index) => {
    showImage(index);
    lightbox.showModal();
    document.body.classList.add("nav-is-open");
  };

  const closeLightbox = () => {
    lightbox.close();
    document.body.classList.remove("nav-is-open");
  };

  galleryItems.forEach((item, index) => item.addEventListener("click", () => openLightbox(index)));
  closeButton.addEventListener("click", closeLightbox);
  previousButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lightbox__content")) closeLightbox();
  });

  lightbox.addEventListener("close", () => document.body.classList.remove("nav-is-open"));

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showImage(currentIndex - 1);
    if (event.key === "ArrowRight") showImage(currentIndex + 1);
  });

  lightbox.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });

  lightbox.addEventListener("pointerup", (event) => {
    const distanceX = event.clientX - pointerStartX;
    if (Math.abs(distanceX) < 50) return;
    showImage(currentIndex + (distanceX < 0 ? 1 : -1));
  });

  window.addEventListener("site-language-change", () => showImage(currentIndex));
}
