const products = [
  { id: "copper-shield", name: "Copper Shield", subtitle: "Copper-based fungicide · protective", type: "fungicide", art: "sage", tone: "green", price: 24.5, size: "250 ml", crops: ["tomato", "potato"], challenges: ["late-blight"], tags: ["Late blight", "Tomato", "Potato"], badge: "FUNGICIDE", mark: "01" },
  { id: "sulfur-care", name: "Sulfur Care", subtitle: "Sulfur-based fungicide · contact", type: "fungicide", art: "berry", tone: "sand", price: 18.75, size: "500 g", crops: ["grape", "cucurbits"], challenges: ["powdery-mildew"], tags: ["Powdery mildew", "Grape", "Cucurbits"], badge: "FUNGICIDE", mark: "02" },
  { id: "bio-guard", name: "BioGuard", subtitle: "Biological fungicide · Bacillus-based", type: "fungicide", art: "sun", tone: "gold", price: 21, size: "250 ml", crops: ["tomato", "grape", "cucurbits", "vegetables"], challenges: ["powdery-mildew", "late-blight"], tags: ["Leaf health", "Vegetables", "Grape"], badge: "BIOLOGICAL", mark: "03" },
  { id: "garden-neem", name: "Garden Neem", subtitle: "Neem-based insect control", type: "insecticide", art: "soil", tone: "brown", price: 16.25, size: "250 ml", crops: ["tomato", "cucurbits", "vegetables"], challenges: ["aphids"], tags: ["Aphids", "Whiteflies", "Vegetables"], badge: "BOTANICAL", mark: "04" },
  { id: "bt-caterpillar", name: "Bt Caterpillar Care", subtitle: "Biological insect control · Bt-based", type: "insecticide", art: "blue", tone: "blue", price: 19.5, size: "100 g", crops: ["tomato", "field", "vegetables"], challenges: ["caterpillars"], tags: ["Caterpillars", "Armyworm", "Field crops"], badge: "BIOLOGICAL", mark: "05" },
  { id: "field-edge", name: "Field Edge", subtitle: "Non-selective weed control · directed use", type: "herbicide", art: "gold", tone: "gold", price: 22, size: "500 ml", crops: ["field"], challenges: ["weeds"], tags: ["Weeds", "Fallow land", "Field crops"], badge: "HERBICIDE", mark: "06" },
];

const cropNames = { tomato: "tomato", potato: "potato", grape: "grape", cucurbits: "cucurbit", vegetables: "vegetable", field: "field crop" };
const challengeNames = { "late-blight": "late blight", "powdery-mildew": "powdery mildew", aphids: "aphids", caterpillars: "caterpillars", weeds: "weeds" };
const productGrid = document.querySelector("#product-grid");
const emptyProducts = document.querySelector("#empty-products");
const finderForm = document.querySelector("#finder-form");
const finderFeedback = document.querySelector("#finder-feedback");
const cropSelect = document.querySelector("#crop-select");
const challengeSelect = document.querySelector("#challenge-select");
const searchInput = document.querySelector("#product-search");
const filterTabs = [...document.querySelectorAll(".filter-tab")];
const bag = new Map();
let activeFilter = "all";
let toastTimer;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function filteredProducts() {
  const search = searchInput.value.trim().toLowerCase();
  return products.filter((product) => {
    const matchesType = activeFilter === "all" || product.type === activeFilter;
    const haystack = [product.name, product.subtitle, product.badge, ...product.tags].join(" ").toLowerCase();
    return matchesType && haystack.includes(search);
  });
}

