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

// Create OSM source
const source = new OSM();

// Create TileLayer without source initially
const layer = new TileLayer();

// Create Map
const map = new Map({
  target: "map",
  layers: [layer],
  view: new View({
    center: fromLonLat([107.57634352477324, -6.87436891415509]), // Center to Sarijadi, Bandung
    zoom: 16,
  }),
});

// Add event listeners to buttons
document.getElementById("set-source").onclick = function () {
  layer.setSource(source); // Set OSM source to the layer
};

document.getElementById("unset-source").onclick = function () {
  layer.setSource(null); // Remove source from the layer
};

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

// Variabel untuk melacak status pop-up
let popupVisible = true;
let userCoordinates = null; // Simpan koordinat pengguna

// Ambil lokasi pengguna
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    // Pindahkan peta ke lokasi pengguna
    userCoordinates = fromLonLat([longitude, latitude]);
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    // Tambahkan marker di lokasi pengguna
    const marker = new Feature({
      geometry: new Point(userCoordinates),
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

    // Ambil informasi lokasi menggunakan API OpenStreetMap
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
    )
      .then((response) => response.json())
      .then((data) => {
        const locationName = data.display_name || "Tidak ada data lokasi";

        // Tambahkan konten pop-up dengan tombol close
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p><strong>Alamat:</strong> ${locationName}</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(
            6
          )}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);

        // Event untuk menutup pop-up saat tombol close diklik
        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      })
      .catch(() => {
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p>Data lokasi tidak ditemukan.</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(
            6
          )}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);

        // Event untuk menutup pop-up secara manual
        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      });

    // Tambahkan event klik pada marker untuk menampilkan atau menyembunyikan pop-up
    map.on("click", function (event) {
      map.forEachFeatureAtPixel(event.pixel, function (feature) {
        if (feature === marker) {
          popupVisible = !popupVisible;
          overlay.setPosition(popupVisible ? userCoordinates : undefined);
        }
      });
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

// Event klik di peta untuk mendapatkan informasi lokasi
map.on("click", function (event) {
  const clickedCoordinates = toLonLat(event.coordinate); // Konversi koordinat ke lon/lat
  const [longitude, latitude] = clickedCoordinates;

  // Hapus semua marker lama sebelum menambahkan yang baru
  markerSource.clear();

  // Tambahkan marker baru di lokasi yang diklik
  const marker = new Feature({
    geometry: new Point(event.coordinate),
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

  // Ambil informasi lokasi dari API OpenStreetMap
  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
  )
    .then((response) => response.json())
    .then((data) => {
      const locationName =
        data.display_name || "Informasi lokasi tidak ditemukan";

      // Tambahkan konten pop-up dengan tombol close
      popup.innerHTML = `
        <button class="close-btn">&times;</button>
        <h3>Informasi Lokasi</h3>
        <p><strong>Alamat:</strong> ${locationName}</p>
        <p><strong>Koordinat:</strong> ${longitude.toFixed(
          6
        )}, ${latitude.toFixed(6)}</p>
      `;
      overlay.setPosition(event.coordinate);

      // Event untuk menutup pop-up saat tombol close diklik
      popup.querySelector(".close-btn").addEventListener("click", () => {
        overlay.setPosition(undefined);
      });
    })
    .catch(() => {
      popup.innerHTML = `
        <button class="close-btn">&times;</button>
        <h3>Informasi Lokasi</h3>
        <p>Data lokasi tidak ditemukan.</p>
        <p><strong>Koordinat:</strong> ${longitude.toFixed(
          6
        )}, ${latitude.toFixed(6)}</p>
      `;
      overlay.setPosition(event.coordinate);

      // Event untuk menutup pop-up secara manual
      popup.querySelector(".close-btn").addEventListener("click", () => {
        overlay.setPosition(undefined);
      });
    });
});

const backToLocationButton = document.getElementById("back-to-location");

// Fungsi untuk kembali ke lokasi pengguna
backToLocationButton.onclick = function () {
  if (userCoordinates) {
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    // Tambahkan marker di lokasi pengguna
    const marker = new Feature({
      geometry: new Point(userCoordinates),
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

    // Ambil informasi lokasi menggunakan API OpenStreetMap
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
    )
      .then((response) => response.json())
      .then((data) => {
        const locationName = data.display_name || "Tidak ada data lokasi";

        // Tambahkan konten pop-up dengan tombol close
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p><strong>Alamat:</strong> ${locationName}</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(
            6
          )}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);

        // Event untuk menutup pop-up saat tombol close diklik
        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      })
      .catch(() => {
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p>Data lokasi tidak ditemukan.</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(
            6
          )}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);

        // Event untuk menutup pop-up secara manual
        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      });
  } else {
    Swal.fire({
      title: "Error",
      text: "Lokasi Anda belum tersedia. Pastikan Anda memberikan izin akses lokasi.",
      icon: "error",
    });
  }
};