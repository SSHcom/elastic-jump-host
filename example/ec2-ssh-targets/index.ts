import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as c3 from '@ssh.com/c3'

// Global app config
const app = new cdk.App()
const stack = new cdk.Stack(app, 'ec2-ssh-targets', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})

const policyName = app.node.tryGetContext('name') || 'defext'
const vpcId = app.node.tryGetContext('vpc')

//
const vpc = ec2.Vpc.fromLookup(stack, 'Vpc', { vpcId })

//
const zeroTrustAccessPolicy: c3.zerotrust.AccessPolicy = {
  policyName,
  audit: true,
}

const nodes = new c3.zerotrust.AutoScalingGroup(stack, 'Nodes', {
  zeroTrustAccessPolicy,

  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },

  instanceType: new ec2.InstanceType('t3.small'),
  machineImage: new ec2.AmazonLinuxImage({
    generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
  }),

  desiredCapacity: 2,
  maxCapacity: 4,
  minCapacity: 1,
})

//
const sg = new ec2.SecurityGroup(stack, 'Sg', {
  vpc
})
sg.connections.allowFromAnyIpv4(new ec2.Port({
  protocol: ec2.Protocol.TCP,
  fromPort: 22,
  toPort: 22,
  stringRepresentation: 'ssh access'
}))
nodes.addSecurityGroup(sg)

app.synth()
