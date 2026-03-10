// Write your code!
console.log('Hello bakers');
// Write your code!
import scrollama from 'scrollama';
import * as d3 from 'd3';
import maplibregl from 'maplibre-gl';
import lc from '../_data/lc.json';

let markerLookup = []; // Master list of markers on the map

const map = new maplibregl.Map({
  container: 'map', // container id
  style:
    'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json', // style URL
  center: [-98.5795, 39.8283], // Chicago's coordinates [lng, lat]
  zoom: 4, // starting zoom
  interactive: false, // Disable map interactions
  projection: 'equalEarth', // Use Equal Earth projection
});

map.on('load', () => {
  map.fitBounds(
    [
      [-125.0, 24.5], // Southwest coordinates (roughly southern CA/TX)
      [-66.9, 49.4], // Northeast coordinates (roughly Maine/North Dakota)
    ],
    {
      padding: 5, // Optional: adds padding around the bounds
      duration: 1000, // Optional: animation duration in ms
    }
  );
  map.resize();

  // Create markers and store them in the lookup
  lc.forEach((dataItem) => {
    if (dataItem.Longitude && dataItem.Latitude) {
      const markerElement = document.createElement('div');
      markerElement.style.backgroundColor = '#5f50ad';
      markerElement.style.width = '12px';
      markerElement.style.height = '12px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.border = '2px solid white';

      // Make the all invisible
      markerElement.style.display = 'none';

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([dataItem.Longitude, dataItem.Latitude])
        .addTo(map);

      // Push the marker element and the marker data as a pair into the lookup
      markerLookup.push([marker, dataItem]);
    }
  });
  console.log(markerLookup, 'Marker lookup initialized.');

  init();
});

// using d3 for convenience, and storing a selected elements
const container = d3.select('#scroll');
const text = container.select('.scroll__text');
const step = text.selectAll('.step');

// initialize the scrollama
const scroller = scrollama();

// State tracking
let currentStep = -1;
let isProcessing = false;
let lastScrollTime = 0;
let scrollTimeout = null;

// Track scroll velocity to detect rapid scrolling
function trackScrollVelocity() {
  const now = Date.now();
  const timeSinceLastScroll = now - lastScrollTime;
  lastScrollTime = now;

  // If scrolling very quickly (less than 100ms between scroll events), return true
  return timeSinceLastScroll < 100;
}

// Light debounce for cleanup operations only
function lightDebounce(func, delay = 50) {
  return function (...args) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function handleResize() {
  if (scroller && scroller.resize) {
    scroller.resize();
  }
}

function showImagePopups2() {
  let popupContainer2 = document.getElementById('image-popup-container-2');
  if (!popupContainer2) {
    popupContainer2 = document.createElement('div');
    popupContainer2.id = 'image-popup-container-2';
    document.body.appendChild(popupContainer2);
  }
  popupContainer2.innerHTML = '';

  // Check if we are at a mobile width
  const isMobile = window.innerWidth <= 1024;

  // Choose the appropriate image set based on screen size
  const imageCount = isMobile ? 2 : formImages.length;

  for (let i = 0; i < imageCount; i++) {
    const imgElement = document.createElement('img');
    imgElement.src = formImages[i];
    imgElement.className = 'popup-image2';
    imgElement.style.animationDelay = `${i * 0.1}s`;

    popupContainer2.appendChild(imgElement);
  }
  popupContainer2.classList.add('active');
}

function hideImagePopups2() {
  const popupContainer2 = document.getElementById('image-popup-container-2');
  if (popupContainer2) {
    popupContainer2.classList.remove('active');
    // Add a small delay then clear the content to ensure smooth transition
    setTimeout(() => {
      popupContainer2.innerHTML = '';
    }, 500);
  }
}

function showImagePopups() {
  // Create popup container if it doesn't exist
  let popupContainer = document.getElementById('image-popup-container');

  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.id = 'image-popup-container';
    document.body.appendChild(popupContainer);
  }

  // Clear any existing popups
  popupContainer.innerHTML = '';

  // Calculate how many times we need to repeat to fill the screen
  // Approximately 3-4 rows and 2-3 columns should fill most screens
  // Calculate how many times we need to repeat to fill the screen
  const repeats = 18; // This will create 60 images (10 images × 6 repeats)

  // Create images by repeating the array
  for (let i = 0; i < emailImages.length * repeats; i++) {
    const imgSrc = emailImages[i % emailImages.length]; // Cycle through images
    const imgElement = document.createElement('img');
    imgElement.src = imgSrc;
    imgElement.className = 'popup-image';

    // Random position
    const randomX = Math.random() * 85; // 0-85% to keep images mostly on screen
    const randomY = Math.random() * 85; // 0-85% to keep images mostly on screen

    // Random rotation
    const randomRotation = (Math.random() - 0.5) * 30; // -15 to 15 degrees

    // Random size variation (80% to 100% of the max size)
    const randomScale = 0.8 + Math.random() * 0.2;

    imgElement.style.left = `${randomX}%`;
    imgElement.style.top = `${randomY}%`;
    imgElement.style.transform = `rotate(${randomRotation}deg) scale(${randomScale})`;
    imgElement.style.animationDelay = `${(i % 20) * 0.1}s`; // Stagger the animations

    popupContainer.appendChild(imgElement);
  }

  // Show the container
  popupContainer.classList.add('active');
}