function productCardMarkup(product) {
  return `
    <article class="product-card">
      <div class="product-art" data-art="${product.art}">
        <span class="product-badge">${escapeHTML(product.badge)}</span>
        <span class="art-orbit" aria-hidden="true">✳</span>
        <div class="product-pack" data-tone="${product.tone}" aria-hidden="true">
          <span class="pack-brand">cropkind</span><span class="pack-leaf">❧</span>
          <span class="pack-rule"></span><span class="pack-name">${escapeHTML(product.mark)} &nbsp; FIELD CARE</span>
        </div>
      </div>
      <div class="product-body">
        <div class="product-topline"><span>${escapeHTML(product.type)}</span><span class="product-rating">✳ &nbsp; LABEL FIRST</span></div>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-subtitle">${escapeHTML(product.subtitle)}</p>
        <div class="product-tags">${product.tags.slice(0, 3).map((tag) => `<span class="product-tag">${escapeHTML(tag)}</span>`).join("")}</div>
        <div class="product-foot">
          <span class="product-price">₹${product.price.toFixed(2)}<small>${escapeHTML(product.size)} · demo price</small></span>
          <button class="add-button" type="button" data-add="${escapeHTML(product.id)}">${bag.has(product.id) ? "Add another +" : "Add to bag +"}</button>
        </div>
      </div>
    </article>`;
}

function renderProducts(visible = filteredProducts()) {
  productGrid.innerHTML = visible.map(productCardMarkup).join("");
  emptyProducts.hidden = visible.length > 0;
  productGrid.hidden = visible.length === 0;
}

function updateBag() {
  const quantity = [...bag.values()].reduce((total, count) => total + count, 0);
  document.querySelector("#bag-count").textContent = String(quantity);
  document.querySelector("#drawer-count").textContent = `(${quantity})`;
  document.querySelector("#bag-empty").hidden = quantity > 0;
  document.querySelector("#bag-summary").hidden = quantity === 0;

  const bagItems = document.querySelector("#bag-items");
  bagItems.innerHTML = [...bag.entries()].map(([id, count]) => {
    const product = products.find((item) => item.id === id);
    return `<article class="bag-item">
      <div class="bag-item-art" aria-hidden="true">❧</div>
      <div><h3>${escapeHTML(product.name)} × ${count}</h3><p>${escapeHTML(product.size)} · ${escapeHTML(product.type)}</p><button class="remove-item" type="button" data-remove="${escapeHTML(id)}">Remove one</button></div>
      <span class="bag-item-price">₹${(product.price * count).toFixed(2)}</span>
    </article>`;
  }).join("");

  const total = [...bag.entries()].reduce((sum, [id, count]) => {
    const product = products.find((item) => item.id === id);
    return sum + product.price * count;
  }, 0);
  document.querySelector("#bag-total").textContent = `₹${total.toFixed(2)}`;
  renderProducts();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function applyFinder(crop, challenge) {
  if (crop === "all" && challenge === "all") {
    finderFeedback.textContent = "Choose a crop, a challenge, or both to narrow down the product list.";
    return;
  }
  const matching = products.filter((product) =>
    (crop === "all" || product.crops.includes(crop)) &&
    (challenge === "all" || product.challenges.includes(challenge)),
  );
  activeFilter = "all";
  searchInput.value = "";
  filterTabs.forEach((tab) => {
    const selected = tab.dataset.filter === "all";
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  const cropText = crop === "all" ? "" : cropNames[crop];
  const challengeText = challenge === "all" ? "" : challengeNames[challenge];
  finderFeedback.textContent = matching.length
    ? `Showing ${matching.length} ${matching.length === 1 ? "option" : "options"}${cropText ? ` for ${cropText}` : ""}${cropText && challengeText ? " with" : ""}${challengeText ? ` ${challengeText}` : ""}. Check the label to confirm this product is approved for your crop and location.`
    : `No listed product matches${cropText ? ` ${cropText}` : ""}${challengeText ? ` and ${challengeText}` : ""}. Ask a local crop adviser before choosing a treatment.`;
  renderProducts(matching);
  document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
}

filterTabs.forEach((tab) => tab.addEventListener("click", () => {
  activeFilter = tab.dataset.filter;
  filterTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  finderFeedback.textContent = "";
  renderProducts();
}));

searchInput.addEventListener("input", () => renderProducts());
document.querySelector("#clear-filters").addEventListener("click", (event) => {
  event.preventDefault();
  activeFilter = "all";
  searchInput.value = "";
  finderFeedback.textContent = "";
  filterTabs.forEach((tab) => {
    const selected = tab.dataset.filter === "all";
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
});
document.querySelector("#reset-search").addEventListener("click", () => {
  activeFilter = "all";
  searchInput.value = "";
  filterTabs.forEach((tab) => {
    const selected = tab.dataset.filter === "all";
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
});
finderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFinder(cropSelect.value, challengeSelect.value);
});
document.querySelectorAll(".guide-arrow").forEach((button) => button.addEventListener("click", () => {
  challengeSelect.value = button.dataset.challenge;
  cropSelect.value = "all";
  applyFinder("all", button.dataset.challenge);
}));

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const id = button.dataset.add;
  bag.set(id, (bag.get(id) || 0) + 1);
  updateBag();
  showToast(`${products.find((product) => product.id === id).name} added to your bag.`);
});
document.querySelector("#bag-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const id = button.dataset.remove;
  const count = bag.get(id) || 0;
  if (count <= 1) bag.delete(id);
  else bag.set(id, count - 1);
  updateBag();
});

const bagDrawer = document.querySelector("#bag-drawer");
const bagBackdrop = document.querySelector("#bag-backdrop");
function setBagOpen(open) {
  bagDrawer.hidden = !open;
  bagBackdrop.hidden = !open;
  document.body.classList.toggle("drawer-open", open);
  if (open) document.querySelector("#bag-close").focus();
}
document.querySelector("#bag-open").addEventListener("click", () => setBagOpen(true));
document.querySelector("#bag-close").addEventListener("click", () => setBagOpen(false));
bagBackdrop.addEventListener("click", () => setBagOpen(false));
document.querySelector("#bag-browse").addEventListener("click", () => {
  setBagOpen(false);
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setBagOpen(false);
    setChatOpen(false);
  }
});

const chatPanel = document.querySelector("#chat-panel");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector("#chat-messages");
let chatHistory = [];
let isSending = false;
function setChatOpen(open) {
  chatPanel.hidden = !open;
  document.querySelector("#chat-launcher").hidden = open;
  if (open) chatInput.focus();
}
document.querySelector("#chat-launcher").addEventListener("click", () => setChatOpen(true));
document.querySelector("#chat-open").addEventListener("click", () => setChatOpen(true));
document.querySelector("#chat-close").addEventListener("click", () => setChatOpen(false));
document.querySelector("#chat-suggestions").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || isSending) return;
  chatInput.value = button.textContent;
  document.querySelector("#chat-suggestions").hidden = true;
  document.querySelector("#chat-form").requestSubmit();
});

