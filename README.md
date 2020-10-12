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

<table width="100%" style="width: 100%">
  <tr>
    <th align="left">
      region
    </th>
    <td>
      mandatory
    </td>
    <td>
      <code>string</code>
    </td>
    <td>
      --
    </td>
  </tr>
  <tr>
    <td colspan="4">
      AWS region.
    </td>
  </tr>

  <tr>
    <th align="left">
      service
    </th>
    <td>
      mandatory
    </td>
    <td>
      <code>string</code>
    </td>
    <td>
      --
    </td>
  </tr>

  <tr>
    <td colspan="4">
      Name of the AWS service (s3, execute-api, etc...).
    </td>
  </tr>

  <tr>
    <th align="left">
      systemClockOffset
    </th>
    <td>
      optional
    </td>
    <td>
      <code>number</code>
    </td>
    <td>
      <code>0</code>
    </td>
  </tr>
  <tr>
    <td colspan="4">
      Compensate for clock skew when your system may be out of sync with the AWS service time.
    </td>
  </tr>

  <tr>
    <th align="left">
      logger
    </th>
    <td>
      optional
    </td>
    <td>
      <code>Console</code>
    </td>
    <td>
      <code>console</code>
    </td>
  </tr>
  <tr>
    <td colspan="4">
      A logger to write debug details.
    </td>
  </tr>

  <tr>
    <th align="left">
      credentialsProvider
    </th>
    <td>
      optional
    </td>
    <td>
      <code>(): Promise&ltAWS.Credentials&gt</code>
    </td>
    <td>
      <code>() => AWS.config.credentialProvider.resolvePromise()<code>
    </td>
  </tr>
  <tr>
    <td colspan="4">
      An async function returning AWS credentials.
    </td>
  </tr>
</table>
