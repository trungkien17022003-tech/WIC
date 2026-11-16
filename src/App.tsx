/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Map,
  Music,
  Volume2,
  VolumeX,
  Code,
  Database,
  Eye,
  Palette,
  Calendar,
  Image as ImageIcon,
  Clipboard,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  MapPin,
  Gift,
  CheckCircle,
  Smartphone,
  Laptop,
  MessageSquare,
  Users,
  Copy,
  Sliders,
  ChevronDown,
  FileCode,
  Info,
  BookOpen,
  Download,
  ExternalLink,
  Sparkles,
  Share2,
  Globe,
  UploadCloud,
  AlertCircle,
  ArrowLeft,
  EyeOff,
  Lock,
  Unlock,
  Shield
} from "lucide-react";
import { WeddingInvitationConfig, GuestWish, RSVPSubmission, RSVPQuestion } from "./types";
import { PRESETS } from "./presets";
import { MULTI_TABLE_SQL, SINGLE_TABLE_SQL, NEXTJS_GUIDE_MARKDOWN } from "./sqlCode";
import { supabase } from './supabaseClient';
import AuthModal from "./components/AuthModal";
import BackgroundMusic from "./components/BackgroundMusic";
import Guestbook from "./components/Guestbook";
import { MapSelector } from "./components/MapSelector";
import { DbRSVP, submitRsvp, fetchHostRsvps } from "./services/rsvpService";

// Helper to copy text to clipboard
const copyToClipboard = (text: string, onSuccess: () => void) => {
  navigator.clipboard.writeText(text).then(() => {
    onSuccess();
  });
};

