const API_BASE = window.DIROMMA_API_URL || "http://localhost:3000/api";
const loginView = document.querySelector("[data-login-view]");
const dashboard = document.querySelector("[data-dashboard]");
const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const dashboardMessage = document.querySelector("[data-dashboard-message]");
const adminList = document.querySelector("[data-admin-list]");
const summary = document.querySelector("[data-summary]");
const search = document.querySelector("[data-admin-search]");
const dialog = document.querySelector("[data-item-dialog]");
const itemForm = document.querySelector("[data-item-form]");
const formTitle = document.querySelector("[data-form-title]");
const formMessage = document.querySelector("[data-form-message]");
const categoryNames = document.querySelector("#category-names");
let items = [];

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Došlo je do greške. Pokušajte ponovo.");
  return body;
};

const showMessage = (element, message) => { element.textContent = message; element.hidden = !message; };
const setAuthenticated = (authenticated) => { loginView.hidden = authenticated; dashboard.hidden = !authenticated; };
const normalize = (value) => value.toLocaleLowerCase("sr-Latn").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const renderItems = () => {
  const query = normalize(search.value.trim());
  const visible = items.filter((item) => normalize(`${item.name} ${item.categoryName} ${item.size || ""}`).includes(query));
  summary.textContent = `${visible.length} proizvoda · ${items.filter((item) => item.isAvailable).length} trenutno vidljivo gostima`;
  adminList.replaceChildren();
  visible.forEach((item) => {
    const card = document.createElement("article");
    card.className = `admin-item${item.isAvailable ? "" : " is-hidden"}`;
    card.innerHTML = `<div class="admin-item__main"><div><h2></h2><p></p></div><strong class="admin-item__price"></strong></div><div class="admin-item__actions"><button type="button" data-edit>Izmeni</button><button type="button" data-availability>${item.isAvailable ? "Obriši proizvod" : "Vrati na meni"}</button></div>`;
    card.querySelector("h2").textContent = item.name;
    card.querySelector("p").textContent = `${item.categoryName}${item.size ? ` · ${item.size}` : ""}${item.isAvailable ? "" : " · Skriveno"}`;
    card.querySelector("strong").textContent = item.price === null ? "Cena nije uneta" : `${item.price} din`;
    card.querySelector("[data-edit]").addEventListener("click", () => openItemDialog(item));
    card.querySelector("[data-availability]").addEventListener("click", () => updateAvailability(item));
    adminList.append(card);
  });
  if (!visible.length) adminList.innerHTML = '<p class="admin-message">Nema proizvoda koji odgovaraju pretrazi.</p>';
};

const loadItems = async () => {
  const data = await request("/admin/menu");
  items = data.items;
  const categories = [...new Map(items.map((item) => [item.categoryId, item.categoryName])).entries()];
  categoryNames.replaceChildren(...categories.map(([, name]) => Object.assign(document.createElement("option"), { value: name })));
  renderItems();
};

const openItemDialog = (item = null) => {
  itemForm.reset();
  showMessage(formMessage, "");
  formTitle.textContent = item ? "Izmeni proizvod" : "Dodaj proizvod";
  itemForm.elements.id.value = item?.id || "";
  itemForm.elements.name.value = item?.name || "";
  itemForm.elements.size.value = item?.size || "";
  itemForm.elements.price.value = item?.price ?? "";
  itemForm.elements.categoryName.value = item?.categoryName || "";
  itemForm.elements.categoryId.value = item?.categoryId || "";
  itemForm.elements.categoryOrder.value = item?.categoryOrder ?? 0;
  itemForm.elements.itemOrder.value = item?.itemOrder ?? 0;
  itemForm.elements.isAvailable.checked = item?.isAvailable ?? true;
  dialog.showModal();
  itemForm.elements.name.focus();
};

const slugify = (value) => normalize(value)
  .replace(/đ/g, "dj")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

itemForm.elements.categoryName.addEventListener("input", () => {
  const category = items.find((item) => item.categoryName === itemForm.elements.categoryName.value);
  if (category) {
    itemForm.elements.categoryId.value = category.categoryId;
    itemForm.elements.categoryOrder.value = category.categoryOrder;
  } else if (!itemForm.elements.id.value) {
    itemForm.elements.categoryId.value = slugify(itemForm.elements.categoryName.value);
  }
});

const updateAvailability = async (item) => {
  const action = item.isAvailable ? "uklonite sa javnog menija" : "vratite na javni meni";
  if (!window.confirm(`Da li želite da ${action} proizvod „${item.name}”?`)) return;
  try {
    await request(`/admin/menu/${item.id}`, { method: "PATCH", body: JSON.stringify({ isAvailable: !item.isAvailable }) });
    await loadItems();
    showMessage(dashboardMessage, item.isAvailable ? "Proizvod je uklonjen sa javnog menija." : "Proizvod je ponovo vidljiv gostima.");
  } catch (error) { showMessage(dashboardMessage, error.message); }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button[type='submit']");
  button.disabled = true;
  showMessage(loginMessage, "");
  try {
    await request("/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
    setAuthenticated(true);
    await loadItems();
  } catch (error) { showMessage(loginMessage, error.message); }
  finally { button.disabled = false; }
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(itemForm));
  const id = data.id;
  const payload = { name: data.name, size: data.size || null, price: data.price === "" ? null : Number(data.price), categoryId: data.categoryId, categoryName: data.categoryName, categoryOrder: Number(data.categoryOrder), itemOrder: Number(data.itemOrder), isAvailable: itemForm.elements.isAvailable.checked };
  const button = itemForm.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    await request(id ? `/admin/menu/${id}` : "/admin/menu", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
    dialog.close();
    await loadItems();
    showMessage(dashboardMessage, id ? "Izmene su sačuvane." : "Novi proizvod je dodat.");
  } catch (error) { showMessage(formMessage, error.message); }
  finally { button.disabled = false; }
});

document.querySelector("[data-add-item]").addEventListener("click", () => openItemDialog());
document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
document.querySelector("[data-cancel-dialog]").addEventListener("click", () => dialog.close());
document.querySelector("[data-logout]").addEventListener("click", async () => { await request("/auth/logout", { method: "POST" }).catch(() => null); setAuthenticated(false); loginForm.reset(); });
search.addEventListener("input", renderItems);

request("/auth/me").then(async () => { setAuthenticated(true); await loadItems(); }).catch(() => setAuthenticated(false));
