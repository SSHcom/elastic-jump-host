//
// Copyright (C) 2020 SSH Communications Security Corp.
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/SSHcom/extender-on-aws
//
package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/SSHcom/privx-sdk-go/api/config"
	"github.com/SSHcom/privx-sdk-go/api/rolestore"
	"github.com/SSHcom/privx-sdk-go/api/userstore"
	"github.com/SSHcom/privx-sdk-go/oauth"
	"github.com/SSHcom/privx-sdk-go/restapi"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
)

/*

Requires env config:

export PRIVX_API_BASE_URL=
export PRIVX_API_CLIENT_ID=
export PRIVX_API_CLIENT_SECRET=
export PRIVX_API_OAUTH_CLIENT_ID=
export PRIVX_API_OAUTH_CLIENT_SECRET=
export PRIVX_EXTENDER=

Requires Permissions:

- api-clients-manage
- roles-view
- roles-manage

*/

func main() {
	name, ok := os.LookupEnv("PRIVX_EXTENDER")
	if !ok {
		panic(fmt.Errorf("Undefined required env variable PRIVX_EXTENDER."))
	}

	//
	auth := oauth.WithClientID(
		restapi.New(restapi.UseEnvironment()),
		oauth.UseEnvironment(),
	)

	curl := restapi.New(
		restapi.Auth(auth),
		restapi.UseEnvironment(),
	)

	key, err := resolveRole(curl, name)
	if err != nil {
		panic(err)
	}

	if err := importKey(name, key); err != nil {
		panic(err)
	}

	cfg, err := registerExtender(curl, name)
	if err != nil {
		panic(err)
	}

	fmt.Println(string(cfg))
}

//
func registerExtender(curl restapi.Connector, name string) ([]byte, error) {
	api := userstore.New(curl)
	seq, err := api.TrustedClients()
	if err != nil {
		return nil, err
	}

	for _, cli := range seq {
		if cli.Type == userstore.EXTENDER && cli.Name == name {
			if err = api.DeleteTrustedClient(cli.ID); err != nil {
				return nil, err
			}
		}
	}

	id, err := api.CreateTrustedClient(userstore.Extender(name))
	if err != nil {
		return nil, err
	}

	return config.New(curl).ConfigExtender(id)
}

//
func resolveRole(curl restapi.Connector, name string) (string, error) {
	api := rolestore.New(curl)

	refs, err := api.ResolveRoles([]string{name})
	if err != nil {
		return "", err
	}

	id := ""
	if len(refs) == 0 {
		id, err = api.CreateRole(rolestore.Role{
			Name:       name,
			SourceRule: rolestore.SourceRuleNone(),
		})
		if err != nil {
			return "", err
		}
	} else {
		id = refs[0].ID
	}

	for {
		role, err := api.Role(id)
		if err != nil {
			return "", err
		}

		if !strings.HasPrefix(role.PublicKey[0], "Generating") {
			return role.PublicKey[0], nil
		}

		time.Sleep(5 * time.Second)
	}
}

//
func importKey(name string, key string) error {
	sess := session.Must(session.NewSession())
	svc := ec2.New(sess)

	input := &ec2.ImportKeyPairInput{
		KeyName:           aws.String(name),
		PublicKeyMaterial: []byte(key),
	}

	_, err := svc.ImportKeyPair(input)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok && aerr.Code() == "InvalidKeyPair.Duplicate" {
			return nil
		}
		return err
	}

	return nil
}
