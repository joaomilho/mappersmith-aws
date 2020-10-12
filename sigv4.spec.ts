import { sigv4 } from "./sigv4"

const defaultParams = {
  systemClockOffset: 0,
  region: "mars-east-1",
  host: "test.com",
  body: "body",
  headers: {},
  secretKey: "1234",
  accessKey: "5678",
  method: "get",
  path: "/test",
  service: "invoke-api",
  params: {},
  now: new Date("1982-12-17"),
}

describe("sigv4", () => {
  test("timestamp", async () => {
    const { timestamp } = await sigv4(defaultParams)
    expect(timestamp).toBe("19821217T000000Z")
  })

  test("empty headers", async () => {
    const { authorization } = await sigv4(defaultParams)

    expect(authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=5678/19821217/mars-east-1/invoke-api/aws4_request, SignedHeaders=host, Signature=360f2899628fa984738ab0247bcc795539d1c199f1ba74a0697e0c8e12fcd854"
    )
  })

  test("with headers", async () => {
    const { authorization } = await sigv4({
      ...defaultParams,
      headers: {
        test1: "some value",
        test2: "another value",
      },
    })

    expect(authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=5678/19821217/mars-east-1/invoke-api/aws4_request, SignedHeaders=host;test1;test2, Signature=1f7ecf94467208b809ddb0011cd30e5540590d220a563b71c6a23b5a2ff5f84d"
    )
  })

  test("with params", async () => {
    const { authorization } = await sigv4({
      ...defaultParams,
      params: {
        test1: "some value",
        test2: "another value",
      },
      now: new Date("1982-12-17"),
    })

    expect(authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=5678/19821217/mars-east-1/invoke-api/aws4_request, SignedHeaders=host, Signature=6c11a8f9fcd18a942efde4d43c388d4d3d97a057a8d40bc5b1dd977fcf620f18"
    )
  })

  test("info", async () => {
    const {
      info: { canonicalRequest, stringToSign },
    } = await sigv4({
      ...defaultParams,
      headers: {
        test1: "some value",
        test2: "another value",
      },
      params: {
        param1: "some value",
        param2: "another value",
      },
    })

    expect(canonicalRequest.split("\n")).toEqual([
      "GET",
      "/test",
      "param1=some%20value&param2=another%20value",
      "host:test.com",
      "test1:some value",
      "test2:another value",
      "",
      "host;test1;test2",
      "230d8358dc8e8890b4c58deeb62912ee2f20357ae92a5cc861b98e68fe31acb5",
    ])
    expect(stringToSign.split("\n")).toEqual([
      "AWS4-HMAC-SHA256",
      "19821217T000000Z",
      "19821217/mars-east-1/invoke-api/aws4_request",
      "d6fda0e19cac2768282950d4fbd7922ae15b9197231d18095cac2cbc41f9ff44",
    ])
  })
})
