export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface MusicTrack {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  style: string | null;
  lyrics: string | null;
  duration_sec: number | null;
  audio_url: string | null;
  cover_url: string | null;
  status: "queued" | "generating" | "success" | "failed";
  suno_job_id: string | null;
  error_message: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "inactive";

export interface UserSubscription {
  id: string;
  user_id: string;
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_order_id: string | null;
  plan_variant_id: string;
  status: SubscriptionStatus;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanSlug = "free" | "basic" | "pro";

export interface PlanFeature {
  label: string;
  free?: boolean;
  basic?: boolean;
  pro?: boolean;
}

export interface PricingTier {
  slug: PlanSlug;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  highlight?: boolean;
  variantId?: string;
  description: string;
  features: PlanFeature[];
  cta: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "updated_at">;
        Update: Partial<Omit<UserProfile, "id" | "created_at">>;
      };
      tracks: {
        Row: MusicTrack;
        Insert: Omit<MusicTrack, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MusicTrack, "id" | "created_at" | "user_id">>;
      };
      subscriptions: {
        Row: UserSubscription;
        Insert: Omit<UserSubscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<UserSubscription, "id" | "created_at" | "user_id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}