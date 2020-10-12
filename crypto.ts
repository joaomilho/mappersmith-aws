import * as _sha256 from "crypto-js/sha256"
import * as _hmac from "crypto-js/hmac-sha256"
import * as CryptoJS from "crypto-js"

export const sha256 = _sha256
export const hmac = _hmac
export type Hash = CryptoJS.lib.WordArray
