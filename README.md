# PrivX Extender on AWS

AWS VPC with private subnets is a right approach to deploy a EC2-based workload. A challenge is the access to these nodes!
PrivX Extender along with [PrivX SaaS](https://privx.io) implements Zero Trust, password/key-less access solution for EC2 instances. 


## Inspiration

Having seen how permanent passwords and left-behind and forgotten SSH keys enable access to critical environments years after they were actually created and needed, we started the PrivX project in order to get rid of the passwords and keys – to get rid of any permanent access altogether.

PrivX Extender enables PrivX to reach fire-walled private networks or virtual private clouds. Once deployed in the private network, it will establish a number of websocket connections to PrivX to route traffic from PrivX proxies to the target network. Learn more about [PrivX Architecture here](https://help.ssh.com/support/solutions/articles/36000205951-privx-architecture).

The configuration of Extender requires a few manual steps. This project automates required steps and delivers them using Infrastructure as a Code:

1. Acquire the hardware to run PrivX Extender.
2. Install PrivX Extender using RPM package.
3. Register the extender to with PrivX instance.
4. Create a PrivX role that govern access for PrivX users.
5. Import SSH Key and binds it with target nodes. 

The following architecture diagram highlights the entire solution.

![PrivX Extender and Its Environment](doc/arch.svg "PrivX Extender and Its Environment")


## Getting Started

The latest version of Infrastructure as a Code is available at `master` branch of the repository. All development, including new features and bug fixes, take place on the master branch using forking and pull requests as described in contribution guidelines.


### Requirements

1. We are using [AWS CDK](https://github.com/aws/aws-cdk) and [TypeScript](https://github.com/microsoft/typescript) to code this Infrastructure as a Code project. You have to configure your development environment with [node and npm](https://nodejs.org/en/download/) version 10.x or later and install required components.

```bash
## with brew on MacOS
brew install node

## then install CDK
npm install -g typescript ts-node aws-cdk
```

2. Obtain [access to target AWS Account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html). You shall have ability to create/delete AWS resources. Ultimately, you are deploying this solution to your own AWS account.

3. This is only an extension to existing PrivX deployment. You have to obtain either [PrivX SaaS](https://privx.io) instance or built it [yourself](https://github.com/SSHcom/privx-on-aws).


### Deployments

Use AWS CDK command line tools to deploy PrivX to your AWS Account. **Please note**, the process consists of multiple stages:

```bash
##
## 1. clone extender-on-aws repository locally
git clone https://github.com/SSHcom/extender-on-aws
cd extender-on-aws

##
## 2. pre-config deployment process by configure environment and
##    installing dependent components  
export AWS_ACCESS_KEY_ID=Your-Access-Key
export AWS_SECRET_ACCESS_KEY=Your-Secret-Key
export CDK_DEFAULT_ACCOUNT=Your-Account-Id
export CDK_DEFAULT_REGION=eu-west-1
export AWS_DEFAULT_REGION=eu-west-1
npm install

##
## 3. configure and bootstrap target AWS region with AWS CDK.
##    You have to bootstrap a region only once during life time
cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}

##
## 4. obtain access/secret keys from PrivX Instance.
##    a) login as superuser
##    b) Settings > Deployment > Integrate with PrivX Using API clients
##    c) create new API client (or use existing one)
##    d) give a client permissions: api-clients-manage, roles-view, roles-manage
##    e) deployment process requires: OAuth Client Secret, API Client ID and API Client Secret 
##

## 5. deploy PrivX Extender you need to define a few variables here
##    name           Unique name of the extender. It MUST contain only latin letters 
##                   and digits. These name is used to create a role and name ssh key pair.
##
##    vpc            Unique identity of existing VPC, extender is deployed to this VPC.
##
##    api            HTTPS address to PrivX API (e.g. https://example.privx.io)
##
##    client-id      Your API-Client-ID, see stage 4
##
##    client-secret  Your API-Client-Secret, see stage 4
##
##    oauth2-secret  Your OAuth-Client-Secret, see stage 4
##
cdk deploy extender-yourname \
  -c name=yourname \
  -c vpc=vpc-00000000000000000 \
  -c api=https://example.privx.io \
  -c client-id=your-api-client-id \
  -c client-secret=your-api-client-secret \
  -c oauth2-secret=your-oauth-secret
```

In few minutes, your own instance of PrivX Extender is available. Login to PrivX to observe its status.

## Next Steps

Usage of [AWS Host Directory](https://help.ssh.com/support/solutions/articles/36000194728-getting-started-with-privx#privx-gettingstarted-hostdirectories) is an easiest way to on-board hosts from your AWS account. Please note, this stack creates AWS User `extender-yourname-hostscan` with only `ec2:Describe*` permission. Use it for the directory definition. 

As post install stage, you can validate functionality of PrivX Extender with example SSH targets. Use this example to automate your IaC delivery.

```bash
cdk example/ec2-ssh-targets
npm install

cdk deploy ec2-ssh-targets \
  -c name=yourname \
  -c vpc=vpc-00000000000000000
```

## Bugs

If you experience any issues with the library, please let us know via [GitHub issues](https://github.com/SSHcom/extender-on-aws/issues). We appreciate detailed and accurate reports that help us to identity and replicate the issue.

* **Specify** the configuration of your environment. Include which operating system you use and the versions of runtime environments.

* **Attach** logs, screenshots and exceptions, in possible.

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

## License

[![See LICENSE](https://img.shields.io/github/license/SSHcom/extender-on-aws.svg?style=for-the-badge)](LICENSE)
