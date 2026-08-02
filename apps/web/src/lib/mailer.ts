type MailEnvironment = {
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
};

export function hasEmailDelivery(env: MailEnvironment) {
  return Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM);
}

export async function sendAuthEmail(env: MailEnvironment, input: { to: string; subject: string; text: string; html: string }) {
  if (!hasEmailDelivery(env)) throw new Error("Authentication email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: env.AUTH_EMAIL_FROM, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}

export function authEmail(kind: "verify" | "reset", url: string) {
  const title = kind === "verify" ? "Verify your LovTokens email" : "Reset your LovTokens password";
  const action = kind === "verify" ? "Verify email" : "Reset password";
  const explanation = kind === "verify" ? "Confirm this email address for your LovTokens account." : "Use this secure link to choose a new LovTokens password.";
  const zhExplanation = kind === "verify" ? "请确认这是你的 LovTokens 账号邮箱。" : "请使用此安全链接设置新的 LovTokens 密码。";
  return {
    subject: title,
    text: `${explanation}\n${zhExplanation}\n\n${url}\n\nIf you did not request this, you can ignore this email. 如果并非你本人操作，请忽略此邮件。`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111512"><h1 style="font-size:28px">${title}</h1><p style="line-height:1.7">${explanation}<br>${zhExplanation}</p><p><a href="${escapeAttribute(url)}" style="display:inline-block;background:#111512;color:#fff;padding:13px 18px;text-decoration:none;font-weight:700">${action}</a></p><p style="color:#646a64;font-size:13px;line-height:1.6">If you did not request this, you can ignore this email.<br>如果并非你本人操作，请忽略此邮件。</p></div>`,
  };
}

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
