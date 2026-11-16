/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeddingInvitationConfig } from "./types";

export const PRESETS: Record<string, { name: string; description: string; config: WeddingInvitationConfig }> = {
  rusticRed: {
    name: "Rustic Burgundy (Đỏ Ấm Hoài Cổ)",
    description: "Tông màu đỏ rượu vang ấm áp kết hợp với font chữ uốn lượn cổ điển, mang lại sự sang trọng và lãng mạn.",
    config: {
      theme: {
        primaryColor: "#991b1b", // red-800
        secondaryColor: "#fca5a5", // red-300
        backgroundColor: "#fffbf9", // off-white warm
        textColor: "#27272a", // zinc-800
        accentColor: "#be123c",
        titleFont: "vibes",
        bodyFont: "cormorant",
        weddingTheme: "rustic"
      },
      music: {
        enabled: true,
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        title: "I Do - 911 (Acoustic cover)",
        autoplay: false
      },
      couple: {
        groom: {
          fullName: "Nguyễn Văn Hùng",
          shortName: "Khắc Hùng",
          avatar: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
          fatherName: "Nguyễn Văn Tuấn",
          motherName: "Nguyễn Thị Mai",
          phone: "0901234567",
          bankInfo: {
            bankName: "Vietcombank",
            accountNumber: "1028746352",
            accountName: "NGUYEN VAN HUNG",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        bride: {
          fullName: "Trần Tuyết Mai",
          shortName: "Tuyết Mai",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
          fatherName: "Trần Văn Bình",
          motherName: "Lê Thị Lan",
          phone: "0934567890",
          bankInfo: {
            bankName: "Techcombank",
            accountNumber: "1903648590203",
            accountName: "TRAN TUYET MAI",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        loveStory: [
          {
            id: "1",
            title: "Cái Hẹn Đầu Tiên",
            date: "2023-04-12",
            content: "Buổi tối gió mùa đông lạnh buốt, nhưng trái tim chúng mình cực kỳ ấm áp tại một góc ban công lộng gió ngắm hồ Tây. Anh lóng ngóng làm đổ cả tách trà gừng lên tay, bối rối không biết giấu mặt đi đâu.",
            image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80"
          },
          {
            id: "2",
            title: "Khi Hai Ta Về Một Nhà",
            date: "2025-12-25",
            content: "Đèn đường thắp sáng lấp lánh cả phố đi bộ. Anh quỳ một gối xuống, lấy ra chiếc nhẫn nhỏ xinh và run run nói làm em vừa cười vừa khóc gật đầu lia lịa. Một hành trình mới bắt đầu!",
            image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80"
          }
        ]
      },
      events: [
        {
          id: "ceremony",
          name: "Lễ Vu Quy (Nhà Gái)",
          date: "2026-11-22",
          time: "08:30",
          locationName: "Tư gia Nhà Gái",
          address: "12 Phố Cổ, Quận Hoàn Kiếm, Hà Nội",
          mapEmbedUrl: "https://maps.google.com/maps?q=Hanoi+Opera+House&t=&z=14&ie=UTF8&iwloc=&output=embed"
        },
        {
          id: "banquet",
          name: "Tiệc Cưới Trọng Đại",
          date: "2026-11-22",
          time: "17:30",
          locationName: "Grand Plaza Wedding Lounge",
          address: "117 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội",
          mapEmbedUrl: "https://maps.google.com/maps?q=Grand+Plaza+Hanoi+Hotel&t=&z=14&ie=UTF8&iwloc=&output=embed"
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop&q=80"
      ],
      blockOrder: ["hero", "couple", "story", "events", "gallery", "rsvp", "wishes"],
      rsvpConfig: {
        allowGuestCount: true,
        questions: [
          {
            id: "shuttle",
            questionText: "Bạn cần xe đưa đón vào 16:30 tại ga Hà Nội không?",
            type: "radio",
            options: ["Có, cho mình xin 1 vé", "Không tự đi xe được nha"]
          },
          {
            id: "diet",
            questionText: "Bạn có ăn chay hoặc dị ứng thực phẩm gì không?",
            type: "text"
          }
        ]
      }
    }
  },
  minimalGold: {
    name: "Minimalist Gold (Vàng Cát Thanh Lịch)",
    description: "Thiết kế tối giản hiện đại với các dải màu kem cát nhạt tô điểm nét chỉ vàng sang trọng, phù hợp người trẻ yêu thích sự tinh tế.",
    config: {
      theme: {
        primaryColor: "#c5a452", // gold-ish
        secondaryColor: "#e9dfc6", // light gold
        backgroundColor: "#faf9f6", // ivory
        textColor: "#1c1917", // stone-900
        accentColor: "#a37e2c",
        titleFont: "playfair",
        bodyFont: "montserrat",
        weddingTheme: "classic"
      },
      music: {
        enabled: true,
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        title: "Until I Found You - Stephen Sanchez",
        autoplay: false
      },
      couple: {
        groom: {
          fullName: "Phạm Minh Hoàng",
          shortName: "Minh Hoàng",
          avatar: "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=600&auto=format&fit=crop&q=80",
          fatherName: "Phạm Minh Hùng",
          motherName: "Nguyễn Thu Hà",
          phone: "0908887776",
          bankInfo: {
            bankName: "MB Bank",
            accountNumber: "0908887776",
            accountName: "PHAM MINH HOANG",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        bride: {
          fullName: "Đỗ Thúy Vy",
          shortName: "Thúy Vy",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
          fatherName: "Đỗ Kiến Quốc",
          motherName: "Vũ Phương thảo",
          phone: "0909998887",
          bankInfo: {
            bankName: "ACB",
            accountNumber: "2847192",
            accountName: "DO THUY VY",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        loveStory: [
          {
            id: "1",
            title: "Trường Đại Học Định Mệnh",
            date: "2019-09-05",
            content: "Năm nhất đại học, một ngày mưa tầm tã, hai đứa cùng trú mưa dưới hiên thư viện cũ. Em mượn anh cây bút viết buổi thi đầu, để rồi cuối cùng 'mượn' luôn cả trái tim anh đi mất.",
            image: "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=600&auto=format&fit=crop&q=80"
          },
          {
            id: "2",
            title: "Đồng Hành Và Thấu Hiểu",
            date: "2024-10-20",
            content: "Hơn 5 năm chia ngọt sẻ bùi từ những ngày lập nghiệp hai bàn tay trắng, cùng đi qua giông bão tuổi trẻ. Chúng mình hiểu rằng đây là mảnh ghép duy nhất không thể thiếu trong cuộc đời này.",
            image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&auto=format&fit=crop&q=80"
          }
        ]
      },
      events: [
        {
          id: "ceremony",
          name: "Lễ Thành Hôn (Tư Gia)",
          date: "2026-12-18",
          time: "09:30",
          locationName: "Vợ Chồng Gia Đình Anh Hoàng",
          address: "Lô 5 Khu Đô Thị Phú Mỹ Hưng, Quận 7, TP. HCM",
          mapEmbedUrl: "https://maps.google.com/maps?q=Phu+My+Hung+District+7+Vietnam&t=&z=14&ie=UTF8&iwloc=&output=embed"
        },
        {
          id: "banquet",
          name: "Đại Tiệc Mừng Hạnh Phúc",
          date: "2026-12-18",
          time: "18:00",
          locationName: "Adora Center Grand Ballroom",
          address: "431 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP. HCM",
          mapEmbedUrl: "https://maps.google.com/maps?q=The+Adora+Center+Tan+Binh&t=&z=14&ie=UTF8&iwloc=&output=embed"
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1537655780520-1e392edd816a?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1520854221256-17451cc35953?w=800&auto=format&fit=crop&q=80"
      ],
      blockOrder: ["hero", "couple", "events", "story", "gallery", "rsvp", "wishes"],
      rsvpConfig: {
        allowGuestCount: true,
        questions: [
          {
            id: "diet",
            questionText: "Có bất kỳ món ăn nào bạn bị ứng không? (Ví dụ: hải sản, thịt bò, đậu phộng...)",
            type: "text"
          }
        ]
      }
    }
  },
  emeraldForest: {
    name: "Emerald Forest (Xem Xanh Ngọc Lục Bảo)",
    description: "Sắc xanh phong cách cỏ úa và lá trầu ngọc rất tự nhiên kết hợp với nét chữ Dancing Script tạo không khí thanh bình, tươi mát.",
    config: {
      theme: {
        primaryColor: "#0f5132", // green-800
        secondaryColor: "#a3cfbb", // green-300
        backgroundColor: "#f7fcf9", // mint off-white
        textColor: "#1c221e",
        accentColor: "#146c43",
        titleFont: "dancing",
        bodyFont: "cormorant",
        weddingTheme: "romantic"
      },
      music: {
        enabled: true,
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        title: "Marry Me - Jason Derulo",
        autoplay: false
      },
      couple: {
        groom: {
          fullName: "Đặng Tiến Dũng",
          shortName: "Tiến Dũng",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
          fatherName: "Đặng Quốc Việt",
          motherName: "Phùng Kim Tuyến",
          phone: "0904445556",
          bankInfo: {
            bankName: "Vietinbank",
            accountNumber: "109823485762",
            accountName: "DANG TIEN DUNG",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        bride: {
          fullName: "Nguyễn Khánh Linh",
          shortName: "Khánh Linh",
          avatar: "https://images.unsplash.com/photo-1541647376583-d184f7751621?w=600&auto=format&fit=crop&q=80",
          fatherName: "Nguyễn Danh Hòa",
          motherName: "Đỗ Thị Thu",
          phone: "0915556667",
          bankInfo: {
            bankName: "BIDV",
            accountNumber: "2151000673849",
            accountName: "NGUYEN KHANH LINH",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        loveStory: [
          {
            id: "1",
            title: "Mối Lương Duyên Công Sở",
            date: "2021-08-01",
            content: "Nàng là cô bé thử việc ngơ ngác thường xuyên nhờ anh sửa lỗi Excel. Chàng là tay code cứng luôn hờ hững lạnh lùng với người lạ nhưng lại hết sức tận tâm sửa từng con số, dấu phẩy cho nhỏ bàn bên.",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"
          }
        ]
      },
      events: [
        {
          id: "ceremony",
          name: "Lễ Hằng Thuận tại Chùa",
          date: "2026-09-09",
          time: "07:00",
          locationName: "Chùa Vĩnh Nghiem",
          address: "339 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP. HCM",
          mapEmbedUrl: "https://maps.google.com/maps?q=Chua+Vinh+Nghiem+Quan+3&t=&z=14&ie=UTF8&iwloc=&output=embed"
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop&q=80"
      ],
      blockOrder: ["hero", "couple", "events", "gallery", "rsvp"],
      rsvpConfig: {
        allowGuestCount: false,
        questions: []
      }
    }
  },
  geometricBalance: {
    name: "Geometric Balance (Cân Bằng Hình Học)",
    description: "Phong cách tối giản đương đại sang trọng. Các khối màu tinh tế tương phản cao, sử dụng hệ phông chữ cổ điển Playfair Display kết hợp cùng Montserrat hình học.",
    config: {
      theme: {
        primaryColor: "#1e293b", // slate-800
        secondaryColor: "#c5a059", // luxurious antique gold
        backgroundColor: "#faf9f5", // alabaster luxury cream
        textColor: "#111111", // rich dark charcoal
        accentColor: "#d36b54", // terracota orange
        titleFont: "playfair",
        bodyFont: "montserrat",
        weddingTheme: "modern"
      },
      music: {
        enabled: true,
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        title: "La Vie En Rose - Guitar Duet",
        autoplay: false
      },
      couple: {
        groom: {
          fullName: "Lê Hoàng Minh",
          shortName: "Hoàng Minh",
          avatar: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
          fatherName: "Lê Minh Đức",
          motherName: "Nguyễn Kim Oanh",
          phone: "0909991112",
          bankInfo: {
            bankName: "VPBank",
            accountNumber: "999111222",
            accountName: "LE HOANG MINH",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        bride: {
          fullName: "Trần Nhã Kỳ",
          shortName: "Nhã Kỳ",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
          fatherName: "Trần Anh Khoa",
          motherName: "Phạm Tú Quỳnh",
          phone: "0938883334",
          bankInfo: {
            bankName: "Vietcombank",
            accountNumber: "1028374650",
            accountName: "TRAN NHA KY",
            qrUrl: "https://images.unsplash.com/photo-1628258334807-290b5072f6a6?w=400&auto=format&fit=crop&q=80"
          }
        },
        loveStory: [
          {
            id: "1",
            title: "Gặp Gỡ Tại Triển Lãm Kiến Trúc",
            date: "2022-04-18",
            content: "Nơi tôn vinh tỷ lệ vàng và kết cấu hình học cũng là lúc đường kẻ song song của hai ta giao nhau. Ánh mắt chạm nhau sau lớp kính trưng bày mô hình đương đại đã khởi đầu hành trình tuyệt đẹp.",
            image: "https://images.unsplash.com/photo-1464755503490-b1d5c58a44af?w=600&auto=format&fit=crop&q=80"
          },
          {
            id: "2",
            title: "Ước Thề Đồng Điệu",
            date: "2025-10-10",
            content: "Tại bãi biển hoang sơ Nha Trang, dưới vòn khung tre tết hình vòm mái bán nguyệt hoàn mĩ, anh ngỏ lời cầu hôn trong tiếng sóng vỗ rì rào. Bản hòa ca tình yêu tìm thấy điểm tựa cân bằng bền lâu.",
            image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80"
          }
        ]
      },
      events: [
        {
          id: "ceremony",
          name: "Lễ Hôn Phối Trọng Thể",
          date: "2026-10-24",
          time: "10:00",
          locationName: "Khách Sạn InterContinental (Sảnh Marble)",
          address: "Quận 1, TP. Hồ Chí Minh",
          mapEmbedUrl: "https://maps.google.com/maps?q=InterContinental+Saigon&t=&z=14&ie=UTF8&iwloc=&output=embed"
        },
        {
          id: "banquet",
          name: "Tiệc Cưới Tối Cao Cấp",
          date: "2026-10-24",
          time: "18:00",
          locationName: "The Centennial Luxury Hall",
          address: "Bến Bạch Đằng, Quận 1, TP. Hồ Chí Minh",
          mapEmbedUrl: "https://maps.google.com/maps?q=Sai+Gon+Port&t=&z=14&ie=UTF8&iwloc=&output=embed"
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80"
      ],
      blockOrder: ["hero", "couple", "story", "events", "gallery", "rsvp", "wishes"],
      rsvpConfig: {
        allowGuestCount: true,
        questions: [
          {
            id: "diet",
            questionText: "Quý khách có yêu cầu đặc biệt về bàn tiệc không? (Ghế trẻ em, ăn chay...)",
            type: "text"
          }
        ]
      }
    }
  }
};
