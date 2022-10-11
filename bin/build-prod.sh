#!/usr/bin/env bash

# Copyright _!_
#
# License _!_

export STATIC_ORIGIN=https://strn.network
export TRUSTED_L1_ORIGIN=https://core.strn.pl
export UNTRUSTED_L1_ORIGIN=https://rings.strn.pl
export LOG_INGESTOR_URL=https://twb3qukm2i654i3tnvx36char40aymqq.lambda-url.us-west-2.on.aws

npm run build
