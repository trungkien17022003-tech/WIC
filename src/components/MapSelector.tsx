import React, { useEffect, useRef, useState } from "react";
import { Map, MapPin, RefreshCw, HelpCircle, Sparkles, Navigation } from "lucide-react";

interface MapSelectorProps {
  locationName: string;
  address: string;
  mapEmbedUrl: string;
  onMapEmbedUrlChange: (url: string) => void;
  triggerToast: (msg: string) => void;
}

export function MapSelector({
  locationName,
  address,
  mapEmbedUrl,
  onMapEmbedUrlChange,
  triggerToast
}: MapSelectorProps) {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 20.7916, // Toạ độ mặc định Hưng Yên khu vực Chợ Đại Quan
    lng: 105.9853
  });

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addressTimeoutRef = useRef<any>(null);
  const lastGeocodedAddressRef = useRef<string>("");

  // 1. Tải thư viện Leaflet động
  useEffect(() => {
    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.id = "leaflet-js";
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // 2. Phân tích toạ độ từ URL nhúng hiện tại (nếu có) để đồng bộ bản đồ kéo thả
  useEffect(() => {
    if (!mapEmbedUrl) return;
    const coordRegex = /(?:q|center)=([0-9.-]+),([0-9.-]+)/i;
    const match = mapEmbedUrl.match(coordRegex);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCurrentCoords({ lat, lng });
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    }
  }, [mapEmbedUrl]);

  const isFirstRenderRef = useRef(true);

  // 3. Lắng nghe thay đổi của Địa chỉ chi tiết để tự động định vị (Debounced)
  useEffect(() => {
    if (!address || !address.trim()) return;

    // Khi load lần đầu tiên (hoặc khi component mount với dữ liệu có sẵn), không tự ý chạy tìm kiếm tự động
    // tránh ghi đè toạ độ chính xác người dùng đã kéo ghim trước đó.
    if (isFirstRenderRef.current) {
      lastGeocodedAddressRef.current = address.trim();
      isFirstRenderRef.current = false;
      return;
    }

    // Tránh tìm kiếm lặp lại vô tận cho cùng 1 địa chỉ
    if (address.trim() === lastGeocodedAddressRef.current) return;

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    addressTimeoutRef.current = setTimeout(() => {
      geocodeAddress(address);
    }, 1200);

    return () => {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
    };
  }, [address]);

  // Tìm kiếm địa chỉ bằng cách kết hợp ArcGIS, Photon (OSM) và Nominatim
  const geocodeAddress = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    lastGeocodedAddressRef.current = queryText.trim();

    // Loại bỏ các tiền tố không cần thiết để tăng tỷ lệ tìm kiếm chính xác
    let cleanQuery = queryText;
    const housePrefixes = ["nhà riêng", "tư gia", "nhà cô dâu", "nhà chú rể", "nhà gái", "nhà trai"];
    const lowerQuery = queryText.toLowerCase();
    for (const prefix of housePrefixes) {
      if (lowerQuery.startsWith(prefix)) {
        cleanQuery = queryText.substring(prefix.length).trim().replace(/^[,\s:-]+/, "");
        break;
      }
    }

    if (!cleanQuery.trim()) {
      cleanQuery = queryText;
    }

    // Bước 1: Thử nghiệm dịch vụ ArcGIS Geocoding (Rất thông minh, chi tiết, CORS tốt)
    try {
      const esriUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(cleanQuery)}&maxLocations=1`;
      const res = await fetch(esriUrl);
      const data = await res.json();

      if (data && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const lat = parseFloat(candidate.location.y);
        const lng = parseFloat(candidate.location.x);

        if (!isNaN(lat) && !isNaN(lng)) {
          updateMapPosition(lat, lng);
          triggerToast("🔍 Đã tìm thấy vị trí và tự động ghim!");
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("ArcGIS Geocoding failed, trying Photon...", err);
    }

    // Bước 2: Thử nghiệm Photon Komoot (Dịch vụ tìm kiếm OpenStreetMap mở rộng)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1&lang=vi`;
      const res = await fetch(photonUrl);
      const data = await res.json();

      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        const lng = parseFloat(feature.geometry.coordinates[0]);
        const lat = parseFloat(feature.geometry.coordinates[1]);

        if (!isNaN(lat) && !isNaN(lng)) {
          updateMapPosition(lat, lng);
          triggerToast("🔍 Đã định vị tự động theo dữ liệu bản đồ!");
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Photon Geocoding failed, trying Nominatim...", err);
    }

    // Bước 3: Thử nghiệm Nominatim làm giải pháp dự phòng cuối cùng
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1&countrycodes=vn`;
      const res = await fetch(nominatimUrl);
      const data = await res.json();

      if (Array.isArray(data) && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        if (!isNaN(lat) && !isNaN(lng)) {
          updateMapPosition(lat, lng);
          triggerToast("🔍 Đã ghim địa điểm thành công!");
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Nominatim Geocoding failed", err);
    }

    setIsSearching(false);
  };

  const updateMapPosition = (lat: number, lng: number) => {
    const fixedLat = parseFloat(lat.toFixed(6));
    const fixedLng = parseFloat(lng.toFixed(6));
    
    setCurrentCoords({ lat: fixedLat, lng: fixedLng });

    if (mapRef.current) {
      mapRef.current.setView([fixedLat, fixedLng], 16);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([fixedLat, fixedLng]);
    }

    // Tạo URL nhúng Google Maps chính xác từ toạ độ tìm được
    const embedUrl = `https://maps.google.com/maps?q=${fixedLat},${fixedLng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    onMapEmbedUrlChange(embedUrl);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      triggerToast("❌ Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị GPS!");
      return;
    }

    setIsLocating(true);
    triggerToast("⏳ Đang kết nối vệ tinh GPS để lấy vị trí của bạn...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateMapPosition(lat, lng);
        triggerToast("📍 Đã định vị thành công vị trí GPS hiện tại của bạn!");
        setIsLocating(false);
      },
      (error) => {
        console.error("GPS error:", error);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          triggerToast("❌ Vui lòng cho phép quyền truy cập vị trí (GPS) trên trình duyệt để sử dụng tính năng này!");
        } else {
          triggerToast("❌ Lỗi định vị GPS: " + error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // 4. Khởi tạo bản đồ tương tác sử dụng TILE LAYER CHÍNH THỨC CỦA GOOGLE MAPS
  useEffect(() => {
    if (!isLeafletLoaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([currentCoords.lat, currentCoords.lng], 16);
    mapRef.current = map;

    // SỬ DỤNG TRỰC TIẾP TILE GOOGLE MAPS ROADMAP (Đầy đủ chi tiết từng ngõ ngách, tên đường, chợ, siêu thị tại Việt Nam)
    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi", {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "© Google Maps"
    }).addTo(map);

    // Ghim đỏ kéo thả phong cách Google Maps nổi bật
    const customIcon = L.divIcon({
      html: `<div class="w-10 h-10 flex items-center justify-center bg-rose-500 rounded-full border-2 border-white shadow-xl text-white transform -translate-y-1 relative animate-bounce">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
               <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-500 rotate-45 border-r border-b border-white"></span>
             </div>`,
      className: "custom-leaflet-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const marker = L.marker([currentCoords.lat, currentCoords.lng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerRef.current = marker;

    // Cập nhật vị trí khi kéo thả ghim đỏ
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const dragLat = parseFloat(pos.lat.toFixed(6));
      const dragLng = parseFloat(pos.lng.toFixed(6));

      setCurrentCoords({ lat: dragLat, lng: dragLng });
      
      const embedUrl = `https://maps.google.com/maps?q=${dragLat},${dragLng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      onMapEmbedUrlChange(embedUrl);
      triggerToast("📍 Đã cập nhật tọa độ ghim mới!");
    });

    // Cho phép người dùng click trực tiếp vào vị trí bất kỳ trên bản đồ Google Maps để dời ghim ngay tức khắc
    map.on("click", (e: any) => {
      const clickLat = parseFloat(e.latlng.lat.toFixed(6));
      const clickLng = parseFloat(e.latlng.lng.toFixed(6));
      updateMapPosition(clickLat, clickLng);
      triggerToast("📍 Đã di chuyển ghim đến điểm bạn vừa chọn!");
    });

    // Khắc phục tình trạng thỉnh thoảng nạp bản đồ bị xám
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isLeafletLoaded]);

  return (
    <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 mt-3 space-y-3.5 text-left">
      {/* Tiêu đề */}
      <div className="flex items-center justify-between border-b border-stone-150 pb-2">
        <div className="flex items-center gap-1.5">
          <Map className="w-4.5 h-4.5 text-rose-500 shrink-0" />
          <div>
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
              Bản đồ tìm kiếm & Kéo ghim trực quan
            </span>
            <span className="text-[10px] text-stone-400 block">
              Sử dụng nền bản đồ Google Maps chính thức, hiển thị cực kỳ chi tiết từng con ngõ.
            </span>
          </div>
        </div>

        {isSearching && (
          <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1 px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100">
            <RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
            Đang tìm...
          </div>
        )}
      </div>

      {/* Các tính năng định vị nhanh (Địa chỉ & GPS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Địa chỉ tự động */}
        <div className="flex items-center justify-between gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-100 text-[10px] text-stone-600">
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Theo địa chỉ: <b>{address || "Chưa nhập địa chỉ"}</b></span>
          </span>
          {address && (
            <button
              type="button"
              onClick={() => geocodeAddress(address)}
              disabled={isSearching}
              className="bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase shrink-0 cursor-pointer shadow-sm"
            >
              Tìm lại
            </button>
          )}
        </div>

        {/* Định vị GPS thực tế */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-stone-300 text-white text-[10px] font-bold p-2 rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          {isLocating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 animate-pulse" />
          )}
          <span>Lấy vị trí GPS hiện tại của bạn</span>
        </button>
      </div>

      {/* KHU VỰC BẢN ĐỒ TƯƠNG TÁC SỬ DỤNG GOOGLE MAPS TILE LAYER */}
      <div className="relative h-60 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm z-10">
        <div ref={containerRef} className="w-full h-full" />
        
        {!isLeafletLoaded && (
          <div className="absolute inset-0 bg-stone-50/95 flex flex-col items-center justify-center gap-2 text-xxs text-stone-500 z-50">
            <RefreshCw className="w-5 h-5 animate-spin text-stone-400" />
            Đang tải dữ liệu Google Maps...
          </div>
        )}
      </div>

      {/* Hiển thị toạ độ và hướng dẫn nhanh */}
      <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
        <span className="text-rose-700 flex items-center gap-1 font-bold">
          <MapPin className="w-3.5 h-3.5" />
          Giữ & kéo ghim đỏ đến chính xác cổng nhà bạn
        </span>
        <span className="font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded text-[9.5px]">
          {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
        </span>
      </div>

      {/* Hướng dẫn chi tiết */}
      <div className="p-2.5 bg-stone-100/60 rounded-lg text-[9.5px] text-stone-500 leading-normal flex gap-1.5">
        <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
        <p>
          Hệ thống đã nạp trực tiếp nền bản đồ <b>Google Maps Việt Nam</b> với độ chi tiết tuyệt đối của từng ngõ ngách, chợ, trường học. Khách mời xem thiệp sẽ được chỉ đường chính xác 100% đến vị trí ghim đỏ này.
        </p>
      </div>

      {/* Tuỳ chọn nâng cao: Mã nhúng Iframe thủ công */}
      <div className="border-t border-stone-200 pt-2.5 space-y-1">
        <label className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
          Hoặc dán trực tiếp mã nhúng Iframe từ Google Maps (Tùy chọn nâng cao):
        </label>
        <input
          type="text"
          placeholder="Dán mã <iframe src='...'></iframe> sao chép từ Google Maps..."
          value={mapEmbedUrl}
          onChange={(e) => {
            const val = e.target.value.trim();
            let processedUrl = val;

            if (val.includes("<iframe")) {
              const match = val.match(/src=["'](https:\/\/www\.google\.com\/maps\/embed[^"']+)["']/i);
              if (match && match[1]) {
                processedUrl = match[1];
              }
            }
            onMapEmbedUrlChange(processedUrl);
          }}
          className="text-[10px] border border-stone-200 rounded-lg px-2.5 py-1.5 w-full font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
        />
      </div>
    </div>
  );
}