function appendMessage(role, content, label) {
  const row = document.createElement("div");
  row.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;
  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "you" : "ck";
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = content;
  if (label) {
    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = label;
    bubble.append(time);
  }
  row.append(avatar, bubble);
  chatMessages.append(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

document.querySelector("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || isSending) return;
  isSending = true;
  document.querySelector("#chat-send").disabled = true;
  document.querySelector("#chat-suggestions").hidden = true;
  appendMessage("user", message);
  chatInput.value = "";
  const thinking = appendMessage("assistant", "Thinking through that…");
  thinking.classList.add("typing-indicator");
  chatHistory.push({ role: "user", content: message });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory.slice(-12) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Assistant request failed (${response.status}).`);
    thinking.classList.remove("typing-indicator");
    thinking.textContent = data.reply;
    const label = document.createElement("span");
    label.className = "message-time";
    label.textContent = "AI-GENERATED · VERIFY LOCALLY";
    thinking.append(label);
    chatHistory.push({ role: "assistant", content: data.reply });
    chatHistory = chatHistory.slice(-12);
  } catch (error) {
    chatHistory.pop();
    thinking.classList.remove("typing-indicator");
    thinking.textContent = error.message.includes("Failed to fetch")
      ? "I couldn’t reach the local assistant. Make sure the CropKind server and Ollama are running, then try again."
      : error.message;
  } finally {
    isSending = false;
    document.querySelector("#chat-send").disabled = false;
    chatInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

document.querySelector("#all-count").textContent = String(products.length).padStart(2, "0");
renderProducts();
