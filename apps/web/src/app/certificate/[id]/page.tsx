import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import QRCode from "qrcode";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, FileKey2, Hash, ScanLine, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { LocaleLink } from "@/components/locale-link";
import { CertificateShareButton } from "@/components/certificate-share-button";
import { ShareLandingTracker } from "@/components/share-landing-tracker";
import { getSession } from "@/lib/auth";
import { verifyPayload } from "@/lib/crypto";
import { formatTokenCount, formatPercent } from "@/lib/format";
import { languageAlternates, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { milestoneClubForTokens, milestoneClubText } from "@/lib/milestone-clubs";
import { getCertificate } from "@/lib/repository";
import { getRuntimeEnv, siteUrl } from "@/lib/runtime";
import { certificateStyles, type CertificateStyle } from "@/lib/share-preview";
/* eslint-disable @next/next/no-img-element -- the server-generated QR code is a data URI */

export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ share_style?: string }> }): Promise<Metadata> {
  const locale = await getLocale();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const certificate = await getCertificate(id);
  if (!certificate || (certificate.status === "active" && !certificate.indexable)) return { title: locale === "zh" ? "私密成就证明" : "Private achievement proof", robots: { index: false, follow: false } };
  const achievementTitle = certificate.kind === "monthly"
    ? `${formatTokenCount(certificate.processedTokens)} ${locale === "zh" ? "Token 月度成就" : "Token Monthly Achievement"}`
    : milestoneClubText(milestoneClubForTokens(certificate.processedTokens), locale).title;
  const title = `${certificate.displayName} · ${achievementTitle} ${locale === "zh" ? "成就证明" : "Achievement Proof"}`;
  const description = locale === "zh" ? `验证 ${certificate.displayName} 的 LovTokens 成就记录及密码学摘要。` : `Verify ${certificate.displayName}'s LovTokens achievement record and cryptographic digest.`;
  const style = certificateStyles.includes(query.share_style as CertificateStyle) ? query.share_style as CertificateStyle : "collector";
  const image = `/certificate/${encodeURIComponent(certificate.id)}/social.png?lang=${locale === "zh" ? "zh" : "en"}&style=${style}`;
  const publicUrl = `/certificate/${certificate.id}?share_style=${style}`;
  return {
    title,
    description,
    alternates: languageAlternates(`/certificate/${certificate.id}`, locale),
    openGraph: { title, description, url: publicUrl, type: "article", images: [{ url: image, width: 1080, height: 1350, type: "image/png", alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CertificatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ share?: string }> }) {
  const locale = await getLocale();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const certificate = await getCertificate(id);
  const session = await getSession(await headers());
  const publiclyViewable = certificate?.status !== "active" || certificate?.indexable;
  const ownerViewable = Boolean(certificate?.userId && certificate.userId === session?.user.id);
  if (!certificate || (!publiclyViewable && !ownerViewable)) notFound();

  const c = certificate;
  const revoked = c.status !== "active";
  const env = await getRuntimeEnv();
  const proof = await verifyPayload(c.payloadJson, c.payloadHash, c.signature, env.CERTIFICATE_PRIVATE_JWK);
  const proofValid = proof !== "invalid";
  const proofPath = localePath(`/certificate/${c.id}`, locale);
  const proofUrl = `${siteUrl()}${proofPath}`;
  const qr = await QRCode.toDataURL(proofUrl, { errorCorrectionLevel: "M", margin: 2, width: 240, color: { dark: "#111827", light: "#ffffff" } });
  const imageUrl = `/certificate/${encodeURIComponent(c.id)}/image?lang=${locale}&download=1`;
  const issuedDate = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(c.issuedAt * 1000));
  const clubTitle = milestoneClubText(milestoneClubForTokens(c.processedTokens), locale).title;
  const kindLabel = c.kind === "monthly" ? (locale === "zh" ? "月度成就" : "Monthly achievement") : clubTitle;
  const shareTitle = `${c.displayName} · ${c.kind === "monthly" ? `${formatTokenCount(c.processedTokens)} ${locale === "zh" ? "Token 成就" : "Token Achievement"}` : clubTitle}`;
  const proofLabel = proof === "signature-verified" ? (locale === "zh" ? "数字签名验证通过" : "Digital signature verified") : proof === "hash-verified" ? (locale === "zh" ? "数据摘要验证通过" : "Data digest verified") : (locale === "zh" ? "证明验证失败" : "Proof verification failed");
  let frozenPayload = c.payloadJson;
  try { frozenPayload = JSON.stringify(JSON.parse(c.payloadJson), null, 2); } catch { /* Preserve the original payload for forensic inspection. */ }

  return <main className="certificate-page">
    <div className="certificate-toolbar shell">
      <LocaleLink className="share-certificate-conversion" href={localePath(c.handle === "revoked" ? "/leaderboard" : `/u/${c.handle}`, locale)} locale={locale}><ArrowLeft aria-hidden="true" size={16} />{locale === "zh" ? "返回个人主页" : "Back to profile"}</LocaleLink>
      <div>
        <span className="certificate-live-status" data-invalid={!proofValid || revoked || undefined}><span />{revoked ? (locale === "zh" ? "证明已撤销" : "Proof revoked") : proofLabel}</span>
        {!revoked && c.indexable && <CertificateShareButton canPublishPreview={ownerViewable} className="certificate-download" id={c.id} initialOpen={query.share === "1"} locale={locale} processedTokens={c.processedTokens} siteOrigin={siteUrl()} title={shareTitle} />}
        <a className="certificate-download" download href={imageUrl}>{locale === "zh" ? "下载成就图片" : "Download achievement"}<Download aria-hidden="true" size={15} /></a>
      </div>
    </div>

    <section className="certificate-document shell" data-revoked={revoked || undefined}>
      <div aria-hidden="true" className="certificate-guilloche" />
      <header className="certificate-document-head">
        <span className="certificate-brand-mark"><i /><i /><i /><i /></span>
        <span><strong>LovTokens</strong><small>{locale === "zh" ? "可验证成就记录" : "Verifiable achievement record"}</small></span>
        <span className="certificate-number"><small>{locale === "zh" ? "成就编号" : "Achievement ID"}</small><strong>{c.id.toUpperCase()}</strong></span>
      </header>
      <div className="certificate-document-body">
        <span className="certificate-kind">{kindLabel} · {c.period}</span>
        <p>{locale === "zh" ? "谨此证明" : "This certifies that"}</p>
        <h1>{revoked ? (locale === "zh" ? "身份已撤回" : "Identity withdrawn") : c.displayName}</h1>
        <p>{locale === "zh" ? "已通过 LovTokens 开源采集器完成累计处理" : "has completed an aggregate measured total of"}</p>
        <strong className="certificate-token-total">{formatTokenCount(c.processedTokens)}</strong>
        <span className="certificate-token-label">{locale === "zh" ? "输入与输出 TOKEN" : "INPUT + OUTPUT TOKENS"}</span>
      </div>
      <dl className="certificate-document-stats">
        <div><dt>{locale === "zh" ? "全球排名" : "Global rank"}</dt><dd>{c.rank ? `#${c.rank}` : "—"}</dd></div>
        <div><dt>{locale === "zh" ? "百分位" : "Percentile"}</dt><dd>{c.percentile === null ? "—" : formatPercent(c.percentile, locale)}</dd></div>
        <div><dt>{locale === "zh" ? "数据覆盖率" : "Data coverage"}</dt><dd>{c.coverage.toFixed(0)}%</dd></div>
        <div><dt>{locale === "zh" ? "获得日期" : "Date earned"}</dt><dd>{issuedDate}</dd></div>
      </dl>
      <footer className="certificate-document-foot">
        <div><ShieldCheck aria-hidden="true" size={30} /><span><strong>{proofLabel}</strong><small>{c.trustLevel.replaceAll("-", " ")}</small></span></div>
        <div className="certificate-signature"><span>LOVTOKENS</span><small>{locale === "zh" ? "独立使用量证明" : "INDEPENDENT USAGE EVIDENCE"}</small></div>
        <div className="certificate-qr"><img alt={locale === "zh" ? "成就证明二维码" : "Achievement proof QR code"} height="104" src={qr} width="104" /><span><ScanLine aria-hidden="true" size={12} />{locale === "zh" ? "扫码验真" : "Scan to verify"}</span></div>
      </footer>
      {revoked && <div className="certificate-revoked-stamp">{locale === "zh" ? "已撤销" : "REVOKED"}</div>}
    </section>

    <section className="certificate-proof-shell shell">
      <div className="certificate-proof-intro">
        <span className="eyebrow">{locale === "zh" ? "证明资料" : "PROOF RECORD"}</span>
        <h2>{locale === "zh" ? "独立、可复查的冻结记录。" : "An independent, inspectable frozen record."}</h2>
        <p>{locale === "zh" ? "该成就在获得时冻结汇总数据，并使用 SHA-256 摘要保护完整性。若部署了签名密钥，还会进一步验证 ECDSA P-256 数字签名。" : "This achievement freezes aggregate data when earned and protects its integrity with a SHA-256 digest. When a signing key is configured, an ECDSA P-256 signature is verified as well."}</p>
      </div>
      <div className="certificate-proof-grid">
        <ProofItem icon={<CheckCircle2 size={20} />} label={locale === "zh" ? "记录状态" : "Record status"} value={revoked ? (locale === "zh" ? "已撤销" : "Revoked") : (locale === "zh" ? "有效" : "Active")} valid={!revoked} />
        <ProofItem icon={<Hash size={20} />} label={locale === "zh" ? "数据完整性" : "Data integrity"} value={proofValid ? (locale === "zh" ? "摘要匹配" : "Digest matches") : (locale === "zh" ? "摘要不匹配" : "Digest mismatch")} valid={proofValid} />
        <ProofItem icon={<FileKey2 size={20} />} label={locale === "zh" ? "密码学证明" : "Cryptographic proof"} value={proofLabel} valid={proofValid} />
        <ProofItem icon={<ShieldCheck size={20} />} label={locale === "zh" ? "信任等级" : "Trust level"} value={c.trustLevel.replaceAll("-", " ")} valid />
      </div>
      <dl className="certificate-proof-facts">
        <div><dt>{locale === "zh" ? "成就编号" : "Achievement ID"}</dt><dd>{c.id}</dd></div>
        <div><dt>{locale === "zh" ? "统计周期" : "Measurement period"}</dt><dd>{c.period}</dd></div>
        <div><dt>SHA-256</dt><dd>{c.payloadHash}</dd></div>
        <div><dt>{locale === "zh" ? "签名" : "Signature"}</dt><dd>{c.signature || (locale === "zh" ? "未配置签名，仅验证摘要" : "Not configured; digest verification only")}</dd></div>
      </dl>
      <details className="certificate-payload"><summary>{locale === "zh" ? "查看冻结证明载荷" : "Inspect frozen proof payload"}<ExternalLink aria-hidden="true" size={14} /></summary><pre>{frozenPayload}</pre></details>
      <p className="certificate-disclaimer">{locale === "zh" ? "LovTokens 证明汇总使用量及其数据完整性，不对生产力、能力或代码质量作出评价，也不代表 OpenAI 或 Anthropic 的认证。" : "LovTokens verifies aggregate usage and data integrity. It does not assess productivity, skill, or code quality, and is not an OpenAI or Anthropic certification."}</p>
    </section>

    <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: `LovTokens Token Achievement ${c.id}`, url: proofUrl, dateCreated: new Date(c.issuedAt * 1000).toISOString(), identifier: c.id }} />
    <ShareLandingTracker contentId={c.id} contentKind="certificate" conversionSelector=".share-certificate-conversion" />
  </main>;
}

function ProofItem({ icon, label, value, valid }: { icon: ReactNode; label: string; value: string; valid: boolean }) {
  return <div className="certificate-proof-item" data-invalid={!valid || undefined}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
