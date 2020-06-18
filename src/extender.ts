import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as log from '@aws-cdk/aws-logs'

export interface ExtenderProps {
  readonly name: string
  readonly image: ecs.ContainerImage
  readonly vpc: ec2.IVpc
  readonly cpu?: number
  readonly memoryLimitMiB?: number

  readonly apiBaseUrl: string
  readonly apiClientID: string
  readonly apiClientSecret: string
  readonly apiOAuth2Secret: string
}

export class Extender extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ExtenderProps) {
    super(scope, id)

    //
    // execution role is required to bootstrap cluster operations
    // see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
    const executionRole = new iam.Role(this, 'EcsBoot', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    })
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
      })
    )
    
    //
    // 
    const taskRole = new iam.Role(this, 'ExtPerm', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    })
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          "ec2:ImportKeyPair",
        ],
      })
    )

    //
    const cluster = new ecs.Cluster(this, 'Ecs', {
      vpc: props.vpc
    })

    //
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'EcsTask', {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      executionRole,
      taskRole,
    })

    taskDefinition.addContainer('extender', {
      image: props.image,
      memoryLimitMiB: props.memoryLimitMiB,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: props.name,
        logRetention: log.RetentionDays.ONE_MONTH,
      }),
      environment: {
        'PRIVX_API_BASE_URL': props.apiBaseUrl,
        'PRIVX_API_CLIENT_ID': props.apiClientID,
        'PRIVX_API_CLIENT_SECRET': props.apiClientSecret,
        'PRIVX_API_OAUTH_CLIENT_ID': 'privx-external',
        'PRIVX_API_OAUTH_CLIENT_SECRET': props.apiOAuth2Secret,
        'PRIVX_EXTENDER': props.name,
      },
    })

    new ecs.FargateService(this, 'Service', {
      cluster,
      desiredCount: 1,
      taskDefinition,
      serviceName: props.name,
    })
  }

}