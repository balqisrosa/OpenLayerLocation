import Map from "https://cdn.skypack.dev/ol/Map.js";
import View from "https://cdn.skypack.dev/ol/View.js";
import TileLayer from "https://cdn.skypack.dev/ol/layer/Tile.js";
import OSM from "https://cdn.skypack.dev/ol/source/OSM.js";
import Overlay from "https://cdn.skypack.dev/ol/Overlay.js";
import { toLonLat, fromLonLat } from "https://cdn.skypack.dev/ol/proj.js";
import Feature from "https://cdn.skypack.dev/ol/Feature.js";
import Point from "https://cdn.skypack.dev/ol/geom/Point.js";
import VectorSource from "https://cdn.skypack.dev/ol/source/Vector.js";
import VectorLayer from "https://cdn.skypack.dev/ol/layer/Vector.js";
import { Style, Icon } from "https://cdn.skypack.dev/ol/style.js";
import Swal from "https://cdn.skypack.dev/sweetalert2";

// Buat peta langsung dengan OSM
const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(), // Tidak perlu hide/show layer lagi
    }),
  ],
  view: new View({
    center: fromLonLat([107.57634352477324, -6.87436891415509]),
    zoom: 16,
  }),
});

// Pop-up untuk informasi lokasi
const popup = document.createElement("div");
popup.className = "popup";
document.body.appendChild(popup);

const overlay = new Overlay({
  element: popup,
  autoPan: true,
});
map.addOverlay(overlay);

// Sumber data marker
const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
});
map.addLayer(markerLayer);

let userCoordinates = null; // Simpan koordinat pengguna

// Fungsi untuk menambahkan marker
function addMarker(coordinates, text) {
  markerSource.clear(); // Hapus marker lama

  const marker = new Feature({
    geometry: new Point(coordinates),
  });
  marker.setStyle(
    new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.05,
      }),
    })
  );
  markerSource.addFeature(marker);

  popup.innerHTML = `
    <button class="close-btn">&times;</button>
    <h3>Lokasi</h3>
    <p><strong>Alamat:</strong> ${text}</p>
    <p><strong>Koordinat:</strong> ${toLonLat(coordinates)
      .map((coord) => coord.toFixed(6))
      .join(", ")}</p>
  `;
  overlay.setPosition(coordinates);

  document.querySelector(".close-btn").addEventListener("click", () => {
    overlay.setPosition(undefined);
  });
}

// Ambil lokasi pengguna
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    userCoordinates = fromLonLat([longitude, latitude]);
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    // Ambil informasi lokasi
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
    )
      .then((response) => response.json())
      .then((data) => {
        const locationName = data.display_name || "Tidak ada data lokasi";
        addMarker(userCoordinates, locationName);
      })
      .catch(() => {
        addMarker(userCoordinates, "Data lokasi tidak ditemukan");
      });
  },
  () => {
    Swal.fire({
      title: "Error",
      text: "Gagal mengambil lokasi. Pastikan Anda memberikan izin akses lokasi.",
      icon: "error",
    });
  }
);

// Klik peta untuk menambahkan marker baru
map.on("click", function (event) {
  const clickedCoordinates = event.coordinate;
  const [longitude, latitude] = toLonLat(clickedCoordinates);

  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
  )
    .then((response) => response.json())
    .then((data) => {
      const locationName = data.display_name || "Informasi lokasi tidak ditemukan";
      addMarker(clickedCoordinates, locationName);
    })
    .catch(() => {
      addMarker(clickedCoordinates, "Data lokasi tidak ditemukan");
    });
});

// Tombol kembali ke lokasi pengguna
document.getElementById("back-to-location").onclick = function () {
  if (userCoordinates) {
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${toLonLat(
        userCoordinates
      )[0]}&lat=${toLonLat(userCoordinates)[1]}`
    )
      .then((response) => response.json())
      .then((data) => {
        const locationName = data.display_name || "Tidak ada data lokasi";
        addMarker(userCoordinates, locationName);
      })
      .catch(() => {
        addMarker(userCoordinates, "Data lokasi tidak ditemukan");
      });
  } else {
    Swal.fire({
      title: "Error",
      text: "Lokasi pengguna tidak tersedia.",
      icon: "error",
    });
  }
};
