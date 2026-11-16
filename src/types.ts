/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  titleFont: "vibes" | "dancing" | "playfair" | "cormorant";
  bodyFont: "cormorant" | "montserrat" | "sans";
  weddingTheme: "rustic" | "classic" | "modern" | "romantic";
}

export interface MusicConfig {
  enabled: boolean;
  url: string;
  title: string;
  autoplay: boolean;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  qrUrl: string;
  accountName: string;
}

export interface IndividualInfo {
  fullName: string;
  shortName: string;
  avatar: string;
  fatherName: string;
  motherName: string;
  phone: string;
  bankInfo: BankInfo;
}

export interface LoveStorySegment {
  id: string;
  title: string;
  date: string;
  content: string;
  image: string;
}

export interface CoupleConfig {
  groom: IndividualInfo;
  bride: IndividualInfo;
  loveStory: LoveStorySegment[];
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  locationName: string;
  address: string;
  mapEmbedUrl: string;
}

export interface RSVPQuestion {
  id: string;
  questionText: string;
  type: "text" | "radio";
  options?: string[];
}

export interface RSVPConfig {
  allowGuestCount: boolean;
  questions: RSVPQuestion[];
}

export interface WeddingInvitationConfig {
  theme: ThemeConfig;
  music: MusicConfig;
  couple: CoupleConfig;
  events: WeddingEvent[];
  gallery: string[];
  blockOrder: Array<"hero" | "couple" | "story" | "events" | "gallery" | "rsvp" | "wishes">;
  rsvpConfig: RSVPConfig;
}

export interface GuestWish {
  id: string;
  name: string;
  relationship: "groom" | "bride" | "friend" | "other";
  message: string;
  createdAt: string;
}

export interface RSVPSubmission {
  id: string;
  guestName: string;
  phone: string;
  attendance: "yes" | "no";
  guestCount: number;
  answers: Record<string, string>;
  createdAt: string;
}

export interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  senderName: string;
  receiverName: string;
  link: string;
}