function hideImagePopups() {
  const popupContainer = document.getElementById('image-popup-container');
  if (popupContainer) {
    popupContainer.classList.remove('active');
    // Add a small delay then clear the content to ensure smooth transition
    setTimeout(() => {
      popupContainer.innerHTML = '';
    }, 500);
  }
}

function handleStepEnter(response) {
  console.log('handleStepEnter', response);
  // response = { element, direction, index }

  // Only apply strict protections during rapid scrolling
  const isRapidScrolling = trackScrollVelocity();

  // Prevent out-of-order execution during rapid scrolling
  // Allow normal upward scrolling (response.index < currentStep) but block truly chaotic rapid scrolling
  if (isProcessing) {
    console.log('Skipping - still processing previous step', response.index);
    return;
  }

  // Only block if we're rapidly scrolling AND the step jump is unreasonable (more than 2 steps difference)
  if (isRapidScrolling && Math.abs(response.index - currentStep) > 1) {
    console.log('Skipping large jump during rapid scrolling', response.index);
    return;
  }

  // Set processing flag briefly to prevent immediate re-triggering
  isProcessing = true;
  currentStep = response.index;

  // fade in current step
  step.classed('is-active', function (d, i) {
    return i === response.index;
  });

  // update graphic based on step here
  var activeStep = response.index + 1;

  // Clear the chart ...
  if (activeStep == 1) {
    console.log('DO THE STEP ONE STUFF...');
    // Loop through the markerlookup and make all markers opacity 1
    markerLookup.forEach((markerPair) => {
      const marker = markerPair[0];
      const markerElement = marker.getElement();
      markerElement.style.display = 'block';
      markerElement.style.backgroundColor = '#5f50ad';
    });
  }

  // STEP 2: "That means 370 never replied..." - no popup yet, just text
  if (activeStep == 2) {
    console.log('DO THE STEP TWO STUFF...');
    hideImagePopups2();
    // You can add any map animations or other effects here if needed
  }
  if (activeStep == 3) {
    console.log('DO THE STEP THREE STUFF...');
    showImagePopups2();
    // You can add any map animations or other effects here if needed
  }
  // STEP 3: Show image popups AFTER step 2

  if (activeStep == 4) {
    console.log('DO THE STEP FOUR STUFF...');
    hideImagePopups();
    hideImagePopups2(); // Hide popups when moving to next step

    // Change the color of markers based on status
    // Update marker colors based on status
    markerLookup.forEach((marker) => {
      if (marker[1].status === 'Did not answer the survey') {
        const markerElement = marker[0].getElement();
        markerElement.style.display = 'none';
      }
    });
  }
  if (activeStep == 5) {
    console.log('SHOWING IMAGE POPUPS...');

    showImagePopups();

    markerLookup.forEach((marker) => {
      const markerElement = marker[0].getElement();
      markerElement.classList.remove('marker-with-pulse');
    });
  }
  if (activeStep == 6) {
    console.log('DO THE STEP SIX STUFF...');
    console.log('Number of markers in lookup:', markerLookup.size);
    hideImagePopups();
    let careCount = 0;

    markerLookup.forEach((marker) => {
      if (marker[1].status === 'Yes, they offer care') {
        const markerElement = marker[0].getElement();
        // Make it black
        // markerElement.style.animation = 'pulse 2s ease-out infinite';
        markerElement.style.backgroundColor = '#5f50ad';
        markerElement.classList.add('marker-with-pulse');
      }
      if (marker[1].status === 'No longer offers Long COVID Care') {
        const markerElement = marker[0].getElement();
        // Make it gray
        markerElement.style.backgroundColor = '#b5afa4';
      }
    });

    console.log('Total clinics that offer care:', careCount);
  }

  if (activeStep == 7) {
    console.log('DO THE STEP SEVEN STUFF...');
    // You can add any map animations or other effects here if needed
    markerLookup.forEach((marker) => {
      if (marker[1].status === 'Did not answer the survey') {
        const markerElement = marker[0].getElement();
        // Make it black
        markerElement.style.backgroundColor = '#b5afa4';
        markerElement.style.display = 'block';
      }
    });
  }

  // Mark processing as complete
  setTimeout(() => {
    isProcessing = false;
  }, 100);
}

function handleStepExit(response) {
  // Remove active class when exiting
  step.classed('is-active', function (d, i) {
    return false;
  });

  // Basic cleanup when exiting steps
  // if (response.index === 2 || response.index === 4) {
  //   hideImagePopups2();
  // }
  // if (response.index === 5) {
  //   hideImagePopups();
  // }
}

function init() {
  console.log('init');
  // 1. call a resize on load to update width/height/position of elements
  handleResize();

  // 2. setup the scrollama instance
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      container: '#scroll', // our outermost scrollytelling element
      graphic: '.scroll__graphic', // the graphic
      text: '.scroll__text', // the step container
      step: '.scroll__text .step', // the step elements
      offset: 0.5, // set the trigger to be 1/2 way down screen
      debug: false, // display the trigger offset for testing
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(lightDebounce(handleStepExit, 50));

  // Add scroll event listener to track velocity
  window.addEventListener('scroll', trackScrollVelocity);

  // setup resize event
  window.addEventListener('resize', handleResize);
}
