import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

let supabaseInstance: any;

if (hasCredentials) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Lỗi khi khởi tạo Supabase Client:', err);
  }
}

// Fallback / Stub implementation for safe local previews without immediate crashes
if (!supabaseInstance) {
  console.warn(
    'Cảnh báo: VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình chính xác!\n' +
    'Ứng dụng đang chạy ở chế độ giả lập để bảo vệ an toàn cho UI preview.'
  );

  const mockAuth = {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    onAuthStateChange: (callback: any) => {
      // Trả về một hàm unsubscribe giả lập để không bị crash
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },
    signInWithPassword: async () => {
      throw new Error(
        'Không thể xử lý: Supabase chưa được cấu hình. Vui lòng khai báo VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY thành công.'
      );
    },
    signUp: async () => {
      throw new Error(
        'Không thể xử lý: Supabase chưa được cấu hình. Vui lòng khai báo VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY thành công.'
      );
    },
    signOut: async () => {
      return { error: null };
    }
  };

  const getMockData = (table: string) => {
    try {
      const item = localStorage.getItem(`mock_sb_${table}`);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  };

  const setMockData = (table: string, data: any[]) => {
    try {
      localStorage.setItem(`mock_sb_${table}`, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  // Seed default wishes if empty
  if (typeof window !== "undefined" && !localStorage.getItem('mock_sb_wishes')) {
    localStorage.setItem('mock_sb_wishes', JSON.stringify([
      {
        id: "w1",
        invitation_id: "demo-invitation-id",
        guest_name: "Chị Thảo (Đại học)",
        relationship: "friend",
        message: "Chúc trăm năm hạnh phúc đầu bạc răng long nhé hai bạn yêu! Nhìn ảnh cưới xịn sò quá đi thôiiii.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "w2",
        invitation_id: "demo-invitation-id",
        guest_name: "Bác Minh (Họ Hàng)",
        relationship: "groom",
        message: "Mừng cho hai cháu đã tìm thấy nhau. Chúc hai cháu luôn bao dung, thấu hiểu nhau nhé.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]));
  }

  const createQueryBuilder = (tableName: string) => {
    let currentData = getMockData(tableName);
    let filters: Array<(item: any) => boolean> = [];
    let sortKey: string | null = null;
    let sortAscending = true;

    const builderObj: any = {
      select: (columns: string = '*') => {
        return builderObj;
      },
      eq: (column: string, value: any) => {
        filters.push((item: any) => {
          // support snake_case and camelCase comparisons: eg invitation_id or invitationId
          if (column === 'invitation_id') {
            return item.invitation_id === value || item.invitationId === value || item.invitation_id === "demo-invitation-id";
          }
          return item[column] === value;
        });
        return builderObj;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        sortKey = column;
        sortAscending = options?.ascending !== false;
        return builderObj;
      },
      then: (onfulfilled?: (value: any) => any) => {
        let filtered = [...currentData];
        for (const fn of filters) {
          filtered = filtered.filter(fn);
        }
        if (sortKey) {
          filtered.sort((a: any, b: any) => {
            const valA = a[sortKey!];
            const valB = b[sortKey!];
            if (valA < valB) return sortAscending ? -1 : 1;
            if (valA > valB) return sortAscending ? 1 : -1;
            return 0;
          });
        }
        const res = { data: filtered, error: null };
        return Promise.resolve(onfulfilled ? onfulfilled(res) : res);
      },
      insert: (values: any | any[]) => {
        const rows = Array.isArray(values) ? values : [values];
        const newRows = rows.map(r => {
          const rowId = r.id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          return {
            id: rowId,
            created_at: new Date().toISOString(),
            ...r
          };
        });
        const updated = [...newRows, ...currentData];
        setMockData(tableName, updated);
        
        const chain: any = {
          select: () => {
            return Promise.resolve({ data: newRows, error: null });
          },
          then: (onfulfilled?: (value: any) => any) => {
            const res = { data: newRows, error: null };
            return Promise.resolve(onfulfilled ? onfulfilled(res) : res);
          }
        };
        return chain;
      },
      update: (values: any) => {
        const updateBuilder: any = {
          eq: (column: string, value: any) => {
            let affected: any[] = [];
            const updated = currentData.map((item: any) => {
              if (item[column] === value) {
                const merged = { ...item, ...values };
                affected.push(merged);
                return merged;
              }
              return item;
            });
            setMockData(tableName, updated);

            const chain: any = {
              select: () => {
                return Promise.resolve({ data: affected, error: null });
              },
              then: (onfulfilled?: (value: any) => any) => {
                const res = { data: affected, error: null };
                return Promise.resolve(onfulfilled ? onfulfilled(res) : res);
              }
            };
            return chain;
          }
        };
        return updateBuilder;
      },
      delete: () => {
        const deleteBuilder: any = {
          eq: (column: string, value: any) => {
            const updated = currentData.filter((item: any) => item[column] !== value);
            setMockData(tableName, updated);
            return Promise.resolve({ error: null });
          }
        };
        return deleteBuilder;
      }
    };

    return builderObj;
  };

  const mockStorage = {
    from: (bucketName: string) => ({
      upload: async (path: string, file: any, options?: any) => {
        console.warn(`[GIA LẬP STORAGE] Đang tải file lên bucket "${bucketName}" tại path "${path}"`);
        // Simulate loading time
        await new Promise(r => setTimeout(r, 800));
        return {
          data: { path },
          error: null
        };
      },
      getPublicUrl: (path: string) => {
        let publicUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3?simulated_upload=${encodeURIComponent(path)}`;
        if (bucketName === "wedding-images" || path.match(/\.(png|jpg|jpeg|webp)$/i)) {
          publicUrl = `https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80&simulated_upload=${encodeURIComponent(path)}`;
        }
        return {
          data: {
            publicUrl
          }
        };
      }
    })
  };

  supabaseInstance = {
    auth: mockAuth,
    from: createQueryBuilder,
    storage: mockStorage
  };
}

export const supabase = supabaseInstance;
