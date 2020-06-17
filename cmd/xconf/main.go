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

	"github.com/SSHcom/privx-sdk-go/api/config"
	"github.com/SSHcom/privx-sdk-go/api/userstore"
	"github.com/SSHcom/privx-sdk-go/oauth"
	"github.com/SSHcom/privx-sdk-go/restapi"
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

* api-clients-manage

*/

func main() {
	name, ok := os.LookupEnv("PRIVX_EXTENDER")
	if !ok {
		panic(fmt.Errorf("Undefined env variable PRIVX_EXTENDER"))
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

	api := userstore.New(curl)
	seq, err := api.TrustedClients()
	if err != nil {
		panic(err)
	}

	for _, cli := range seq {
		if cli.Type == userstore.EXTENDER && cli.Name == name {
			if err = api.DeleteTrustedClient(cli.ID); err != nil {
				panic(err)
			}
		}
	}

	id, err := api.CreateTrustedClient(userstore.Extender(name))
	if err != nil {
		panic(err)
	}

	cfg, err := config.New(curl).ConfigExtender(id)
	if err != nil {
		panic(err)
	}

	fmt.Println(string(cfg))
}
