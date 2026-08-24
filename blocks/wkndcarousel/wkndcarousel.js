import { fetchPlaceholders } from '../../scripts/placeholders.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.wkndcarousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);

  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    const isActive = idx === slideIndex;

    aSlide.classList.toggle('active', isActive);
    aSlide.setAttribute('aria-hidden', String(!isActive));

    aSlide.querySelectorAll('a').forEach((link) => {
      if (isActive) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');

  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    const isActive = idx === slideIndex;

    indicator.classList.toggle('active', isActive);

    if (isActive) {
      button.setAttribute('disabled', 'true');
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');

  if (!slides.length) return;

  let realSlideIndex = slideIndex;

  if (slideIndex < 0) {
    realSlideIndex = slides.length - 1;
  }

  if (slideIndex >= slides.length) {
    realSlideIndex = 0;
  }

  updateActiveSlide(slides[realSlideIndex]);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');

  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;

      showSlide(
        block,
        parseInt(slideIndicator.dataset.targetSlide, 10),
      );
    });
  });

  const previousButton = block.querySelector('.slide-prev');
  const nextButton = block.querySelector('.slide-next');

  if (previousButton) {
    previousButton.addEventListener('click', () => {
      showSlide(
        block,
        parseInt(block.dataset.activeSlide || '0', 10) - 1,
      );
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      showSlide(
        block,
        parseInt(block.dataset.activeSlide || '0', 10) + 1,
      );
    });
  }
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');

  slide.dataset.slideIndex = slideIndex;

  slide.setAttribute(
    'id',
    `carousel-${carouselId}-slide-${slideIndex}`,
  );

  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(
      `carousel-slide-${colIdx === 0 ? 'image' : 'content'}`,
    );

    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');

  if (labeledBy) {
    slide.setAttribute(
      'aria-labelledby',
      labeledBy.getAttribute('id'),
    );
  }

  return slide;
}

let carouselId = 0;

export default async function decorate(block) {
  carouselId += 1;

  block.setAttribute('id', `carousel-${carouselId}`);

  const rows = block.querySelectorAll(':scope > div');

  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');

  block.setAttribute(
    'aria-roledescription',
    placeholders.carousel || 'Carousel',
  );

  const container = document.createElement('div');

  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');

  slidesWrapper.classList.add('carousel-slides');

  let slideIndicators;

  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');

    slideIndicatorsNav.setAttribute(
      'aria-label',
      placeholders.carouselSlideControls
        || 'Carousel Slide Controls',
    );

    slideIndicators = document.createElement('ol');

    slideIndicators.classList.add('carousel-slide-indicators');

    slideIndicatorsNav.append(slideIndicators);

    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');

    slideNavButtons.classList.add(
      'carousel-navigation-buttons',
    );

    slideNavButtons.innerHTML = `
      <button
        type="button"
        class="slide-prev"
        aria-label="${placeholders.previousSlide || 'Previous Slide'}">
      </button>

      <button
        type="button"
        class="slide-next"
        aria-label="${placeholders.nextSlide || 'Next Slide'}">
      </button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);

    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');

      indicator.classList.add('carousel-slide-indicator');

      indicator.dataset.targetSlide = idx;

      indicator.innerHTML = `
        <button
          type="button"
          aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}">
        </button>
      `;

      slideIndicators.append(indicator);
    }

    row.remove();
  });

  container.append(slidesWrapper);

  block.prepend(container);

  // Initialize first slide.
  showSlide(block, 0);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
