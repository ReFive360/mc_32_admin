export type Permission = "view" | "edit" | "delete";

export type Doctor = {
  id: string;
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  room: string;
  experience: number;
  about: string;
  active: boolean;
  color: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  active: boolean;
};

export type AppointmentStatus = "planned" | "confirmed" | "done" | "cancelled";

export type Appointment = {
  id: string;
  doctorId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  patientName: string;
  patientPhone: string;
  patientBirthDate: string;
  status: AppointmentStatus;
  notes: string;
};

export type DiscountType = "percent" | "amount";

export type Promotion = {
  id: string;
  title: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  serviceIds: string[];
  startsOn: string;
  endsOn: string;
  active: boolean;
};

export type PhraseKind =
  | "birthday"
  | "reminder"
  | "confirmation"
  | "thanks"
  | "promo"
  | "custom";

export type PhraseChannel = "sms" | "messenger" | "email";

export type Phrase = {
  id: string;
  title: string;
  kind: PhraseKind;
  channel: PhraseChannel;
  body: string;
  active: boolean;
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  password: string;
  permissions: Permission[];
  active: boolean;
};

export type Database = {
  doctors: Doctor[];
  services: Service[];
  appointments: Appointment[];
  promotions: Promotion[];
  phrases: Phrase[];
  admins: Admin[];
};
