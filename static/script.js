/* WheyOnWheels – premium motion layer
   Scroll reveals, counters, parallax, progress bar + price animations
*/
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call(
      (ctx || document).querySelectorAll(sel)
    );
  };

  /* ---------- Scroll progress bar ---------- */

  var bar = document.createElement('div');
  bar.className = 'pb-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  /* ---------- Scroll reveal ---------- */

  function mark(selector, step, base) {
    $$(selector).forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty(
        '--d',
        ((base || 0) + i * (step || 0)) + 'ms'
      );
    });
  }

  mark('.section-heading', 0);
  mark('.flavour-card', 130);

  /* Price section reveal */
  mark('.pb-price-copy > *', 100, 80);
  mark('.pb-price-card', 0, 180);

  mark('.story-stamp', 0);
  mark('.story-copy > *', 90, 120);
  mark('.ingredient-row', 110);
  mark('.product-facts', 0, 120);
  mark('.nutrition-panel', 0, 150);
  mark('.use-card', 90);
  mark('.use-note', 0);
  mark('.pb-final-cta > *', 110);
  mark('.pb-footer-inner > *', 110);
  mark('.pb-footer-bottom', 0, 250);

  var revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px'
    });

    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  /* ---------- Number count-up ---------- */

  var counters = $$('.fact strong, .ingredient-row > strong');

  function parseCounter(el) {
    var m = el.textContent.trim().match(/^([\d.]+)(.*)$/);

    if (!m) return null;

    return {
      final: el.textContent,
      value: parseFloat(m[1]),
      decimals: (m[1].split('.')[1] || '').length,
      suffix: m[2]
    };
  }

  function runCounter(el, data) {
    var start = null;
    var duration = 1500;

    function tick(ts) {
      if (start === null) start = ts;

      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);

      el.textContent =
        (data.value * eased).toFixed(data.decimals) + data.suffix;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = data.final;
      }
    }

    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var data = entry.target._counter;
        cio.unobserve(entry.target);

        if (data) runCounter(entry.target, data);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      var data = parseCounter(el);

      if (!data) return;

      el._counter = data;
      el.textContent = (0).toFixed(data.decimals) + data.suffix;

      cio.observe(el);
    });
  }

  /* ---------- Price counter animation ---------- */

  var priceAmount = document.querySelector('.pb-price-amount');

  if (priceAmount) {
    var priceTextNode = Array.prototype.slice.call(
      priceAmount.childNodes
    ).filter(function (node) {
      return node.nodeType === 3 && node.textContent.trim();
    })[0];

    if (priceTextNode) {
      var originalPrice = priceTextNode.textContent;
      var priceValue = parseFloat(originalPrice.trim());

      if (!isNaN(priceValue)) {
        if (reduce || !('IntersectionObserver' in window)) {
          priceTextNode.textContent = originalPrice;
        } else {
          priceTextNode.textContent = '0';

          var priceObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;

              priceObserver.unobserve(entry.target);

              var start = null;
              var duration = 1250;

              function animatePrice(timestamp) {
                if (start === null) start = timestamp;

                var progress = Math.min(
                  (timestamp - start) / duration,
                  1
                );

                var eased = 1 - Math.pow(1 - progress, 3);

                priceTextNode.textContent = String(
                  Math.round(priceValue * eased)
                );

                if (progress < 1) {
                  requestAnimationFrame(animatePrice);
                } else {
                  priceTextNode.textContent = originalPrice;
                }
              }

              requestAnimationFrame(animatePrice);
            });
          }, { threshold: 0.65 });

          priceObserver.observe(priceAmount);
        }
      }
    }
  }

  /* ---------- Cursor spotlight on cards ---------- */

  $$('.flavour-card, .use-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();

      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Price card 3D tilt ---------- */

  var priceCard = document.querySelector('.pb-price-card');

  var canHover = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  ).matches;

  if (priceCard && canHover && !reduce) {
    priceCard.style.transformStyle = 'preserve-3d';

    priceCard.style.transition =
      'transform 180ms ease-out, box-shadow 300ms ease-out';

    priceCard.addEventListener('pointermove', function (e) {
      var r = priceCard.getBoundingClientRect();

      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;

      var rotateX = y * -5;
      var rotateY = x * 6;

      priceCard.style.transform =
        'perspective(900px) rotateX(' + rotateX.toFixed(2) +
        'deg) rotateY(' + rotateY.toFixed(2) +
        'deg) translateY(-3px)';

      priceCard.style.boxShadow =
        '0 30px 75px rgba(0,0,0,.34), ' +
        '0 0 35px rgba(254,105,149,.10), ' +
        'inset 0 0 50px rgba(254,105,149,.06)';
    });

    priceCard.addEventListener('pointerleave', function () {
      priceCard.style.transform = '';
      priceCard.style.boxShadow = '';
    });
  }

  /* ---------- Hero mouse parallax ---------- */

  var hero = document.querySelector('.pb-hero');
  var fan = document.querySelector('.pb-sachet-fan');
  var orbits = $$('.pb-orbit');

  if (hero && fan && canHover && !reduce) {
    var tx = 0;
    var ty = 0;
    var cx = 0;
    var cy = 0;
    var running = false;

    function frame() {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;

      fan.style.translate =
        (cx * -22) + 'px ' + (cy * -14) + 'px';

      orbits.forEach(function (o, i) {
        o.style.translate =
          (cx * (i ? 26 : -16)) + 'px ' +
          (cy * (i ? 16 : -10)) + 'px';
      });

      if (
        Math.abs(tx - cx) > 0.001 ||
        Math.abs(ty - cy) > 0.001
      ) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function kick() {
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();

      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;

      kick();
    });

    hero.addEventListener('pointerleave', function () {
      tx = 0;
      ty = 0;
      kick();
    });
  }

  /* ---------- Scroll progress + watermark drift ---------- */

  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;

    var max = Math.max(
      root.scrollHeight - window.innerHeight,
      1
    );

    bar.style.transform =
      'scaleX(' + Math.min(y / max, 1) + ')';

    if (hero && !reduce) {
      hero.style.setProperty(
        '--wm-y',
        Math.min(y * 0.14, 140) + 'px'
      );
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  window.addEventListener('resize', onScroll);

  onScroll();

})();
