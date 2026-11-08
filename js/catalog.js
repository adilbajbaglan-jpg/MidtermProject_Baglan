(() => {
  const search = document.getElementById('product-search');
  const sort = document.getElementById('product-sort');
  const savedOnly = document.getElementById('saved-only');
  const categories = ['All', 'Study', 'Daily', 'Home', 'Electronics'];
  const requestedCategory = new URLSearchParams(location.search).get('category');
  let category = categories.includes(requestedCategory) ? requestedCategory : 'All';
  function updateCatalog() {
    const query = search.value.trim().toLowerCase();
    let result = products.filter(product => {
      const matchesSearch = (product.name + ' ' + product.category + ' ' + product.description).toLowerCase().includes(query);
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSaved = !savedOnly.checked || BagaShop.isSaved(product.id);
      return matchesSearch && matchesCategory && matchesSaved;
    });
    if (sort.value === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort.value === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    BagaShop.renderProducts(document.getElementById('product-grid'), result);
    document.getElementById('empty-results').hidden = result.length !== 0;
    document.getElementById('results-count').textContent = result.length + ' of ' + products.length + ' essentials';
    document.getElementById('saved-count').textContent = BagaShop.savedCount();
    document.querySelectorAll('[data-category]').forEach(button => {
      button.classList.toggle('selected', button.dataset.category === category);
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });
  }
  function resetFilters() {
    category = 'All';
    search.value = '';
    sort.value = 'featured';
    savedOnly.checked = false;
    updateCatalog();
    search.focus();
  }
  search.addEventListener('input', updateCatalog);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; updateCatalog(); } });
  sort.addEventListener('change', updateCatalog);
  savedOnly.addEventListener('change', updateCatalog);
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; updateCatalog(); }));
  document.querySelectorAll('#reset-filters, [data-reset-filters]').forEach(button => button.addEventListener('click', resetFilters));
  document.addEventListener('savedchange', updateCatalog);
  updateCatalog();
})();
