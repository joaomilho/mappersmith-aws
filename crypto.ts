import * as _sha256 from "crypto-js/sha256"
import * as _hmac from "crypto-js/hmac-sha256"
import * as CryptoJS from "crypto-js"

export type Hash = CryptoJS.lib.WordArray

interface HasherHelper {
  (message: Hash | string, cfg?: object): Hash
}

export function sha256(message: Hash | string): Hash {
  return _sha256(message)
}

export function hmac(message: Hash | string, key: Hash | string): Hash {
  return _hmac(message, key)
}
