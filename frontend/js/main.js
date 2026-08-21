if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  window.scrollTo(0, 0);
});

const navToggle = document.querySelector("[data-nav-toggle]");
const navigation = document.querySelector("[data-nav]");
const siteHeader = document.querySelector("[data-header]");
let headerFrameId;
const chooseLanguage = (serbian, english) => window.siteI18n?.choose(serbian, english) || serbian;

const updateHeaderState = () => {
  headerFrameId = undefined;
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const requestHeaderUpdate = () => {
  if (headerFrameId) return;
  headerFrameId = window.requestAnimationFrame(updateHeaderState);
};

window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
updateHeaderState();

const closeNavigation = () => {
  if (!navToggle || !navigation) return;

  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", chooseLanguage("Otvori navigaciju", "Open navigation"));
  navigation.classList.remove("is-open");
  document.body.classList.remove("nav-is-open");
};

if (navToggle && navigation) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute("aria-label", isOpen
      ? chooseLanguage("Otvori navigaciju", "Open navigation")
      : chooseLanguage("Zatvori navigaciju", "Close navigation"));
    navigation.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("nav-is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  window.matchMedia("(min-width: 48rem)").addEventListener("change", (event) => {
    if (event.matches) closeNavigation();
  });
}

document.querySelectorAll("[data-image]").forEach((image) => {
  image.addEventListener("error", () => {
    const parent = image.parentElement;

    if (!parent || parent.querySelector(".image-fallback")) return;

    image.hidden = true;
    parent.classList.add("has-fallback");

    if (parent.classList.contains("brand")) return;

    const fallback = document.createElement("div");
    fallback.className = "image-fallback";
    fallback.textContent = chooseLanguage("Fotografija Caffe di Romma", "Caffe di Romma photo");
    parent.append(fallback);
  });
});

const slider = document.querySelector("[data-slider]");

if (slider) {
  const slides = [...slider.querySelectorAll("[data-slide]")];
  const dots = [...slider.querySelectorAll("[data-slider-dot]")];
  const previousButton = slider.querySelector("[data-slider-previous]");
  const nextButton = slider.querySelector("[data-slider-next]");
  const currentCounter = slider.querySelector("[data-slider-current]");
  const totalCounter = slider.querySelector("[data-slider-total]");
  const progressBar = slider.querySelector("[data-slider-progress]");
  const sliderViewport = slider.querySelector(".slider__viewport");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentSlide = 0;
  let autoplayId;
  let pointerStartX = 0;
  let pointerStartY = 0;

  const formatSlideNumber = (number) => String(number).padStart(2, "0");

  if (totalCounter) totalCounter.textContent = formatSlideNumber(slides.length);

  const restartProgress = () => {
    if (!progressBar || reduceMotion.matches) return;

    progressBar.classList.remove("is-running");
    void progressBar.offsetWidth;
    progressBar.classList.add("is-running");
  };

  const showSlide = (nextIndex) => {
    currentSlide = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === currentSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentSlide;
      dot.classList.toggle("is-active", isActive);
      if (isActive) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    if (currentCounter) currentCounter.textContent = formatSlideNumber(currentSlide + 1);
    restartProgress();
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayId);
    slider.classList.add("is-paused");
  };

  const startAutoplay = () => {
    window.clearInterval(autoplayId);
    slider.classList.remove("is-paused");

    if (!reduceMotion.matches) {
      restartProgress();
      autoplayId = window.setInterval(() => showSlide(currentSlide + 1), 5000);
    }
  };

  previousButton?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    startAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.sliderDot));
      startAutoplay();
    });
  });

  sliderViewport?.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    stopAutoplay();
  });

  sliderViewport?.addEventListener("pointerup", (event) => {
    const distanceX = event.clientX - pointerStartX;
    const distanceY = event.clientY - pointerStartY;

    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      showSlide(currentSlide + (distanceX < 0 ? 1 : -1));
    }

    if (event.pointerType === "mouse") stopAutoplay();
    else startAutoplay();
  });

  sliderViewport?.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "mouse") stopAutoplay();
    else startAutoplay();
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", startAutoplay);
  document.addEventListener("visibilitychange", () => (document.hidden ? stopAutoplay() : startAutoplay()));
  reduceMotion.addEventListener("change", startAutoplay);
  startAutoplay();
}

const year = document.querySelector("[data-current-year]");
if (year) year.textContent = new Date().getFullYear();

const aboutImageFrame = document.querySelector("[data-about-image]");
const aboutImage = aboutImageFrame?.querySelector("img");
const parallaxMedia = window.matchMedia("(min-width: 48rem) and (prefers-reduced-motion: no-preference)");
let parallaxFrameId;

const updateAboutParallax = () => {
  parallaxFrameId = undefined;

  if (!aboutImage || !aboutImageFrame || !parallaxMedia.matches) {
    aboutImage?.style.removeProperty("transform");
    return;
  }

  const imagePosition = aboutImageFrame.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;
  const imageCenter = imagePosition.top + imagePosition.height / 2;
  const distanceFromCenter = (imageCenter - viewportCenter) / window.innerHeight;
  const offset = Math.max(-14, Math.min(14, distanceFromCenter * -18));

  aboutImage.style.transform = `translateY(${offset}px) scale(1.06)`;
};

const requestAboutParallax = () => {
  if (parallaxFrameId) return;
  parallaxFrameId = window.requestAnimationFrame(updateAboutParallax);
};

