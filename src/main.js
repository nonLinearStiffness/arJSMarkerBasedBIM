/* Import external libraries */
import "leaflet";
import "./main.css";
import * as THREE from 'three';
import * as LocAR from "locar";
import { GLTFLoader } from "three/examples/jsm/Addons.js";


/* Import internal libraries */
/* --- END --- */

/* Declaration of variables */
const app = document.getElementById("app");

let leafletMap = null;
let locations = [];
let mapCenter = null;
let mapZoom = null;
/* --- END --- */


/* CUSTOM FUNCTIONS */
// Fetch model data from JSON file
async function fetchModelData() {
  const res = await fetch("models.json");
  if (!res.ok) throw new Error("Failed to load model data");
  return res.json();
}

// Custom building icon
const buildingIcon = new L.Icon({
  iconUrl: "bim.png",
  iconSize: [48, 48], // Increased size
  iconAnchor: [24, 48], // Adjust anchor to match new size
});

// Function to locate the user and center the map
function locateUser(controlBtn) {
  // Try to locate the user using Geolocation API. Will fire either "locationfound" or "locationerror".
  leafletMap.locate({
    setView: true,
    maxZoom: 14,
    enableHighAccuracy: true,
  });

  // If location was found, then applies the location point.
  leafletMap.once("locationfound", (e) => {
    const radius = e.accuracy;

    L.marker(e.latlng).addTo(leafletMap).bindPopup("You are here").openPopup();

    L.circle(e.latlng, radius).addTo(leafletMap);

    if (controlBtn) {
      controlBtn.disabled = false;
      controlBtn.title = "Center on Me";
    }
  });

  // If there was an error, location defaults to map center.
  leafletMap.once("locationerror", (e) => {
    console.warn("Location failed:", e.message);
    leafletMap.setView([51.505, -0.09], 13);

    if (controlBtn) {
      controlBtn.disabled = true;
      controlBtn.title = "Location unavailable";
    }
  });
}

// Function to add the markers for each location
function addLocationMarkers() {
  locations.forEach((loc) => {
    // Use buildingIcon for a custom building image
    const marker = L.marker(loc.coords, { icon: buildingIcon }).addTo(leafletMap);
    marker.on("click", () => goToAR(loc.id));
  });
}

// This function allows the specific model to be added as AR element in the map.
function goToAR(id) {
  if (leafletMap) {
    mapCenter = leafletMap.getCenter();
    mapZoom = leafletMap.getZoom();
  }
  location.hash = `#/ar/${id}`;
}

// Function to show or hide the disclaimer banner and instructions
function showDisclaimer(show) {
  const banner = document.getElementById("disclaimer-banner");
  const instructions = document.getElementById("map-instruction");
  if (banner) banner.style.display = show ? "block" : "none";
  if (instructions) instructions.style.display = show ? "block" : "none";
}

// This function allows rendering the AR view for a specific model

function renderARView(id) {
  showDisclaimer(false);
  const loc = locations.find((l) => l.id === id);
  if (!loc) return renderNotFound();

  const modelUrl = loc.modelUrl;

    app.innerHTML = `
      <button class="btn" onclick="location.hash = '#'">← Back to Map</button>
        <a-scene id="ar-canvas" embedded arjs>
          <a-marker preset="hiro">
            <a-box color="yellow" position="0 0.5 0"></a-box>
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>
  `
};

// This function allows rendering the AR view for a specific model
// This function allows rendering the map view
function renderMapView() {
  showDisclaimer(true);
  app.innerHTML = `<div id="map" style="height: 100%"></div>`;

  // Remove all elements with class 'arjs-video' from the page
  document.querySelectorAll('#arjs-video').forEach(el => el.remove());

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  // Initialize the map
  leafletMap = L.map("map");

  // Add OpenStreetMap tile layer

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(leafletMap);

  // Define the map start origin and zoom level
  const defaultCenter = [41.453149, -8.288615];
  const center = defaultCenter; // You can adjust these coordinates for a more precise center
  const zoom = mapZoom || 18; // Increased zoom for a closer view
  leafletMap.setView(center, zoom);

  // Add the location markers
  addLocationMarkers();

}

/* HTML to diaplay if the map render fails */
function renderNotFound() {
  app.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h2>404 - Page Not Found</h2>
      <a href="#">Back to Home</a>
    </div>
  `;
}

/* Function to route the page to map or AR or default */
function router() {
  const hash = location.hash || "#";
  const match = hash.match(/^#\/ar\/(\d+)$/);
  const isQRScanner = hash === '#/qr-scanner';

  if (hash === "#") {
    renderMapView();
  } else if (match) {
    renderARView(match[1]);
  } else {
    renderNotFound();
  }
}

async function init() {
  try {
    locations = await fetchModelData();
    router();
    window.addEventListener("hashchange", router);
  } catch (err) {
    console.log(err);
    renderNotFound();
  }
}
/* --- END --- */


/* MAIN ACTIONS */
/* 1. Initiate the init function. */
init();

/* --- END --- */

// ---------------------------------------------- WIP ----------------------------------------------

// ---------------------------------------------- WIP ----------------------------------------------