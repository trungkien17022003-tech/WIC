import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { MessageSquare, RefreshCw, User, Users, Heart, CheckCircle2, AlertCircle, Edit2, Trash2, RotateCcw } from "lucide-react";

interface Wish {
  id: string;
  invitation_id: string;
  guest_name: string;
  relationship: string;
  message: string;
  created_at: string;
}

interface DeletedWish {
  id: string;
  invitation_id: string;
  guest_name: string;
  relationship: string;
  message: string;
  created_at: string;
  deleted_at: string;
}

interface GuestbookProps {
  invitationId: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontTitleClass?: string;
  isOwner?: boolean;
}

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const getRemainingTime = (deletedAt: string) => {
  const deletedTime = new Date(deletedAt).getTime();
  const expiryTime = deletedTime + 7 * 24 * 60 * 60 * 1000;
  const remainingMs = expiryTime - Date.now();
  if (remainingMs <= 0) return "Đã hết hạn khôi phục";
  
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  if (remainingDays >= 1) return `Còn lại ${remainingDays} ngày`;
  
  const remainingHours = Math.max(1, Math.floor(remainingMs / (60 * 60 * 1000)));
  return `Còn lại ${remainingHours} giờ`;
};

const DUMMY_UUID = "00000000-0000-0000-0000-000000000000";