if (aboutImage) {
  window.addEventListener("scroll", requestAboutParallax, { passive: true });
  window.addEventListener("resize", requestAboutParallax);
  parallaxMedia.addEventListener("change", updateAboutParallax);
  updateAboutParallax();
}

const pageSections = [...document.querySelectorAll("[data-page-section]")];
const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const revealSections = [...document.querySelectorAll("[data-reveal]")];

const setActiveSection = (sectionId) => {
  sectionLinks.forEach((link) => {
    const isActive = link.dataset.sectionLink === sectionId;
    link.classList.toggle("is-active", isActive);

    if (isActive) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.18 },
  );

  revealSections.forEach((section) => revealObserver.observe(section));

  const navigationObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

      if (visibleSections[0]) setActiveSection(visibleSections[0].target.id);
    },
    { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.25, 0.5, 0.75] },
  );

  pageSections.forEach((section) => navigationObserver.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add("is-visible"));
}

const toast = document.querySelector("[data-toast]");
let toastTimeoutId;

const showToast = (message) => {
  if (!toast) return;

  window.clearTimeout(toastTimeoutId);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.append(temporaryInput);
  temporaryInput.select();
  document.execCommand("copy");
  temporaryInput.remove();
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await copyText(button.dataset.copy);
      showToast(chooseLanguage(button.dataset.copyLabel || "Kopirano.", "Copied."));
    } catch {
      showToast(chooseLanguage("Kopiranje nije uspelo. Pokušajte ponovo.", "Copying failed. Please try again."));
    }
  });
});

const openStatus = document.querySelector("[data-open-status]");

const updateOpenStatus = () => {
  if (!openStatus) return;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Belgrade",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const timePart = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const currentMinutes = Number(timePart.hour) * 60 + Number(timePart.minute);
  const opensAt = 7 * 60;
  const closesAt = timePart.weekday === "Fri" || timePart.weekday === "Sat" ? 24 * 60 : 23 * 60;
  const isOpen = currentMinutes >= opensAt && currentMinutes < closesAt;
  const messageSr = isOpen
    ? `Otvoreno sada · do ${closesAt === 24 * 60 ? "00:00" : "23:00"}`
    : currentMinutes < opensAt
      ? "Trenutno zatvoreno · otvaramo danas u 07:00"
      : "Trenutno zatvoreno · otvaramo sutra u 07:00";
  const message = chooseLanguage(messageSr, {
    "Otvoreno sada · do 23:00": "Open now · until 23:00",
    "Otvoreno sada · do 00:00": "Open now · until 00:00",
    "Trenutno zatvoreno · otvaramo danas u 07:00": "Currently closed · opens today at 07:00",
    "Trenutno zatvoreno · otvaramo sutra u 07:00": "Currently closed · opens tomorrow at 07:00"
  }[messageSr]);

  openStatus.classList.toggle("is-open", isOpen);
  openStatus.classList.toggle("is-closed", !isOpen);
  openStatus.querySelector("strong").textContent = message;
};

if (openStatus) {
  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);
  window.addEventListener("site-language-change", updateOpenStatus);
}

const locationButton = document.querySelector("[data-use-location]");
const destinationAddress = "Kralja Petra Prvog 1/1, 11300 Smederevo";

locationButton?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast(chooseLanguage("Vaš uređaj ne podržava određivanje lokacije.", "Your device does not support location services."));
    return;
  }

  locationButton.disabled = true;
  locationButton.textContent = chooseLanguage("Tražimo lokaciju…", "Finding your location…");

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const directionsUrl = new URL("https://www.google.com/maps/dir/");
      directionsUrl.searchParams.set("api", "1");
      directionsUrl.searchParams.set("origin", `${coords.latitude},${coords.longitude}`);
      directionsUrl.searchParams.set("destination", destinationAddress);
      window.location.href = directionsUrl.toString();
    },
    () => {
      locationButton.disabled = false;
      locationButton.textContent = chooseLanguage("Putanja od moje lokacije", "Directions from my location");
      showToast(chooseLanguage("Lokacija nije dostupna. Možete otvoriti standardnu putanju.", "Your location is unavailable. You can open standard directions instead."));
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
});

const mapContainer = document.querySelector("[data-map-container]");
const mapFrame = document.querySelector("[data-map-frame]");
const mapFallback = document.querySelector("[data-map-fallback]");
let mapFallbackTimeoutId;

if (mapContainer && mapFrame) {
  mapFallbackTimeoutId = window.setTimeout(() => {
    if (mapContainer.classList.contains("is-loaded")) return;
    if (mapFallback) mapFallback.hidden = false;
  }, 12000);

  mapFrame.addEventListener("load", () => {
    window.clearTimeout(mapFallbackTimeoutId);
    if (mapFallback) mapFallback.hidden = true;
    mapContainer.classList.add("is-loaded");
  });
}

const mobileActions = document.querySelector("[data-mobile-actions]");
const contactFooter = document.querySelector("[data-site-footer]");
let isFooterVisible = false;

const updateMobileActions = () => {
  mobileActions?.classList.toggle("is-visible", window.scrollY > 320 && !isFooterVisible);
};

if (mobileActions) {
  window.addEventListener("scroll", updateMobileActions, { passive: true });

  if (contactFooter && "IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver((entries) => {
      isFooterVisible = entries[0].isIntersecting;
      updateMobileActions();
    });
    footerObserver.observe(contactFooter);
  }

  updateMobileActions();
}
