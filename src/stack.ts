import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as path from 'path'
import { Extender } from './extender'

export class Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props)
    const name = scope.node.tryGetContext('name') || 'defext'
    const vpcId = scope.node.tryGetContext('vpc')
    const apiBaseUrl = scope.node.tryGetContext('api')
    const apiClientID = scope.node.tryGetContext('client-id')
    const apiClientSecret = scope.node.tryGetContext('client-secret')
    const apiOAuth2Secret = scope.node.tryGetContext('oauth2-secret')

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId })

    new Extender(this, 'Ext', {
      name,
      image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../docker')),
      vpc,

      apiBaseUrl,
      apiClientID,
      apiClientSecret,
      apiOAuth2Secret,
    })
  }
}
