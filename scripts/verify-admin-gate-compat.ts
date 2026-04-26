// Edge crypto 마이그레이션 회귀 테스트용. 향후 admin-site-gate.ts 수정 시 동일 스크립트로 재검증할 것.
/**
 * Node createHmac token should verify with Web Crypto admin gate (commit 1).
 * Run: npx tsx scripts/verify-admin-gate-compat.ts
 */
import { createHmac } from "node:crypto";
import { signAdminGateValue, verifyAdminGateCookie } from "../lib/admin-site-gate";

process.env.NEXTAUTH_SECRET = "compat-test-secret";

async function main() {
  const expMs = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sig = createHmac("sha256", "compat-test-secret").update(expMs).digest("hex");
  const oldStyle = `${expMs}.${sig}`;

  const oldVerifies = await verifyAdminGateCookie(oldStyle);
  const signed = await signAdminGateValue();
  const newVerifies = signed ? await verifyAdminGateCookie(signed) : false;

  console.log(
    JSON.stringify(
      { oldNodeHmacTokenVerifiesWithNewCode: oldVerifies, newSignThenVerify: newVerifies },
      null,
      2,
    ),
  );
  if (!oldVerifies || !newVerifies) process.exit(1);
}

void main();
