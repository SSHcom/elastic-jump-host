#!/bin/sh

/usr/local/bin/xconf > /opt/privx/etc/extender-config.toml 
/opt/privx/scripts/extender-postinstall.sh
/opt/privx/bin/privx-extender -run