// Helper to normalize strings to NFC composed Unicode and auto-correct common spacing diacritic spacing bugs (prevents browser/font rendering separation)
const nfc = (text: string | undefined | null) => {
  if (!text) return "";
  let s = String(text).normalize("NFC");
  
  // Mapping of vowel + spacing accent to unified composed character
  const map: Record<string, string> = {
    "a": "à", "â": "ầ", "ă": "ằ", "e": "è", "ê": "ề",
    "i": "ì", "o": "ò", "ô": "ồ", "ơ": "ờ", "u": "ù", "ư": "ừ", "y": "ỳ",
    "A": "À", "Â": "Ầ", "Ă": "Ằ", "E": "È", "Ê": "Ề",
    "I": "Ì", "O": "Ò", "Ô": "Ồ", "Ơ": "Ờ", "U": "Ù", "Ư": "Ừ", "Y": "Ỳ"
  };
  
  // Replace vowel + optional space + backtick (U+0060) or separate grave accent (U+0300)
  s = s.replace(/([aâăeêioôơuưyAÂĂEÊIOÔƠUƯY])\s*[\`\u0060\u0300]/g, (match, vowel) => {
    return map[vowel] || match;
  });
  
  // Mapping of vowel + spacing acute
  const acuteMap: Record<string, string> = {
    "a": "á", "â": "ấ", "ă": "ắ", "e": "é", "ê": "ế",
    "i": "í", "o": "ó", "ô": "ố", "ơ": "ớ", "u": "ú", "ư": "ứ", "y": "ý",
    "A": "Á", "Â": "Ấ", "Ă": "Ắ", "E": "É", "Ê": "Ế",
    "I": "Í", "O": "Ó", "Ô": "Ố", "Ơ": "Ớ", "U": "Ú", "Ư": "Ứ", "Y": "Ý"
  };
  
  s = s.replace(/([aâăeêioôơuưyAÂĂEÊIOÔƠUƯY])\s*[\u00B4\u0301´]/g, (match, vowel) => {
    return acuteMap[vowel] || match;
  });

  return s.normalize("NFC");
};

export default function App() {
  // Current Configuration state with NFC-normalized strings to ensure flawless Vietnamese diacritics
  const [config, setConfig] = useState<WeddingInvitationConfig>(() => {
    return JSON.parse(JSON.stringify(PRESETS.geometricBalance.config), (key, value) => {
      return typeof value === "string" ? value.normalize("NFC") : value;
    });
  });
  const [activePresetKey, setActivePresetKey] = useState<string>("geometricBalance");

  // App UI Navigation state
  const [activeTab, setActiveTab] = useState<"presets" | "general" | "story" | "gallery" | "rsvp">("presets");
  const [codeTab, setCodeTab] = useState<"json" | "sql_relational" | "sql_simple" | "guide">("json");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  
  // Interaction/Toast States
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDate, setNewStoryDate] = useState("");
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryImage, setNewStoryImage] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"text" | "radio">("text");
  const [newQuestionOptions, setNewQuestionOptions] = useState("");

  // Music Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Invitation Live State
  const [simulatedWishes, setSimulatedWishes] = useState<GuestWish[]>([
    {
      id: "w1",
      name: "Chị Thảo (Đại học)",
      relationship: "friend",
      message: "Chúc trăm năm hạnh phúc đầu bạc răng long nhé hai bạn yêu! Nhìn ảnh cưới xịn sò quá đi thôiiii.",
      createdAt: "2026-05-28T14:20:00Z"
    },
    {
      id: "w2",
      name: "Bác Minh (Họ Hàng)",
      relationship: "other",
      message: "Mừng cho hai cháu đã tìm thấy nhau. Chúc hai cháu luôn bao dung, thấu hiểu nhau nhé.",
      createdAt: "2026-05-28T19:45:00Z"
    }
  ]);

  const [simulatedRSVPs, setSimulatedRSVPs] = useState<RSVPSubmission[]>([]);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Real database-backed RSVPs for host & guest flow
  const [realRsvps, setRealRsvps] = useState<DbRSVP[]>([]);
  const [realRsvpTotalExpected, setRealRsvpTotalExpected] = useState<number>(0);
  const [isLoadingRealRsvps, setIsLoadingRealRsvps] = useState<boolean>(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSubmitStatus, setRsvpSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  // RSVP Form Input values inside simulation
  const [rsvpGuestName, setRsvpGuestName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpAttendance, setRsvpAttendance] = useState<"yes" | "no">("yes");
  const [rsvpGuestCount, setRsvpGuestCount] = useState(1);
  const [rsvpReplies, setRsvpReplies] = useState<Record<string, string>>({});

  // Wishing Well Form states inside simulation
  const [wishGuestName, setWishGuestName] = useState("");
  const [wishRelationship, setWishRelationship] = useState<"groom" | "bride" | "friend" | "other">("friend");
  const [wishMessage, setWishMessage] = useState("");

  // Create Wedding Invitation Action & Wizard states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<"setup" | "creating" | "success">("setup");
  const [slug, setSlug] = useState("dung-hoa-2026");
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [guestViewMode, setGuestViewMode] = useState(false);
  const [guestInvitationId, setGuestInvitationId] = useState<string | null>(null);

  // Supabase Auth states
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authGoal, setAuthGoal] = useState<"publish" | null>(null);

  // Secure Banking Masking & Privacy States
  const [revealGroomBank, setRevealGroomBank] = useState(false);
  const [revealBrideBank, setRevealBrideBank] = useState(false);

  // Privacy Protection Helper: Mask sensitive personal data to prevent public crawling/scraping
  const maskSensitiveValue = (value: string | undefined | null, isRevealed: boolean) => {
    if (!value) return "";
    if (isRevealed) return value;
    if (value.length <= 4) return "****";
    const first = value.slice(0, Math.min(3, value.length - 2));
    const last = value.slice(-Math.min(3, value.length - first.length));
    const stars = "*".repeat(Math.max(4, value.length - first.length - last.length));
    return `${first}${stars}${last}`;
  };

  // User’s saved invitations list and currently editing card states
  const [userInvitations, setUserInvitations] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Advanced secure audio upload state config
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (mp3, wav)
    const validTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav"];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && fileExt !== "mp3" && fileExt !== "wav") {
      const errMsg = "Chỉ chấp nhận định dạng file .mp3 hoặc .wav!";
      setAudioUploadError(errMsg);
      triggerToast(errMsg);
      return;
    }

    // Limit size to 15MB for performance
    if (file.size > 15 * 1024 * 1024) {
      const errMsg = "Tệp âm thanh quá lớn! Giới hạn tối đa là 15MB.";
      setAudioUploadError(errMsg);
      triggerToast(errMsg);
      return;
    }

    setIsUploadingAudio(true);
    setAudioUploadError(null);

    try {
      // Create random token string and secure clean filename
      const randToken = Math.random().toString(36).substring(2, 10);
      const cleanSlug = slug ? slug.replace(/[^a-z0-9-]/g, "") : "wedding";
      const secureFileName = `${cleanSlug}-${randToken}.${fileExt}`;

      // Upload via Supabase Storage
      const { data, error } = await supabase.storage
        .from('wedding-audio')
        .upload(secureFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Build and retrieve public asset path from Supabase
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-audio')
        .getPublicUrl(secureFileName);

      // Successfully saved! Let's update state configuration values
      updateConfig(["music", "url"], publicUrl);
      
      // Extract song name from file or use a fallback
      const cleanTitle = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
      updateConfig(["music", "title"], cleanTitle);

      triggerToast("Đã tải nhạc nền lên thiệp cưới thành công!");
    } catch (err: any) {
      console.error("Lỗi khi tải file nhạc lên Storage:", err);
      setAudioUploadError(err.message || "Lỗi tải âm thanh lên máy chủ.");
      triggerToast(`Lỗi upload nhạc: ${err.message}`);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // State configurations for secure image upload (Thư viện ảnh)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const handleUploadPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (png, jpg, jpeg, webp)
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !["png", "jpg", "jpeg", "webp"].includes(fileExt || "")) {
      const errMsg = "Chỉ chấp nhận các định dạng file ảnh: .png, .jpg, .jpeg, .webp!";
      setPhotoUploadError(errMsg);
      triggerToast(errMsg);
      return;
    }

    // Limit size to 10MB for album pictures
    if (file.size > 10 * 1024 * 1024) {
      const errMsg = "Tệp ảnh quá lớn! Giới hạn tối đa là 10MB.";
      setPhotoUploadError(errMsg);
      triggerToast(errMsg);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      // Create random suffix and timestamp to prevent collisions
      const cleanSlug = slug ? slug.replace(/[^a-z0-9-]/g, "") : "wedding";
      const secureFileName = `album_${Date.now()}_${cleanSlug}.${fileExt}`;

      // Upload via Supabase Storage
      const { data, error } = await supabase.storage
        .from('wedding-images')
        .upload(secureFileName, file, {
          cacheControl: '31536000',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-images')
        .getPublicUrl(secureFileName);

      // Append new photo URL to the gallery configuration state
      updateConfig(["gallery"], [...config.gallery, publicUrl]);
      triggerToast("Tải ảnh cưới lên album thành công!");
    } catch (err: any) {
      console.error("Lỗi tải ảnh lên Storage:", err);
      setPhotoUploadError(err.message || "Lỗi tải ảnh lên máy chủ.");
      triggerToast(`Lỗi upload ảnh: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
      // Reset input element value
      e.target.value = "";
    }
  };

  const fetchUserInvitations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserInvitations(data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách thiệp:", err);
    }
  };

  const handleLoadInvitationForEdit = (invitation: any) => {
    setEditingId(invitation.id);
    setSlug(invitation.slug);
    if (invitation.config) {
      setConfig(invitation.config);
    }
    triggerToast(`Đã nạp thiệp "${invitation.title || invitation.slug}" để chỉnh sửa!`);
  };

  const handleDeleteInvitation = async (id: string, slugToDelete: string) => {
    const isConfirmed = window.confirm ? window.confirm(`Bạn có chắc muốn xóa thiệp cưới "${slugToDelete}"? Hành động này không thể hoàn tác.`) : true;
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      triggerToast("Đã xóa thiệp cưới thành công!");
      if (editingId === id) {
        setEditingId(null);
        setSlug("dung-hoa-2026");
        // Reset config
        const normalizedDefault = JSON.parse(JSON.stringify(PRESETS.geometricBalance.config), (k, v) => {
          return typeof v === "string" ? v.normalize("NFC") : v;
        });
        setConfig(normalizedDefault);
      }

      if (user) {
        fetchUserInvitations(user.id);
      }
    } catch (err: any) {
      console.error("Lỗi xóa thiệp:", err);
      triggerToast(`Lỗi xóa thiệp: ${err.message}`);
    }
  };

  const executePublish = async (currentUser?: any) => {
    const activeUser = currentUser || user;
    // 1. Chuyển UI sang trạng thái đang tạo
    setCreationStep("creating");
    setCreationProgress(20);
    setCreationLogs(["Bắt đầu kết nối với Supabase..."]);

    if (!editingId && userInvitations.length >= 10) {
      setCreationLogs(prev => [...prev, "❌ Lỗi: Bạn đã đạt giới hạn tối đa 10 thiệp cưới/tài khoản."]);
      setCreationProgress(0);
      setCreationStep("setup");
      triggerToast("Bạn đã đạt giới hạn tối đa 10 thiệp cưới!");
      return;
    }

    try {
      setCreationLogs(prev => [...prev, "Đang đẩy cấu hình JSON lên Database..."]);
      
      let resError = null;
      if (editingId) {
        // Cập nhật cấu hình thiệp cưới hiện có
        const { error } = await supabase
          .from('invitations')
          .update({
            title: `Thiệp cưới của ${config.couple.groom.shortName} & ${config.couple.bride.shortName}`,
            config: config,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        resError = error;
      } else {
        // Kiểm tra trùng lặp slug trước
        const { data: existing } = await supabase
          .from('invitations')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          throw new Error("Đường dẫn (Slug) này đã tồn tại. Vui lòng chọn đường dẫn khác!");
        }

        // Tạo thiệp mới hoàn toàn
        const { error } = await supabase
          .from('invitations')
          .insert([
            {
              slug: slug,
              title: `Thiệp cưới của ${config.couple.groom.shortName} & ${config.couple.bride.shortName}`,
              config: config,
              owner_id: activeUser ? activeUser.id : undefined
            }
          ]);
        resError = error;
      }

      // 3. Xử lý nếu có lỗi từ Database (ví dụ: trùng slug hoặc lỗi trigger)
      if (resError) {
        throw resError; 
      }

      // 4. Nếu thành công, cập nhật UI 100%
      setCreationProgress(100);
      setCreationLogs(prev => [...prev, "Kích hoạt thành công! Dữ liệu đã lưu vào Supabase."]);
      
      if (activeUser) {
        await fetchUserInvitations(activeUser.id);
      }

      // Đợi 1 chút cho user đọc dòng log rồi chuyển màn hình
      setTimeout(() => {
        setCreationStep("success");
      }, 1000);

    } catch (error: any) {
      console.error("Lỗi Supabase:", error);
      setCreationLogs(prev => [...prev, `❌ Lỗi lưu DB: ${error.message}`]);
      setCreationProgress(0);
    }
  };

  const handleStartPublish = async () => {
    if (!user) {
      // Nếu chưa đăng nhập, hướng người dùng đăng nhập trước và lưu lại ý định gán của họ
      setAuthGoal("publish");
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!editingId && userInvitations.length >= 10) {
      triggerToast("Bạn đã đạt giới hạn tối đa 10 thiệp cưới!");
      return;
    }
    
    await executePublish();
  };

  const handleAuthSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    fetchUserInvitations(loggedInUser.id);
    triggerToast(`Đăng nhập thành công với email: ${loggedInUser.email}`);
    if (authGoal === "publish") {
      setAuthGoal(null);
      // Đợi modal đóng mượt mà rồi tự động thực thi quá trình đẩy dữ liệu
      setTimeout(() => {
        executePublish(loggedInUser);
      }, 600);
    }
  };

  const handleDownloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thiệp Cưới: ${config.couple.groom.fullName} & ${config.couple.bride.fullName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Dancing+Script&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Montserrat:wght@200;400;600&family=Inter:wght@300;400;600&display=swap&subset=vietnamese" rel="stylesheet">
  <style>
    .font-vibes { font-family: 'Charm', cursive; }
    .font-dancing { font-family: 'Dancing Script', cursive; }
    .font-playfair { font-family: 'Playfair Display', serif; }
    .font-cormorant { font-family: 'Cormorant Garamond', serif; }
    .font-serif { font-family: 'Cormorant Garamond', serif; }
    .font-montserrat { font-family: 'Montserrat', sans-serif; }
    .font-sans { font-family: 'Inter', sans-serif; }
    
    /* Avoid diacritic splitting and letter gaps on Webkit/Blink */
    h1, h2, h3, h4, h5, h6, .font-playfair, .font-cormorant, .font-vibes, .font-dancing, span, p, label {
      letter-spacing: normal !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased !important;
      font-variant-ligatures: common-ligatures !important;
      font-feature-settings: "liga" on, "clig" on, "kern" on !important;
    }
  </style>
</head>
<body class="bg-stone-100 min-h-screen text-stone-800 antialiased" style="background-color: ${config.theme.backgroundColor}; color: ${config.theme.textColor || '#1c1917'};">
  <!-- Interactive Mobile Container Frame -->
  <div class="max-w-md mx-auto bg-white shadow-2xl min-h-screen flex flex-col relative overflow-hidden" id="app">
    
    <!-- Hero Banner with Countdown -->
    <div class="relative min-h-[500px] flex flex-col items-center justify-center text-center p-6 bg-cover bg-center text-white overflow-hidden shrink-0" style="background-image: linear-gradient(rgba(10,12,18,0.55), rgba(10,12,18,0.65)), url('${config.gallery[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800"}')">
      <div class="absolute inset-[15px] border-2 pointer-events-none opacity-80" style="border-color: ${config.theme.secondaryColor}"></div>
      <p class="text-[10px] uppercase tracking-[0.2em] mb-2 font-sans text-stone-200">Thư Mời Lễ Thành Hôn</p>
      <h2 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-5xl' : config.theme.titleFont === 'dancing' ? 'font-dancing text-4xl' : config.theme.titleFont === 'playfair' ? 'font-playfair text-4xl' : 'font-cormorant text-5xl'} text-white my-3 font-medium">
        ${nfc(config.couple.groom.shortName)} <span class="text-2xl font-serif italic">&amp;</span> ${nfc(config.couple.bride.shortName)}
      </h2>
      <div class="w-16 h-px my-3" style="background-color: ${config.theme.secondaryColor}"></div>
      <p class="text-xs uppercase tracking-widest text-stone-100 mb-1 font-sans font-semibold">
        ${config.events[0]?.date ? new Date(config.events[0].date).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Ngày 31 Tháng 12, 2026"}
      </p>
      <p class="text-[10px] text-stone-300 mb-8 font-sans">TẠI ${config.events[0]?.locationName?.toUpperCase() || "TƯ GIA"}</p>
    </div>

    <!-- Couple Cards -->
    <div class="py-14 px-6 space-y-10 text-center bg-white border-b border-stone-100">
      <h3 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-4xl' : 'font-playfair text-3xl'}" style="color: ${config.theme.primaryColor}">Lễ Thành Hôn</h3>
      <div class="space-y-6">
        <!-- Groom Card -->
        <div class="bg-stone-50 p-6 border border-stone-200 relative text-left">
          <div class="flex items-start gap-4">
            <img src="${config.couple.groom.avatar}" class="w-20 h-20 object-cover border border-stone-300 bg-white" />
            <div>
              <span class="text-[8px] uppercase tracking-widest font-sans font-bold text-stone-400">CHÚ RỂ</span>
              <h4 class="font-serif font-bold text-stone-900 text-base">${nfc(config.couple.groom.fullName)}</h4>
              <p class="text-[10px] text-stone-500 mt-1 font-sans">
                Con ông: ${nfc(config.couple.groom.fatherName)}<br/>Con bà: ${nfc(config.couple.groom.motherName)}
              </p>
            </div>
          </div>
          <!-- Gift -->
          <div class="mt-4 pt-3 border-t border-stone-200">
            <div class="bg-white p-3 border border-stone-200 rounded text-[10px] font-mono">
              <p class="font-sans font-bold text-stone-800 mb-1"><i class="fa-solid fa-gift"></i> Mừng Cưới Chú Rể:</p>
              Ngân hàng: ${config.couple.groom.bankInfo.bankName}<br/>Số TK: ${config.couple.groom.bankInfo.accountNumber}<br/>Chủ TK: ${nfc(config.couple.groom.bankInfo.accountName)}
            </div>
          </div>
        </div>
        
        <!-- Bride Card -->
        <div class="bg-stone-50 p-6 border border-stone-200 relative text-left">
          <div class="flex items-start gap-4">
            <img src="${config.couple.bride.avatar}" class="w-20 h-20 object-cover border border-stone-300 bg-white" />
            <div>
              <span class="text-[8px] uppercase tracking-widest font-sans font-bold text-stone-400">CÔ DÂU</span>
              <h4 class="font-serif font-bold text-stone-900 text-base">${nfc(config.couple.bride.fullName)}</h4>
              <p class="text-[10px] text-stone-500 mt-1 font-sans">
                Con ông: ${nfc(config.couple.bride.fatherName)}<br/>Con bà: ${nfc(config.couple.bride.motherName)}
              </p>
            </div>
          </div>
          <!-- Gift -->
          <div class="mt-4 pt-3 border-t border-stone-200">
            <div class="bg-white p-3 border border-stone-200 rounded text-[10px] font-mono">
              <p class="font-sans font-bold text-stone-800 mb-1"><i class="fa-solid fa-gift"></i> Mừng Cưới Cô Dâu:</p>
              Ngân hàng: ${config.couple.bride.bankInfo.bankName}<br/>Số TK: ${config.couple.bride.bankInfo.accountNumber}<br/>Chủ TK: ${nfc(config.couple.bride.bankInfo.accountName)}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Events Block -->
    <div class="py-14 px-6 bg-stone-50 text-center space-y-8">
      <h3 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-4xl' : 'font-playfair text-3xl'}" style="color: ${config.theme.primaryColor}">Lịch Tổ Chức Cưới</h3>
      <div class="space-y-6">
        ${config.events.map(evt => `
          <div class="bg-white p-6 border border-stone-200 text-center">
            <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-stone-50 border inline-block mb-3">${evt.name}</span>
            <p class="text-base font-bold text-stone-950 font-serif">${evt.time} • ${evt.date ? new Date(evt.date).toLocaleDateString("vi-VN") : ""}</p>
            <p class="text-[10px] text-stone-500 my-1">SẢNH: ${evt.locationName}</p>
            <p class="text-xs text-stone-600 mt-2"><i class="fa-solid fa-location-dot text-amber-600"></i> ${evt.address}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Love Story -->
    <div class="py-14 px-6 text-center space-y-8 bg-white border-t border-stone-200">
      <h3 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-4xl' : 'font-playfair text-3xl'}" style="color: ${config.theme.primaryColor}">Hành Trình Tình Yêu</h3>
      <p class="text-[10px] tracking-wider text-stone-400 uppercase -mt-4">Khi duyên số dẫn lối cho hai ta</p>
      <div class="space-y-8 text-left relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-stone-200">
        ${config.couple.loveStory.map(story => `
          <div class="relative pl-8 space-y-2">
            <span class="absolute left-2.5 top-2 h-2.5 w-2.5 rotate-45 bg-white border border-stone-400"></span>
            <div class="text-[9px] font-mono font-bold" style="color: ${config.theme.primaryColor}">${story.date}</div>
            <h4 class="text-xs font-bold text-stone-900 leading-tight">${nfc(story.title)}</h4>
            ${story.image ? `<img src="${story.image}" class="w-full h-28 object-cover border border-stone-200 mt-1" />` : ""}
            <p class="text-[11px] text-stone-500 leading-relaxed">${nfc(story.content)}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Photo Gallery -->
    <div class="py-14 px-6 bg-stone-50 text-center space-y-8">
      <h3 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-4xl' : 'font-playfair text-3xl'}" style="color: ${config.theme.primaryColor}">Khoảnh Khắc Kỷ Niệm</h3>
      <div class="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        ${config.gallery.map((url, idx) => `
          <div class="aspect-square bg-stone-100 overflow-hidden border border-stone-200">
            <img src="${url}" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
          </div>
        `).join('')}
      </div>
    </div>

    <!-- RSVP Block -->
    <div class="py-14 px-6 bg-white shrink-0 text-center border-t border-stone-205">
      <div class="bg-stone-50 p-6 border border-stone-250 text-left space-y-4">
        <h3 class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-3xl' : 'font-playfair text-2xl'} text-center" style="color: ${config.theme.primaryColor}">Xác Nhận Tham Dự</h3>
        <p class="text-[9px] text-stone-400 uppercase text-center tracking-widest font-sans font-semibold">Vui lòng phản hồi trước ngày tổ chức</p>
        <div class="space-y-3 pt-2 text-stone-800">
          <div>
            <label class="text-[9px] uppercase tracking-wider font-bold text-stone-500 block mb-1">Tên của bạn*</label>
            <input type="text" class="text-xs border border-stone-200 bg-white p-2 w-full" placeholder="Họ và tên khách mời" />
          </div>
          <div>
            <label class="text-[9px] uppercase tracking-wider font-bold text-stone-500 block mb-1">Số điện thoại</label>
            <input type="tel" class="text-xs border border-stone-200 bg-white p-2 w-full" placeholder="Số điện thoại" />
          </div>
          <button type="button" onclick="alert('Đã ghi nhận xác nhận gửi thành công!')" class="w-full text-white text-xs font-bold py-2.5 px-4 bg-stone-900 uppercase tracking-widest hover:opacity-90 mt-2">Gửi Xác Nhận</button>
        </div>
      </div>
    </div>

    <footer class="py-10 text-center space-y-2 bg-stone-50 border-t border-stone-200">
      <p class="${config.theme.titleFont === 'vibes' ? 'font-vibes text-2xl' : 'font-playfair text-xl'}" style="color: ${config.theme.primaryColor}">Cám Ơn Quý Khách!</p>
      <p class="text-[9px] text-stone-400 font-mono">Trình tạo thiệp cưới miễn phí Supabase • 2026</p>
    </footer>

  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Thiep_Cuoi_${config.couple.groom.shortName}_${config.couple.bride.shortName}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Tải file HTML thiệp thành công!");
  };

  // Toast feedback helper
  const triggerToast = (msg: string) => {
    setCopiedText(msg);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Safe nested update reducer replacement with automatic Vietnamese diacritics normalization
  const updateConfig = (path: string[], value: any) => {
    const normalizedValue = typeof value === "string" ? nfc(value) : value;
    setConfig(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      let current = clone;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = normalizedValue;
      return clone;
    });
  };

  // Preset swap with Unicode normalization safety - preserves user-edited content and only updates theme and music styling
  const handlePresetSelect = (key: string) => {
    setActivePresetKey(key);
    const normalizedConfig = JSON.parse(JSON.stringify(PRESETS[key].config), (k, v) => {
      return typeof v === "string" ? v.normalize("NFC") : v;
    });
    
    // Applying preset styles (theme & music) but leaving couple info, events, gallery, and rsvp configs untouched
    setConfig(prev => ({
      ...prev,
      theme: normalizedConfig.theme,
      music: normalizedConfig.music,
    }));
    triggerToast(`Đã áp dụng mẫu giao diện: ${PRESETS[key].name}`);
  };

  // Manage Supabase Auth Session and state change
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchUserInvitations(u.id);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchUserInvitations(u.id);
      } else {
        setUserInvitations([]);
        setEditingId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // TỰ ĐỘNG NHẬN DIỆN ĐƯỜNG DẪN ĐỂ HIỂN THỊ THIỆP (ĐOẠN MỚI THÊM VÀO)
  useEffect(() => {
    const path = window.location.pathname;
    
    // Nếu URL không phải là trang chủ (ví dụ: /kieu-trinh-2026)
    if (path && path !== "/") {
      const urlSlug = path.substring(1); 
      
      const fetchInvitation = async () => {
        try {
          const decodedSlug = decodeURIComponent(urlSlug); 
          
          const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('slug', decodedSlug)
            .single();

          if (error) throw error;

          if (data && data.config) {
            setConfig(data.config);     
            setSlug(data.slug);         
            setGuestViewMode(true);     
            setGuestInvitationId(data.id);
          }
        } catch (err) {
          console.error("Lỗi tải thiệp từ Supabase:", err);
        }
      };

      fetchInvitation();
    }
  }, []);

  // Audio effects
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log("Audio autoplay block by browser:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, config.music.url]);

  // Load real RSVPs from Supabase for the host dashboard
  const loadRealRsvpsForHost = async (invId: string) => {
    setIsLoadingRealRsvps(true);
    try {
      const response = await fetchHostRsvps(invId);
      if (response.success && response.data) {
        setRealRsvps(response.data.rsvps);
        setRealRsvpTotalExpected(response.data.totalExpectedGuests);
      } else {
        console.warn(response.message);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách RSVP thực tế:", err);
    } finally {
      setIsLoadingRealRsvps(false);
    }
  };

  useEffect(() => {
    if (editingId) {
      loadRealRsvpsForHost(editingId);
    } else {
      setRealRsvps([]);
      setRealRsvpTotalExpected(0);
    }
  }, [editingId]);

  // Handle countdown calculation
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const weddingDate = config.events[0]?.date || "2026-12-31";
  const weddingTime = config.events[0]?.time || "18:00";

  useEffect(() => {
    const interval = setInterval(() => {
      const parsedDate = new Date(`${weddingDate}T${weddingTime}`);
      const diff = parsedDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [weddingDate, weddingTime]);

  // Story handlers
  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle || !newStoryContent) return;
    const newId = Date.now().toString();
    const newStory = {
      id: newId,
      title: newStoryTitle,
      date: newStoryDate || "2026-05-29",
      content: newStoryContent,
      image: newStoryImage || "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80"
    };
    updateConfig(["couple", "loveStory"], [...config.couple.loveStory, newStory]);
    setNewStoryTitle("");
    setNewStoryDate("");
    setNewStoryContent("");
    setNewStoryImage("");
    triggerToast("Thêm cột mốc tình yêu thành công!");
  };

  const handleRemoveStory = (id: string) => {
    const updated = config.couple.loveStory.filter(s => s.id !== id);
    updateConfig(["couple", "loveStory"], updated);
    triggerToast("Đã xoá cột mốc tình yêu.");
  };

  // Photo gallery handlers
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl) return;
    updateConfig(["gallery"], [...config.gallery, newPhotoUrl]);
    setNewPhotoUrl("");
    triggerToast("Thêm ảnh cưới mới thành công!");
  };

  const handleRemovePhoto = (index: number) => {
    const updated = [...config.gallery];
    updated.splice(index, 1);
    updateConfig(["gallery"], updated);
    triggerToast("Đã xoá ảnh cưới.");
  };

  // Block ordering utilities
  const moveBlock = (index: number, direction: "up" | "down") => {
    const newOrder = [...config.blockOrder];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    updateConfig(["blockOrder"], newOrder);
    triggerToast(`Đã di chuyển khối hiển thị`);
  };

  // RSVP Custom Question handlers
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText) return;
    const qs: RSVPQuestion = {
      id: "q_" + Date.now().toString().slice(-4),
      questionText: newQuestionText,
      type: newQuestionType,
      options: newQuestionType === "radio" ? newQuestionOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined
    };
    updateConfig(["rsvpConfig", "questions"], [...config.rsvpConfig.questions, qs]);
    setNewQuestionText("");
    setNewQuestionOptions("");
    triggerToast("Đã thêm câu hỏi tùy chỉnh!");
  };

  const handleRemoveQuestion = (id: string) => {
    const updated = config.rsvpConfig.questions.filter(q => q.id !== id);
    updateConfig(["rsvpConfig", "questions"], updated);
    triggerToast("Đã xoá câu hỏi tùy chỉnh.");
  };

  // Preview form submittals
  const submitSimulatedWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishGuestName || !wishMessage) {
      alert("Vui lòng nhập tên và lời chúc của bạn.");
      return;
    }
    const newWish: GuestWish = {
      id: "w_new_" + Date.now().toString(),
      name: wishGuestName,
      relationship: wishRelationship,
      message: wishMessage,
      createdAt: new Date().toISOString()
    };
    setSimulatedWishes([newWish, ...simulatedWishes]);
    setWishGuestName("");
    setWishMessage("");
    triggerToast("Gửi lời chúc thành công! (Dữ liệu giả lập)");
  };

  const submitSimulatedRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpGuestName) {
      alert("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    setRsvpSubmitStatus(null);

    // If viewing in guestViewMode with a valid invitation ID, use real database query
    if (guestViewMode && guestInvitationId) {
      setIsSubmittingRsvp(true);
      try {
        const payload: DbRSVP = {
          invitation_id: guestInvitationId,
          guest_name: rsvpGuestName,
          phone: rsvpPhone || null,
          attendance: rsvpAttendance,
          guest_count: rsvpAttendance === "yes" ? rsvpGuestCount : 0,
          answers: rsvpReplies,
        };

        const result = await submitRsvp(payload);
        if (result.success) {
          const newSubmission: RSVPSubmission = {
            id: result.data?.id || "rsvp_" + Date.now().toString(),
            guestName: rsvpGuestName,
            phone: rsvpPhone,
            attendance: rsvpAttendance,
            guestCount: rsvpAttendance === "yes" ? rsvpGuestCount : 0,
            answers: rsvpReplies,
            createdAt: new Date().toISOString()
          };
          setSimulatedRSVPs([newSubmission, ...simulatedRSVPs]);
          
          setRsvpSubmitStatus({ success: true, message: result.message });
          triggerToast(result.message);

          // reset form
          setRsvpGuestName("");
          setRsvpPhone("");
          setRsvpReplies({});
        } else {
          setRsvpSubmitStatus({ success: false, message: result.message });
          triggerToast(result.message);
        }
      } catch (err: any) {
        console.error("Lỗi gửi RSVP:", err);
        setRsvpSubmitStatus({ success: false, message: "Lỗi kết nối máy chủ khi gửi thông tin." });
        triggerToast("Lỗi kết nối khi gửi RSVP.");
      } finally {
        setIsSubmittingRsvp(false);
      }
    } else {
      // Simulated preview mode
      const newSubmission: RSVPSubmission = {
        id: "rsvp_" + Date.now().toString(),
        guestName: rsvpGuestName,
        phone: rsvpPhone,
        attendance: rsvpAttendance,
        guestCount: rsvpAttendance === "yes" ? rsvpGuestCount : 1,
        answers: rsvpReplies,
        createdAt: new Date().toISOString()
      };
      setSimulatedRSVPs([newSubmission, ...simulatedRSVPs]);
      setRsvpSubmitStatus({ success: true, message: "Gửi RSVP thành công! (Dữ liệu giả lập demo)" });
      triggerToast(`Gửi RSVP thành công! Cám ơn sự phản hồi của bạn.`);
      
      // reset form
      setRsvpGuestName("");
      setRsvpPhone("");
      setRsvpReplies({});
    }
  };

  // JSON view formatting
  const generatedJSONString = JSON.stringify(config, null, 2);

  // Font class resolvers for dynamic fonts
  const fontTitleClass = () => {
    switch (config.theme.titleFont) {
      case "vibes": return "font-vibes text-4xl md:text-5xl lg:text-6xl";
      case "dancing": return "font-dancing text-3xl md:text-4xl lg:text-5xl";
      case "playfair": return "font-playfair text-3xl md:text-4xl";
      case "cormorant": return "font-cormorant italic text-3.5xl md:text-4.5xl";
      default: return "font-vibes text-4xl";
    }
  };

  const fontBodyClass = () => {
    switch (config.theme.bodyFont) {
      case "cormorant": return "font-cormorant text-lg leading-relaxed";
      case "montserrat": return "font-montserrat text-sm leading-relaxed font-light";
      case "sans": return "font-sans text-sm leading-relaxed";
      default: return "font-sans text-sm leading-relaxed";
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-800 antialiased">
      {/* Dynamic Toast Feedback Overlay */}
      {copiedText && (
        <div id="toast" className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-950 text-stone-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-stone-800 text-sm animate-bounce" role="status">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{copiedText}</span>
        </div>
      )}

      {/* Main Header Station */}
      {guestViewMode ? (
        user && (
          <button
            type="button"
            onClick={() => setGuestViewMode(false)}
            className="fixed top-4 left-4 z-50 text-[11px] font-bold px-4 py-2 bg-stone-900/90 hover:bg-stone-900 text-stone-100 rounded-lg transition-all flex items-center gap-1.5 hover:shadow-xl shadow-md border border-stone-800 backdrop-blur-xs cursor-pointer opacity-80 hover:opacity-100 hover:scale-105"
            title="Quay lại Trình Thiết Kế"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-300" /> Back to Editor
          </button>
        )
      ) : (
        <header id="main-header" className="bg-white/95 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <Heart className="w-6 h-6 text-rose-600 fill-rose-600 animate-pulse" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight text-stone-900">
                Trình Cấu Hình Thiệp Cưới 0đ
              </h1>
              <p className="text-xs text-stone-500">
                Thiết kế JSON cấu hình • Phát sinh SQL database xịn sò cho ứng dụng Next.js & Supabase
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-medium px-2.5 py-1 bg-yellow-50 text-yellow-800 border border-yellow-250 rounded-lg">
              supabase-ready
            </span>
            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-lg">
              next.js-optimized
            </span>
            {user ? (
              <div className="flex items-center gap-2 border border-stone-200 bg-stone-50 rounded-lg px-3 py-1.5 text-xs text-stone-700">
                <span className="font-mono font-medium max-w-[125px] truncate" title={user.email}>
                  {user.email}
                </span>
                <div className="w-px h-3 bg-stone-300"></div>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    triggerToast("Đã đăng xuất thành công!");
                  }}
                  className="font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthGoal(null);
                  setIsAuthModalOpen(true);
                }}
                className="text-xs font-semibold px-3 py-1.5 bg-stone-50 hover:bg-stone-200 text-stone-650 border border-stone-300 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                Đăng nhập
              </button>
            )}
            <button 
              type="button"
              onClick={() => {
                // Swap configuration completely with default (fully normalized to NFC)
                const normalizedDefault = JSON.parse(JSON.stringify(PRESETS.geometricBalance.config), (k, v) => {
                  return typeof v === "string" ? v.normalize("NFC") : v;
                });
                setConfig(normalizedDefault);
                setActivePresetKey("geometricBalance");
                triggerToast("Khôi phục cài đặt mặc định thành công");
              }}
              className="text-xs font-medium px-3 py-1 bg-stone-50 hover:bg-stone-200 text-stone-600 border border-stone-300 rounded-lg flex items-center gap-1 transition-all"
              aria-label="Khôi phục mặc định"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(true);
                setCreationStep("setup");
              }}
              className={`text-xs font-bold px-4.5 py-2.5 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer relative overflow-hidden group border ${
                editingId 
                  ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-700" 
                  : "bg-rose-600 hover:bg-rose-700 border-rose-700"
              }`}
            >
              <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '1.5s' }}></span>
              {editingId ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white" />
                  <span>Cập Nhật Thiệp Cưới</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Tạo Thiệp Cưới Ngay</span>
                </>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main workspace bento grid layout */}
      <main id="workspace-main" className={`flex-1 grid grid-cols-1 ${guestViewMode ? 'grid-cols-1 h-screen overflow-hidden' : 'lg:grid-cols-12 landscape:grid-cols-12 bg-stone-100'}`}>
        
        {/* Left column config zone - takes 7/12 cols */}
        {!guestViewMode && (
          <section id="config-workspace" className="lg:col-span-7 landscape:col-span-7 flex flex-col border-r border-stone-200 bg-stone-50 p-4 md:p-6 space-y-6 animate-fade-in">
          
            {/* Dashboard cho người dùng đã đăng nhập */}
            {user && (
              <div id="user-dashboard" className="bg-white p-6 rounded-none border border-stone-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-600"></div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-xs font-bold tracking-[0.08em] text-stone-900 uppercase">
                      Danh Sách Thiệp Cưới ({userInvitations.length}/10)
                    </h2>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setSlug("dung-hoa-2026");
                        // Reset to geometricBalance preset
                        const normalizedDefault = JSON.parse(JSON.stringify(PRESETS.geometricBalance.config), (k, v) => {
                          return typeof v === "string" ? v.normalize("NFC") : v;
                        });
                        setConfig(normalizedDefault);
                        triggerToast("Đã chuyển về tạo thiệp cưới mới!");
                      }}
                      className="text-[9px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded transition-all cursor-pointer"
                    >
                      Thoát Sửa (Tạo Mới)
                    </button>
                  )}
                </div>
                
                {userInvitations.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-stone-200 rounded bg-stone-50/50">
                    <p className="text-xs text-stone-500">Bạn chưa có mẫu thiệp cưới nào lưu trữ trực tiếp. Bấm "Tạo Thiệp Cưới Ngay" để bắt đầu!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                    {userInvitations.map((inv) => {
                      const isCurrentlyEditing = editingId === inv.id;
                      return (
                        <div key={inv.id} className={`py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-colors ${isCurrentlyEditing ? 'bg-emerald-50/20 -mx-4 px-4 border-y border-emerald-100/10' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-stone-900 text-xs truncate max-w-[220px]" title={inv.title}>
                                {inv.title || "Thiệp cưới không tên"}
                              </span>
                              {isCurrentlyEditing && (
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                  Đang sửa
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-stone-400 text-[10px] mt-0.5">
                              <a
                                href={`${window.location.origin}/${inv.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-rose-600 transition-colors flex items-center gap-0.5 font-mono"
                              >
                                <span>/{inv.slug}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <span>•</span>
                              <span>
                                {new Date(inv.created_at).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleLoadInvitationForEdit(inv)}
                              className="text-[10px] font-semibold px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-250 text-stone-700 rounded transition-all cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInvitation(inv.id, inv.slug)}
                              className="text-[10px] font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded transition-all flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          
          {/* Section 1: Presets selection (Theming) */}
          <div id="section-presets" className="bg-white p-6 rounded-none border border-stone-200 shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: config.theme.secondaryColor }}></div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" style={{ color: config.theme.primaryColor }} />
              <h2 className="text-xs font-bold tracking-[0.08em] text-stone-900 uppercase">
                1. Lựa Chọn Presets Giao Diện (Mẫu Nhanh)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Nhấp để chuyển đổi các preset thiết kế. Hệ thống sẽ thay đổi toàn bộ cấu trúc JSON màu sắc, hệ phông chữ, danh sách phát nhạc và nội dung mẫu thiệp tương ứng.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {Object.entries(PRESETS).map(([key, data]) => {
                const isSelected = activePresetKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`flex flex-col text-left p-3.5 rounded-none border transition-all relative ${
                      isSelected 
                        ? "shadow-xs font-semibold" 
                        : "border-stone-200 hover:border-stone-400 bg-stone-50/40 hover:bg-white"
                    }`}
                    style={isSelected ? { 
                      borderColor: config.theme.primaryColor,
                      backgroundColor: `${config.theme.primaryColor}10`
                    } : {}}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: config.theme.primaryColor }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: config.theme.primaryColor }}></span>
                      </span>
                    )}
                    <div className="font-bold text-stone-900 text-xs tracking-wide leading-tight">{data.name.split(" ")[0]}</div>
                    <div className="text-[10px] text-stone-500 mt-1 lines-clamp-2 leading-tight">
                      {data.name.includes("(") ? data.name.substring(data.name.indexOf("(")) : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Deep Customizer control center */}
          <div id="section-customizer" className="bg-white rounded-none border border-stone-200 shadow-none overflow-hidden">
            {/* Header tab navigation for customizer section */}
            <div className="bg-stone-50/50 border-b border-stone-200 flex flex-wrap text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className="flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all"
                style={activeTab === "presets" ? {
                  borderBottomColor: config.theme.primaryColor,
                  color: config.theme.primaryColor,
                  backgroundColor: "white"
                } : {
                  borderBottomColor: "transparent",
                  color: "#57534e"
                }}
              >
                <Sliders className="w-3.5 h-3.5" /> Màu sắc & Nhạc
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className="flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all"
                style={activeTab === "general" ? {
                  borderBottomColor: config.theme.primaryColor,
                  color: config.theme.primaryColor,
                  backgroundColor: "white"
                } : {
                  borderBottomColor: "transparent",
                  color: "#57534e"
                }}
              >
                <Users className="w-3.5 h-3.5" /> Cặp đôi & Tài khoản
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("story")}
                className="flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all"
                style={activeTab === "story" ? {
                  borderBottomColor: config.theme.primaryColor,
                  color: config.theme.primaryColor,
                  backgroundColor: "white"
                } : {
                  borderBottomColor: "transparent",
                  color: "#57534e"
                }}
              >
                <Calendar className="w-3.5 h-3.5" /> Sự kiện & Cột mốc
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("gallery")}
                className="flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all"
                style={activeTab === "gallery" ? {
                  borderBottomColor: config.theme.primaryColor,
                  color: config.theme.primaryColor,
                  backgroundColor: "white"
                } : {
                  borderBottomColor: "transparent",
                  color: "#57534e"
                }}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Thư viện ảnh
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("rsvp")}
                className="flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all"
                style={activeTab === "rsvp" ? {
                  borderBottomColor: config.theme.primaryColor,
                  color: config.theme.primaryColor,
                  backgroundColor: "white"
                } : {
                  borderBottomColor: "transparent",
                  color: "#57534e"
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Form RSVP & Block
              </button>
            </div>

            {/* Customizer content panels */}
            <div className="p-5 space-y-4">
              
              {/* PANEL 1: Theme & Colors & Music */}
              {activeTab === "presets" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visual Color Pickers */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-stone-700">Màu sắc chủ đạo (Theme style)</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Màu chủ đạo (Primary)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={config.theme.primaryColor}
                              onChange={(e) => updateConfig(["theme", "primaryColor"], e.target.value)}
                              className="w-8 h-8 rounded border border-stone-200 cursor-pointer object-cover"
                            />
                            <input
                              type="text"
                              value={config.theme.primaryColor}
                              onChange={(e) => updateConfig(["theme", "primaryColor"], e.target.value)}
                              className="text-xs border border-stone-200 rounded px-1.5 py-1 w-full font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Màu bổ trợ (Secondary)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={config.theme.secondaryColor}
                              onChange={(e) => updateConfig(["theme", "secondaryColor"], e.target.value)}
                              className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={config.theme.secondaryColor}
                              onChange={(e) => updateConfig(["theme", "secondaryColor"], e.target.value)}
                              className="text-xs border border-stone-200 rounded px-1.5 py-1 w-full font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Nền thiệp (Canvas BG)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={config.theme.backgroundColor}
                              onChange={(e) => updateConfig(["theme", "backgroundColor"], e.target.value)}
                              className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={config.theme.backgroundColor}
                              onChange={(e) => updateConfig(["theme", "backgroundColor"], e.target.value)}
                              className="text-xs border border-stone-200 rounded px-1.5 py-1 w-full font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Màu văn bản (Text)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={config.theme.textColor}
                              onChange={(e) => updateConfig(["theme", "textColor"], e.target.value)}
                              className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={config.theme.textColor}
                              onChange={(e) => updateConfig(["theme", "textColor"], e.target.value)}
                              className="text-xs border border-stone-200 rounded px-1.5 py-1 w-full font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Font selections */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-stone-700">Hệ Phông Chữ (Google Fonts)</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Font tiêu đề (Cặp đôi/Banner)</label>
                          <select
                            value={config.theme.titleFont}
                            onChange={(e) => updateConfig(["theme", "titleFont"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-medium"
                          >
                            <option value="vibes">Charm Calligraphy (Cổ điển hỗ trợ tiếng Việt)</option>
                            <option value="dancing">Dancing Script (Viết tay uyển chuyển)</option>
                            <option value="playfair">Playfair Display (Serif cổ điển sang quý)</option>
                            <option value="cormorant">Cormorant Garamond (Garamond cổ điển hiển thị tốt nhất)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Font nội dung (Lịch/Thông điệp)</label>
                          <select
                            value={config.theme.bodyFont}
                            onChange={(e) => updateConfig(["theme", "bodyFont"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-medium"
                          >
                            <option value="cormorant">Cormorant Garamond (Thanh lịch cổ điển)</option>
                            <option value="montserrat">Montserrat (Sạch sẽ thanh mảnh)</option>
                            <option value="sans">Inter (Trực quan hiện đại)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background music section */}
                  <div className="border-t border-stone-100 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-rose-600" /> Nhạc nền thiệp (Audio Stream & Upload)
                      </h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xxs text-stone-500 cursor-pointer select-none">Bật nhạc mặc định?</label>
                        <input
                          type="checkbox"
                          checked={config.music.enabled}
                          onChange={(e) => updateConfig(["music", "enabled"], e.target.checked)}
                          className="w-3.5 h-3.5 accent-rose-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Draggable/Selectable secure audio uploader */}
                    <div className="bg-rose-50/30 border border-dashed border-rose-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative transition-all hover:bg-rose-50/50">
                      <input
                        type="file"
                        accept=".mp3,.wav"
                        id="audio-upload-input"
                        onChange={handleUploadAudio}
                        disabled={isUploadingAudio}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                        {isUploadingAudio ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
                            <span className="text-xs font-semibold text-rose-700">Đang tải nhạc lên (Tối đa 15MB)...</span>
                            <span className="text-[10px] text-stone-500">Vui lòng chờ trong giây lát</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-7 h-7 text-rose-600" />
                            <span className="text-xs font-semibold text-stone-800">
                              Kéo thả hoặc nhấp để tải nhạc tự chọn (.mp3, .wav)
                            </span>
                            <span className="text-[10px] text-stone-500 max-w-sm">
                              Tệp tự động mã hóa dạng ngẫu nhiên để an toàn dữ liệu. Giới hạn tối đa 15MB.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {audioUploadError && (
                      <div className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{audioUploadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">Tên bài hát hiển thị</label>
                        <input
                          type="text"
                          value={config.music.title}
                          onChange={(e) => updateConfig(["music", "title"], e.target.value)}
                          className="text-xs border border-stone-200 rounded px-2.5 py-1.5 w-full"
                          placeholder="VD: Beautiful in White"
                        />
                      </div>
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">Đường dẫn tệp âm thanh (.mp3)</label>
                        <input
                          type="text"
                          value={config.music.url}
                          onChange={(e) => updateConfig(["music", "url"], e.target.value)}
                          className="text-xs border border-stone-200 rounded px-2.5 py-1.5 w-full font-mono text-stone-600"
                          placeholder="Link bài hát https://..."
                        />
                      </div>
                    </div>

                    {/* Audio Player Simulated Controller */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all"
                          title="Thử nghe nhạc"
                        >
                          {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="text-xxs font-medium text-stone-600">Trình chơi thử (Testing preview player)</div>
                          <div className="text-xs font-semibold text-stone-900 truncate max-w-[200px] md:max-w-xs">{config.music.title}</div>
                        </div>
                      </div>
                      <div className="text-xxs text-stone-400 font-mono italic">
                        {isPlaying ? "đang phát thử..." : "đang dừng..."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 2: Couple details & Bank accounts */}
              {activeTab === "general" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Groom side config Column */}
                    <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-150">
                      <h3 className="text-xs font-bold text-sky-800 flex items-center gap-1.5 border-b border-sky-100 pb-2">
                        🤵 THÔNG TIN CHÚ RỂ
                      </h3>
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">Họ Tên Đầy Đủ</label>
                        <input
                          type="text"
                          value={config.couple.groom.fullName}
                          onChange={(e) => updateConfig(["couple", "groom", "fullName"], e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Tên Gọi Ngắn</label>
                          <input
                            type="text"
                            value={config.couple.groom.shortName}
                            onChange={(e) => updateConfig(["couple", "groom", "shortName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Số Điện Thoại</label>
                          <input
                            type="text"
                            value={config.couple.groom.phone}
                            onChange={(e) => updateConfig(["couple", "groom", "phone"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Họ Tên Bố</label>
                          <input
                            type="text"
                            value={config.couple.groom.fatherName}
                            onChange={(e) => updateConfig(["couple", "groom", "fatherName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Họ Tên Mẹ</label>
                          <input
                            type="text"
                            value={config.couple.groom.motherName}
                            onChange={(e) => updateConfig(["couple", "groom", "motherName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">URL Avatar (Chú rể)</label>
                        <input
                          type="text"
                          value={config.couple.groom.avatar}
                          onChange={(e) => updateConfig(["couple", "groom", "avatar"], e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-mono text-stone-500"
                        />
                      </div>

                      {/* Bank account parameters */}
                      <div className="border-t border-sky-100 pt-3 space-y-2">
                        <label className="text-xxs font-semibold text-sky-800 block">Tài Khoản Nhận Quà (Simulated)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Tên ngân hàng</label>
                            <input
                              type="text"
                              value={config.couple.groom.bankInfo.bankName}
                              onChange={(e) => updateConfig(["couple", "groom", "bankInfo", "bankName"], e.target.value)}
                              className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Số tài khoản</label>
                            <input
                              type="text"
                              value={config.couple.groom.bankInfo.accountNumber}
                              onChange={(e) => updateConfig(["couple", "groom", "bankInfo", "accountNumber"], e.target.value)}
                              className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Tên chủ thẻ (Viết liền hoa)</label>
                          <input
                            type="text"
                            value={config.couple.groom.bankInfo.accountName || "NGUYEN VAN HUNG"}
                            onChange={(e) => updateConfig(["couple", "groom", "bankInfo", "accountName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bride side config Column */}
                    <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-150">
                      <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 border-b border-rose-100 pb-2">
                        👰 THÔNG TIN CÔ DÂU
                      </h3>
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">Họ Tên Đầy Đủ</label>
                        <input
                          type="text"
                          value={config.couple.bride.fullName}
                          onChange={(e) => updateConfig(["couple", "bride", "fullName"], e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Tên Gọi Ngắn</label>
                          <input
                            type="text"
                            value={config.couple.bride.shortName}
                            onChange={(e) => updateConfig(["couple", "bride", "shortName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Số Điện Thoại</label>
                          <input
                            type="text"
                            value={config.couple.bride.phone}
                            onChange={(e) => updateConfig(["couple", "bride", "phone"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Họ Tên Bố</label>
                          <input
                            type="text"
                            value={config.couple.bride.fatherName}
                            onChange={(e) => updateConfig(["couple", "bride", "fatherName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xxs text-stone-500 block mb-1">Họ Tên Mẹ</label>
                          <input
                            type="text"
                            value={config.couple.bride.motherName}
                            onChange={(e) => updateConfig(["couple", "bride", "motherName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xxs text-stone-500 block mb-1">URL Avatar (Cô dâu)</label>
                        <input
                          type="text"
                          value={config.couple.bride.avatar}
                          onChange={(e) => updateConfig(["couple", "bride", "avatar"], e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2.5 py-1.5 w-full font-mono text-stone-500"
                        />
                      </div>

                      {/* Bank account parameters for bride */}
                      <div className="border-t border-rose-100 pt-3 space-y-2">
                        <label className="text-xxs font-semibold text-rose-800 block">Tài Khoản Nhận Quà (Simulated)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Tên ngân hàng</label>
                            <input
                              type="text"
                              value={config.couple.bride.bankInfo.bankName}
                              onChange={(e) => updateConfig(["couple", "bride", "bankInfo", "bankName"], e.target.value)}
                              className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Số tài khoản</label>
                            <input
                              type="text"
                              value={config.couple.bride.bankInfo.accountNumber}
                              onChange={(e) => updateConfig(["couple", "bride", "bankInfo", "accountNumber"], e.target.value)}
                              className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Tên chủ thẻ (Viết liền hoa)</label>
                          <input
                            type="text"
                            value={config.couple.bride.bankInfo.accountName || "TRAN TUYET MAI"}
                            onChange={(e) => updateConfig(["couple", "bride", "bankInfo", "accountName"], e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* PANEL 3: Events & Love Story timeline */}
              {activeTab === "story" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Wedding date & location config */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                      📍 ĐỊA ĐIỂM & THỜI GIAN SỰ KIỆN
                    </h3>
                    
                    {config.events.map((evt, idx) => (
                      <div key={evt.id} className="p-3 bg-white rounded-lg border border-stone-200 space-y-2.5">
                        <div className="flex justify-between items-center bg-stone-50 px-2 py-1.5 rounded">
                          <span className="text-xs font-bold text-rose-600">{evt.name}</span>
                          <span className="text-xxs text-stone-400 font-mono">Index {idx}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div>
                            <label className="text-xxs text-stone-500 block mb-0.5">Tên buổi lễ</label>
                            <input
                              type="text"
                              value={evt.name}
                              onChange={(e) => {
                                const copy = [...config.events];
                                copy[idx].name = e.target.value;
                                updateConfig(["events"], copy);
                              }}
                              className="text-xs border border-stone-200 rounded px-2 py-1 w-full font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-xxs text-stone-500 block mb-0.5">Ngày tổ chức</label>
                            <input
                              type="date"
                              value={evt.date}
                              onChange={(e) => {
                                const copy = [...config.events];
                                copy[idx].date = e.target.value;
                                updateConfig(["events"], copy);
                              }}
                              className="text-xs border border-stone-200 rounded px-2 py-1 w-full font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xxs text-stone-500 block mb-0.5">Giờ hành lễ</label>
                            <input
                              type="time"
                              value={evt.time}
                              onChange={(e) => {
                                const copy = [...config.events];
                                copy[idx].time = e.target.value;
                                updateConfig(["events"], copy);
                              }}
                              className="text-xs border border-stone-200 rounded px-2 py-1 w-full font-mono"
                            />
                          </div>
                        </div>

                        {/* Venue details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xxs text-stone-500 block mb-0.5">Tên sảnh tiệc/Nhà</label>
                            <input
                              type="text"
                              value={evt.locationName || ""}
                              onChange={(e) => {
                                const copy = [...config.events];
                                copy[idx].locationName = e.target.value;
                                updateConfig(["events"], copy);
                              }}
                              className="text-xs border border-stone-200 rounded px-2 py-1 w-full text-stone-800 font-medium"
                              placeholder="Ví dụ: Tư gia nhà gái, Nhà hàng Melisa..."
                            />
                          </div>
                          <div>
                            <label className="text-xxs text-stone-500 block mb-0.5">Địa chỉ chi tiết</label>
                            <input
                              type="text"
                              value={evt.address || ""}
                              onChange={(e) => {
                                const copy = [...config.events];
                                copy[idx].address = e.target.value;
                                updateConfig(["events"], copy);
                              }}
                              className="text-xs border border-stone-200 rounded px-2 py-1 w-full text-stone-600"
                              placeholder="Số nhà, tên đường, phường, quận..."
                            />
                          </div>
                        </div>

                        {/* Google Maps Configuration Block */}
                        <MapSelector
                          locationName={evt.locationName || ""}
                          address={evt.address || ""}
                          mapEmbedUrl={evt.mapEmbedUrl || ""}
                          onMapEmbedUrlChange={(url) => {
                            const copy = [...config.events];
                            copy[idx].mapEmbedUrl = url;
                            updateConfig(["events"], copy);
                          }}
                          triggerToast={triggerToast}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Love story editor */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-3">
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2">
                      📖 CÁC CỘT MỐC TÌNH YÊU (LOVE STORY)
                    </h3>
                    
                    {/* List existing stories */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {config.couple.loveStory.length === 0 ? (
                        <p className="text-xs text-stone-400 italic py-2 text-center">Chưa có cột mốc tình yêu nào.</p>
                      ) : (
                        config.couple.loveStory.map((story) => (
                          <div key={story.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-stone-200 text-xs justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-stone-400 px-1.5 py-0.5 bg-stone-100 rounded text-xxs">{story.date}</span>
                              <span className="font-semibold text-stone-900 truncate">{story.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveStory(story.id)}
                              className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition-all"
                              title="Xoá cột mốc"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new story item form */}
                    <form onSubmit={handleAddStory} className="bg-stone-100 p-3 rounded-lg border border-stone-200 space-y-3">
                      <div className="font-semibold text-xxs text-stone-500 uppercase">Thêm cột mốc mới</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Tiêu đề (Ví dụ: Lần đầu gặp nhau)</label>
                          <input
                            type="text"
                            value={newStoryTitle}
                            onChange={(e) => setNewStoryTitle(e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full"
                            placeholder="Tiêu đề mốc"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Ngày diễn ra</label>
                          <input
                            type="date"
                            value={newStoryDate}
                            onChange={(e) => setNewStoryDate(e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Nội dung câu kể chuyện tình yêu</label>
                        <textarea
                          value={newStoryContent}
                          onChange={(e) => setNewStoryContent(e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full h-14 resize-none"
                          placeholder="Kể chi tiết ngọt ngào tại đây..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">URL ảnh minh họa</label>
                        <input
                          type="text"
                          value={newStoryImage}
                          onChange={(e) => setNewStoryImage(e.target.value)}
                          className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full font-mono text-[11px]"
                          placeholder="Link ảnh Unsplash hoặc CDN của bạn"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-stone-900 hover:bg-stone-850 text-white rounded py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tạo cột mốc này
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* PANEL 4: Image album gallery list */}
              {activeTab === "gallery" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-widest flex items-center justify-between border-b border-stone-200 pb-2">
                      <span>🖼️ DANH SÁCH ẢNH CƯỚI (ALBUM)</span>
                      <span className="text-xxs font-mono text-stone-400">({config.gallery.length} ảnh)</span>
                    </h3>

                    {/* Integrated direct file upload zone */}
                    <div className="bg-rose-50/30 border border-dashed border-rose-250 rounded-xl p-4 flex flex-col items-center justify-center text-center relative transition-all hover:bg-rose-50/50">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        id="photo-upload-input"
                        onChange={handleUploadPhotoFile}
                        disabled={isUploadingPhoto}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                        {isUploadingPhoto ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
                            <span className="text-xs font-semibold text-rose-700">Đang tải ảnh lên (Tối đa 10MB)...</span>
                            <span className="text-[10px] text-stone-500 font-medium font-sans">Vui lòng chờ trong giây lát</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-7 h-7 text-rose-600 animate-pulse" />
                            <span className="text-xs font-semibold text-stone-800">
                              Kéo thả hoặc nhấp để chọn ảnh cưới (.png, .jpg, .jpeg, .webp)
                            </span>
                            <span className="text-[10px] text-stone-500 max-w-sm font-sans">
                              Hoạt động trực tiếp với Supabase Storage bảo mật cao. Ảnh sẽ được hiển thị ngay.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {photoUploadError && (
                      <div className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{photoUploadError}</span>
                      </div>
                    )}

                    {/* Divisor with "OR" text */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-stone-200"></div>
                      <span className="flex-shrink mx-3 text-[10px] text-stone-400 uppercase font-bold tracking-wider">Hoặc nhập URL ảnh</span>
                      <div className="flex-grow border-t border-stone-200"></div>
                    </div>

                    {/* Image URL adding */}
                    <form onSubmit={handleAddPhoto} className="flex gap-2">
                      <input
                        type="text"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="text-xs border border-stone-200 bg-white rounded-lg px-2.5 py-1.5 flex-1 font-mono text-xxs"
                        placeholder="Dán URL ảnh cưới mới vào đây (https://...)"
                      />
                      <button
                        type="submit"
                        disabled={isUploadingPhoto}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Thêm
                      </button>
                    </form>

                    {/* Image grid in config with remove button */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 h-72 overflow-y-auto">
                      {config.gallery.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-xs text-stone-400 italic">
                          Chưa có ảnh cưới nào trong danh sách.
                        </div>
                      ) : (
                        config.gallery.map((url, index) => (
                          <div key={url + index} className="group relative aspect-video bg-stone-250 rounded-lg overflow-hidden border border-stone-250 shadow-sm">
                            <img
                              src={url}
                              alt={`Wedding grid ${index}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                                title="Xoá ảnh này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              #{index + 1}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 5: Block hierarchy sequencing order & RSVP customised questions */}
              {activeTab === "rsvp" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Block Order Sequence Organizer */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-205 space-y-3">
                      <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2 flex items-center justify-between">
                        <span>🗂️ THỨ TỰ HIỂN THỊ CÁC KHỐI</span>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono">JSON: blockOrder</span>
                      </h3>
                      <p className="text-xxs text-stone-500 leading-relaxed">
                        Bạn có thể trực tiếp kéo hoặc nhấn nút lên/xuống để thay đổi thứ tự xuất hiện của các phần trên website đám cưới.
                      </p>

                      <div className="space-y-1.5 pt-1">
                        {config.blockOrder.map((block, index) => {
                          const blockLabels: Record<string, string> = {
                            hero: "🌹 Khối Mở Đầu (Hero Banner + Đếm Ngược)",
                            couple: "💑 Khối Chú Rể - Cô Dâu & Tài Khoản Ngân Hàng",
                            story: "📖 Khối Câu Chuyện Tình Yêu",
                            events: "📍 Khối Địa Điểm Bản Đồ & Thời Gian",
                            gallery: "🖼️ Khối Thư Viện Album Ảnh Cưới",
                            rsvp: "💌 Khối Form Xác Nhận RSVP",
                            wishes: "✍️ Khối Lời Chúc & Sổ Lưu Bút"
                          };
                          return (
                            <div
                              key={block}
                              className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-stone-200 text-xs hover:border-zinc-350 transition-all"
                            >
                              <span className="font-medium text-stone-850 truncate">{blockLabels[block] || block}</span>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveBlock(index, "up")}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-stone-100 disabled:opacity-30 rounded transition-all text-stone-500"
                                  title="Di chuyển lên"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveBlock(index, "down")}
                                  disabled={index === config.blockOrder.length - 1}
                                  className="p-1 hover:bg-stone-100 disabled:opacity-30 rounded transition-all text-stone-500"
                                  title="Di chuyển xuống"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RSVP customized questionnaire builder */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-205 space-y-3">
                      <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2">
                        🎈 CÂU HỎI Form RSVP TÙY BIẾN
                      </h3>
                      
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-stone-500">Cho điền số lượng khách đi cùng?</label>
                        <input
                          type="checkbox"
                          checked={config.rsvpConfig.allowGuestCount}
                          onChange={(e) => updateConfig(["rsvpConfig", "allowGuestCount"], e.target.checked)}
                          className="w-3.5 h-3.5 accent-rose-600 rounded cursor-pointer"
                        />
                      </div>

                      {/* Display active custom questions */}
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                        {config.rsvpConfig.questions.length === 0 ? (
                          <div className="text-xxs text-stone-400 italic py-2 text-center">Chưa có câu hỏi tùy chỉnh nào. Các câu hỏi mặc định: Họ và tên, SĐT, Điểm tham dự.</div>
                        ) : (
                          config.rsvpConfig.questions.map((q) => (
                            <div key={q.id} className="bg-white p-2 rounded-lg border border-stone-180 flex justify-between items-center text-xs">
                              <div className="truncate">
                                <p className="font-semibold text-stone-900 truncate">{q.questionText}</p>
                                <span className="text-[9px] text-stone-400 font-mono italic">Kiểu: {q.type === "radio" ? "Trắc nghiệm" : "Tự do"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(q.id)}
                                className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded"
                                title="Xoá câu hỏi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add dynamic question form */}
                      <form onSubmit={handleAddQuestion} className="bg-stone-100 p-2.5 rounded-lg border border-stone-200 space-y-2.5">
                        <div className="text-[10px] font-bold text-stone-500 uppercase">Thêm câu hỏi mới</div>
                        
                        <div>
                          <input
                            type="text"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            className="text-xs border border-stone-200 bg-white rounded-lg px-2.5 py-1.5 w-full"
                            placeholder="Nội dung câu hỏi (VD: Bạn đi xe bus chứ?)"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <select
                              value={newQuestionType}
                              onChange={(e) => setNewQuestionType(e.target.value as "text" | "radio")}
                              className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full"
                            >
                              <option value="text">Nhập văn bản tự do</option>
                              <option value="radio">Chọn một lựa chọn (Radio)</option>
                            </select>
                          </div>
                          
                          {newQuestionType === "radio" && (
                            <div>
                              <input
                                type="text"
                                value={newQuestionOptions}
                                onChange={(e) => setNewQuestionOptions(e.target.value)}
                                className="text-xs border border-stone-200 bg-white rounded px-2 py-1 w-full"
                                placeholder="Cách nhau bằng dấu phẩy"
                                title="Ví dụ: Lựa chọn 1, Lựa chọn 2"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-stone-900 hover:bg-stone-850 text-white rounded py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi này
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* REAL-TIME RSVP LIST FROM SUPABASE (HOST VIEW) */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 mt-4 space-y-4 shadow-sm text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-rose-500" />
                          <span>DANH SÁCH KHÁCH XÁC NHẬN THỰC TẾ (SUPABASE)</span>
                        </h3>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {editingId 
                            ? "Cập nhật trực tiếp từ cơ sở dữ liệu Supabase." 
                            : "Hãy chọn/lưu một thiệp cưới cụ thể để xem danh sách khách từ database."}
                        </p>
                      </div>

                      {editingId && (
                        <button
                          type="button"
                          onClick={() => loadRealRsvpsForHost(editingId)}
                          disabled={isLoadingRealRsvps}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingRealRsvps ? "animate-spin" : ""}`} />
                          Tải lại
                        </button>
                      )}
                    </div>

                    {!editingId ? (
                      <div className="text-center py-6 text-xs text-stone-400 italic bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
                        Bạn đang xem bản Thử nghiệm (Sự kiện demo). Hãy "Lưu thiệp cưới" hoặc mở/chọn thiệp trong danh sách của bạn để xem số liệu RSVP thực tế của khách mời.
                      </div>
                    ) : isLoadingRealRsvps ? (
                      <div className="text-center py-8 text-xs text-stone-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                        Đang đồng bộ dữ liệu RSVP từ Supabase...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Aggregate metric cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100/80">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Sẽ tham dự</span>
                            <span className="text-xl font-bold text-emerald-800 font-mono block mt-1">
                              {realRsvps.filter(r => r.attendance === "yes").length} <span className="text-xs font-normal text-emerald-600">khách</span>
                            </span>
                          </div>
                          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100/80">
                            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Bận lỡ hẹn</span>
                            <span className="text-xl font-bold text-rose-800 font-mono block mt-1">
                              {realRsvps.filter(r => r.attendance === "no").length} <span className="text-xs font-normal text-rose-600">khách</span>
                            </span>
                          </div>
                          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100/80">
                            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Tổng số người sẽ đến</span>
                            <span className="text-xl font-bold text-amber-800 font-mono block mt-1">
                              {realRsvpTotalExpected} <span className="text-xs font-normal text-amber-600">người</span>
                            </span>
                          </div>
                        </div>

                        {/* Data table */}
                        {realRsvps.length === 0 ? (
                          <div className="text-center py-8 text-xs text-stone-400 italic bg-stone-50/40 rounded-lg">
                            Chưa có khách mời nào phản hồi RSVP cho thiệp cưới này.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-stone-150">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-stone-50 border-b border-stone-150 text-stone-600 font-bold">
                                  <th className="p-3">Tên khách</th>
                                  <th className="p-3">Số điện thoại</th>
                                  <th className="p-3">Trạng thái</th>
                                  <th className="p-3">Đi kèm</th>
                                  <th className="p-3">Khác</th>
                                  <th className="p-3 text-right">Ngày gửi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 text-stone-700">
                                {realRsvps.map((r, idx) => (
                                  <tr key={r.id || idx} className="hover:bg-stone-50/50">
                                    <td className="p-3 font-semibold text-stone-900">{r.guest_name}</td>
                                    <td className="p-3 font-mono text-stone-500">{r.phone || "—"}</td>
                                    <td className="p-3">
                                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        r.attendance === "yes" 
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-red-50 text-rose-700"
                                      }`}>
                                        {r.attendance === "yes" ? "Sẽ đến" : "Lỡ hẹn"}
                                      </span>
                                    </td>
                                    <td className="p-3 font-medium font-mono">{r.attendance === "yes" ? (r.guest_count || 1) : 0}</td>
                                    <td className="p-3 max-w-xs truncate text-[11px] text-stone-500">
                                      {r.answers && typeof r.answers === "object" ? (
                                        <div className="space-y-0.5 max-h-12 overflow-y-auto">
                                          {Object.entries(r.answers).map(([key, val]) => {
                                            const qText = config.rsvpConfig.questions.find(q => q.id === key)?.questionText || key;
                                            return (
                                              <div key={key}>
                                                <span className="font-medium text-stone-605">{qText}:</span> {String(val)}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : "—"}
                                    </td>
                                    <td className="p-3 text-right text-[10px] text-stone-400 font-mono">
                                      {r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : "Vừa xong"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Section 3: CODE OUTPUT / SQL GENERATOR PANELS */}
          <div id="section-export" className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Header tabs for code panel */}
            <div className="bg-stone-900 border-b border-stone-850 px-4 py-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex text-xs font-medium text-stone-400">
                <button
                  type="button"
                  onClick={() => setCodeTab("json")}
                  className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 transition-all ${
                    codeTab === "json" 
                      ? "border-rose-500 text-stone-100 bg-stone-850" 
                      : "border-transparent hover:text-stone-100 hover:bg-stone-850"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-rose-500" /> CẤU HÌNH JSON THIỆP
                </button>
                
                <button
                  type="button"
                  onClick={() => setCodeTab("sql_relational")}
                  className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 transition-all ${
                    codeTab === "sql_relational" 
                      ? "border-amber-500 text-stone-100 bg-stone-850" 
                      : "border-transparent hover:text-stone-100 hover:bg-stone-850"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-amber-500" /> SQL SUPABASE (Chuẩn Sạch)
                </button>
                
                <button
                  type="button"
                  onClick={() => setCodeTab("sql_simple")}
                  className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 transition-all ${
                    codeTab === "sql_simple" 
                      ? "border-amber-500 text-stone-100 bg-stone-850" 
                      : "border-transparent hover:text-stone-100 hover:bg-stone-850"
                  }`}
                >
                  SQL Gộp 1 Bảng
                </button>

                <button
                  type="button"
                  onClick={() => setCodeTab("guide")}
                  className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 transition-all ${
                    codeTab === "guide" 
                      ? "border-sky-500 text-stone-100 bg-stone-850" 
                      : "border-transparent hover:text-stone-100 hover:bg-stone-850"
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-sky-500" /> LƯU ĐỒ KẾT NỐI NEXT.JS
                </button>
              </div>

              {/* Copy action quick icon */}
              <button
                type="button"
                onClick={() => {
                  let copyContent = "";
                  if (codeTab === "json") copyContent = generatedJSONString;
                  else if (codeTab === "sql_relational") copyContent = MULTI_TABLE_SQL;
                  else if (codeTab === "sql_simple") copyContent = SINGLE_TABLE_SQL;
                  else copyContent = NEXTJS_GUIDE_MARKDOWN;
                  
                  copyToClipboard(copyContent, () => {
                    triggerToast("Đã sao chép vào bộ nhớ tạm thành công!");
                  });
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" /> Sao chép nhanh
              </button>
            </div>

            {/* Selected Code Viewer Terminal Container */}
            <div className="bg-stone-950 text-stone-100 p-4 md:p-5 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto">
              
              {codeTab === "json" && (
                <div>
                  <div className="text-[10px] text-rose-400 font-bold tracking-wider mb-2 uppercase">// JSON này lưu toàn bộ thay đổi của bạn trên form phía trên</div>
                  <pre className="whitespace-pre">{generatedJSONString}</pre>
                </div>
              )}

              {codeTab === "sql_relational" && (
                <div>
                  <div className="text-[10px] text-amber-400 font-bold tracking-wider mb-2 uppercase">// Sơ đồ nhiều bảng khuyên dùng giúp tối đa hiệu năng & tránh Race-conditions RLS</div>
                  <pre className="whitespace-pre text-stone-200 leading-relaxed font-mono">{MULTI_TABLE_SQL}</pre>
                </div>
              )}

              {codeTab === "sql_simple" && (
                <div>
                  <div className="text-[10px] text-amber-500 font-bold tracking-wider mb-2 uppercase">// Giải pháp gộp thông tin siêu tối giản trong 1 schema đơn</div>
                  <pre className="whitespace-pre text-stone-300 leading-relaxed font-mono">{SINGLE_TABLE_SQL}</pre>
                </div>
              )}

              {codeTab === "guide" && (
                <div className="text-stone-250 leading-relaxed whitespace-pre h-[300px]">
                  <div className="p-3.5 bg-sky-950/40 border border-sky-800/40 rounded-lg text-sky-200 text-xs mb-3 font-sans flex flex-col gap-1.5">
                    <span className="font-bold flex items-center gap-1 text-sm text-sky-100">
                      <BookOpen className="w-4 h-4" /> Tại sao nên chọn cấu trúc JSONB kết hợp SQL?
                    </span>
                    <span>1. <b>Tính Linh Hoạt Cực Cao:</b> Nhà phát hành thiệp cưới có thể thêm bớt màu sắc, danh sách bài hát hoặc trường tùy biến mà không cần chạy migration thay đổi cấu trúc bảng SQL (schema migration) mệt mỏi!</span>
                    <span>2. <b>Bảo Mật Cao:</b> Với Row-Level Security (RLS) của Supabase, bạn hoàn toàn có thể phân tách quyền: Khách chỉ được viết lời chúc (INSERT), còn Vợ Chồng mới có quyền Sửa/Xóa (UPDATE/DELETE).</span>
                  </div>
                  <div className="font-mono text-xs">{NEXTJS_GUIDE_MARKDOWN}</div>
                </div>
              )}

            </div>
          </div>

        </section>
        )}

        {/* Right column: LIVE WORKSPACE PREVIEW - Mocked Device Frame */}
        <section id="preview-workspace" className={`${guestViewMode ? "col-span-12 lg:col-span-12 landscape:col-span-12 bg-stone-950 flex justify-center h-screen" : "lg:col-span-5 landscape:col-span-5 bg-stone-200 flex flex-col lg:sticky landscape:sticky lg:top-[73px] landscape:top-[73px] lg:h-[calc(100vh-73px)] landscape:h-[calc(100vh-73px)]"} overflow-hidden transition-all duration-300`}>
          
          {/* Preview Navigation toolbar */}
          {!guestViewMode && (
            <div id="preview-toolbar" className="bg-white border-b border-stone-300 px-4 py-2.5 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-500" />
                Bảng Xem Trước Thời Gian Thực (Live Preview)
              </span>

              {/* Device Switch toggles */}
              <div className="flex rounded-md bg-stone-100 p-0.5 border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-3 py-1 rounded flex items-center gap-1 transition-all ${
                    previewDevice === "mobile" 
                      ? "bg-white text-stone-950 font-bold shadow-xs" 
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Di Động
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-3 py-1 rounded flex items-center gap-1 transition-all ${
                    previewDevice === "desktop" 
                      ? "bg-white text-stone-950 font-bold shadow-xs" 
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Toàn Màn Hình
                </button>
              </div>
            </div>
          )}

          {/* Interactive view container outer shell */}
          <div className={`flex-1 flex items-center justify-center relative ${
            guestViewMode 
              ? "bg-stone-950 p-0 overflow-hidden h-full w-full" 
              : "bg-stone-150 p-3 lg:overflow-hidden landscape:overflow-hidden overflow-y-auto h-full"
          }`}>
            
            {/* The Dynamic Simulated Smartphone Device Frame */}
            <div
              id="device-frame"
              className={`transition-all duration-300 bg-white relative overflow-hidden flex flex-col ${
                guestViewMode
                  ? "w-full max-w-lg h-full rounded-none border-none ring-0 shadow-none"
                  : previewDevice === "mobile"
                    ? "aspect-[375/812] h-full max-h-[calc(100vh-150px)] w-auto rounded-[38px] ring-12 ring-stone-900 ring-offset-1 border border-stone-350 shadow-2xl shrink-0"
                    : "w-full h-full rounded-none border border-stone-350"
              }`}
            >
              {/* Simulated camera notch for phone look */}
              {(!guestViewMode && previewDevice === "mobile") && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-stone-900 h-5 w-36 rounded-b-xl z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-stone-850 rounded-full border border-stone-700 mr-2"></div>
                  <div className="w-10 h-1 bg-stone-800 rounded-full"></div>
                </div>
              )}

              {/* Floating Sound Helix mini player widget inside the invitation view */}
              {config.music.enabled && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ backgroundColor: config.theme.primaryColor, color: "#ffffff" }}
                  className="absolute bottom-5 right-5 z-40 p-3 rounded-full shadow-2xl flex items-center justify-center animate-bounce hover:scale-110 active:scale-95 transition-all border border-white/20"
                  aria-label="Toggle âm nhạc"
                >
                  <Music className={`w-5 h-5 ${isPlaying ? "animate-spin" : ""}`} />
                </button>
              )}

              {/* The actual Invitation client layout viewport! It dynamically changes with the JSON state */}
              <div
                id="wedding-preview-scroller"
                className="flex-1 overflow-y-auto scroll-smooth flex flex-col bg-stone-50"
                style={{ backgroundColor: config.theme.backgroundColor, color: config.theme.textColor }}
              >
                <div 
                  className="flex flex-col flex-1 shrink-0 w-full"
                  style={(!guestViewMode && previewDevice === "mobile") ? {
                    zoom: 0.85,
                  } : undefined}
                >
                  {/* Dynamically sequence blocks based on user set "blockOrder" array */}
                  {config.blockOrder.map((blockName) => {
                  
                  // 1. HERO BANNER & COUNTDOWN BLOCK
                  if (blockName === "hero") {
                    return (
                      <div
                        key="block-hero"
                        id="block-hero"
                        className="relative min-h-[480px] flex flex-col items-center justify-center text-center p-6 bg-cover bg-center text-white overflow-hidden shrink-0 animate-fade-in"
                        style={{
                          backgroundImage: `linear-gradient(rgba(10,12,18,0.5), rgba(10,12,18,0.6)), url(${config.gallery[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80"})`
                        }}
                      >
                        {/* Elegant overlay geometric border frame with offsets */}
                        <div 
                          className="absolute inset-[15px] border-2 pointer-events-none z-10 opacity-80"
                          style={{ borderColor: config.theme.secondaryColor }}
                        ></div>
                        <div 
                          className="absolute inset-[20px] border pointer-events-none z-10 opacity-35 animate-pulse"
                          style={{ borderColor: config.theme.secondaryColor }}
                        ></div>

                        {/* Top corner geometric marks */}
                        <div className="absolute top-[25px] left-[25px] w-3 h-3 border-t border-l opacity-80 z-10" style={{ borderColor: config.theme.secondaryColor }}></div>
                        <div className="absolute top-[25px] right-[25px] w-3 h-3 border-t border-r opacity-80 z-10" style={{ borderColor: config.theme.secondaryColor }}></div>
                        <div className="absolute bottom-[25px] left-[25px] w-3 h-3 border-b border-l opacity-80 z-10" style={{ borderColor: config.theme.secondaryColor }}></div>
                        <div className="absolute bottom-[25px] right-[25px] w-3 h-3 border-b border-r opacity-80 z-10" style={{ borderColor: config.theme.secondaryColor }}></div>

                        <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-200 mb-2 relative z-10">
                          Thư Mời Lễ Thành Hôn
                        </p>
                        
                        {/* Dynamic font title custom styles applied */}
                        <h2 className={`${fontTitleClass()} text-white my-3 drop-shadow-lg relative z-10 font-medium break-words px-4 leading-normal`}>
                          {nfc(config.couple.groom.shortName)} <span className="text-[0.6em] inline-block align-middle font-serif italic mx-1 opacity-95">&amp;</span> {nfc(config.couple.bride.shortName)}
                        </h2>

                        <div className="w-16 h-0.5 my-3 relative z-10" style={{ backgroundColor: config.theme.secondaryColor }}></div>

                        {/* Event date formatted beautifully in preview */}
                        <p className="text-xs uppercase tracking-widest text-stone-100 font-sans font-semibold relative z-10">
                          {config.events[0]?.date ? new Date(config.events[0].date).toLocaleDateString("vi-VN", {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          }) : "31 Tháng 12, 2026"}
                        </p>
                        
                        <p className="text-xxs text-stone-300 mb-6 font-sans relative z-10">
                          TẠI {config.events[0]?.locationName?.toUpperCase() || "TƯ GIA NHÀ GÁI"}
                        </p>

                        {/* Interactive Countdown Timer - Geometric Balance Grid */}
                        <div className="grid grid-cols-4 gap-1.5 relative z-10 w-full max-w-[270px]">
                          <div className="flex flex-col bg-white/10 backdrop-blur-xs py-2 border border-white/20 rounded-none relative">
                            <span className="font-mono text-base font-bold text-white">{timeLeft.days}</span>
                            <span className="text-[8px] text-stone-200 uppercase font-sans tracking-wider font-semibold">Ngày</span>
                          </div>
                          <div className="flex flex-col bg-white/10 backdrop-blur-xs py-2 border border-white/20 rounded-none relative">
                            <span className="font-mono text-base font-bold text-white">{timeLeft.hours}</span>
                            <span className="text-[8px] text-stone-200 uppercase font-sans tracking-wider font-semibold">Giờ</span>
                          </div>
                          <div className="flex flex-col bg-white/10 backdrop-blur-xs py-2 border border-white/20 rounded-none relative">
                            <span className="font-mono text-base font-bold text-white">{timeLeft.minutes}</span>
                            <span className="text-[8px] text-stone-200 uppercase font-sans tracking-wider font-semibold">Phút</span>
                          </div>
                          <div className="flex flex-col bg-white/10 backdrop-blur-xs py-2 border border-white/20 rounded-none relative">
                            <span className="font-mono text-base font-bold text-white">{timeLeft.seconds}</span>
                            <span className="text-[8px] text-stone-200 uppercase font-sans tracking-wider font-semibold">Giây</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. COUPLE CARDS & TRUST BANK DETAILS BLOCK
                  if (blockName === "couple") {
                    return (
                      <div key="block-couple" id="block-couple" className="py-14 px-6 space-y-10 shrink-0 text-center relative bg-white">
                        {/* Decorative background grid pattern to emphasize geometric alignment */}
                        <div className="absolute inset-x-0 top-0 h-px bg-stone-200"></div>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-stone-200"></div>
                        
                        <div className="space-y-3">
                          <div className="inline-flex justify-center items-center gap-2 mb-1">
                            <div className="w-6 h-px" style={{ backgroundColor: config.theme.primaryColor }}></div>
                            <Heart className="w-4 h-4 opacity-80" style={{ color: config.theme.primaryColor }} />
                            <div className="w-6 h-px" style={{ backgroundColor: config.theme.primaryColor }}></div>
                          </div>
                          <h3 className={`${fontTitleClass()} font-normal`} style={{ color: config.theme.primaryColor }}>
                            Lễ Thành Hôn
                          </h3>
                          <p className="text-[9px] text-stone-500 max-w-xs mx-auto uppercase tracking-[0.25em] font-sans font-semibold">
                            Hai tâm hồn • Một nhịp đập tương lai
                          </p>
                        </div>

                        {/* Groom and Bride grid presentation with Architectural Geometric Frames */}
                        <div className="grid grid-cols-1 gap-10 max-w-sm mx-auto">
                          
                          {/* Groom section container - Sharp Offset Frame */}
                          <div 
                            className="bg-stone-50/50 p-6 rounded-none border border-stone-200 relative text-left"
                          >
                            {/* Accent indicator bar */}
                            <div className="absolute top-0 right-0 w-8 h-px" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                            <div className="absolute top-0 right-0 w-px h-8" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                            
                            <div className="flex items-start gap-4">
                              {/* Avatar wrapper with geometric golden line offset shadow */}
                              <div className="relative shrink-0">
                                <div className="absolute inset-0 border translate-x-[5px] translate-y-[5px]" style={{ borderColor: config.theme.secondaryColor }}></div>
                                <img
                                  src={config.couple.groom.avatar}
                                  alt={config.couple.groom.fullName}
                                  className="w-20 h-20 object-cover border border-stone-300 relative z-10 bg-white"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="space-y-1 flex-1">
                                <span className="text-[8px] uppercase tracking-widest font-sans font-bold text-stone-400">CHÚ RỂ</span>
                                <h4 className="font-serif font-bold text-stone-900 text-base leading-tight">{nfc(config.couple.groom.fullName)}</h4>
                                <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                                  Con ông: <b>{config.couple.groom.fatherName}</b> <br />
                                  Con bà: <b>{config.couple.groom.motherName}</b>
                                </p>
                              </div>
                            </div>
                            
                            {/* Stylised banking summary section */}
                            <div className="mt-4 pt-3 border-t border-stone-200/60">
                              <details className="group border border-stone-200 rounded-none overflow-hidden bg-white">
                                <summary style={{ color: config.theme.primaryColor }} className="text-[10px] font-bold p-2.5 cursor-pointer flex justify-between items-center bg-stone-50 hover:bg-stone-100 select-none">
                                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                                    <Gift className="w-3 h-3" /> Mừng cưới Chú Rể
                                  </span> 
                                  <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-all text-stone-400" />
                                </summary>
                                <div className="p-4 border-t border-stone-150 space-y-3 bg-stone-50/50 text-center">
                                  <p className="text-[10px] text-stone-500 font-sans italic">Hân hạnh đón nhận mọi chúc phúc chân thành</p>
                                  <div className="text-[10px] text-stone-600 font-mono bg-white p-3 border border-stone-200 inline-block text-left w-full space-y-2 relative">
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                      <span className="text-[7px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 font-sans font-bold flex items-center gap-0.5 select-none">
                                        <Shield className="w-2 h-2 text-emerald-600" /> An toàn
                                      </span>
                                    </div>
                                    <div>Ngân hàng: <b className="text-stone-800">{config.couple.groom.bankInfo.bankName}</b></div>
                                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                                      <span>Số TK: <b className="text-stone-950 font-bold tracking-wider">{maskSensitiveValue(config.couple.groom.bankInfo.accountNumber, revealGroomBank)}</b></span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setRevealGroomBank(!revealGroomBank)}
                                          className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-850 cursor-pointer rounded-xs"
                                          title={revealGroomBank ? "Ẩn số tài khoản" : "Hiện số tài khoản"}
                                        >
                                          {revealGroomBank ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            copyToClipboard(config.couple.groom.bankInfo.accountNumber, () => triggerToast("Đã sao chép Số tài khoản Chú Rể!"));
                                          }}
                                          className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-850 cursor-pointer rounded-xs"
                                          title="Sao chép số tài khoản"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div>Chủ TK: <b className="text-stone-900">{config.couple.groom.bankInfo.accountName || "NGUYEN VAN HUNG"}</b></div>
                                  </div>
                                  <div className="relative inline-block border p-1 bg-white">
                                    <img
                                      src={config.couple.groom.bankInfo.qrUrl}
                                      alt="QR Chú Rể"
                                      className="w-24 h-24 object-cover mx-auto"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 border border-stone-300 opacity-20 pointer-events-none"></div>
                                  </div>
                                </div>
                              </details>
                            </div>
                          </div>

                          {/* Bride section container - Sharp Offset Frame */}
                          <div 
                            className="bg-stone-50/50 p-6 rounded-none border border-stone-200 relative text-left"
                          >
                            {/* Accent indicator bar */}
                            <div className="absolute top-0 right-0 w-8 h-px" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                            <div className="absolute top-0 right-0 w-px h-8" style={{ backgroundColor: config.theme.secondaryColor }}></div>

                            <div className="flex items-start gap-4">
                              {/* Avatar wrapper with geometric golden line offset shadow */}
                              <div className="relative shrink-0">
                                <div className="absolute inset-0 border translate-x-[5px] translate-y-[5px]" style={{ borderColor: config.theme.secondaryColor }}></div>
                                <img
                                  src={config.couple.bride.avatar}
                                  alt={config.couple.bride.fullName}
                                  className="w-20 h-20 object-cover border border-stone-300 relative z-10 bg-white"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="space-y-1 flex-1">
                                <span className="text-[8px] uppercase tracking-widest font-sans font-bold text-stone-400">CÔ DÂU</span>
                                <h4 className="font-serif font-bold text-stone-900 text-base leading-tight">{nfc(config.couple.bride.fullName)}</h4>
                                <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                                  Con ông: <b>{config.couple.bride.fatherName}</b> <br />
                                  Con bà: <b>{config.couple.bride.motherName}</b>
                                </p>
                              </div>
                            </div>
                            
                            {/* Stylised banking summary section for bride */}
                            <div className="mt-4 pt-3 border-t border-stone-200/60">
                              <details className="group border border-stone-200 rounded-none overflow-hidden bg-white">
                                <summary style={{ color: config.theme.primaryColor }} className="text-[10px] font-bold p-2.5 cursor-pointer flex justify-between items-center bg-stone-50 hover:bg-stone-100 select-none">
                                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                                    <Gift className="w-3 h-3" /> Mừng cưới Cô Dâu
                                  </span> 
                                  <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-all text-stone-400" />
                                </summary>
                                <div className="p-4 border-t border-stone-150 space-y-3 bg-stone-50/50 text-center">
                                  <p className="text-[10px] text-stone-500 font-sans italic">Hân hạnh đón nhận mọi chúc phúc chân thành</p>
                                  <div className="text-[10px] text-stone-600 font-mono bg-white p-3 border border-stone-200 inline-block text-left w-full space-y-2 relative">
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                      <span className="text-[7px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 font-sans font-bold flex items-center gap-0.5 select-none">
                                        <Shield className="w-2 h-2 text-emerald-600" /> An toàn
                                      </span>
                                    </div>
                                    <div>Ngân hàng: <b className="text-stone-800">{config.couple.bride.bankInfo.bankName}</b></div>
                                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                                      <span>Số TK: <b className="text-stone-950 font-bold tracking-wider">{maskSensitiveValue(config.couple.bride.bankInfo.accountNumber, revealBrideBank)}</b></span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setRevealBrideBank(!revealBrideBank)}
                                          className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-850 cursor-pointer rounded-xs"
                                          title={revealBrideBank ? "Ẩn số tài khoản" : "Hiện số tài khoản"}
                                        >
                                          {revealBrideBank ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            copyToClipboard(config.couple.bride.bankInfo.accountNumber, () => triggerToast("Đã sao chép Số tài khoản Cô Dâu!"));
                                          }}
                                          className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-850 cursor-pointer rounded-xs"
                                          title="Sao chép số tài khoản"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div>Chủ TK: <b className="text-stone-900">{config.couple.bride.bankInfo.accountName || "TRAN TUYET MAI"}</b></div>
                                  </div>
                                  <div className="relative inline-block border p-1 bg-white">
                                    <img
                                      src={config.couple.bride.bankInfo.qrUrl}
                                      alt="QR Cô Dâu"
                                      className="w-24 h-24 object-cover mx-auto"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 border border-stone-300 opacity-20 pointer-events-none"></div>
                                  </div>
                                </div>
                              </details>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  }

                  // 3. EVENTS TIMES & ADDRESS DETAILS BLOCK
                  if (blockName === "events") {
                    return (
                      <div key="block-events" id="block-events" className="py-14 px-6 bg-stone-50 text-center space-y-8 shrink-0 relative">
                        {/* Architectural background lines */}
                        <div className="absolute inset-y-0 left-6 w-px bg-stone-200/40 pointer-events-none"></div>
                        <div className="absolute inset-y-0 right-6 w-px bg-stone-200/40 pointer-events-none"></div>

                        <div className="space-y-2 relative z-10">
                          <h3 className={`${fontTitleClass()} font-normal`} style={{ color: config.theme.primaryColor }}>
                            Lịch Tổ Chức Cưới
                          </h3>
                          <div className="w-16 h-px mx-auto" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                        </div>

                        <div className="space-y-8 max-w-sm mx-auto relative z-10">
                          {config.events.map((evt) => (
                            <div key={evt.id} className="bg-white p-6 rounded-none border border-stone-200 shadow-xs text-center relative overflow-hidden">
                              {/* Thin continuous secondary accent border inside */}
                              <div className="absolute inset-1.5 border pointer-events-none opacity-40" style={{ borderColor: config.theme.secondaryColor }}></div>

                              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] px-3 py-1 border rounded-none text-stone-700 bg-stone-50 inline-block mb-4" style={{ borderColor: config.theme.primaryColor + '20' }}>
                                {nfc(evt.name)}
                              </span>
                              
                              <p className="text-lg font-bold text-stone-900 font-serif leading-tight">
                                {nfc(evt.time)} • {evt.date ? new Date(evt.date).toLocaleDateString("vi-VN", {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                }) : "10/10/2026"}
                              </p>

                              <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-1 mb-4">
                                PHÒNG SẢNH: <b>{nfc(evt.locationName)}</b>
                              </p>

                              <p className="text-xs text-stone-600 px-2 leading-relaxed flex items-center justify-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                {nfc(evt.address)}
                              </p>

                              {/* Interactive Google Map Simulation Iframe - Geometric Border Frame */}
                              <div className="mt-5 rounded-none overflow-hidden border border-stone-200 aspect-video relative bg-stone-50">
                                <iframe
                                  title={`Bản đồ ${evt.name}`}
                                  src={evt.mapEmbedUrl}
                                  className="w-full h-full border-0 absolute inset-0"
                                  allowFullScreen
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 4. LOVE STORY TIMELINE BLOCK
                  if (blockName === "story") {
                    return (
                      <div key="block-story" id="block-story" className="py-14 px-6 shrink-0 text-center space-y-8 bg-white relative">
                        <div className="absolute inset-x-0 bottom-0 h-px bg-stone-200"></div>

                        <div className="space-y-2">
                          <h3 className={`${fontTitleClass()}`} style={{ color: config.theme.primaryColor }}>
                            Hành Trình Tình Yêu
                          </h3>
                          <p className="text-[9px] text-stone-400 uppercase tracking-[0.25em] font-sans font-semibold">
                            Khi duyên số dẫn lối cho hai ta
                          </p>
                        </div>

                        {/* Stories timeline presentation list - Diamond/Square structural dots */}
                        <div className="space-y-10 max-w-sm mx-auto text-left relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-stone-300">
                          {config.couple.loveStory.map((story) => (
                            <div key={story.id} className="relative pl-8 space-y-3">
                              {/* Glowing timeline square dot indicator */}
                              <span className="absolute left-[10px] top-2 h-2.5 w-2.5 rotate-45 bg-white border flex items-center justify-center z-10" style={{ borderColor: config.theme.primaryColor }}>
                                <span className="h-1 w-1 bg-amber-600"></span>
                              </span>

                              <div className="text-[10px] font-mono font-bold" style={{ color: config.theme.primaryColor }}>
                                {story.date ? new Date(story.date).toLocaleDateString("vi-VN", {
                                  month: 'short', year: 'numeric', day: '2-digit'
                                }) : ""}
                              </div>
                              
                              <h4 className="text-xs font-bold text-stone-900 leading-tight">{nfc(story.title)}</h4>
                              
                              {/* Aspect-video story preview image - Geometric Style */}
                              {story.image && (
                                <div className="relative">
                                  <div className="absolute inset-0 border translate-x-1.5 translate-y-1.5 opacity-60" style={{ borderColor: config.theme.secondaryColor }}></div>
                                  <img
                                    src={story.image}
                                    alt={story.title}
                                    className="w-full h-28 object-cover rounded-none border border-stone-200 relative z-10 bg-white"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              
                              <p className={`${fontBodyClass()} text-stone-500 text-xxs leading-relaxed`}>
                                {nfc(story.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 5. ALBUM PHOTO GALLERY GRID BLOCK
                  if (blockName === "gallery") {
                    return (
                      <div key="block-gallery" id="block-gallery" className="py-14 px-6 bg-stone-50 shrink-0 text-center space-y-8 relative">
                        <div className="absolute inset-y-0 left-6 w-px bg-stone-200/40 pointer-events-none"></div>
                        <div className="absolute inset-y-0 right-6 w-px bg-stone-200/40 pointer-events-none"></div>

                        <div className="space-y-2 relative z-10">
                          <h3 className={`${fontTitleClass()} font-normal`} style={{ color: config.theme.primaryColor }}>
                            Khoảnh Khắc Kỷ Niệm
                          </h3>
                          <div className="w-16 h-px mx-auto" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                          <p className="text-[9px] text-stone-400 uppercase tracking-widest">
                            Album ảnh cưới đương đại kết nối yêu thương
                          </p>
                        </div>

                        {/* Beautiful photo grid - Symmetrical minimalist borders */}
                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto relative z-10">
                          {config.gallery.map((url, idx) => (
                            <div
                              key={url + idx}
                              onClick={() => setActiveLightboxImg(url)}
                              className="aspect-square bg-stone-100 rounded-none overflow-hidden border border-stone-200 cursor-pointer relative group"
                            >
                              {/* Inside decorative frame frame */}
                              <div className="absolute inset-1.5 border border-white/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                              <img
                                src={url}
                                alt={`Grid image ${idx}`}
                                className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-[1.05]"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 6. FORM RSVP SUBMISSION SIMULATOR BLOCK
                  if (blockName === "rsvp") {
                    return (
                      <div key="block-rsvp" id="block-rsvp" className="py-14 px-6 bg-white shrink-0 text-center relative border-t border-stone-200/80">
                        <div className="max-w-sm mx-auto bg-[#faf9f5] p-6 rounded-none border border-stone-300 relative text-left space-y-5">
                          {/* Inner geometric accent ring */}
                          <div className="absolute inset-1 border pointer-events-none opacity-20" style={{ borderColor: config.theme.secondaryColor }}></div>
                          <div className="absolute top-[2px] left-[2px] right-[2px] h-[3px] opacity-80" style={{ backgroundColor: config.theme.secondaryColor }}></div>

                          <div className="text-center space-y-2">
                            <h3 className={`${fontTitleClass()} text-xl font-normal`} style={{ color: config.theme.primaryColor }}>
                              Xác Nhận Tham Dự
                            </h3>
                            <div className="w-8 h-px bg-stone-300 mx-auto"></div>
                            <p className="text-[9px] text-stone-500 uppercase tracking-widest font-sans font-semibold leading-relaxed">
                              Vui lòng phản hồi trước ngày tổ chức để chúng tôi tiện đón tiếp chu đáo nhất.
                            </p>
                          </div>

                          {/* Live Interactive RSVP Form for simulation */}
                          <form onSubmit={submitSimulatedRSVP} className="space-y-4 pt-1 text-stone-800 relative z-10">
                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-600 block mb-1">Tên của bạn*</label>
                              <input
                                type="text"
                                required
                                value={rsvpGuestName}
                                onChange={(e) => setRsvpGuestName(e.target.value)}
                                className="text-xs border border-stone-200 bg-white rounded-none px-2.5 py-2 w-full focus:bg-white focus:ring-1 focus:ring-stone-400 focus:outline-none font-medium"
                                placeholder="Nhập tên khách tham dự"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-600 block mb-1">Số điện thoại</label>
                              <input
                                type="tel"
                                value={rsvpPhone}
                                onChange={(e) => setRsvpPhone(e.target.value)}
                                className="text-xs border border-stone-200 bg-white rounded-none px-2.5 py-2 w-full focus:bg-white focus:ring-1 focus:ring-stone-400 focus:outline-none font-mono"
                                placeholder="Nhập số điện thoại của bạn"
                              />
                            </div>

                            {/* Attending selection */}
                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-bold text-stone-600 block mb-1">Tham gia chung vui?</label>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <label className={`flex items-center justify-center p-2.5 rounded-none border cursor-pointer font-medium transition-all ${
                                  rsvpAttendance === "yes" 
                                    ? "bg-stone-900 border-stone-900 text-white font-semibold" 
                                    : "bg-white border-stone-200 hover:bg-stone-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="attendance"
                                    value="yes"
                                    checked={rsvpAttendance === "yes"}
                                    onChange={() => setRsvpAttendance("yes")}
                                    className="sr-only"
                                  />
                                  <span>Sẽ đến 🎉</span>
                                </label>

                                <label className={`flex items-center justify-center p-2.5 rounded-none border cursor-pointer font-medium transition-all ${
                                  rsvpAttendance === "no" 
                                    ? "bg-amber-800 border-amber-800 text-white font-semibold" 
                                    : "bg-white border-stone-200 hover:bg-stone-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="attendance"
                                    value="no"
                                    checked={rsvpAttendance === "no"}
                                    onChange={() => {
                                      setRsvpAttendance("no");
                                      setRsvpGuestCount(0);
                                    }}
                                    className="sr-only"
                                  />
                                  <span>Lỡ hẹn mất rồi 🥺</span>
                                </label>
                              </div>
                            </div>

                            {/* Allow companion counts? */}
                            {config.rsvpConfig.allowGuestCount && rsvpAttendance === "yes" && (
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-bold text-stone-600 block mb-1">Số lượng người tham gia đi cùng</label>
                                <select
                                  value={rsvpGuestCount}
                                  onChange={(e) => setRsvpGuestCount(Number(e.target.value))}
                                  className="text-xs border border-stone-200 bg-white rounded-none px-2 py-2 w-full font-bold focus:outline-none"
                                >
                                  <option value={1}>Mình tôi tham gia (1 người)</option>
                                  <option value={2}>Cặp đôi (2 người)</option>
                                  <option value={3}>Gia đình (3 người)</option>
                                  <option value={4}>Đại gia đình (4+ người)</option>
                                </select>
                              </div>
                            )}

                            {/* Custom dynamic questions created on the fly rendering */}
                            {config.rsvpConfig.questions.map((qs) => (
                              <div key={qs.id} className="pt-1.5">
                                <label className="text-[9px] uppercase tracking-wider font-bold text-stone-600 block mb-1">{qs.questionText}</label>
                                
                                {qs.type === "text" ? (
                                  <input
                                    type="text"
                                    value={rsvpReplies[qs.id] || ""}
                                    onChange={(e) => setRsvpReplies({ ...rsvpReplies, [qs.id]: e.target.value })}
                                    className="text-xs border border-stone-200 bg-white rounded-none px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-stone-400"
                                    placeholder="Trả lời câu hỏi..."
                                  />
                                ) : (
                                  <div className="flex flex-col gap-1 text-xs">
                                    {qs.options?.map((opt) => (
                                      <label key={opt} className="flex items-center gap-1.5 bg-white border border-stone-150 hover:bg-stone-50 p-2 rounded-none cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`qs_${qs.id}`}
                                          value={opt}
                                          checked={rsvpReplies[qs.id] === opt}
                                          onChange={() => setRsvpReplies({ ...rsvpReplies, [qs.id]: opt })}
                                          className="accent-stone-950 w-3.5 h-3.5"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}

                            {isSubmittingRsvp && (
                              <div className="text-stone-500 text-[10px] text-center italic py-1 animate-pulse">
                                Đang gửi lời xác nhận của bạn, vui lòng đợi...
                              </div>
                            )}

                            {rsvpSubmitStatus && (
                              <div className={`p-3 text-xxs border ${
                                rsvpSubmitStatus.success 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-rose-50 border-rose-200 text-rose-800 font-medium"
                              }`}>
                                {rsvpSubmitStatus.message}
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={isSubmittingRsvp}
                              style={{ backgroundColor: config.theme.primaryColor }}
                              className="w-full text-white text-xs font-bold py-2.5 px-4 rounded-none uppercase tracking-wider transition-all hover:bg-opacity-95 shadow-none active:translate-y-px mt-3 cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingRsvp ? "Đang gửi..." : "Gửi Xác Nhận Ngay"}
                            </button>
                          </form>

                          {/* Simulation Result Counter to see the inputs working */}
                          {simulatedRSVPs.length > 0 && (
                            <div className="bg-stone-900 text-stone-100 p-3.5 rounded-none text-xxs mt-4 space-y-1.5 border border-stone-850">
                              <div className="font-bold uppercase tracking-widest flex items-center gap-1 text-amber-500">
                                <Check className="w-3.5 h-3.5" /> ĐÃ GỬI THÀNH CÔNG (GIẢ LẬP):
                              </div>
                              <div className="max-h-20 overflow-y-auto divide-y divide-stone-800">
                                {simulatedRSVPs.map((r) => (
                                  <div key={r.id} className="py-1 text-stone-300">
                                    • {r.guestName} <span className="text-stone-500">({r.attendance === "yes" ? `tham dự ${r.guestCount} người` : "lỡ hẹn"})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 7. GUEST wishes / GUEST LABELS GUESTBOOK BLOCK
                  if (blockName === "wishes") {
                    return (
                      <div key="block-wishes" id="block-wishes" className="py-14 px-6 bg-white shrink-0 text-center space-y-8 relative">
                        <div className="space-y-2">
                          <h3 className={`${fontTitleClass()}`} style={{ color: config.theme.primaryColor }}>
                            Sổ Lưu Bút Lời Chúc
                          </h3>
                          <div className="w-16 h-px mx-auto" style={{ backgroundColor: config.theme.secondaryColor }}></div>
                          <p className="text-[9px] text-stone-400 uppercase tracking-widest leading-relaxed">
                            Hãy gửi lời chúc ngọt ngào nhất tới đôi bạn cưới nhé
                          </p>
                        </div>

                        <div className="max-w-sm mx-auto">
                          <Guestbook
                            invitationId={guestInvitationId || editingId || "demo-invitation-id"}
                            primaryColor={config.theme.primaryColor}
                            secondaryColor={config.theme.secondaryColor}
                            fontTitleClass={fontTitleClass()}
                            isOwner={!guestViewMode || (user !== null && userInvitations.some(inv => inv.id === guestInvitationId))}
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Footer Section in Invitation */}
                <footer className="py-10 text-center space-y-2 border-t border-stone-150 shrink-0 select-none">
                  <p className={`${fontTitleClass()} text-xl`} style={{ color: config.theme.primaryColor }}>
                    Cám Ơn Quý Khách!
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Powered by Supabase Wedding JSON Engine • 2026
                  </p>
                </footer>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* SUPABASE AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* SECURE BACKGROUND MUSIC CONTROL FOR GUESTS (NON-DOWNLOADABLE STREAM PLAYER) */}
      {guestViewMode && config.music.enabled && (
        <BackgroundMusic
          audioUrl={config.music.url}
          title={config.music.title}
          enabled={config.music.enabled}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          audioRef={audioRef}
        />
      )}

      {/* CREATE WEDDING INVITATION WIZARD MODAL */}
      {isCreateModalOpen && (
        <div
          id="create-invitation-modal"
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-scale-up flex flex-col text-stone-800">
            {/* Modal Header */}
            <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between border-b border-stone-800">
              <span className="font-bold text-sm tracking-wide flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                {editingId ? "CẬP NHẬT CẤU HÌNH THIỆP CƯỚI" : "DỊCH VỤ KÍCH HOẠT THIỆP CƯỚI 0Đ ONLINE"}
              </span>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-white transition-all text-sm font-bold"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Modal Content depending on step */}
            <div className="p-6 flex-1 space-y-4">
              
              {creationStep === "setup" && (
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border flex gap-2 text-xs ${editingId ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    {editingId ? (
                      <RefreshCw className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5 animate-spin-slow" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <div>
                      {editingId ? (
                        <>Bạn đang lưu cập nhật thiết kế hôm nay cho thiệp cưới có mã <b>{editingId.substring(0, 8)}...</b> trên đường dẫn: <b>/{slug}</b>.</>
                      ) : (
                        <>Hệ thống tự động biên dịch thiết kế hôm nay (màu <b>{config.theme.primaryColor}</b>, font {config.theme.titleFont}) thành một website thiệp cưới độc lập tốc độ cao.</>
                      )}
                    </div>
                  </div>

                  {/* Slug Configuration card with custom dynamic input cleanup */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                      Đường dẫn thiệp cưới của bạn (Slug):
                    </label>
                    <div className="flex items-center rounded-lg border border-stone-300 overflow-hidden shadow-xs bg-stone-50 font-medium">
                      <span className="bg-stone-150 px-3 py-2 text-stone-500 text-xs select-none">
                        `${window.location.origin}/`
                      </span>
                      <input
                        type="text"
                        value={slug}
                        required
                        disabled={!!editingId}
                        onChange={(e) => {
                          const cleaned = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "") // remove spaces, accents, special chars
                            .slice(0, 40);
                          setSlug(cleaned);
                        }}
                        className={`bg-white flex-1 text-xs px-2.5 py-2 font-mono text-stone-900 border-0 focus:outline-none focus:ring-0 ${editingId ? 'bg-stone-100 text-stone-400 cursor-not-allowed font-semibold' : ''}`}
                        placeholder="ten-co-dau-chu-re"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 leading-relaxed block italic">
                      {editingId ? (
                        <span className="text-emerald-700 font-medium font-sans">⚠️ Đường dẫn (slug) được giữ cố định khi sửa thiệp cưới để đảm bảo liên kết trước đó không bị lỗi.</span>
                      ) : (
                        <>Viết liền không dấu, không khoảng trắng (Ví dụ: <b>{config.couple.groom.shortName.toLowerCase()}-{config.couple.bride.shortName.toLowerCase()}-2026</b>)</>
                      )}
                    </span>
                  </div>

                  {/* Feature toggles verification */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-2.5">
                    <div className="text-[11px] text-stone-500 uppercase tracking-widest font-bold">TÓM TẮT DỮ LIỆU ĐĂNG KÝ:</div>
                    <div className="grid grid-cols-2 gap-2 font-medium text-stone-700">
                      <div>Chú rể: <b className="text-stone-950 font-bold">{config.couple.groom.fullName}</b></div>
                      <div>Cô dâu: <b className="text-stone-950 font-bold">{config.couple.bride.fullName}</b></div>
                      <div>Preset giao diện: <b className="text-stone-900 uppercase font-mono text-[10px]">{activePresetKey}</b></div>
                      <div>Bài hát: <b className="text-stone-900">{config.music.enabled ? config.music.songTitle : "Tắt nhạc nền"}</b></div>
                    </div>
                    <div className="w-full h-px bg-stone-200 my-2"></div>
                    <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-3.5 h-3.5 accent-rose-600 rounded"
                      />
                      <span>Đồng bộ và kích hoạt Row-Level Security (RLS) để nhận lời chúc từ khách</span>
                    </label>
                  </div>

                  {/* Trigger Action */}
                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 text-xs font-semibold py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-250 rounded-lg transition-all"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="button"
                      onClick={handleStartPublish}
                      className={`flex-1 text-xs font-bold py-2.5 text-white rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 ${
                        editingId 
                          ? "bg-emerald-600 hover:bg-emerald-750" 
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {editingId ? (
                        <>
                          <RefreshCw className="w-4 h-4 text-emerald-100" />
                          <span>Lưu & Cập Nhật</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>Kích Hoạt Live Thiệp</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {creationStep === "creating" && (
                <div className="space-y-5 py-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                    <div className="text-xs text-stone-500 font-medium">Hệ thống đang biên dịch cấu hình và đồng bộ hóa...</div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold font-mono text-zinc-500">
                      <span>TIẾN ĐỘ THIẾT LẬP:</span>
                      <span>{creationProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className="bg-rose-600 h-full transition-all duration-300"
                        style={{ width: `${creationProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Emulated database creation server terminals log summary */}
                  <div className="bg-stone-950 p-4 rounded-xl font-mono text-[10px] text-emerald-400 h-40 overflow-y-auto space-y-1.5 border border-stone-800 shadow-inner">
                    {creationLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed">
                        <span className="text-stone-500 select-none mr-1.5">$ supabase-cli:</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {creationStep === "success" && (
                <div className="space-y-5 py-2 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-6 h-6 text-emerald-600 stroke-[3px]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">KÍCH HOẠT THIỆP CỦA BẠN THÀNH CÔNG!</h3>
                    <p className="text-xs text-stone-500 mt-1">Đường dẫn live và tệp HTML tĩnh tự chạy đã sẵn sàng sử dụng.</p>
                  </div>

                  {/* Interactive Generated URL Container */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 max-w-md mx-auto text-left">
                    <div className="text-[10px] font-bold text-stone-400 uppercase font-mono tracking-wider">ĐƯỜNG DẪN THIỆP TRỰC TUYẾN:</div>
                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-stone-250 text-xs font-mono">
                      <span className="text-rose-600 font-semibold truncate select-all">
                        `${window.location.origin}/${slug}`
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(`${window.location.origin}/${slug}`, () => triggerToast("Đã sao chép link!"));
                        }}
                        className="text-stone-500 hover:text-stone-900 font-sans font-semibold pl-2 shrink-0 transition-all cursor-pointer text-xxs border-l border-stone-200 uppercase"
                      >
                        Sao chép
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed">
                      💡 Bạn có thể dán đường dẫn này lên Story Facebook, Zalo, gửi Messenger cho bạn bè xem trước hoặc lưu cấu hình về hệ thống quản lý.
                    </p>
                  </div>

                  <div className="w-full h-px bg-stone-200"></div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setGuestViewMode(true);
                        setIsCreateModalOpen(false);
                        triggerToast("Đã mở chế độ Khách Mời!");
                      }}
                      className="text-xs font-bold py-2.5 px-3.5 bg-stone-900 hover:bg-stone-850 text-white rounded-lg transition-all flex items-center justify-center gap-1 hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem Thực Tế (Guest View)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDownloadHTML}
                      className="text-xs font-bold py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center justify-center gap-1 hover:shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải HTML Tự Chạy</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-full text-xs font-medium py-1.5 hover:bg-stone-50 text-stone-500 border border-transparent hover:border-stone-200 rounded-lg transition-all mt-1"
                  >
                    Đóng bảng xuất bản
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX LAYOUT SIMULATION FOR CARD IMAGES */}
      {activeLightboxImg && (
        <div
          id="lightbox-overlay"
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black border border-stone-800 animate-scale-up">
            <img
              src={activeLightboxImg}
              alt="Preview lightbox"
              className="object-contain max-h-[80vh] mx-auto w-full"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 font-sans">
              Bấm ra ngoài để quay lại
            </div>
          </div>
        </div>
      )}

      {/* Global, Secure HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={config.music.url}
        loop
      />

    </div>
  );
}
