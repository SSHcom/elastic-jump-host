# PrivX Extender on AWS

AWS VPC with private subnets is a right approach to deploy a EC2-based workload. A challenge is the access to these nodes without getting into credential management trouble. PrivX Extender along with [PrivX SaaS](https://signup.privx.io/leanpam/) implements Zero Trust, password/key-less access solution for EC2 instances.

## Challenge 

A classical multi-tier architecture built with public and private subnets. It is recommended to run only an Internet-facing access point on public IP, while keeping other components inside private networks. Here is a common example with AWS: Application Load Balancer runs on a public network; database servers and virtual machines on private. How do you implement the control plane in this architecture? Despite the Infrastructure as a Code solutions, engineering teams still must access instances to conduct experiments and probe configurations, consult system logs, or debug application issues. Secure Shell (SSH) and Remote Desktop (RDP) are protocols to access Linux/Windows servers.  

Usage of jump hosts, bastions, VPNs or other naive access gateways causes a risk of security threats. These threats are connected with needs to maintain access credentials, store, rotate and share them. According to Verizon report, 81% of all breaches are caused by stolen credentials. Many are struggling to properly manage credentials and prevent credentials-related attacks.

Think beyond VPNs, jump hosts or bastion hosts...


## Inspiration

Having seen how permanent passwords and left-behind and forgotten credentials enable access to critical environments years after they were actually created and needed, we started the PrivX SaaS in order to get rid of the passwords and keys – to get rid of any permanent access altogether.

PrivX SaaS builds a solution for you that only grants access when it's needed & on the level needed, so called Zero Trust identity. It automates the process of granting and revoking access by integrating & fetching identities and roles from your identity management system and ensures your engineering and admin staff have one-click access to the right infrastructure resources at the right access level. You will also get full audit trail and monitoring - vital if you are handling sensitive data or for example open access for third parties to your environment. All access to enterprise resources is fully authenticated, fully authorized, and fully encrypted based upon device state and user credentials.

PrivX Extender enables PrivX to reach fire-walled private networks or virtual private clouds. Once deployed in the private network, it will establish a number of websocket connections to PrivX to route traffic from PrivX proxies to the target network. Here is the Infrastructure as a Code, it eliminates an engineering toil on PrivX Extender deployment to your AWS account.

![PrivX Extender and Its Environment](doc/arch.svg "PrivX Extender and Its Environment")

This solution goes beyond the deployment. It automates few extra required configuration steps:
* registers the extender with your PrivX SaaS instance;
* creates the PrivX role that govern control plane access to this VPC;
* imports requires SSH keys to target AWS account so that target EC2 instances are accessible via PrivX;
* optionally it automatically enables access to target nodes.

Just for your information, this project utilizes serverless technology to run the extender deployment. Everything is managed for you!


## Getting Started

The latest version of Infrastructure as a Code is available at the main branch of this repository. All development, including new features and bug fixes, take place on the master branch using forking and pull requests as described in contribution guidelines. If you find any issue with the project or missing a feature please open an [issue to us](https://github.com/SSHcom/extender-on-aws/issues).


1. Sign Up for [PrivX SaaS](https://signup.privx.io/leanpam/).

2. Obtain [access to target AWS Account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html). You shall have the ability to create/delete AWS resources. Ultimately, you are deploying this solution to your own AWS account.

3. Clone extender-on-aws repository
```bash
git clone https://github.com/SSHcom/extender-on-aws
cd extender-on-aws
```

4. Configure access rights to your AWS account
```bash
export AWS_ACCESS_KEY_ID=Your-Access-Key
export AWS_SECRET_ACCESS_KEY=Your-Secret-Key
export CDK_DEFAULT_ACCOUNT=Your-Account-Id
export CDK_DEFAULT_REGION=eu-west-1
export AWS_DEFAULT_REGION=eu-west-1
```

5. We are using [AWS CDK](https://github.com/aws/aws-cdk) and [TypeScript](https://github.com/microsoft/typescript) to code this Infrastructure as a Code project. You have to configure your development environment with [node and npm](https://nodejs.org/en/download/) version 10.x or later and install required components.
```bash
## with brew on MacOS
brew install node

## then install CDK
npm install -g typescript ts-node aws-cdk
```

6. Install dependencies
```bash
npm install
```

7. Configure and bootstrap target AWS region with AWS CDK. You have to bootstrap a region only once during life time
```bash
cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}
```

8. Obtain access/secret keys from PrivX Instance so that the extender is able to configure an access to your private subnet. 
  - Login as `superuser`
  - Go to: Settings > Deployment > Integrate with PrivX Using API clients
  - Create new API client (or use existing one)
  - Give a client permissions: `api-clients-manage`, `roles-view`, `roles-manage`
  - Deployment process requires: `OAuth Client Secret`, `API Client ID` and `API Client Secret` values. 

9. Use AWS CDK command line tools to deploy PrivX extender to your AWS Account
```bash
cdk deploy extender-yourname \
  -c name=yourname \
  -c vpc=vpc-00000000000000000 \
  -c api=https://example.privx.io \
  -c client-id=your-api-client-id \
  -c client-secret=your-api-client-secret \
  -c oauth2-secret=your-oauth-secret

## Note the deployment requires:
##    name           Unique name of the extender. It MUST contain only latin letters 
##                   and digits. This name is used to create a role and name ssh key pair.
##
##    vpc            Unique identity of existing VPC, extender is deployed to this VPC.
##
##    api            HTTPS address to PrivX API (e.g. https://example.privx.io)
##
##    client-id      Your API-Client-ID, see previous stage
##
##    client-secret  Your API-Client-Secret, see previous stage
##
##    oauth2-secret  Your OAuth-Client-Secret, see previous stage
##
```

10. In a few minutes, your own instance of PrivX Extender is available. Login to PrivX to observe its status.


## Next Steps

Usage of [AWS Host Directory](https://help.ssh.com/support/solutions/articles/36000194728-getting-started-with-privx#privx-gettingstarted-hostdirectories) is an easiest way to on-board hosts from your AWS account. Please note, this stack creates AWS User `extender-yourname-hostscan` with only `ec2:Describe*` permission. Use it for the directory definition. 

As a post install stage, you can validate functionality of PrivX Extender with example SSH targets. Use this example to automate your IaC delivery.

```bash
cdk example/ec2-ssh-targets
npm install

cdk deploy ec2-ssh-targets \
  -c name=yourname \
  -c vpc=vpc-00000000000000000
```

## Bugs

If you experience any issues with the library, please let us know via [GitHub issues](https://github.com/SSHcom/extender-on-aws/issues). We appreciate detailed and accurate reports that help us to identify and replicate the issue.

* **Specify** the configuration of your environment. Include which operating system you use and the versions of runtime environments.

* **Attach** logs, screenshots and exceptions, if possible.

* **Reveal** the steps you took to reproduce the problem, include code snippet or links to your project.


## How To Contribute

The project is [MIT](LICENSE) licensed and accepts contributions via GitHub pull requests:

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

The development requires TypeScript and AWS CDK

```bash
npm install -g typescript ts-node aws-cdk
```

```bash
git clone https://github.com/SSHcom/extender-on-aws
cd privx-on-aws

npm install
npm run build
npm run test
npm run lint
```

## References

1. [Passwords Are Still a Problem According to the 2019 Verizon Data Breach Investigations Report](http://blog.lastpass.com/2019/05/passwords-still-problem-according-2019-verizon-data-breach-investigations-report/)

## License

[![See LICENSE](https://img.shields.io/github/license/SSHcom/extender-on-aws.svg?style=for-the-badge)](LICENSE)
