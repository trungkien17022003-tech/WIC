import { supabase } from "../supabaseClient";
import { RSVPSubmission } from "../types";

/**
 * Interface mapping table 'rsvps' structure in Supabase
 */
export interface DbRSVP {
  id?: string;
  invitation_id: string;
  guest_name: string;
  phone?: string | null;
  attendance: "yes" | "no";
  guest_count?: number | null;
  answers?: Record<string, any> | null;
  created_at?: string;
}

// ==========================================
// 1. LUỒNG KHÁCH MỜI (GUEST RSVP FLOW)
// ==========================================

/**
 * Gửi phản hồi RSVP của khách mời lên hệ thống Supabase.
 * Thực hiện logic chống trùng lặp theo cặp (invitation_id, phone).
 * 
 * @param rsvp Dữ liệu từ form của khách gửi lên
 */
export async function submitRsvp(rsvp: DbRSVP): Promise<{ success: boolean; data?: DbRSVP | null; message: string }> {
  try {
    // 1. Kiểm tra đầu vào tối thiểu
    if (!rsvp.invitation_id) {
      return { success: false, message: "Mã thiệp mời không hợp lệ." };
    }
    if (!rsvp.guest_name || rsvp.guest_name.trim() === "") {
      return { success: false, message: "Vui lòng nhập tên khách mời." };
    }

    // Chuẩn hóa dữ liệu điện thoại đề phòng trường hợp nhập khoảng trắng
    const cleanPhone = rsvp.phone ? rsvp.phone.trim() : "";

    // 2. Logic chống trùng lặp: Nếu có cung cấp số điện thoại, kiểm tra xem đã RSVP cho thiệp này chưa
    if (cleanPhone) {
      const { data: existingRSVPs, error: checkError } = await supabase
        .from("rsvps")
        .select("id")
        .eq("invitation_id", rsvp.invitation_id)
        .eq("phone", cleanPhone);

      if (checkError) {
        console.error("Lỗi kiểm tra RSVP trùng lặp:", checkError);
        // Nếu gặp lỗi kết nối hoặc check, có thể ném hoặc cảnh báo
      } else if (existingRSVPs && existingRSVPs.length > 0) {
        return {
          success: false,
          message: "Bạn đã xác nhận tham dự trước đó cho số điện thoại này!"
        };
      }
    }

    // 3. Thực hiện Insert bản ghi mới vào Supabase
    const payload = {
      invitation_id: rsvp.invitation_id,
      guest_name: rsvp.guest_name.trim(),
      phone: cleanPhone || null,
      attendance: rsvp.attendance,
      guest_count: rsvp.attendance === "yes" ? (rsvp.guest_count ?? 1) : 0,
      answers: rsvp.answers || {},
    };

    const { data, error } = await supabase
      .from("rsvps")
      .insert([payload])
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : null,
      message: "Lời xác nhận tham dự đã được gửi thành công. Xin chân thành cảm ơn!"
    };
  } catch (err: any) {
    console.error("Lỗi khi gửi RSVP:", err);
    return {
      success: false,
      message: err.message || "Đã xảy ra lỗi trong quá trình gửi cấu hình RSVP."
    };
  }
}

// ==========================================
// 2. LUỒNG CHỦ NHÀ (HOST DASHBOARD FLOW)
// ==========================================

export interface HostRsvpData {
  rsvps: DbRSVP[];
  totalExpectedGuests: number;
}

/**
 * Lấy toàn bộ danh sách RSVP thuộc về các thiệp cưới do người dùng làm chủ (owner_id = auth.uid())
 * và tính toán tổng số lượng khách mời xác nhận tham dự (attendance = 'yes').
 * 
 * @param invitationId ID thiệp cụ thể (nếu muốn lọc chi tiết, mặc định lấy toàn bộ)
 */
export async function fetchHostRsvps(invitationId?: string): Promise<{ success: boolean; data?: HostRsvpData; message: string }> {
  try {
    // 1. Thực hiện query JOIN/SELECT bảo mật thông qua quan hệ với RLS.
    // Lưu ý: Nếu RLS được kích hoạt chuẩn xác, Supabase sẽ tự động chỉ trả về các bản ghi 
    // trong bảng 'rsvps' thuộc về các thiệp 'invitations' mà người dùng hiện tại sở hữu.
    let query = supabase
      .from("rsvps")
      .select(`
        *,
        invitations:invitation_id (
          id,
          title,
          owner_id
        )
      `)
      .order("created_at", { ascending: false });

    if (invitationId) {
      query = query.eq("invitation_id", invitationId);
    }

    const { data: rsvpsData, error } = await query;

    if (error) {
      throw error;
    }

    const rsvpsList: DbRSVP[] = rsvpsData || [];

    // 2. Tính toán tổng số lượng khách chắc chắn sẽ đến (attendance === 'yes')
    const totalExpectedGuests = rsvpsList.reduce((sum, rsvp) => {
      if (rsvp.attendance === "yes") {
        return sum + (rsvp.guest_count ?? 1);
      }
      return sum;
    }, 0);

    return {
      success: true,
      data: {
        rsvps: rsvpsList,
        totalExpectedGuests
      },
      message: "Tải danh sách phản hồi RSVP thành công!"
    };
  } catch (err: any) {
    console.error("Lỗi khi tải danh sách RSVP chủ thiệp:", err);
    return {
      success: false,
      message: err.message || "Không thể tải danh sách RSVP của chủ nhà."
    };
  }
}