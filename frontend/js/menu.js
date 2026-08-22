const menuSections = document.querySelector("[data-menu-sections]");
const categoryNav = document.querySelector("[data-category-nav]");
const searchInput = document.querySelector("[data-menu-search]");
const clearSearchButton = document.querySelector("[data-clear-search]");
const loadingState = document.querySelector("[data-menu-loading]");
const emptyState = document.querySelector("[data-menu-empty]");
const errorState = document.querySelector("[data-menu-error]");
const backToTopButton = document.querySelector("[data-back-to-top]");
const categoryToggle = document.querySelector("[data-category-toggle]");
const categoryPanel = document.querySelector("[data-category-panel]");
const categoryCloseButton = document.querySelector("[data-category-close]");
const menuPagination = document.querySelector("[data-menu-pagination]");
const MENU_API_URL = window.DIROMMA_API_URL || "http://localhost:3000/api";
let menuData;
let categoryObserver;
const translate = (value) => window.siteI18n?.translate(value) || value;

const normalizeText = (value) => value
  .toLocaleLowerCase("sr-Latn")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const createMenuItem = (item, currency) => {
  const article = document.createElement("article");
  const info = document.createElement("div");
  const title = document.createElement("h3");
  const price = document.createElement("span");

  article.className = "menu-item";
  title.textContent = translate(item.name);
  info.append(title);

  if (item.size) {
    const size = document.createElement("span");
    size.className = "menu-item__size";
    size.textContent = translate(item.size);
    info.append(size);
  }

  price.className = "menu-item__price";
  if (Number.isFinite(item.price)) price.textContent = translate(`${item.price} ${currency}`);
  else {
    price.classList.add("is-pending");
    price.textContent = "Proveriti cenu";
  }

  article.append(info, price);
  return article;
};

const setActiveCategory = (categoryId) => {
  categoryNav.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset.categoryTarget === categoryId;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });

  menuPagination.querySelectorAll("a").forEach((link) => {
    const isActive = link.dataset.paginationTarget === categoryId;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
};

const closeCategoryPanel = () => {
  categoryPanel.hidden = true;
  categoryToggle.setAttribute("aria-expanded", "false");
};

const observeCategories = () => {
  categoryObserver?.disconnect();
  categoryObserver = new IntersectionObserver((entries) => {
    const activeEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (activeEntry) setActiveCategory(activeEntry.target.id);
  }, { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.2, 0.5] });

  menuSections.querySelectorAll(".menu-category").forEach((section) => categoryObserver.observe(section));
};

const renderMenu = (query = "") => {
  if (!menuData) return;

  const normalizedQuery = normalizeText(query.trim());
  menuSections.replaceChildren();
  categoryNav.replaceChildren();
  menuPagination.replaceChildren();
  let visibleItems = 0;

  menuData.categories.forEach((category) => {
    const filteredItems = category.items.filter((item) => {
      const searchableText = normalizeText(`${item.name} ${translate(item.name)} ${item.size || ""} ${category.name} ${translate(category.name)}`);
      return searchableText.includes(normalizedQuery);
    });

    if (!filteredItems.length) return;
    visibleItems += filteredItems.length;

    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.textContent = translate(category.name);
    navButton.dataset.categoryTarget = category.id;
    navButton.addEventListener("click", () => {
      document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      closeCategoryPanel();
    });
    categoryNav.append(navButton);

    const paginationLink = document.createElement("a");
    paginationLink.href = `#${category.id}`;
    paginationLink.dataset.paginationTarget = category.id;
    paginationLink.setAttribute("aria-label", translate(category.name));
    menuPagination.append(paginationLink);

    const section = document.createElement("section");
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    const count = document.createElement("span");
    const items = document.createElement("div");

    section.className = "menu-category";
    section.id = category.id;
    heading.className = "menu-category__heading";
    title.textContent = translate(category.name);
    count.textContent = translate(`${filteredItems.length} ${filteredItems.length === 1 ? "proizvod" : "proizvoda"}`);
    items.className = "menu-items";
    filteredItems.forEach((item) => items.append(createMenuItem(item, menuData.currency)));
    heading.append(title, count);
    section.append(heading, items);
    menuSections.append(section);
  });

  const renderedCategories = [...menuSections.querySelectorAll(".menu-category")];
  renderedCategories.forEach((section, index) => {
    const nextTarget = renderedCategories[index + 1]?.id || "menu-footer";
    const arrow = document.createElement("a");
    const arrowIcon = document.createElement("span");
    arrow.className = "section-arrow";
    arrow.href = `#${nextTarget}`;
    arrow.setAttribute("aria-label", renderedCategories[index + 1] ? "Pređi na sledeću kategoriju" : "Pređi na kraj menija");
    arrowIcon.setAttribute("aria-hidden", "true");
    arrow.append(arrowIcon);
    section.append(arrow);
  });

  menuSections.hidden = visibleItems === 0;
  emptyState.hidden = visibleItems !== 0;
  categoryNav.hidden = visibleItems === 0;
  menuPagination.hidden = visibleItems === 0;
  if (visibleItems) {
    categoryNav.querySelector("button")?.classList.add("is-active");
    observeCategories();
  }
};

categoryToggle?.addEventListener("click", () => {
  const willOpen = categoryPanel.hidden;
  categoryPanel.hidden = !willOpen;
  categoryToggle.setAttribute("aria-expanded", String(willOpen));
});

categoryCloseButton?.addEventListener("click", closeCategoryPanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && categoryPanel && !categoryPanel.hidden) closeCategoryPanel();
});

document.addEventListener("click", (event) => {
  if (!categoryPanel || categoryPanel.hidden) return;
  if (!categoryPanel.contains(event.target) && !categoryToggle.contains(event.target)) closeCategoryPanel();
});

const loadMenu = async () => {
  try {
    let response;
    try {
      response = await fetch(`${MENU_API_URL}/menu`);
      if (!response.ok) throw new Error("API nije dostupan");
    } catch {
      response = await fetch("data/menu.json");
    }
    if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
    menuData = await response.json();
    loadingState.hidden = true;
    menuSections.hidden = false;
    renderMenu();
  } catch {
    loadingState.hidden = true;
    errorState.hidden = false;
  }
};

searchInput?.addEventListener("input", () => {
  clearSearchButton.hidden = searchInput.value.length === 0;
  renderMenu(searchInput.value);
});

clearSearchButton?.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchButton.hidden = true;
  renderMenu();
  searchInput.focus();
});

const updateBackToTop = () => backToTopButton?.classList.toggle("is-visible", window.scrollY > 700);
window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

loadMenu();
window.addEventListener("site-language-change", () => renderMenu(searchInput?.value || ""));
