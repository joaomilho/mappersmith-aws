import { MiddlewareDescriptor, AbortFn, RequestGetter, Request } from "mappersmith"
import * as AWS from "aws-sdk"
import { sigv4 } from "./sigv4"
import { parse } from "url"

interface AWSMiddlewareDescriptor extends MiddlewareDescriptor {
  prepareRequest(next: RequestGetter, abort: AbortFn): Promise<Request | void>
}

export type AWSMiddleware = {
  (): AWSMiddlewareDescriptor
}

export function configAWSMiddleware({
  systemClockOffset = 0,
  region,
  service,
  logger = console,
  credentialsProvider = async () => AWS.config.credentialProvider?.resolvePromise(),
}: {
  systemClockOffset?: number
  region: string
  service: string
  logger?: Console
  credentialsProvider?(): Promise<AWS.Credentials | undefined>
}): AWSMiddleware {
  return function AWSMiddleware() {
    return {
      prepareRequest(next, abort) {
        return next().then(async (request) => {
          const method = request.method()
          const path = request.path()
          const params = request.params()
          const body = request.body() || ""
          const headers = request.headers()
          const { host } = parse(request.host())

          if (!host) throw new Error("Invalid host")

          const credentials = await credentialsProvider()

          if (!credentials) throw new Error("Credentials not found")

          const { sessionToken, accessKeyId, secretAccessKey } = credentials

          const { authorization, timestamp, info } = await sigv4({
            method,
            path,
            region,
            host,
            secretKey: secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
            accessKey: accessKeyId,
            systemClockOffset,
            params,
            body,
            headers,
            service,
          })

          logger.info(info)

          const newHeaders: Record<string, string> = {
            Authorization: authorization,
            "x-amz-date": timestamp,
          }

          if (sessionToken) newHeaders["x-amz-security-token"] = sessionToken

          return request.enhance({ headers: newHeaders })
        })
      },
    }
  }
}
