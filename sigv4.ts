import { Parameters, Headers } from "mappersmith"
import { hmac, sha256, Hash } from "./crypto"

const algo = "AWS4-HMAC-SHA256"

function builCanonicalRequest(
  method: string,
  path: string,
  params: Parameters,
  headers: Headers,
  body: string | object
) {
  return [
    method.toUpperCase(),
    encodeURI(path),
    buildCanonicalQueryString(params),
    buildCanonicalHeaders(headers),
    buildCanonicalSignedHeaders(headers),
    sha256(body.toString()),
  ].join("\n")
}

function buildCanonicalQueryString(params: Parameters): string {
  return Object.keys(params)
    .sort()
    .map((key) => [key, fixedEncodeURIComponent(String(params[key]))].join("="))
    .join("&")
}

function fixedEncodeURIComponent(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16))
}

function buildCanonicalHeaders(headers: Headers): string {
  return (
    Object.keys(headers)
      .sort()
      .map((key) => [key.toLowerCase(), headers[key]].join(":"))
      .join("\n") + "\n"
  )
}

function buildCanonicalSignedHeaders(headers: Headers): string {
  return Object.keys(headers).sort().join(";")
}

function buildStringToSign(
  timestamp: string,
  credentialScope: string,
  hashedCanonicalRequest: Hash
): string {
  return [algo, timestamp, credentialScope, hashedCanonicalRequest].join("\n")
}

function buildCredentialScope(date: string, region: string, service: string): string {
  return [date, region, service, "aws4_request"].join("/")
}

function calculateSigningKey(
  secretKey: string,
  date: string,
  region: string,
  service: string
): Hash {
  return hmac("aws4_request", hmac(service, hmac(region, hmac(date, "AWS4" + secretKey))))
}

function buildAuthorizationHeader(
  accessKey: string,
  credentialScope: string,
  headers: Headers,
  signature: Hash
): string {
  const credential = [accessKey, credentialScope].join("/")
  const signedHeaders = buildCanonicalSignedHeaders(headers)

  return `${algo} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

export async function sigv4({
  systemClockOffset = 0,
  region,
  host,
  params,
  body,
  headers,
  secretKey,
  accessKey,
  method,
  path,
  service,
  now = new Date(),
}: {
  systemClockOffset?: number
  region: string
  host: string
  params: Parameters
  body: string | object
  headers: Headers
  secretKey: string
  accessKey: string
  method: string
  path: string
  service: string
  now?: Date
}) {
  headers = { ...headers, host }

  const timestamp = new Date(now.getTime() + systemClockOffset)
    .toISOString()
    .replace(/[:\-]|\.\d{3}/g, "")
  const date = timestamp.substr(0, 8)

  const canonicalRequest = builCanonicalRequest(method, path, params, headers, body)
  const hashedCanonicalRequest = sha256(canonicalRequest)
  const credentialScope = buildCredentialScope(date, region, service)
  const stringToSign = buildStringToSign(timestamp, credentialScope, hashedCanonicalRequest)
  const signingKey = calculateSigningKey(secretKey, date, region, service)

  const signature = hmac(stringToSign, signingKey)
  const authorization = buildAuthorizationHeader(accessKey, credentialScope, headers, signature)

  return { authorization, timestamp, info: { canonicalRequest, stringToSign } }
}
