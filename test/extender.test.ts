import { expect, haveResource } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as path from 'path'
import { Extender } from '../src/extender'

const resources: string[] = [
  'AWS::IAM::Role',
  'AWS::ECS::Cluster',
  'AWS::ECS::TaskDefinition',
]

test('extender spawns required resources', () => {
  const app = new cdk.App()
  const stack = new cdk.Stack(app, 'Stack', {})
  const vpc = new ec2.Vpc(stack, 'Vpc', {})

  new Extender(stack, 'Ext', {
    name: 'test',
    image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../docker')),
    vpc,

    apiBaseUrl: 'https://example.privx.io',
    apiClientID: 'foo',
    apiClientSecret: 'bar',
    apiOAuth2Secret: 'foobar',
  })

  resources.forEach(x => expect(stack).to(haveResource(x)))
})