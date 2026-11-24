import type { Metadata } from "next";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { UserStatusControls } from "@/components/admin/user-status-controls";
import { SellerVerifyControl } from "@/components/admin/seller-verify-control";
import { ROLE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Users", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const current = await getSessionUser();
  const canManageUsers = hasPermission(current, "user.manage");
  const users = await prisma.user.findMany({
    include: { profile: true, _count: { select: { listings: true, reports: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Users</h1>
      <p className="mt-1 text-sm text-ink-500">Manage account access and review recent registrations.</p>

      <div className="surface-card mt-6 overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-800">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Seller verification</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {users.map((user) => {
                const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs text-ink-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABELS[user.roleName] ?? user.roleName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "BANNED" ? "danger" : "signal"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <SellerVerifyControl
                        userId={user.id}
                        verified={user.profile?.identityStatus === "VERIFIED"}
                        canManage={canManageUsers}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {user._count.listings} ads · {user._count.reports} reports
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusControls
                        userId={user.id}
                        status={user.status}
                        isSelf={current?.id === user.id}
                        isSuperAdmin={user.roleName === "SUPER_ADMIN"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
