#!/bin/bash
./test src/cognito_functions/http_headers/index.js
./test src/cognito_functions/check_auth/index.js
./test src/cognito_functions/parse_auth/index.js
./test src/cognito_functions/refresh_auth/index.js
./test src/cognito_functions/sign_out/index.js
./test src/cognito_functions/shared/shared.js
