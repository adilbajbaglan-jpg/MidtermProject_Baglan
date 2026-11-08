(() => {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const fields = ['full-name', 'email', 'phone', 'city', 'preferred-date', 'topic', 'address', 'message', 'consent'];
  const touched = new Set();
  let submitted = false;
  let mode = new URLSearchParams(location.search).get('mode') === 'order' ? 'order' : 'message';
  const dateField = document.getElementById('preferred-date');
  function dateString(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function updateDates() { dateField.min = dateString(1); dateField.max = dateString(30); }
  function requiresAddress() { return mode === 'order' && document.getElementById('delivery').value === 'delivery'; }
  function errorFor(id) {
    const element = document.getElementById(id);
    const value = element.value.trim();
    if (id === 'address' && !requiresAddress()) return '';
    if (id === 'consent') return element.checked ? '' : 'Please confirm that you understand this is a demo.';
    if (!value) return 'Please ' + (element.tagName === 'SELECT' || id === 'preferred-date' ? 'choose a value for this field.' : 'complete this field.');
    if (id === 'full-name' && (value.length < 2 || value.length > 60 || !/^[\p{L}\p{M}\s.'’-]+$/u.test(value))) return 'Use 2–60 characters: letters, spaces, apostrophes or hyphens.';
    if (id === 'email' && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 120)) return 'Enter a valid email, for example name@example.com.';
    if (id === 'phone') {
      const digits = value.replace(/[\s()+-]/g, '');
      if (!/^[+\d\s()-]+$/.test(value) || !/^[78]\d{10}$/.test(digits)) return 'Enter a Kazakhstan number: +7 followed by 10 digits, or 8 followed by 10 digits.';
    }
    if (id === 'preferred-date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < dateString(1) || value > dateString(30))) return 'Choose a date from tomorrow through the next 30 days.';
    if (id === 'address' && (value.length < 8 || value.length > 160)) return 'Enter a complete address using 8–160 characters.';
    if (id === 'message' && (value.length < 10 || value.length > 1000)) return 'Write a message between 10 and 1,000 characters.';
    return '';
  }
  function validateField(id) {
    const element = document.getElementById(id);
    const error = errorFor(id);
    document.getElementById(id + '-error').textContent = error;
    element.classList.toggle('is-invalid', Boolean(error));
    element.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  }
  function resetValidation() {
    touched.clear();
    submitted = false;
    fields.forEach(id => {
      document.getElementById(id).classList.remove('is-invalid');
      document.getElementById(id).removeAttribute('aria-invalid');
      document.getElementById(id + '-error').textContent = '';
    });
    document.getElementById('order-error').textContent = '';
  }
  function renderSummary() {
    const items = BagaShop.getItems();
    const container = document.getElementById('checkout-summary');
    if (!items.length) {
      container.innerHTML = '<p class="eyebrow">YOUR EVERYDAY ESSENTIALS</p><h2>Your bag, at a glance.</h2><div class="empty-state"><p>Your bag is empty. Add something useful, or use the form to leave a demo message.</p><a class="button button-outline" href="products.html">Find your essentials →</a></div>';
      return;
    }
    const delivery = BagaShop.deliveryCost(document.getElementById('delivery').value);
    container.innerHTML = `<p class="eyebrow">A LITTLE SOMETHING FOR YOU</p><h2>Order summary</h2>${items.map(item => `<div class="summary-product"><img src="${item.image}" alt="${item.name}" width="50" height="55"><div><strong>${item.name}</strong><small>Quantity: ${item.quantity}</small></div><span>${BagaShop.money(item.price * item.quantity)}</span></div>`).join('')}<div class="summary-line"><span>Subtotal</span><span>${BagaShop.money(BagaShop.subtotal())}</span></div><div class="summary-line"><span>${document.getElementById('delivery').value === 'pickup' ? 'Campus pickup' : 'Delivery'}</span><span>${BagaShop.money(delivery)}</span></div><div class="summary-line summary-total"><span>Total</span><span>${BagaShop.money(BagaShop.subtotal() + delivery)}</span></div><button type="button" class="text-button" data-open-cart>Edit your bag ↗</button><p class="summary-note">Demo prices and delivery. No payment is collected.</p>`;
  }
  function updateAddress() {
    const required = requiresAddress();
    document.querySelector('.address-field').hidden = !required;
    document.getElementById('address').required = required;
    document.getElementById('address').disabled = !required;
    if (!required) {
      document.getElementById('address').classList.remove('is-invalid');
      document.getElementById('address').removeAttribute('aria-invalid');
      document.getElementById('address-error').textContent = '';
    }
    renderSummary();
  }
  function setMode(nextMode) {
    mode = nextMode;
    resetValidation();
    $(success).stop(true, true).hide();
    document.querySelectorAll('[data-mode]').forEach(button => {
      button.classList.toggle('selected', button.dataset.mode === mode);
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    document.querySelectorAll('.order-field').forEach(element => element.hidden = mode !== 'order');
    document.getElementById('form-title').textContent = mode === 'order' ? 'Your essentials are almost yours.' : 'Let’s talk essentials.';
    document.getElementById('form-intro').textContent = mode === 'order' ? 'Complete a demo order. Nothing is charged or shipped.' : 'Try the contact form. Your message stays in this demo.';
    document.getElementById('submit-label').textContent = mode === 'order' ? 'Place demo order' : 'Submit demo message';
    document.getElementById('topic').value = mode === 'order' ? 'Demo order' : '';
    document.getElementById('message').placeholder = mode === 'order' ? 'Add your delivery or pickup instructions…' : 'Tell us a little more…';
    updateAddress();
  }
  fields.forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('blur', () => { touched.add(id); validateField(id); });
    for (const type of ['input', 'change']) element.addEventListener(type, () => {
      if (touched.has(id) || submitted) validateField(id);
      if ($(success).is(':visible')) $(success).stop(true, true).hide();
    });
  });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.getElementById('delivery').addEventListener('change', updateAddress);
  document.addEventListener('cartchange', () => {
    renderSummary();
    if (BagaShop.getItems().length) document.getElementById('order-error').textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    updateDates();
    submitted = true;
    const valid = fields.map(validateField).every(Boolean);
    const hasItems = mode !== 'order' || BagaShop.getItems().length > 0;
    document.getElementById('order-error').textContent = hasItems ? '' : 'Your bag is empty. Add products before placing a demo order.';
    if (!valid || !hasItems) {
      const firstError = form.querySelector('.is-invalid');
      if (firstError) firstError.focus();
      else { document.getElementById('order-error').setAttribute('tabindex', '-1'); document.getElementById('order-error').focus(); }
      return;
    }
    const name = document.getElementById('full-name').value.trim();
    const total = BagaShop.subtotal() + BagaShop.deliveryCost(document.getElementById('delivery').value);
    success.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = mode === 'order' ? 'Your demo order is complete.' : 'Your demo message is complete.';
    const text = document.createElement('p');
    text.textContent = mode === 'order' ? 'Thank you, ' + name + '. Demo total: ' + BagaShop.money(total) + '. Your bag has been cleared. No payment was taken and no order was sent.' : 'Thank you, ' + name + '. The form was validated successfully and cleared. No message was sent and no personal details were saved.';
    success.append(heading, text);
    if (mode === 'order') BagaShop.clearCart();
    form.reset();
    resetValidation();
    updateAddress();
    $(success).stop(true, true).fadeIn(200, () => success.focus());
  });
  updateDates();
  setMode(mode);
})();
