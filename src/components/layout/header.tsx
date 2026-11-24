import { getSessionActor } from "@/lib/auth";
import { getSiteCustomizer } from "@/lib/customizer/server";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [actor, config] = await Promise.all([getSessionActor(), getSiteCustomizer()]);
  return (
    <HeaderClient
      logoUrl={config.media.logo}
      user={
        actor
          ? {
              name: [actor.user.profile?.firstName, actor.user.profile?.lastName].filter(Boolean).join(" ") || actor.user.email.split("@")[0],
              email: actor.user.email,
              role: actor.user.roleName,
              avatar: actor.user.profile?.avatarUrl ?? null,
              isVerified: Boolean(actor.user.profile?.phoneVerifiedAt),
              isGuest: actor.isGuest,
            }
          : null
      }
    />
  );
}
