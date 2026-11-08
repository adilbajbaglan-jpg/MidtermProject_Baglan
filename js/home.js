(() => {
  BagaShop.renderProducts(document.getElementById('featured-grid'), products.slice(0, 4));
  const form = document.getElementById('kit-form');
  const budget = document.getElementById('kit-budget');
  const error = document.getElementById('kit-error');
  const result = document.getElementById('kit-result');
  const kitPlans = { Study: [1, 3, 4, 7], Daily: [2, 1, 5, 6], Home: [8, 3, 1, 6] };
  let selectedIds = [];
  function buildKit() {
    const amount = Number(budget.value);
    if (!budget.value.trim() || !Number.isInteger(amount) || amount < 1500 || amount > 50000) {
      error.textContent = 'Enter a whole-number budget between 1,500 and 50,000 KZT.';
      budget.classList.add('is-invalid');
      budget.setAttribute('aria-invalid', 'true');
      result.replaceChildren();
      selectedIds = [];
      return;
    }
    error.textContent = '';
    budget.classList.remove('is-invalid');
    budget.setAttribute('aria-invalid', 'false');
    const type = form.elements['kit-type'].value;
    let total = 0;
    const kit = [];
    for (const id of kitPlans[type]) {
      const product = products.find(product => product.id === id);
      if (total + product.price <= amount && kit.length < 3) {
        kit.push(product);
        total += product.price;
      }
    }
    selectedIds = kit.map(product => product.id);
    result.innerHTML = `<div class="kit-products">${kit.map(product => `<div class="kit-item"><img src="${product.image}" alt="${product.name}" width="150" height="75"><span>${product.name}</span></div>`).join('')}</div><div class="kit-total"><div><strong>${BagaShop.money(total)}</strong><p>${BagaShop.money(amount - total)} left · ${kit.length} items · delivery extra</p></div><button id="add-kit" type="button" class="button">Add kit to bag +</button></div>`;
    document.getElementById('add-kit').addEventListener('click', () => BagaShop.addKit(selectedIds));
  }
  form.addEventListener('submit', event => { event.preventDefault(); buildKit(); });
  form.addEventListener('change', buildKit);
  budget.addEventListener('input', buildKit);
  buildKit();
})();
