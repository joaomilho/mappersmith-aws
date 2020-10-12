import { configAWSMiddleware, AWSMiddleware } from "./"
// @ts-ignore
import MethodDescriptor from "mappersmith/method-descriptor"
// @ts-ignore
import Request from "mappersmith/request"
import { RequestGetter } from "mappersmith"
import MockDate from "mockdate"
import { Credentials } from "aws-sdk"

const logger = ({ info: () => {} } as unknown) as Console

function createTestMiddleware(override = {}) {
  const credentialsProvider = async () =>
    ({
      accessKeyId: "accessKeyId",
      secretAccessKey: "secretAccessKey",
      ...override,
    } as Credentials)

  return configAWSMiddleware({ region: "us-east-1", service: "foo", credentialsProvider, logger })
}

async function runMiddleware(middleware: AWSMiddleware, headers = {}, params = {}) {
  const { prepareRequest } = middleware()

  const methodDescriptor = new MethodDescriptor({
    path: "/test",
    host: "https://test.com",
  })
  const request = new Request(methodDescriptor, {
    ...params,
    body: "some body",
    headers,
  })

  const next = () => Promise.resolve(request)
  return await prepareRequest((next as unknown) as RequestGetter, () => {})
}

describe("configAWSMiddleware", () => {
  beforeEach(() => {
    MockDate.set(new Date("1982-12-24"))
  })

  afterEach(() => {
    MockDate.reset()
  })

  it("returns named middleware", () => {
    expect(createTestMiddleware().name).toBe("AWSMiddleware")
  })

  it("adds authorization and date headers to request", async () => {
    const middleware = createTestMiddleware()
    const result = await runMiddleware(middleware)
    // @ts-ignore
    expect(result.requestParams).toEqual({
      body: "some body",
      headers: {
        Authorization:
          "AWS4-HMAC-SHA256 Credential=accessKeyId/19821224/us-east-1/foo/aws4_request, SignedHeaders=host, Signature=2c4ff17d9a70c33984fa2e086988ccb8d2fee1a8e652717fab7ffd7207111f73",
        "x-amz-date": "19821224T000000Z",
      },
    })
  })

  it("adds amazon security token if given by the credentials provided", async () => {
    const middleware = createTestMiddleware({ sessionToken: "sessionToken" })
    const result = await runMiddleware(middleware)
    // @ts-ignore
    expect(result.requestParams).toEqual({
      body: "some body",
      headers: {
        Authorization:
          "AWS4-HMAC-SHA256 Credential=accessKeyId/19821224/us-east-1/foo/aws4_request, SignedHeaders=host, Signature=2c4ff17d9a70c33984fa2e086988ccb8d2fee1a8e652717fab7ffd7207111f73",
        "x-amz-date": "19821224T000000Z",
        "x-amz-security-token": "sessionToken",
      },
    })
  })

  it("adds any preexisting headers to the signature", async () => {
    const middleware = createTestMiddleware()
    const result = await runMiddleware(middleware, { "x-test": "19821217" })
    // @ts-ignore
    expect(result.requestParams).toEqual({
      body: "some body",
      headers: {
        Authorization:
          "AWS4-HMAC-SHA256 Credential=accessKeyId/19821224/us-east-1/foo/aws4_request, SignedHeaders=host;x-test, Signature=ccdbf4524731b45a3799a81f183e2479c040df33aba13a50442fda31e562e94e",
        "x-test": "19821217",
        "x-amz-date": "19821224T000000Z",
      },
    })
  })

  it("adds params to the signature", async () => {
    const middleware = createTestMiddleware()
    const result = await runMiddleware(middleware, {}, { param1: "value" })
    // @ts-ignore
    expect(result.requestParams).toEqual({
      body: "some body",
      headers: {
        Authorization:
          "AWS4-HMAC-SHA256 Credential=accessKeyId/19821224/us-east-1/foo/aws4_request, SignedHeaders=host, Signature=f0e49c7ed215737f438c867145f6cd86d673ee14e2041c06cc5c77cf82af4282",
        "x-amz-date": "19821224T000000Z",
      },
      param1: "value",
    })
  })
})
