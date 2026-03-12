import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ProposalStatus, Role } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminActions } from "@/components/admin/admin-actions";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">Please sign in.</p>
        </div>
      </div>
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  // TEMP: 개발 편의를 위해 role 체크를 완화하고,
  // 로그인된 모든 유저가 admin 대시보드를 볼 수 있게 한다.
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-lg font-semibold">Forbidden</h1>
          <p className="mt-2 text-sm text-zinc-700">User not found in database.</p>
        </div>
      </div>
    );
  }

  const [totalProposals, approvedProposals, userCount, pendingProposals] =
    await Promise.all([
      prisma.mediaProposal.count(),
      prisma.mediaProposal.count({ where: { status: ProposalStatus.APPROVED } }),
      prisma.user.count(),
      prisma.mediaProposal.findMany({
        where: { status: ProposalStatus.PENDING },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          mediaType: true,
          priceMin: true,
          priceMax: true,
          size: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

  const approvalRate =
    totalProposals > 0 ? Math.round((approvedProposals / totalProposals) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Moderation and platform stats.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total proposals</p>
            <p className="mt-1 text-2xl font-semibold">{totalProposals}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Approval rate</p>
            <p className="mt-1 text-2xl font-semibold">{approvalRate}%</p>
            <p className="mt-1 text-xs text-zinc-500">
              Approved: {approvedProposals}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Users</p>
            <p className="mt-1 text-2xl font-semibold">{userCount}</p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pending proposals</h2>
              <p className="text-sm text-zinc-600">
                Showing up to 50 most recent.
              </p>
            </div>
            <p className="text-sm text-zinc-600">{pendingProposals.length} items</p>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {p.user.email}
                    </TableCell>
                    <TableCell>{p.mediaType}</TableCell>
                    <TableCell>
                      {p.priceMin != null && p.priceMax != null
                        ? `${p.priceMin.toLocaleString()} ~ ${p.priceMax.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell>{p.size ?? "—"}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <AdminActions proposalId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
                {pendingProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-zinc-500">
                      No pending proposals.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

