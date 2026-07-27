import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { Transaction } from "@/lib/models/Transaction";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { NAIRA_PER_VOTE } from "@/lib/config";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/**
 * GET /api/admin/export?type=results|transactions
 * results (default): one row per contestant, sorted by votes desc.
 * transactions: full audit log, for reconciliation against Paystack.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();
  const type = req.nextUrl.searchParams.get("type") === "transactions" ? "transactions" : "results";

  if (type === "transactions") {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).lean();
    const contestants = await Contestant.find().lean();
    const nameById = new Map(contestants.map((c) => [c._id.toString(), c.name]));

    const rows: (string | number)[][] = [
      ["reference", "contestant", "amountPaidNaira", "votesCredited", "status", "customerEmail", "createdAt"],
      ...transactions.map((t) => [
        t.reference,
        nameById.get(t.contestantId.toString()) ?? "(deleted contestant)",
        t.amountPaid / 100,
        t.votesCredited,
        t.status,
        t.customerEmail ?? "",
        t.createdAt.toISOString(),
      ]),
    ];

    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nimsa-transactions-${Date.now()}.csv"`,
      },
    });
  }

  const contestants = await Contestant.find().sort({ voteCount: -1 }).lean();
  const totalVotes = contestants.reduce((sum, c) => sum + c.voteCount, 0);

  const rows: (string | number)[][] = [
    ["rank", "name", "voteCount", "sharePercent", "revenueNaira"],
    ...contestants.map((c, i) => [
      i + 1,
      c.name,
      c.voteCount,
      totalVotes > 0 ? Number(((c.voteCount / totalVotes) * 100).toFixed(2)) : 0,
      c.voteCount * NAIRA_PER_VOTE,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nimsa-results-${Date.now()}.csv"`,
    },
  });
}