export default function Guestbook({
  invitationId,
  primaryColor = "#079e0a",
  secondaryColor = "#f1d209",
  fontTitleClass = "font-serif text-3xl font-semibold",
  isOwner = false
}: GuestbookProps) {
  // Local storage key based on current invitation
  const effectiveId = invitationId || "demo-invitation-id";
  const localStorageKey = `user_wish_id_${effectiveId}`;

  // Query states
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [guestName, setGuestName] = useState("");
  const [relationship, setRelationship] = useState("friend");
  const [message, setMessage] = useState("");
  const [userWishId, setUserWishId] = useState<string | null>(null);

  // Soft delete state
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [deletedWishes, setDeletedWishes] = useState<DeletedWish[]>([]);

  // Trigger brief alert toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Fetch entire wishes list
  const loadAllWishes = async () => {
    setIsLoading(true);
    try {
      if (!isUUID(effectiveId)) {
        // Mode A: Offline/Demo. Read mock list from localStorage
        const stored = localStorage.getItem(`mock_wishes_list_${effectiveId}`);
        if (stored) {
          setWishes(JSON.parse(stored));
        } else {
          // Clear demo wishes so the guest list starts completely fresh
          const initialWishes: Wish[] = [];
          localStorage.setItem(`mock_wishes_list_${effectiveId}`, JSON.stringify(initialWishes));
          setWishes(initialWishes);
        }
      } else {
        // Mode B: Real Supabase interaction
        const { data, error } = await supabase
          .from("wishes")
          .select("*")
          .eq("invitation_id", effectiveId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setWishes(data || []);
      }
    } catch (err: any) {
      console.error("Lỗi fetch wishes:", err);
      showToast(err.message || "Không thể tải danh sách lời chúc.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch specific user wish if ID is saved in localStorage
  const loadUserWishData = async (wishId: string) => {
    if (!isUUID(effectiveId)) {
      // Offline mode check
      const stored = localStorage.getItem(`mock_wishes_list_${effectiveId}`);
      if (stored) {
        const list: Wish[] = JSON.parse(stored);
        const match = list.find((item) => item.id === wishId);
        if (match) {
          setGuestName(match.guest_name);
          setRelationship(match.relationship || "friend");
          setMessage(match.message);
          return;
        }
      }
      localStorage.removeItem(localStorageKey);
      setUserWishId(null);
      return;
    }

    if (!isUUID(wishId)) {
      localStorage.removeItem(localStorageKey);
      setUserWishId(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishes")
        .select("*")
        .eq("id", wishId);

      if (error) throw error;

      if (data && data.length > 0) {
        const userWish = data[0];
        setGuestName(userWish.guest_name);
        setRelationship(userWish.relationship || "friend");
        setMessage(userWish.message);
      } else {
        // If not found in database, clear stale localStorage
        localStorage.removeItem(localStorageKey);
        setUserWishId(null);
      }
    } catch (err: any) {
      console.error("Lỗi fetch user wish:", err);
    }
  };

  // Helper to load deleted wishes from localStorage (recycle bin)
  const loadDeletedWishes = () => {
    const deletedKey = `deleted_wishes_${effectiveId}`;
    const deletedStored = localStorage.getItem(deletedKey);
    if (deletedStored) {
      try {
        const list: DeletedWish[] = JSON.parse(deletedStored);
        // Clean up items older than 7 days
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const validList = list.filter(item => new Date(item.deleted_at).getTime() > oneWeekAgo);
        if (validList.length !== list.length) {
          localStorage.setItem(deletedKey, JSON.stringify(validList));
        }
        setDeletedWishes(validList);
      } catch (e) {
        console.error("Lỗi load deleted wishes:", e);
        setDeletedWishes([]);
      }
    } else {
      setDeletedWishes([]);
    }
  };

  // Soft delete a wish
  const handleDeleteWish = async (wishId: string) => {
    const wishToDelete = wishes.find(w => w.id === wishId);
    if (!wishToDelete) return;

    const confirmDelete = window.confirm ? window.confirm(`Bạn có chắc chắn muốn xóa lời chúc của "${wishToDelete.guest_name}"? Lời chúc này sẽ được giữ trong Thùng rác và có thể khôi phục trong vòng 1 tuần.`) : true;
    if (!confirmDelete) return;

    try {
      if (!isUUID(effectiveId)) {
        // Mode A: Offline/Demo
        const stored = localStorage.getItem(`mock_wishes_list_${effectiveId}`);
        let list: Wish[] = stored ? JSON.parse(stored) : [];
        list = list.filter(w => w.id !== wishId);
        localStorage.setItem(`mock_wishes_list_${effectiveId}`, JSON.stringify(list));
        setWishes(list);
      } else {
        // Mode B: Supabase
        const { error } = await supabase
          .from("wishes")
          .delete()
          .eq("id", wishId);

        if (error) throw error;
        await loadAllWishes();
      }

      // Add to deleted wishes in localStorage (acts as a recycle bin)
      const deletedKey = `deleted_wishes_${effectiveId}`;
      const deletedStored = localStorage.getItem(deletedKey);
      const deletedList: DeletedWish[] = deletedStored ? JSON.parse(deletedStored) : [];
      
      const newDeletedItem: DeletedWish = {
        ...wishToDelete,
        deleted_at: new Date().toISOString()
      };

      // Filter out items older than 1 week
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const validDeletedList = deletedList.filter(item => new Date(item.deleted_at).getTime() > oneWeekAgo);

      localStorage.setItem(deletedKey, JSON.stringify([newDeletedItem, ...validDeletedList]));
      showToast("Đã xóa lời chúc. Bạn có thể khôi phục trong vòng 1 tuần.");
      loadDeletedWishes();
    } catch (err: any) {
      console.error("Lỗi xóa lời chúc:", err);
      showToast("Không thể xóa lời chúc: " + err.message, "error");
    }
  };

  // Restore a deleted wish
  const handleRestoreWish = async (deletedWish: DeletedWish) => {
    try {
      if (!isUUID(effectiveId)) {
        // Mode A: Offline/Demo
        const stored = localStorage.getItem(`mock_wishes_list_${effectiveId}`);
        let list: Wish[] = stored ? JSON.parse(stored) : [];
        
        // Check if already exists in list
        if (!list.some(w => w.id === deletedWish.id)) {
          const restoredWish: Wish = {
            id: deletedWish.id,
            invitation_id: deletedWish.invitation_id,
            guest_name: deletedWish.guest_name,
            relationship: deletedWish.relationship,
            message: deletedWish.message,
            created_at: deletedWish.created_at
          };
          list = [restoredWish, ...list];
          localStorage.setItem(`mock_wishes_list_${effectiveId}`, JSON.stringify(list));
          setWishes(list);
        }
      } else {
        // Mode B: Supabase
        const { error } = await supabase
          .from("wishes")
          .insert([
            {
              id: deletedWish.id,
              invitation_id: deletedWish.invitation_id,
              guest_name: deletedWish.guest_name,
              relationship: deletedWish.relationship,
              message: deletedWish.message,
              created_at: deletedWish.created_at
            }
          ]);

        if (error) throw error;
        await loadAllWishes();
      }

      // Remove from deleted list
      const deletedKey = `deleted_wishes_${effectiveId}`;
      const deletedStored = localStorage.getItem(deletedKey);
      if (deletedStored) {
        let deletedList: DeletedWish[] = JSON.parse(deletedStored);
        deletedList = deletedList.filter(w => w.id !== deletedWish.id);
        localStorage.setItem(deletedKey, JSON.stringify(deletedList));
      }

      showToast("Khôi phục lời chúc thành công!");
      loadDeletedWishes();
    } catch (err: any) {
      console.error("Lỗi khôi phục lời chúc:", err);
      showToast("Không thể khôi phục: " + err.message, "error");
    }
  };

  // Initial Load Actions
  useEffect(() => {
    loadAllWishes();
    loadDeletedWishes();

    const savedWishId = localStorage.getItem(localStorageKey);
    if (savedWishId) {
      setUserWishId(savedWishId);
      loadUserWishData(savedWishId);
    } else {
      setUserWishId(null);
      setGuestName("");
      setRelationship("friend");
      setMessage("");
    }
  }, [effectiveId]);

  // Handle Form Submission: Create (Insert) or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      showToast("Vui lòng nhập tên khách mời!", "error");
      return;
    }
    if (!message.trim()) {
      showToast("Vui lòng nhập lời chúc của bạn!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isUUID(effectiveId)) {
        // Mode A: Local mock update or insert
        const stored = localStorage.getItem(`mock_wishes_list_${effectiveId}`);
        let list: Wish[] = stored ? JSON.parse(stored) : [];
        if (userWishId) {
          // Update
          list = list.map((item) =>
            item.id === userWishId
              ? {
                  ...item,
                  guest_name: guestName.trim(),
                  relationship,
                  message: message.trim()
                }
              : item
          );
          showToast("Cập nhật lời chúc thành công!");
        } else {
          // Insert
          const newId = `mock-wish-${Date.now()}`;
          const newWishItem: Wish = {
            id: newId,
            invitation_id: effectiveId,
            guest_name: guestName.trim(),
            relationship,
            message: message.trim(),
            created_at: new Date().toISOString()
          };
          list = [newWishItem, ...list];
          localStorage.setItem(localStorageKey, newId);
          setUserWishId(newId);
          showToast("Gửi lời chúc mừng thành công!");
        }
        localStorage.setItem(`mock_wishes_list_${effectiveId}`, JSON.stringify(list));
        setWishes(list);
      } else {
        // Mode B: Real Supabase interaction
        if (userWishId) {
          // Update
          if (!isUUID(userWishId)) {
            throw new Error("Mã lời chúc không hợp lệ để cập nhật.");
          }
          const { error } = await supabase
            .from("wishes")
            .update({
              guest_name: guestName.trim(),
              relationship,
              message: message.trim()
            })
            .eq("id", userWishId);

          if (error) throw error;
          showToast("Cập nhật lời chúc thành công!");
        } else {
          // Insert
          const { data, error } = await supabase
            .from("wishes")
            .insert([
              {
                invitation_id: effectiveId,
                guest_name: guestName.trim(),
                relationship,
                message: message.trim()
              }
            ])
            .select();

          if (error) throw error;

          if (data && data.length > 0) {
            const newWish = data[0];
            localStorage.setItem(localStorageKey, newWish.id);
            setUserWishId(newWish.id);
            showToast("Gửi lời chúc mừng thành công!");
          } else {
            showToast("Gửi lời chúc thành công!");
          }
        }
        await loadAllWishes();
      }
    } catch (err: any) {
      console.error("Lỗi khi gửi/cập nhật lời chúc:", err);
      showToast(err.message || "Có lỗi xảy ra khi lưu vào máy chủ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Reset capability (allows creating another wish or clearing form if they want)
  const handleWriteNewWish = () => {
    localStorage.removeItem(localStorageKey);
    setUserWishId(null);
    setGuestName("");
    setRelationship("friend");
    setMessage("");
    showToast("Bạn có thể viết một lời chúc mới!");
  };

  // Vietnamese badges mapping
  const relationshipLabels: Record<string, string> = {
    friend: "Bạn bè",
    colleague: "Đồng nghiệp",
    relative: "Họ hàng",
    groom: "Họ hàng nhà trai",
    bride: "Họ hàng nhà gái",
    other: "Khách mời"
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-left" id="wedding-guestbook-component">
      {/* Tiny active status banner/alert */}
      {toastMessage && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in border ${
            toastMessage.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Write wishes form outer visual box */}
      <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 p-5 rounded-none space-y-4 shadow-sm relative">
        <div className="absolute top-0 right-0 w-3 h-px" style={{ backgroundColor: secondaryColor }}></div>
        <div className="absolute top-0 right-0 w-px h-3" style={{ backgroundColor: secondaryColor }}></div>
        
        <div className="flex justify-between items-center pb-2 border-b border-stone-150">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stone-600" style={{ color: primaryColor }} />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              {userWishId ? "Chỉnh sửa lời chúc của bạn" : "Gửi lời chúc mừng"}
            </span>
          </div>
          {userWishId && (
            <button
              type="button"
              onClick={handleWriteNewWish}
              className="text-[10px] text-stone-500 hover:text-stone-800 underline uppercase tracking-tight flex items-center gap-1 cursor-pointer font-bold"
              title="Nhấp để xóa liên kết và viết lời chúc mới"
            >
              <Edit2 className="w-3 h-3" /> Viết Lời Chúc Mới
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-stone-800">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
              Tên khách mời
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="text-xs border border-stone-200 bg-white rounded-none px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
              placeholder="VD: Anh Tuấn"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
              Mối quan hệ
            </label>
            <select
              disabled={isSubmitting}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="text-xs border border-stone-200 bg-white rounded-none px-2 py-2 w-full font-medium focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
            >
              <option value="friend">Bạn bè</option>
              <option value="colleague">Đồng nghiệp</option>
              <option value="relative">Họ hàng gần</option>
              <option value="groom">Nhà trai (Họ hàng)</option>
              <option value="bride">Nhà gái (Họ hàng)</option>
              <option value="other">Khách mời / Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
            Lời chúc của bạn
          </label>
          <textarea
            required
            disabled={isSubmitting}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-xs border border-stone-200 bg-white rounded-none px-3 py-2 w-full h-20 resize-none focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400 font-sans"
            placeholder="Hãy viết những tâm tình chân thành, ấm áp nhất gửi tới cặp đôi trong ngày trọng đại..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: primaryColor }}
          className="w-full text-white text-xs font-bold py-2.5 px-3 rounded-none uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang xử lý dữ liệu...</span>
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
              <span>{userWishId ? "Cập nhật lời chúc" : "Gửi Lời Chúc Mừng"}</span>
            </>
          )}
        </button>
      </form>

      {/* List wishes inside client representation style or loaded real time */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`text-[10px] uppercase font-bold tracking-wider pb-1 transition-all relative ${
                activeTab === "active" 
                  ? "text-stone-800 border-b-2 border-stone-800 font-extrabold" 
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Lời chúc ({wishes.length})
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setActiveTab("deleted")}
                className={`text-[10px] uppercase font-bold tracking-wider pb-1 transition-all relative flex items-center gap-1.5 ${
                  activeTab === "deleted" 
                    ? "text-rose-850 border-b-2 border-rose-800 font-extrabold" 
                    : "text-stone-400 hover:text-rose-600"
                }`}
              >
                <span>Thùng rác ({deletedWishes.length})</span>
                {deletedWishes.length > 0 && (
                  <span className="bg-rose-500 text-white text-[8px] px-1 rounded-full font-bold">
                    {deletedWishes.length}
                  </span>
                )}
              </button>
            )}
          </div>
          {isLoading && (
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang tải...
            </span>
          )}
        </div>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
          {activeTab === "active" ? (
            wishes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-stone-200 text-stone-400 text-xs rounded-none bg-stone-50/30">
                Chưa có lời chúc nào trong mục này. Hãy là người đầu tiên chúc phúc!
              </div>
            ) : (
              wishes.map((w) => {
                const badgeLabel = relationshipLabels[w.relationship] || "Khách mời";
                const isMatchedWish = w.id === userWishId;
                
                return (
                  <div 
                    key={w.id} 
                    className={`p-4 rounded-none border text-xs relative transition-all ${
                      isMatchedWish 
                        ? "bg-rose-50/40 border-rose-200" 
                        : "bg-stone-50/50 border-stone-250/70"
                    }`}
                  >
                    {/* Little decoration brackets */}
                    <div className="absolute top-0 right-0 w-3 h-px" style={{ backgroundColor: secondaryColor }}></div>
                    <div className="absolute top-0 right-0 w-px h-3" style={{ backgroundColor: secondaryColor }}></div>

                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 font-serif text-sm tracking-wide">{w.guest_name}</span>
                        {isMatchedWish && (
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded-xs uppercase">
                            Của bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-none font-bold ${
                            w.relationship === "groom" 
                              ? "bg-sky-650 text-white" 
                              : w.relationship === "bride"
                                ? "bg-rose-600 text-white"
                                : "bg-stone-850 text-white"
                          }`}
                        >
                          {badgeLabel}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWish(w.id)}
                            className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition-colors"
                            title="Xóa lời chúc không phù hợp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-stone-700 leading-relaxed font-sans italic my-1 break-words">
                      "{w.message}"
                    </p>

                    <div className="text-[8px] text-stone-400 font-mono text-right uppercase tracking-wider mt-1.5">
                      {new Date(w.created_at || new Date()).toLocaleDateString("vi-VN", {
                        day: "2-digit", 
                        month: "2-digit", 
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            deletedWishes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-stone-200 text-stone-400 text-xs rounded-none bg-stone-50/30">
                Thùng rác trống. Chưa có lời chúc nào bị xóa gần đây.
              </div>
            ) : (
              deletedWishes.map((w) => {
                const badgeLabel = relationshipLabels[w.relationship] || "Khách mời";
                const remainingText = getRemainingTime(w.deleted_at);
                
                return (
                  <div 
                    key={w.id} 
                    className="p-4 rounded-none border border-stone-200 bg-stone-100/50 text-xs relative transition-all"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-500 font-serif text-sm tracking-wide line-through">{w.guest_name}</span>
                        <span className="text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-150 px-1 py-0.5 rounded-xs uppercase">
                          Đã xóa
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] uppercase text-stone-400 bg-stone-250 px-1.5 py-0.5 font-bold">
                          {badgeLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRestoreWish(w)}
                          className="p-1 hover:bg-emerald-50 text-stone-500 hover:text-emerald-600 rounded transition-colors flex items-center gap-1 text-[10px] font-bold border border-stone-200 hover:border-emerald-200 bg-white"
                          title="Khôi phục lời chúc"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Khôi phục
                        </button>
                      </div>
                    </div>

                    <p className="text-stone-400 leading-relaxed font-sans italic my-1 break-words line-through">
                      "{w.message}"
                    </p>

                    <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider mt-1.5 text-stone-400">
                      <span className="text-amber-600 font-semibold">{remainingText}</span>
                      <span>
                        Xóa ngày: {new Date(w.deleted_at).toLocaleDateString("vi-VN", {
                          day: "2-digit", 
                          month: "2-digit", 
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
