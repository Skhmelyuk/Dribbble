// Маскує email для відображення на екрані підтвердження коду,
// напр. "user@example.com" -> "u*******@e******.com"
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email

  const maskedLocal = local.length <= 1 ? local : local[0] + '*'.repeat(Math.max(local.length - 1, 3))

  const domainParts = domain.split('.')
  const domainName = domainParts[0] ?? ''
  const tld = domainParts.slice(1).join('.')
  const maskedDomain =
    domainName.length <= 1 ? domainName : domainName[0] + '*'.repeat(Math.max(domainName.length - 1, 3))

  return `${maskedLocal}@${maskedDomain}${tld ? '.' + tld : ''}`
}
