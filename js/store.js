const BagaShop = (() => {
  const icons = {
    plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>'
  };
  function readStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { showToast('Browser storage is unavailable. Your bag works for this visit.'); }
  }
  const storedCart = readStorage('bagashop-cart', []);
  let cart = [];
  if (Array.isArray(storedCart)) {
    for (const item of storedCart) {
      const product = products.find(product => product.id === item?.id);
      if (product && Number.isInteger(item.quantity) && item.quantity > 0 && !cart.some(row => row.id === item.id)) {
        cart.push({ id: item.id, quantity: Math.min(item.quantity, product.stock) });
      }
    }
  }
  const storedSaved = readStorage('bagashop-saved', []);
  let saved = Array.isArray(storedSaved) ? [...new Set(storedSaved.filter(id => products.some(product => product.id === id)))] : [];
  let lastTrigger = null;
  function money(amount) { return new Intl.NumberFormat('en-US').format(amount) + ' KZT'; }
  function getItems() { return cart.map(item => ({ ...products.find(product => product.id === item.id), quantity: item.quantity })); }
  function subtotal() { return getItems().reduce((sum, item) => sum + item.price * item.quantity, 0); }
  function deliveryCost(method = 'delivery') { return !cart.length || method === 'pickup' || subtotal() >= 15000 ? 0 : 1000; }
  function isSaved(id) { return saved.includes(id); }
  function savedCount() { return saved.length; }
  function showToast(message) {
    const toast = $('#toast');
    const activeDialog = document.querySelector('dialog[open]');
    (activeDialog || document.body).appendChild(toast[0]);
    toast.stop(true, true).text(message).fadeIn(160).delay(2200).fadeOut(200);
  }
  function saveCart() {
    writeStorage('bagashop-cart', cart);
    renderCart();
    document.dispatchEvent(new CustomEvent('cartchange'));
  }
  function addItem(id, quantity = 1) {
    const product = products.find(product => product.id === id);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return false;
    const item = cart.find(item => item.id === id);
    const current = item ? item.quantity : 0;
    if (current + quantity > product.stock) {
      showToast('Only ' + product.stock + ' ' + product.name.toLowerCase() + ' items are available in this demo.');
      return false;
    }
    document.dispatchEvent(new CustomEvent('productadded', { detail: { id } }));
    if (item) item.quantity += quantity;
    else cart.push({ id, quantity });
    saveCart();
    showToast(product.name + ' added to your bag.');
    return true;
  }
  function addKit(ids) {
    const selected = ids.map(id => products.find(product => product.id === id));
    if (!selected.length || selected.some(product => !product)) return;
    for (const product of selected) {
      const quantity = cart.find(item => item.id === product.id)?.quantity || 0;
      if (quantity >= product.stock) {
        showToast('Your bag already has the available stock of ' + product.name + '.');
        return;
      }
    }
    for (const product of selected) {
      const item = cart.find(item => item.id === product.id);
      if (item) item.quantity++;
      else cart.push({ id: product.id, quantity: 1 });
    }
    saveCart();
    showToast('Your everyday kit is in the bag.');
  }
  function clearCart() { cart = []; saveCart(); }
  function toggleSaved(id) {
    saved = isSaved(id) ? saved.filter(savedId => savedId !== id) : [...saved, id];
    writeStorage('bagashop-saved', saved);
    document.querySelectorAll('[data-save="' + id + '"]').forEach(button => {
      button.setAttribute('aria-pressed', String(isSaved(id)));
      button.setAttribute('aria-label', (isSaved(id) ? 'Unsave ' : 'Save ') + products.find(product => product.id === id).name);
    });
    showToast(isSaved(id) ? 'Saved for later.' : 'Removed from saved products.');
    document.dispatchEvent(new CustomEvent('savedchange'));
  }
  function productCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.innerHTML = `
      <div class="product-image">
        <button type="button" data-detail="${product.id}" aria-label="View ${product.name} details"><img src="${product.image}" alt="${product.name}" width="700" height="640" loading="lazy"><span class="quick-view-label" aria-hidden="true">Take a closer look <span>↗</span></span></button>
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        <button type="button" class="save-button" data-save="${product.id}" aria-pressed="${isSaved(product.id)}" aria-label="${isSaved(product.id) ? 'Unsave' : 'Save'} ${product.name}">${icons.heart}</button>
      </div>
      <div class="product-info"><p class="product-category">${product.category}</p><h3><button class="product-name" type="button" data-detail="${product.id}">${product.name}</button></h3><p class="product-description">${product.short}</p><div class="product-bottom"><span class="price">${money(product.price).replace(' KZT', ' <small>KZT</small>')}</span><button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">${icons.plus}</button></div></div>`;
    return card;
  }
  function renderProducts(container, items) {
    container.replaceChildren();
    for (const [index, product] of items.entries()) {
      const card = productCard(product);
      card.style.setProperty('--item-delay', Math.min(index, 5) * 55 + 'ms');
      container.appendChild(card);
    }
    document.dispatchEvent(new CustomEvent('productsrendered', { detail: { container } }));
  }
  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(element => element.textContent = count);
    document.querySelector('[data-open-cart]').setAttribute('aria-label', 'Open shopping bag, ' + count + ' items');
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    if (!cart.length) {
      container.innerHTML = '<div class="empty-state"><h3>A little room for something good.</h3><p>Your shopping bag is empty. Let’s find your next useful thing.</p><a href="products.html" class="button">Explore essentials →</a></div>';
      summary.innerHTML = '';
      return;
    }
    container.innerHTML = getItems().map(item => `<article class="cart-item"><img src="${item.image}" alt="${item.name}" width="68" height="85"><div><h3>${item.name}</h3><p>${money(item.price)} each</p><div class="quantity-controls"><button type="button" data-quantity="${item.id}" data-step="-1" aria-label="Decrease ${item.name} quantity" ${item.quantity <= 1 ? 'disabled' : ''}>−</button><span aria-label="Quantity">${item.quantity}</span><button type="button" data-quantity="${item.id}" data-step="1" aria-label="Increase ${item.name} quantity" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button></div></div><div><span class="price">${money(item.price * item.quantity)}</span><button class="remove-button" type="button" data-remove="${item.id}" aria-label="Remove ${item.name}">Remove</button></div></article>`).join('');
    const remainder = Math.max(0, 15000 - subtotal());
    summary.innerHTML = `<div class="delivery-progress" aria-hidden="true"><span style="width:${Math.min(100, subtotal() / 15000 * 100)}%"></span></div><p class="delivery-message">${remainder ? 'You’re ' + money(remainder) + ' away from free delivery.' : 'Your bag qualifies for free delivery.'}</p><div class="summary-line"><span>Subtotal</span><span>${money(subtotal())}</span></div><div class="summary-line"><span>Standard delivery</span><span>${money(deliveryCost())}</span></div><div class="summary-line summary-total"><span>Total</span><span>${money(subtotal() + deliveryCost())}</span></div><a class="button checkout-link" href="contact.html?mode=order">Continue to checkout <span>→</span></a><p class="cart-demo-note">Demo checkout · No payment required</p>`;
  }
  function openDialog(id, trigger) {
    const dialog = document.getElementById(id);
    lastTrigger = trigger || document.activeElement;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  function closeDialog(dialog) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (document.documentElement.classList.contains('motion-off') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    window.setTimeout(() => { dialog.close(); dialog.classList.remove('is-closing'); }, 180);
  }
  function showProduct(id, trigger) {
    const product = products.find(product => product.id === id);
    if (!product) return;
    document.getElementById('product-detail').innerHTML = `<div class="product-detail-grid"><div class="detail-gallery"><img id="gallery-image" src="${product.image}" alt="${product.name}" width="700" height="640"><div class="gallery-options" role="group" aria-label="Product image view"><button class="active" type="button" data-gallery="full" aria-pressed="true">Full view</button><button type="button" data-gallery="detail" aria-pressed="false">Closer look</button></div></div><div class="detail-copy"><p class="eyebrow">${product.category.toUpperCase()} ESSENTIALS</p><h2 id="product-title">${product.name}</h2><p>${product.description}</p><p class="price">${money(product.price)}</p><ul>${product.details.map(detail => '<li>' + detail + '</li>').join('')}</ul><p>${product.stock} available in the demo collection</p><button class="button" type="button" data-add="${product.id}">Add to bag ${icons.plus}</button><p class="summary-note">Illustrative product photo. This is a student demo.</p></div></div>`;
    openDialog('product-dialog', trigger);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-add')) addItem(Number(button.dataset.add));
    if (button.hasAttribute('data-save')) toggleSaved(Number(button.dataset.save));
    if (button.hasAttribute('data-detail')) showProduct(Number(button.dataset.detail), button);
    if (button.hasAttribute('data-open-cart')) openDialog('cart-dialog', button);
    if (button.hasAttribute('data-close-dialog')) closeDialog(button.closest('dialog'));
    if (button.hasAttribute('data-remove')) {
      cart = cart.filter(item => item.id !== Number(button.dataset.remove));
      saveCart();
      document.querySelector('#cart-items [data-remove]')?.focus();
      if (!cart.length) document.querySelector('#cart-items a').focus();
      showToast('Item removed from your bag.');
    }
    if (button.hasAttribute('data-quantity')) {
      const id = Number(button.dataset.quantity);
      const item = cart.find(item => item.id === id);
      const product = products.find(product => product.id === id);
      const step = Number(button.dataset.step);
      if (item && item.quantity + step >= 1 && item.quantity + step <= product.stock) {
        item.quantity += step;
        saveCart();
        const replacement = document.querySelector('[data-quantity="' + id + '"][data-step="' + step + '"]');
        if (!replacement.disabled) replacement.focus();
        else document.querySelector('[data-quantity="' + id + '"][data-step="' + -step + '"]').focus();
      }
    }
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      document.body.appendChild(document.getElementById('toast'));
      if (lastTrigger?.isConnected) lastTrigger.focus();
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  renderCart();
  return { money, getItems, subtotal, deliveryCost, addItem, addKit, clearCart, isSaved, savedCount, renderProducts, showToast };
})();
