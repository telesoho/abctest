#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CCS=${1-1}
CCV=${2-1}
CC_SRC_LANGUAGE=typescript

if [ "$CC_SRC_LANGUAGE" = "typescript" ]; then
	CC_SRC_PATH="${PWD}/chaincode-typescript/"
else
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
	echo Supported chaincode languages are: javascript and typescript
	exit 1
fi

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh deployCC -ccn abctest -ccv ${CCV} -ccs ${CCS} -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH}
popd
