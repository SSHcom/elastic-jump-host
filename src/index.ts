import * as cdk from '@aws-cdk/core'
import { Stack } from './stack'

const app = new cdk.App()

const name = app.node.tryGetContext('name')
new Stack(app, `extender-${name}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})

app.synth()
