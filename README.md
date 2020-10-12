# mappersmith-aws

Mappersmith middeware for AWS Signature Version 4 signing process.

## Usage

```js
import forge from "mappersmith"
import { configAWSMiddleware } from "mappersmith-aws"

const AWSMiddleware = configAWSMiddleware({ 
  region: "us-east-1",
  service: "execute-api"
})

const api = forge({
  middleware: [
      ...,
      AWSMiddleware
  ]
  ...
})
```

> Important: the middleware should always be the last one in your API definitions since it needs to be aware of all headers.

### Params:

**systemClockOffset** 
<small>number</small> `0`
Compensate for clock skew when your system may be out of sync with the AWS service time.

**region**
<small>string</small> `"us-east-1"`
AWS region.

**service**
<small>string</small> `undefined`
Name of the AWS service (s3, execute-api, etc...).

**logger**
<small>Console</small> `console`
A logger to write debug details.

**credentialsProvider**
<small>() => Promise\<AWS.Credentials\></small> `() => AWS.config.credentialProvider.resolvePromise()`
An async function returning credentials.