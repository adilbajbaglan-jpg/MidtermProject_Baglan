$(function () {
  $.fx.off = document.documentElement.classList.contains('motion-off') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('.menu-toggle').on('click', function () {
    const isOpen = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', String(!isOpen)).attr('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    $('#main-nav').toggleClass('is-open', !isOpen);
  });
  $(document).on('keydown', function (event) {
    if (event.key === 'Escape' && $('#main-nav').hasClass('is-open')) {
      $('#main-nav').removeClass('is-open');
      $('.menu-toggle').attr('aria-expanded', 'false').attr('aria-label', 'Open navigation').trigger('focus');
    }
  });
  $('.faq-question').on('click', function () {
    const button = $(this);
    const expanded = button.attr('aria-expanded') === 'true';
    button.attr('aria-expanded', String(!expanded));
    button.find('span').attr('aria-hidden', 'true');
    const answer = $('#' + button.attr('aria-controls'));
    answer.stop(true, true);
    if (expanded) answer.slideUp(220);
    else answer.slideDown(220);
  });
  $('[data-scroll]').on('click', function (event) {
    const id = this.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    $('html, body').stop(true).animate({ scrollTop: Math.max(0, $(target).offset().top - 100) }, 400).promise().done(function () {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    });
  });
  $(document).on('click', '[data-gallery]', function () {
    const closer = this.dataset.gallery === 'detail';
    $('[data-gallery]').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');
    $('#gallery-image').stop(true, true).fadeOut(100, function () {
      $(this).css({ objectFit: closer ? 'cover' : 'contain', objectPosition: 'center', transform: closer ? 'scale(1.12)' : 'none' }).fadeIn(140);
    });
  });
});
