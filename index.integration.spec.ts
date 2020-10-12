import { Credentials } from "aws-sdk"
jest.mock("aws-sdk", () => {
  return {
    config: {
      credentialProvider: {
        resolvePromise: () =>
          ({
            accessKeyId: "accessKeyId",
            secretAccessKey: "secretAccessKey",
            sessionToken: "sessionToken",
          } as Credentials),
      },
    },
  }
})

import { install, uninstall, mockClient } from "mappersmith/test"

import forge from "mappersmith"
import { configAWSMiddleware } from "./"

const logger = ({ info: jest.fn() } as unknown) as Console

const AWSMiddleware = configAWSMiddleware({ region: "us-east-1", service: "execute-api", logger })
const api = forge({
  clientId: "test",
  host: "https://test.execute-api.us-east-1.amazonaws.com",
  middleware: [AWSMiddleware],
  resources: {
    test: {
      get: { path: "/test", method: "get" },
      post: { path: "/test", method: "post" },
    },
  },
})

describe("AWSMiddleware", () => {
  beforeEach(() => install())
  afterEach(() => uninstall())

  test("get", async () => {
    mockClient(api).resource("test").method("get").response({ ok: true })

    const response = await api.test.get()

    // @ts-ignore
    expect(response.originalRequest?.requestParams).toEqual({
      headers: {
        Authorization: expect.stringMatching(
          /^AWS4-HMAC-SHA256 Credential=accessKeyId\/\d{8}\/us-east-1\/execute-api\/aws4_request, SignedHeaders=host, Signature=[a-f0-9]{64}$/
        ),
        "x-amz-date": expect.stringMatching(/^\d{8}T\d{6}Z$/),
        "x-amz-security-token": "sessionToken",
      },
    })

    expect(logger.info).toHaveBeenCalledWith({
      canonicalRequest: expect.stringMatching(
        /^GET\n\/test\n\nhost:test\.execute-api\.us-east-1\.amazonaws\.com\n\nhost\n[a-f0-9]{64}$/
      ),
      stringToSign: expect.stringMatching(
        /^AWS4-HMAC-SHA256\n\d{8}T\d{6}Z\n\d{8}\/us-east-1\/execute-api\/aws4_request\n[a-f0-9]{64}$/
      ),
    })
  })

  test("post with headers", async () => {
    mockClient(api).resource("test").method("post").with({ body: "body" }).response({ ok: true })

    const response = await api.test.post({ body: "body", headers: { test: "test" } })

    // @ts-ignore
    expect(response.originalRequest?.requestParams).toEqual({
      body: "body",
      headers: {
        Authorization: expect.stringMatching(
          /^AWS4-HMAC-SHA256 Credential=accessKeyId\/\d{8}\/us-east-1\/execute-api\/aws4_request, SignedHeaders=host;test, Signature=[a-f0-9]{64}$/
        ),
        "x-amz-date": expect.stringMatching(/^\d{8}T\d{6}Z$/),
        "x-amz-security-token": "sessionToken",
        test: "test",
      },
    })

    expect(logger.info).toHaveBeenCalledWith({
      canonicalRequest: expect.stringMatching(
        /^GET\n\/test\n\nhost:test\.execute-api\.us-east-1\.amazonaws\.com\n\nhost\n[a-f0-9]{64}$/
      ),
      stringToSign: expect.stringMatching(
        /^AWS4-HMAC-SHA256\n\d{8}T\d{6}Z\n\d{8}\/us-east-1\/execute-api\/aws4_request\n[a-f0-9]{64}$/
      ),
    })
  })
})
